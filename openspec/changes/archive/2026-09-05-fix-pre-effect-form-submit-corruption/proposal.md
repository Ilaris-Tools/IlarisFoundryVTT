## Why

The structured spell-modification editor (`uebernatuerlich_talent.hbs`) lives inside the same AppV2 form as the shared Pre-Effect editor, and that form submits on every control change (`submitOnChange: true`). The shared form handler only normalizes `system.preEffects`, so any click on a spell-modification control — including the "Widerstandsprobe aktiv" checkbox — writes `system.spellModifications` back in object-indexed shape instead of arrays, corrupting nested `preEffects` and stacking them endlessly. Separately, the outcome-payload controls in the shared `pre-effects.hbs` render with an empty index (`system.preEffects..resistanceOutcomes.failure.enabled`), so their toggles never persist.

## What Changes

- Extend the shared Pre-Effect form-submit normalization so that `system.spellModifications` (and its nested `preEffects`, `changes`, `ilarisModifiers`, `summonItem.overrides`, `summonCreature.overrides`, `summonCreature.dominationChecks.entries`, and `resistanceOutcomes` outcomes) are normalized back to arrays before `document.update`, instead of only `system.preEffects`.
- Fix the Handlebars index references in `pre-effects.hbs` outcome payloads by capturing the enclosing Pre-Effect index with an `{{#each ... as |preEffect preEffectIndex|}}` block parameter and using `{{preEffectIndex}}` through the nested `{{#with}}`/`{{#each}}` blocks.
- Add/update unit tests for the extended normalization and the corrected index rendering.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `pre-effect-item-sheet-base`: The shared form-submit handler SHALL normalize indexed form data across all nested array fields the concrete supernatural sheet renders, not only `system.preEffects`; the shared Pre-Effect editor SHALL render outcome-payload controls with correct indexed names.
- `structured-spell-modifications`: A structured spell modification SHALL persist its form controls through the auto-submit path without duplicating or corrupting its nested pre-effects.

## Impact

- **Foundry API classes touched**:
    - [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html) — the sheet whose AppV2 form handler and `submitOnChange` option drive the auto-submit path.
    - [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/classes/foundry.applications.api.HandlebarsApplicationMixin.html) — the mixin that owns `DEFAULT_OPTIONS.form`.
    - [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) — `document.update` receiving the normalized diff.
- **Foundry utilities touched**:
    - [foundry.utils.expandObject](https://foundryvtt.com/api/v14/functions/foundry.utils.expandObject.html) — expands dotted form paths into the object-indexed shape that must be normalized.
    - [foundry.utils.deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) — render/working copies used by the editor mutation lifecycle.
- **Hooks**: none.
- **Files**:
    - `scripts/items/sheets/pre-effect-item.js` (form handler + `normalizePreEffectFormData`)
    - `scripts/items/templates/pre-effects.hbs` (outcome-payload index references)
    - `scripts/items/sheets/_spec/pre-effect-item.spec.js` and `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` (unit coverage)
- **Behavior classification**: modifies existing behavior (fixes a corruption regression introduced by the in-progress `fix-pre-effect-sheet-bindings` change); not additive, not breaking.

## Testing Impact

- **New unit test scenarios**:
    - `normalizePreEffectFormData` normalizes object-indexed `system.spellModifications` and its nested arrays into arrays while preserving unrelated fields.
    - Outcome-payload control names in `pre-effects.hbs` contain the pre-effect index (no empty segment).
- **Existing unit tests to update**:
    - `scripts/items/sheets/_spec/pre-effect-item.spec.js` — extend the normalization cases.
    - `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` — assert spell-modification form persistence through the submit path.
- **New E2E cases**: none required beyond E2E-027's existing scenarios.
- **Existing E2E cases affected**:
    - `e2e/cases/e2e-027-pre-effect-sheet-config/` — the currently failing "outcome panels follow Widerstand and reveal only when enabled" and "adds, persists, and deletes a pre-effect entry" tests must pass again; optionally add an assertion that toggling "Widerstandsprobe aktiv" in a spell modification does not add a pre-effect.
- **E2E environment context**: GM-owned temporary Zauber item imported in `ilaris-e2e-world-v14363-r1` (port 30000), no compendium `_source/` changes.

## Proposal Self-Review

**Decision:** PASS

- **Scope:** Two related defects in the shared Pre-Effect form-submit/rendering lifecycle: (1) un-normalized `spellModifications` on auto-submit, (2) incorrect Handlebars index references in outcome payloads. Both are required to restore E2E-027.
- **Affected requirements:** `pre-effect-item-sheet-base` ("Shared editor normalizes indexed form data", "Reusable Pre-Effect Item sheet base") and `structured-spell-modifications` ("Form data persists").
- **API evidence:** Verified the `submitOnChange: true` form option and the custom `#onSubmitForm` handler in `scripts/items/sheets/item.js` and `pre-effect-item.js`; the object-indexed `expandObject` behavior is documented in `openspec/changes/fix-pre-effect-sheet-bindings/tasks.md` task 1.1; the empty-index rendering is observed in the E2E-027 failure output (`system.preEffects..resistanceOutcomes.failure.enabled`).
- **Testing impact:** Unit tests extended in `pre-effect-item.spec.js`/`uebernatuerlich-talent.spec.js`; E2E-027 must pass.
- **Migration/rollback:** No migration; the fix only changes how already-authored data is written back on the next save. Rollback is a simple revert of the handler/template edits.
- **UI ordering:** The shared Pre-Effect editor keeps its established control order; the change does not reorder controls.
