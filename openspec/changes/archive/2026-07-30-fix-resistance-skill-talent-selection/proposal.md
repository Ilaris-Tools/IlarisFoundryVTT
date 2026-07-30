## Why

The pre-effect resistance editor currently offers supernatural skills even though resistance checks must use profane skills. It also cannot configure a specific profane talent, so the resulting Widerstandsprobe always opens without a preselected talent. This prevents authors from expressing the intended rule: use a named profane skill and, where available, its named talent.

## What Changes

- Modify the pre-effect resistance editor to offer only profane Fertigkeiten and profane Talente; exclude all `uebernatuerlicheFertigkeit` entries.
- Persist an optional configured profane talent alongside `avoidTest.fertigkeit`.
- Open the target's Widerstandsprobe with the configured profane skill and automatically select the configured talent when that target owns it under the selected skill.
- Fall back to the same profane skill without a talent when the target does not own the configured talent; retain the existing warning behavior when the target lacks the configured base skill.
- Add unit and E2E regression coverage for editor filtering, automatic talent selection, and the no-talent fallback.

This modifies existing resistance-check behavior; it is not a breaking change for existing pre-effect data, because the new talent field is optional.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `resist-dialog-ux`: The pre-effect editor's resistance controls and the Widerstandsprobe's initial talent selection change.
- `supernatural-pre-effects`: The optional `avoidTest` schema and its profane skill resolution change.
- `pre-effect-e2e-tests`: Resistance and pre-effect sheet scenarios gain profane talent coverage.

## Impact

- `scripts/items/sheets/uebernatuerlich-talent.js`: prepares profane skill and talent options and defaults for the item-sheet context.
- `scripts/items/templates/pre-effects.hbs`: renders an optional profane talent selector beside the resistance skill selector.
- `scripts/effects/pre-effects/resist-handler.js`: resolves and passes the configured talent to the skill dialog.
- `scripts/skills/dialogs/fertigkeit.js` and `scripts/skills/templates/dialogs/fertigkeit.hbs`: accept and render a validated initial talent selection.
- Existing pre-effect records remain valid when they lack the optional `avoidTest.talent` value.

### Foundry VTT API surface

- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html) and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html): existing AppV2 sheet/dialog rendering paths are extended with prepared context and initial form state.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): the existing target actor data supplies profane skills and their embedded talents for validation.
- Custom hook `Ilaris.postSkillRoll`: behavior remains unchanged; the new state only determines the PW/PWT used before this hook reports the roll.
- No new `foundry.utils.*` helper or Foundry lifecycle hook is required.

## Testing Impact

- **Unit tests:** extend `scripts/effects/pre-effects/_spec_/resist-handler.spec.js` for configured-talent matching and fallback; add focused dialog-state coverage for initial specific-talent selection and PW fallback.
- **Existing unit tests:** retain the current attribute-resistance and diminished-effect scenarios.
- **E2E tests:** extend E2E-026 with a skill-based resistance configuration that confirms the Widerstandsprobe opens for the configured profane skill, auto-selects a possessed configured talent, and falls back to `ohne Talent` when the target does not possess it. Extend the pre-effect sheet configuration case to assert only profane options are offered and that the talent value persists.
- **E2E environment:** the existing Foundry baseline and GM client are sufficient; use the existing all-capabilities actor or add temporary embedded profane skill/talent data during setup. No additional player client or shared fixture is expected.
