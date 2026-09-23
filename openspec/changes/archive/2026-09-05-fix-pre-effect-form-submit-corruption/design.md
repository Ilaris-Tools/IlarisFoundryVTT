## Context

`IlarisItemSheet` (`scripts/items/sheets/item.js`) configures AppV2 forms with `submitOnChange: true`, so every form-control change auto-submits the sheet. `PreEffectItemSheet` (`scripts/items/sheets/pre-effect-item.js`) overrides the form handler with `#onSubmitForm`, which runs `normalizePreEffectFormData(foundry.utils.expandObject(formData.object))` and then `document.update(...)`. That normalizer only rewrites `system.preEffects` back to arrays; the concrete `UebernatuerlichTalentSheet` also renders a structured spell-modification editor (`uebernatuerlich_talent.hbs`) whose inputs use indexed dotted names (`system.spellModifications.<i>.preEffects.<j>…`). `foundry.utils.expandObject` leaves those indexed paths as objects (confirmed in `fix-pre-effect-sheet-bindings/tasks.md` task 1.1), so every auto-submit writes `system.spellModifications` back in object-indexed shape, corrupting its nested `preEffects`.

The shared `pre-effects.hbs` template has a second defect: the `resistanceOutcomes` outcome payloads use relative index references inside `{{#with}}` and nested `{{#each}}` blocks. Runtime E2E showed that both the original relative references and a proposed replacement using `@index` rendered an empty segment, producing control names like `system.preEffects..resistanceOutcomes.failure.enabled`. The enclosing Pre-Effect index must therefore be captured explicitly as an outer `#each` block parameter.

## Goals / Non-Goals

**Goals:**

- Normalize every nested array field the supernatural sheet renders through the auto-submit path so `document.update` receives arrays, not object-indexed data.
- Make outcome-payload controls render with the correct pre-effect index so their toggles persist.
- Restore E2E-027 to green without changing editor layout or UX.

**Non-Goals:**

- Do not change `submitOnChange` behavior or move the spell-modification editor out of the form.
- Do not change data semantics, defaults, or the runtime effect-application flow.
- Do not alter compendium `_source/` data.

## Decisions

**Decision 1 — Normalize on submit instead of disabling auto-submit.**

Keep `submitOnChange: true` and normalize the full form diff in `#onSubmitForm`. Disabling auto-submit would change the established authoring UX and could regress the already-working standard Pre-Effect controls. _Alternative considered:_ set `submitOnChange: false` on the supernatural sheet — rejected because it is more invasive and changes behavior for the standard tab too.

**Decision 2 — Extract a shared per-pre-effect normalizer.**

Introduce a `normalizePreEffect(preEffect)` helper that normalizes one Pre-Effect's nested arrays (`changes`, `ilarisModifiers`, `summonItem.overrides`, `summonCreature.overrides`, `summonCreature.dominationChecks.entries`, `resistanceOutcomes.<outcome>.*`). Reuse it in `normalizePreEffectFormData` and in a new `normalizeSpellModificationFormData` that maps `system.spellModifications` and normalizes each form's `preEffects` plus `system.spellModificationGroups` via the existing `toPreEffectArray`. _Alternative considered:_ reuse `normalizeSpellModifications` from `scripts/items/data/spell-modifications.js` — rejected because it is a read-only, lossy projection (filters by group, dedupes ids, drops fields like `description`/`ballistic`/full `preEffects`), unsuitable for a write-back path.

**Decision 3 — Capture the outer Handlebars index explicitly.**

In `pre-effects.hbs`, bind the outer loop as `{{#each preEffects as |preEffect preEffectIndex|}}` and use `{{preEffectIndex}}` in every outcome-payload `name` attribute, including nested `changes` and `ilarisModifiers`. The prior relative-data-variable approach rendered an empty segment at runtime; a real E2E assertion of the final name is required. _Alternative considered:_ rewriting the payload section to avoid `#with` — rejected as a larger diff with no functional benefit.

## Risks / Trade-offs

- [Normalizer misses a nested array] → add unit coverage for each nested array shape and assert the persisted object shape after a control change.
- [Normalizing on submit reorders or drops fields] → normalize by spreading the source object and only rewriting the nested array keys, never reconstructing the modification/profile objects wholesale.
- [Index-reference fix is wrong for some block depth] → assert rendered `name` attributes in template-string unit tests and rely on E2E-027's "outcome panels reveal only when enabled" scenario as a regression gate.

## Migration Plan

No migration. The change only affects how already-authored data is written back on the next save. Rollback is a plain revert of the handler and template edits; existing stored arrays remain valid.

## Open Questions

- Whether `system.spellModificationGroups` can also arrive object-indexed on submit (it is rendered with `{{#each item.system.spellModificationGroups}}` but currently edited only through explicit `#handleSpellModificationEditorClick` handlers). The normalizer will normalize it defensively regardless.

## API Surface

- **Foundry classes used:** [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html) (form lifecycle), [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/classes/foundry.applications.api.HandlebarsApplicationMixin.html) (`DEFAULT_OPTIONS.form`), [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) (`update`).
- **Hook events:** none.
- **`foundry.utils.*` helpers relied upon:** [expandObject](https://foundryvtt.com/api/v14/functions/foundry.utils.expandObject.html), [deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html).

## Testing Strategy

- **Unit (pure helpers):** extend `scripts/items/sheets/_spec/pre-effect-item.spec.js` to cover `normalizePreEffectFormData` with object-indexed `system.spellModifications` and each nested array; add a case proving `spellModificationGroups` and unrelated fields survive.
- **Unit (template):** assert in `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` and `pre-effect-item.spec.js` that outcome-payload `name` attributes contain exactly one pre-effect index and no empty segment.
- **E2E:** rerun `e2e/cases/e2e-027-pre-effect-sheet-config` and confirm "outcome panels follow Widerstand and reveal only when enabled" and "adds, persists, and deletes a pre-effect entry" pass; add a regression assertion that toggling a spell-modification `avoidTest.enabled` checkbox does not change the modification's pre-effect count.
