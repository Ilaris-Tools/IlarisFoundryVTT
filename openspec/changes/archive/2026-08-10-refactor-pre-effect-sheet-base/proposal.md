## Why

`ManoeverSheet` currently inherits from `UebernatuerlichTalentSheet` solely to
reuse Pre-Effect authoring. That also couples it to supernatural-only form
context and LLM generation, and makes every additional item sheet with the
same Pre-Effect structure inherit unrelated spell behaviour.

## What Changes

- Introduce a shared `PreEffectItemSheet` between `IlarisItemSheet` and the
  concrete spell/liturgy and maneuver sheets.
- Move the common Pre-Effect part, defaults, context preparation, editing
  lifecycle, autocomplete, and reusable authoring controls into that base.
- Make `UebernatuerlichTalentSheet` and `ManoeverSheet` sibling subclasses,
  each retaining its own form, only its small source-specific context, and
  its appropriate Pre-Effect presentation mode.
- Keep LLM Pre-Effect generation a supernatural-item feature; it must not be
  inherited merely because another item type uses Pre-Effects.
- Preserve the shared Pre-Effect data shape and existing item behaviour, so a
  future compatible item sheet can adopt the common base without a bespoke
  Pre-Effect lifecycle.

This is an internal refactor with one intentional UI correction: the spell-only
LLM generation control is no longer available on maneuver sheets.

## Capabilities

### New Capabilities

- `pre-effect-item-sheet-base`: reusable ItemSheetV2 base contract for items
  that author the standard `system.preEffects` structure.

### Modified Capabilities

- `supernatural-pre-effects`: move the existing editable Pre-Effect sheet
  lifecycle to the common base while preserving supernatural authoring.
- `llm-pre-effect-generation`: make the generation control explicitly
  supernatural-only after shared sheet behaviour is extracted.

## Impact

- Affected code: a new shared sheet module under `scripts/items/sheets/`,
  `uebernatuerlich-talent.js`, `manoever.js`, `pre-effects.hbs`, their unit
  tests, and imports/registration only as necessary.
- The base continues to build on Foundry's
  [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html)
  behaviour through the existing
  [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html).
  It uses the documented `_prepareContext` and `_onRender` lifecycle methods;
  no Foundry Hooks are added or changed.
- Existing `foundry.utils.deepClone` remains the shared safe-copy helper for
  indexed Pre-Effect arrays. The implementation will verify the current v14
  helper guidance in the [Foundry community API guide](https://foundryvtt.wiki/en/development/api)
  before moving it.
- No Item data migration, ActiveEffect change, compendium repack, dependency,
  or world-setting change is expected.

## Testing Impact

- Add or move unit tests to cover the shared base's default values, context,
  array normalization, and delegated add/remove operations. Retain dedicated
  smoke coverage that both concrete sheets render their own form plus the
  shared Pre-Effect part.
- Update `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` and
  `manoever.spec.js`; add a focused shared-base spec if it improves isolation.
  Verify the LLM button remains eligible only for a GM's configured
  supernatural sheet and is absent from maneuver output.
- No new E2E flow is required because persistent data and gameplay execution
  do not change. Re-run the existing Pre-Effect editor and maneuver Pre-Effect
  E2E cases in `ilaris-e2e-world-v14363-r1` as `e2e-gm`; no player client,
  altered world data, or shared E2E helper is needed.
