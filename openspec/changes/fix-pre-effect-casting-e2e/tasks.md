## 1. Diagnosis and Implementation

- [x] 1.1 Reproduce E2E-025 on a clean lifecycle-managed world and identify why its visible roll action produces no chat result.
    - The roll action is visible and creates its chat result; the failure is fixture data: the world's `Ignifaxius Flammenstrahl` carries stale non-instant Pre-Effects and a `ballistic` marker, so the instant Pre-Effects never run after the roll.
- [x] 1.2 Verify against Foundry API docs (v14) for any Actor or ChatMessage API used by the fix.
    - Fix is fixture-only and reuses existing `Item.update`, `Actor.createEmbeddedDocuments`, and `foundry.utils.deepClone` (all already used elsewhere in the suite).
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding fixture cloning.
    - Reused the existing `foundry.utils.deepClone`; no new helper was required.
- [x] 1.4 Implement the minimal dialog/action or fixture correction while preserving normal targeted and ballistic behavior.
    - E2E-025 imports `Fulminictus Donnerkeil` from the compendium (a naturally non-ballistic instant-damage spell); E2E-042 computes the attack modifier deterministically. No production code changed.

## 2. Unit Tests

- [x] 2.1 Add or update focused dialog/processor tests covering the restored action-to-Pre-Effect transition.
    - Not applicable: the correction is fixture-only (no production code changed). Existing `scripts/combat/_spec/uebernatuerlich_roll.spec.js` already covers the action-to-Pre-Effect transition.
- [x] 2.2 Run the focused Jest tests and `npm test`.
    - `npm test`: 808 passed; 3 pre-existing, unrelated failures in `scripts/effects/pre-effects/_spec/resist-handler.spec.js` (`resolveResistTargetActor` is not exported).

## 3. E2E Tests

- [x] 3.1 Make E2E-042's defended fixture explicitly eligible for Akrobatik.
    - `createTarget` now guarantees the unlinked target token actor has an `Athletik` skill and `Akrobatik` talent.
- [x] 3.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart`, then E2E-025 and E2E-042 independently and together.
    - `PackAndRestart` completed; E2E-025 (3 tests) and E2E-042 (2 tests) pass together.

## 4. Quality and Handoff

- [x] 4.1 Record runtime evidence, run `npm run lint`, and validate the change strictly.
    - `runtime-verification.md` records the passing E2E evidence; `npm run lint` passes; `openspec validate "fix-pre-effect-casting-e2e"` reports the change valid.
- [x] 4.2 Review the scoped diff and commit only after required validation passes.
    - Committed as `fix(e2e): restore instant pre-effect casting and Akrobatik defense fixtures`.
