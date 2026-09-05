## 1. Zone Diagnosis and Implementation

- [x] 1.1 Run PackAndRestart and reproduce E2E-037, E2E-038, and E2E-040 independently from a clean world.
- [x] 1.2 Verify against Foundry API docs (v14) for Region, TokenDocument, Actor, and embedded-document operations used.
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding fixture utilities.
- [x] 1.4 Scope fixture assertions and cleanup to recorded test-owned documents; correct zone targeting only if clean reproduction proves a runtime defect.

## 2. Unit Tests

- [x] 2.1 Update zone-target and zone-administration unit tests for owned-document and containment behavior.
- [x] 2.2 Run focused Jest tests and `npm test`.

## 3. E2E Tests

- [x] 3.1 Update E2E-037, E2E-038, and E2E-040 fixtures with idempotent cleanup and ownership-scoped assertions.
- [x] 3.2 Run the three E2E cases individually and together after lifecycle preparation; capture runtime evidence.

## 4. Quality and Handoff

- [x] 4.1 Run `npm run lint`, validate strictly, review the scoped diff, and commit only after all validation passes.
