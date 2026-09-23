## 1. Sheet Binding Diagnosis and Implementation

- [x] 1.1 Reproduce the two E2E-027 failures on a lifecycle-managed clean world and trace their AppV2 update paths. (2026-09-03: both reproduce; `expandObject` leaves indexed Pre-Effect paths as objects.)
- [x] 1.2 Verify against Foundry API docs (v14) for the item-sheet/form APIs used. (2026-09-03: AppV2 handler receives `FormDataExtended`; `ItemSheetV2` exposes the document-sheet form processing path.)
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before manipulating nested form data. (Reviewed 2026-09-03: retain the existing `foundry.utils.deepClone` render copy; no additional helper is indicated for the dotted-path form update.)
- [x] 1.4 Implement the minimal nested source-kind persistence and modifier-row rendering correction.

## 2. Unit Tests

- [x] 2.1 Update the relevant Pre-Effect item-sheet unit tests for source kind and added modifier controls.
- [x] 2.2 Run focused Jest tests and `npm test`. (2026-09-04: focused sheet suites passed; the full Jest suite passed after the dedicated resistance-target-resolution change restored `resolveResistTargetActor`.)

## 3. E2E Tests

- [x] 3.1 Run E2E-027 after `node utils/foundry-lifecycle.mjs Restart` and verify reopen persistence visibly. (2026-09-04: source-kind and modifier persistence cases passed in separate fresh E2E sessions.)

## 4. Quality and Handoff

- [x] 4.1 Record runtime evidence, run `npm run lint`, validate strictly, review the scoped diff, and commit only after all validation passes. (Runtime evidence, lint, strict proposal validation, scoped diff review, and the unblocked full Jest suite pass.)
