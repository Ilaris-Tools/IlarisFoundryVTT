## 1. Verification and Context

- [x] 1.1 Verify the AppV2 form-submit path and `submitOnChange` behavior against the [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html) and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/classes/foundry.applications.api.HandlebarsApplicationMixin.html) API docs (v14).
- [x] 1.2 Check [foundryvtt.wiki](https://foundryvtt.wiki/en/development/api) for `foundry.utils.expandObject` / `deepClone` helper guidance before writing the normalizer.
- [x] 1.3 Confirm the observed empty-index rendering (`system.preEffects..resistanceOutcomes.failure.enabled`) in E2E-027 output and map it to the `{{@../index}}` references in `pre-effects.hbs`.

## 2. Implementation

- [x] 2.1 Extract a shared per-pre-effect normalizer in `scripts/items/sheets/pre-effect-item.js` that rewrites nested `changes`, `ilarisModifiers`, `summonItem.overrides`, `summonCreature.overrides`, `summonCreature.dominationChecks.entries`, and `resistanceOutcomes` outcome payloads back to arrays.
- [x] 2.2 Add `normalizeSpellModificationFormData` (or extend the existing normalizer) so `#onSubmitForm` normalizes `system.spellModifications` (each form's `preEffects`) and `system.spellModificationGroups` before `document.update`.
- [x] 2.3 Capture the outer Pre-Effect index with a Handlebars block parameter and use it in every outcome-payload `name` attribute; do not rely on relative `@index` lookup through `{{#with}}`.
- [x] 2.4 Verify the spell-modification editor continues to use explicit `#handleSpellModificationEditorClick` array updates (no change needed) and that the submit handler does not double-persist.

## 3. Unit Tests

- [x] 3.1 Extend `scripts/items/sheets/_spec/pre-effect-item.spec.js` with cases for object-indexed `system.spellModifications` and each nested array shape.
- [x] 3.2 Add a case proving `system.spellModificationGroups` and unrelated form fields survive normalization.
- [x] 3.3 Add template-shape assertions plus an E2E assertion of the rendered outcome-payload `name` attribute; template-string matching alone is insufficient.

## 4. E2E Tests

- [x] 4.1 Run E2E-027 after `node utils/foundry-lifecycle.mjs Restart` and confirm the previously failing scenarios pass.
- [x] 4.2 Add a regression assertion that toggling a spell-modification `avoidTest.enabled` checkbox does not change that modification's pre-effect count.

## 5. Quality and Handoff

- [x] 5.1 Run `npm install` then `npm test`. (`npm install` completed; the full Jest suite passed after `resolveResistTargetActor` was restored in the dedicated resistance-target-resolution change.)
- [x] 5.2 Run `npm run lint`.
- [x] 5.3 Run `openspec validate fix-pre-effect-form-submit-corruption --strict`. (The proposal passes; `openspec validate --all --strict` still reports six pre-existing failing base specs.)
- [x] 5.4 Review the scoped diff and commit only after all validation passes.
