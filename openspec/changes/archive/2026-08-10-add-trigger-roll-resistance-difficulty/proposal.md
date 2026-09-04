## Why

Resistance pre-effects currently overload `avoidTest.resistDifficulty: 0` to
mean “use the roll that triggered this effect.” The implementation does not
support that meaning: JavaScript treats `0` as absent and silently uses the
fixed default of 12. Maneuvers such as _Entwaffnen_ and _Niederwerfen_ need a
clear, documented way to make their resistance difficulty equal the triggering
attack result without changing the normal fixed-difficulty behaviour.

## What Changes

- Add an explicit `avoidTest.resistDifficultySource` mode. Its default is
  `fixed`; `triggeringRoll` uses the final total of the roll that caused this
  pre-effect.
- Keep `avoidTest.resistDifficulty` as a numeric fixed difficulty with an
  explicit default of 12. `0` is no longer a sentinel and is retained as an
  authored fixed value.
- Carry the triggering roll total through pre-effect processing and the
  resistance-chat payload. For `triggeringRoll`, the resistance difficulty is
  that total exactly; Mächtige Magie/Liturgie QS additions apply only to the
  fixed-difficulty mode.
- Add a German source selector to the Pre-Effect editor and document both
  modes in the Pre-Effects quick reference.
- Migrate the supported maneuver data for _Entwaffnen_, _Niederwerfen_, and
  _Umreißen_ from the ambiguous `0` value to `triggeringRoll`.

This modifies existing resistance-pre-effect behaviour while remaining
backward-compatible for existing authored non-zero fixed difficulties and
missing source fields.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `supernatural-pre-effects`: define explicit fixed and triggering-roll
  resistance difficulty resolution and Pre-Effect authoring fields.
- `resist-dialog-ux`: show the resolved, immutable resistance difficulty from
  either source in the FertigkeitDialog workflow.
- `combat`: preserve the successful attack or defense roll needed by a
  maneuver pre-effect when it creates a resistance prompt.
- `spell-pre-effect-quick-reference`: document German authoring guidance for
  resistance-difficulty source modes.

## Impact

- Affected code: `scripts/effects/pre-effects/resist-handler.js`,
  `scripts/effects/pre-effects/pre-effects-processor.js`,
  `scripts/combat/dialogs/angriff.js`, the übernatürlich item-sheet template
  and defaults, relevant tests, and the maneuver/quick-reference `_source/`
  compendium documents.
- The existing [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
  document remains the transport for the encoded resistance-prompt payload;
  its documented `renderChatMessageHTML` hook continues to attach the button
  handler. The existing [DialogV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html)
  API remains the attribute-choice dialog. No new Foundry document class or
  core hook is introduced; the system continues to use the existing custom
  `Ilaris.postSkillRoll` hook.
- Existing Foundry helpers remain in scope:
  `foundry.utils.randomID` creates the prompt identity and
  `foundry.utils.fromUuid` resolves its source documents. The implementation
  will verify their v14 usage against the
  [Foundry API](https://foundryvtt.com/api/v14/) and
  [community API guide](https://foundryvtt.wiki/en/development/api) before
  coding.
- No additional dependencies or world settings are required.

## Testing Impact

- Add unit coverage for fixed difficulty defaults, an explicit fixed value of
  `0`, triggering-roll resolution, missing triggering totals, and the
  fixed-mode Mächtige Magie/Liturgie bonus. Update the resistance handler and
  pre-effect processor specs to assert that the serialized chat payload
  preserves the triggering total.
- Add or extend combat-dialog unit coverage to assert that maneuver
  pre-effects receive the final attack/defense roll instead of a synthetic
  success-only result. Update supported maneuver-data assertions for the three
  migrated entries.
- Add an E2E regression to the existing maneuver Pre-Effect flow: in the
  `ilaris-e2e-world-v14363-r1` world, an active GM rolls _Entwaffnen_ or
  _Niederwerfen_, the target receives a resistance prompt, and its displayed
  difficulty equals the triggering roll total. No player client is required;
  use the existing test actors and restore chat, effects, and equipped-weapon
  state afterwards. No shared E2E helper is expected initially.
