## Context

`avoidTest.resistDifficulty` currently represents a fixed target number. The
resistance handler obtains it with `|| 12`, so `0` is treated as missing. Three
maneuvers use that accidental convention in an attempt to resist against the
attack result, but the pre-effect dispatch currently passes only
`{ success: true }` and therefore has no roll total to transport.

The change crosses pre-effect authoring, roll dispatch, chat-prompt
serialization, and the resistance dialog. It must keep spell/liturgy
pre-effects with fixed resistance values working unchanged while making the
combat-rule use case explicit.

## Goals / Non-Goals

**Goals:**

- Make a resistance difficulty's origin explicit and serializable.
- Preserve the resolved triggering result until the target opens the
  resistance dialog.
- Retain a fixed difficulty default of 12 without treating a numeric value as
  a control signal.
- Give GMs German authoring guidance and migrate the known maneuver data.

**Non-Goals:**

- Recalculate a triggering roll after the prompt is sent, or re-run combat
  resolution when its chat message changes.
- Add dynamic comparisons, opposed-roll cancellation, or a general formula
  language for resistance difficulties.
- Infer a source from arbitrary custom pre-effect callers when no triggering
  roll was supplied.
- Change how a resistance test itself determines success after its difficulty
  has been resolved.

## Decisions

### Use an explicit source enum rather than a numeric sentinel

`avoidTest.resistDifficultySource` will be a persisted string with two values:

| Value            | Meaning                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `fixed`          | Use `avoidTest.resistDifficulty`; absent/null values resolve to 12. |
| `triggeringRoll` | Use the numeric `total` of the roll that caused this pre-effect.    |

Missing `resistDifficultySource` resolves as `fixed`, so existing pre-effects
remain compatible. The implementation will use nullish/default validation,
not truthiness, for `resistDifficulty`; therefore an intentionally configured
`0` remains an explicit fixed value. A selector labelled `Schwierigkeit aus`
will expose the choices `Fester Wert` and `Ergebnis der auslösenden Probe`.
The numeric input remains meaningful only in the fixed mode.

Alternative considered: retain `0` as `triggeringRoll`. Rejected because it
cannot represent a genuine fixed zero and makes data meaning invisible to
authors, reviewers, and documentation readers.

### Snapshot a final roll total into the resistance prompt

`applyPreEffects` will derive a numeric `triggeringRollTotal` from its
`rollResult.roll.total` when available and include it in the serialized
pre-effect data that feeds the existing `ChatMessage` resistance button. The
number is a snapshot: the target's later click cannot be affected by chat or
combat dialog state being cleaned up.

For maneuver activation, combat will supply the real roll result that achieved
the activation: the attack roll for `onConfirmedHit` and the successful
defense roll for `onSuccessfulDefense`. This replaces the synthetic
success-only object passed today. Other pre-effect callers may omit a total;
if `triggeringRoll` is authored but no finite total was supplied, the handler
will issue a localized warning and resolve the standard fixed default of 12 so
the target is never left with an unusable prompt.

Alternative considered: store a ChatMessage UUID and resolve its roll at click
time. Rejected because a resistance prompt is a separate whisper, the source
roll may not have a message, and later lookup is more fragile than copying the
already-resolved scalar.

### Apply amplification only to fixed source values

For `fixed`, the resolved difficulty remains
`resistDifficulty + (Mächtige-Magie-QS × 4)`. For `triggeringRoll`, the
difficulty is the triggering roll total exactly. This prevents a maneuver's
already-final combat result from being altered by the caster-oriented
Mächtige-Magie/Liturgie mechanic.

Alternative considered: add the QS bonus to both modes. Rejected because the
triggering-roll mode expresses an opposed result, not a spell's authored
static difficulty.

### Migrate only reviewed maneuver data

The `_source/` documents for _Entwaffnen_, _Niederwerfen_, and _Umreißen_ will
receive `resistDifficultySource: "triggeringRoll"` and an ordinary fixed
fallback of `12`. They are the reviewed entries presently using `0` for this
purpose. The quick-reference journal will document the field for all
pre-effect authors. No world Item migration is needed: absent fields remain
fixed values.

## API Surface

- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  continue to create the whispered resistance prompt and use the documented
  `renderChatMessageHTML` render hook. The v14 callback is verified as
  `(message, html, data)`; the existing listener may continue to consume its
  first two arguments.
- [DialogV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html):
  continue to use `DialogV2.wait` only for choosing among permitted resistance
  attributes; this change does not add a new dialog class or hook.
- [Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html):
  read the already-evaluated final `roll.total` as a scalar before the prompt
  is created. No roll is evaluated or altered by this feature.
- Hooks: no new Foundry core hook is registered. The documented
  `renderChatMessageHTML(message, html, data)` listener remains in use, and
  the system-specific `Ilaris.postSkillRoll(dialog, payload)` listener remains
  the completion path for the target's own resistance test.
- Utilities: retain existing `foundry.utils.randomID` for prompt identities
  and `foundry.utils.fromUuid` for source resolution. No new bespoke cloning
  utility is required; the existing plain serializable prompt payload remains
  the boundary.

## Risks / Trade-offs

- [A third-party caller requests `triggeringRoll` without supplying a Roll]
  → detect a non-finite/missing snapshot, warn in German, and use the
  documented default 12 rather than creating an invalid dialog.
- [A custom pre-effect has an unknown source value] → treat it as `fixed` and
  retain the previous fixed-value behaviour, preventing unknown data from
  accidentally changing resistance semantics.
- [Future combat refactors change which roll activates a maneuver] → keep the
  trigger result an explicit `_dispatchManeuverPreEffects` parameter and cover
  confirmed-hit and successful-defense paths in unit tests.
- [Compendium source is edited but packed data is stale] → include
  `npm run pack-all` and source-data assertions in the implementation tasks.

## Migration Plan

1. Add the source resolver, serialization, combat hand-off, and editor fields.
2. Update the three reviewed maneuver `_source/` documents and the German
   quick-reference JournalEntry, then run `npm run pack-all`.
3. Validate unit tests, lint, and the focused E2E flow before release.
4. Rollback is source-compatible: removing `resistDifficultySource` returns an
   entry to fixed mode. No persistent Actor or ActiveEffect migration occurs.

## Open Questions

None. The fallback, default, source values, and amplification semantics are
defined by this change.

## Testing Strategy

- Extract or expose a small pure resolver in `resist-handler.js` and test the
  fixed default, explicit zero, fixed QS bonus, triggering total, and missing
  triggering total without rendering Foundry UI.
- Extend the existing Jest patterns in
  `scripts/effects/pre-effects/_spec/resist-handler.spec.js` and
  `pre-effects-processor.spec.js`; mock `ChatMessage.create` and decode the
  button payload to inspect the snapshot.
- Test maneuver dispatch with the existing module-mock / object-instance style
  used by combat dialog specs, asserting that each activation path forwards a
  result containing its original `Roll`.
- Extend the supported-data test for the migrated JSON entries. The E2E case
  runs in `ilaris-e2e-world-v14363-r1` as `e2e-gm`, uses the established test
  actors, creates the prompt, verifies its displayed difficulty against the
  completed attack, and cleans up messages, effects, and weapon-slot state.
