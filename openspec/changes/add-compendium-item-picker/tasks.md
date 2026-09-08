## 1. API and Setup

- [x] 1.1 Verify against Foundry API docs (v14): AppV2/mixin parts/actions, CompendiumCollection permissions/index/document methods, SearchFilter.cleanQuery, Actor embedded creation, Item.toObject and read-only preview options.
- [x] 1.2 Check foundryvtt.wiki for relevant foundry.utils.\* helpers before source/default manipulation; record unavailable wiki content and use official docs where necessary.
- [x] 1.3 Run npm install before any tests or build operation.

## 2. Unit Tests

- [x] 2.1 Create scripts/items/dialogs/\_spec/item-picker-data.spec.js covering indexed accessible discovery, contextual type/profan filters, name/source combination, same-name source identity, partial errors, and no eager document retrieval; verify failing tests before implementation.
- [x] 2.2 Create scripts/items/dialogs/\_spec/compendium-item-picker.spec.js for preview, unchanged source data, permission/type rechecks, pending-operation guards, cancel/close during retrieval, failed import retry, and explicit blank creation; verify failing tests before implementation.
- [x] 2.3 Create scripts/actors/sheets/\_spec/actor-item-picker.spec.js and focused item context/import helper tests for default names/data, Vorteil mapping, direct ActiveEffect behavior and exactly-one creature freiesTalent conversion; verify failures before implementation.
- [x] 2.4 Verify against Foundry API docs (v14) for mocks used in 2.1-2.3; check foundryvtt.wiki for relevant foundry.utils.\* helpers used by source/default adaptation fixtures.

## 3. Picker and Integration

- [x] 3.1 Implement contextual options/defaults/import-data helper and shared scripts/items/dialogs picker using actor, itemclass and profan; preserve complete ordinary source data and prepare creature conversion without legacy drop dispatch.
- [x] 3.2 Implement readable Item index discovery including type, img and system.profan; combined filters, stable row identity, loading/partial-failure/empty states and lazy source retrieval.
- [x] 3.3 Implement read-only preview, explicit blank creation/import, ownership/access/type checks, single-operation guard, retry and cancellation lifecycle.
- [x] 3.4 Verify against Foundry API docs (v14) for 3.1-3.3; check foundryvtt.wiki for relevant foundry.utils.\* helpers before cloning/default manipulation.
- [x] 3.5 Add Handlebars template parts and scoped responsive styles matching target/settings windows, keeping search focus and footer reachability; register stylesheet.
- [x] 3.6 Route shared/creature item add actions through the picker, map creature own Vorteil creation to Eigenschaft, and preserve direct ActiveEffect creation.
- [x] 3.7 Verify against Foundry API docs (v14) for 3.5-3.6; check foundryvtt.wiki for relevant foundry.utils.\* helpers involved in sheet defaults.
- [x] 3.8 Document the new user flow in existing German user documentation.

## 4. E2E Tests

- [x] 4.1 Update e2e/cases/e2e-013-inventar-geld-gegenstaende/e2e-013-inventar-geld-gegenstaende.spec.ts to explicitly choose own-item creation; retain its inventory regression assertions.
- [x] 4.2 Create a dedicated e2e/cases picker spec covering contextual suggestions, combined filters, preview without creation, single complete import, cancel/close, creature conversions and blank Eigenschaft from the delta scenarios.
- [x] 4.3 Include an owning-player access scenario using deterministic existing compendium candidates, actor snapshots, and temporary existing-pack permission change with exact restoration of core.compendiumConfiguration; reuse shared fixture helpers.
- [x] 4.4 Verify against Foundry API docs (v14) for test setup/restore in 4.1-4.3; check foundryvtt.wiki for relevant foundry.utils.\* helpers used for snapshots.
- [x] 4.5 Check Playwright discovery only. Record that the user explicitly deferred E2E setup and browser execution; do not start/setup a runtime.

## 5. Validation and Review

- [x] 5.1 Run npm test and resolve regressions; run npm run lint and resolve change-related violations.
- [x] 5.2 Run OpenSpec validation for add-compendium-item-picker and review all delta requirements against implementation.
- [x] 5.3 Obtain independent risk-based review with PASS, PASS_WITH_NOTES or BLOCK; address high-confidence findings.
- [x] 5.4 Record final validation evidence, deferred live E2E coverage, and git handoff without committing/publishing unless separately requested.

Compendium \_source data is unchanged, so npm run pack-all is not applicable.
