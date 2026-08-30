## Context

`UebernatuerlichDialog` currently parses only a numeric effective difficulty.
`Magieresistenz` therefore remains prose and follows the manual
“Erfolgreich gewirkt/Misslungen” path even when a target Actor is selected.
The target-selection setting is deliberately optional; E2E cases enable and
restore it locally. Existing defense prompts already show the system pattern
for choosing a target Actor's active owner and routing a system-socket event.

The agreed rule is target-specific: the target rolls `1W20`, then its current
derived MR plus that die total is the caster's difficulty. The P1 spell
_Blitz dich find_ is a single-Actor target and is the acceptance consumer.

## Goals / Non-Goals

**Goals:**

- Author an unambiguous target-MR requirement instead of parsing German rule
  text at casting time.
- Resolve one selected Actor's current MR plus a target-side D20 before the
  caster makes the spell roll.
- Keep the existing caster dialog as the source of cast state and make the
  resolved difficulty visible there and in chat.
- Reuse the established target-owner socket routing and preserve the
  target-selection setting's opt-in behavior.

**Non-Goals:**

- No automatic MR for multi-target, zone, object, or conditionally
  target-dependent spells in this change.
- No generic resistance test, effect avoidance, saving throw, ballistic
  defense, or pre-effect redesign.
- No change to the target's derived MR calculation or to fixed numeric spell
  difficulties.
- No automatic target selection when `useTargetSelection` is disabled.

## Decisions

### Use explicit source data and carry it through the effective profile

Add `magicResistance` as a structured field on supernatural Item data and on
structured spell-modification profiles. Its initial form is
`{ enabled: true }`; absent or invalid data is disabled. `baseProfile()` and form resolution carry this field with the same
single-owner override protection used for other effective profile values.

The compendium audit marks only sources whose rule is an unconditional
single-Actor `Magieresistenz` difficulty. Entries such as
`12/Magieresistenz (bei Tieren)` and Zone/area targets are intentionally not
migrated. This avoids encoding a semantic parser for `schwierigkeit` prose or
accidentally turning a target's MR into a global Zone difficulty.

**Alternative considered:** detect the word “Magieresistenz” in
`schwierigkeit`. Rejected because forms and conditional text make the wording
non-canonical and it cannot represent the selected target mode.

### Bind one MR challenge to a dialog and target selection revision

The supernatural dialog holds an in-memory `magicResistanceChallenge` with a
random request ID, the selected target Actor UUID, its MR snapshot, target
user ID, die result, and total. It is never written to an Item or Actor. A
new target selection or dialog close invalidates the challenge. The roll
action remains disabled until a current challenge is resolved.

The selected Actor is resolved via the existing target payload helper, not by
trusting a client-provided numeric MR. The authority that accepts the result
reads the Actor's prepared derived MR at challenge creation and records that
snapshot for the displayed calculation.

**Alternative considered:** roll the D20 when the caster clicks the cast
button. Rejected because the rule explicitly assigns the die to the target
and the caster needs a visible, reviewable difficulty before spending energy.

### Route the target roll to its responsible active user, with GM fallback

Reuse the defense prompt's executor resolution and `system.Ilaris` socket
route. A selected active non-GM owner receives a whispered MR card with one
“MR würfeln” control. The client evaluates one
[Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) and
sends only the request ID, Actor UUID, and roll total back through the socket;
the accepting GM/caster context verifies the current challenge before using
it. For an unowned or GM-owned Actor, the active GM receives/handles the same
card.

The card is whispered to the designated executor and active GMs, and records
the D20, MR snapshot, and resulting difficulty. Duplicate socket events and
double-clicks are ignored by request ID. Existing target-selection Hooks keep
their current signature; this feature does not add a new public hook.

**Alternative considered:** use a browser prompt or silently have the caster
roll for the target. Rejected because neither provides the target-side roll
required by the rule or an auditable chat result.

### Keep UI ownership in the existing supernatural dialog

No new sheet or dialog window is introduced. In the existing supernatural
dialog, the target-selection section remains after spell modifications and
before maneuvers. For marked spells, an MR subsection appears directly below
the selected target list:

1. without exactly one Actor target: a localized instruction;
2. with target but no result: target name, current MR, and a request button;
3. after the target rolls: `Magieresistenz: <MR> + <W20> = <difficulty>`.

The normal roll summary uses the resolved number as its `Schwierigkeit` row;
its roll control is visibly disabled while an automated MR challenge is
missing. The non-automated manual path is unchanged. The existing light and
dark themes are both in scope; this uses existing summary/target CSS classes
where possible rather than inline styles.

### Resolve the casting difficulty before existing success, cost, and effects

Once the challenge is resolved, `_angreifenKlick()` passes its total as the
numeric difficulty to the existing roll evaluator. A success or failure then
follows the current path unchanged: it posts the spell roll, charges energy
according to the actual result, and only dispatches Pre-Effects after success.
The resolved target MR belongs to the cast/chat context for traceability but
does not become a persistent ActiveEffect or change source data.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  read the selected Actor's prepared derived MR and ownership data; no Actor
  schema or update method is extended.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  create the existing-style whispered target-roll card with
  `ChatMessage.create`.
- [Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html):
  evaluate the target-side single D20; use the documented roll result rather
  than `Math.random`.
- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html):
  the existing `UebernatuerlichDialog` rerenders its transient challenge state.
- The project-local `Ilaris.preTargetSelection(dialog, candidates)` and
  `Ilaris.targetSelectionComplete(dialog, selectedActors)` Hooks retain their
  observed current signatures and semantics; no new Hook is registered.
- Community wiki review found no suitable replacement for the existing
  `foundry.utils.randomID` request-ID pattern. Use that helper where available
  for the dialog challenge identity, with the current safe fallback retained.

## Risks / Trade-offs

- **A remote target has no active authorized user** → route the card to an
  active GM and show a localized warning only when no executor exists.
- **Target changes while its card is open** → bind result acceptance to request
  ID and target UUID; ignore stale results and require a new request.
- **MR modifiers change after the request** → record MR at request time so the
  shown D20 calculation and the caster's difficulty agree; a new selection
  always gets a fresh snapshot.
- **Source migration marks a conditional/area spell** → audit target and
  difficulty together; source-data tests assert the intended exact set.
- **A user relies on manual casting** → the feature activates only for explicit
  data plus enabled target selection, leaving manual/non-Actor paths intact.
- **Chat card interaction is duplicated** → retain a bounded processed-request
  cache, following the defense-prompt event guard.

## Migration Plan

1. Add the optional model/profile fields with disabled defaults.
2. Add source data only for audited unconditional single-Actor MR spells, then
   run `npm run pack-all`.
3. Implement dialog/socket behavior and tests; no world Item migration is
   required because an absent marker remains manual.
4. Rollback removes the marker and dialog/socket path. Existing world Items
   with the optional field remain loadable and simply return to manual
   handling.

## Open Questions

None for the P1 single-Actor scope. Multi-target, Zone, object, and
conditional-MR entries are deliberately deferred to a follow-up with their
own rule semantics.

## Testing Strategy

- **Pure/unit:** add a dialog-safe resolver test for normalized MR data,
  selected-form propagation, Actor MR extraction, valid request construction,
  stale-result rejection, and disabled/manual fallbacks. Extend structured
  modification and source-data specs using the existing direct-import/Jest
  patterns.
- **Dialog/unit:** use the existing mocked ApplicationV2/roll-dialog tests to
  assert summary text, disabled controls, numeric evaluator input, and no
  Pre-Effect call before a valid target-MR result.
- **E2E:** add a new Playwright case or extend the structured supernatural
  suite. It starts the local active-GM world with a caster and a selected
  owned target Token, locally enables `useTargetSelection`, proves the visible
  MR subsection and target roll card, verifies the exact `MR + 1W20` result in
  caster chat and then checks _Blitz dich find_'s successful pre-effect. It
  restores settings, targets, temporary Actor data, chat, and documents.
- **Visual/runtime:** capture the normal-theme dialog after its resolved MR
  row is visible, inspect the map target selection and chat card, then repeat
  the visible control reachability check in the supported dark theme.
