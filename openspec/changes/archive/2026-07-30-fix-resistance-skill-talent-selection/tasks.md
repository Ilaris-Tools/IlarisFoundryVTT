## 1. Validate integration points

- [x] 1.1 Verify the AppV2 sheet and dialog context/render approach against the Foundry API docs (v14).
- [x] 1.2 Check foundryvtt.wiki for relevant ApplicationV2, HandlebarsApplicationMixin, and form-state patterns.
- [x] 1.3 Inspect the existing pre-effect data schema and add optional avoidTest.talent with an empty default while preserving records that omit it.

## 2. Configure profane resistance choices

- [x] 2.1 Update scripts/items/sheets/uebernatuerlich-talent.js to build separate option collections containing only profane fertigkeit and talent compendium entries.
- [x] 2.2 Check foundryvtt.wiki for relevant foundry.utils.\* helpers before adding option-filtering or compatibility utilities.
- [x] 2.3 Include each talent's parent skill and expose only talents compatible with the selected avoidTest.fertigkeit.
- [x] 2.4 Update scripts/items/templates/pre-effects.hbs with an optional Talent selector, unavailable-value handling, and German labels.
- [x] 2.5 Verify the sheet implementation against the Foundry API docs (v14).

## 3. Preselect resistance talents at roll time

- [x] 3.1 Update scripts/effects/pre-effects/resist-handler.js to resolve an optional configured talent only from the target's resolved profane skill.
- [x] 3.2 Pass the matched talent as initial dialog state; leave the dialog unselected when the target lacks that talent and retain the existing missing-skill warning.
- [x] 3.3 Update scripts/skills/dialogs/fertigkeit.js and scripts/skills/templates/dialogs/fertigkeit.hbs so a valid initial talent is selected before the first modifier preview and roll calculation.
- [x] 3.4 Verify the AppV2 dialog and actor-data access against the Foundry API docs (v14).
- [x] 3.5 Check foundryvtt.wiki for relevant foundry.utils.\* helpers before adding any data-copying or lookup utility.

## 4. Unit Tests

- [x] 4.1 Extend scripts/effects/pre-effects/\_spec/resist-handler.spec.js to cover passing a possessed configured talent and omitting an unavailable configured talent.
- [x] 4.2 Add or extend FertigkeitDialog unit coverage for initial specific talent uses PWT and unavailable initial talent uses PW.
- [x] 4.3 Add focused item-sheet option-builder coverage proving supernatural skills are excluded and talents are filtered by their profane parent skill.
- [x] 4.4 Run the targeted Jest suites.

## 5. E2E Tests

- [x] 5.1 Extend e2e/cases/e2e-026-pre-effect-resist-flow/e2e-026-pre-effect-resist-flow.spec.ts with a profane skill resistance that auto-selects a target-owned configured talent and uses PWT.
- [x] 5.2 Extend the same E2E flow with a target lacking the configured talent and assert ohne Talent plus PW fallback.
- [x] 5.3 Extend the pre-effect sheet configuration E2E case to assert supernatural skills are absent, compatible profane talents are present, and avoidTest.talent persists after reopen.
- [x] 5.4 Run the affected Playwright cases using the existing baseline world and GM client.

## 6. Validation

- [x] 6.1 Run npm install.
- [x] 6.2 Run npm test.
- [x] 6.3 Run scoped non-mutating ESLint on the changed JavaScript files; repository-wide npm run lint auto-fixes unrelated dirty files.
- [x] 6.4 Do not run npm run pack-all because implementation did not change compendium \_source data.
