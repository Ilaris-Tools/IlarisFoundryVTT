# Runtime Verification: fix-pre-effect-form-submit-corruption

**Scope:** `runtime-relevant`  
**Status:** `passed`  
**World:** `ilaris-e2e-world-v14363-r1`  
**Server:** `http://127.0.0.1:30000`  
**Source revision:** `feature/wound-effects` working tree

## Applicability

This change affects the rendered Pre-Effect Item sheet and persistence of
`Item.system.preEffects` and `Item.system.spellModifications`. Runtime
verification is required.

## Traceability

| Case  | Requirement scenario / task                          | Player-visible behavior                                                                |
| ----- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| RV-01 | Correct indexed outcome-payload names; task 2.3/3.3  | The visible failure-outcome checkbox has `system.preEffects.0...`, not an empty index. |
| RV-02 | Spell-modification form controls survive auto-submit | A control change retains the same nested Pre-Effect list.                              |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, GM E2E user.
- **Actors, items, packs, and settings:** E2E-027 temporary imported spell fixture.
- **Baseline IDs/state to restore:** Temporary world Item created and deleted by the E2E fixture.
- **Restart action:** `Restart` after template and sheet-code changes.
- **Foundry v14 API / wiki references consulted:** ItemSheetV2/AppV2 form handler and `foundry.utils.expandObject`; community API overview.

## UI acceptance contract

- **Affected surface(s):** Pre-Effects section of the supernatural Item sheet.
- **Required order / placement:** Existing section and outcome-card order remain unchanged.
- **Must remain visible / unchanged:** Failure/success outcome labels and their enabling controls.
- **Shared vs. concrete ownership:** `pre-effects.hbs` owns the control names; `PreEffectItemSheet` owns submit normalization.
- **Theme scope:** `not applicable`; no theme-sensitive presentation change.
- **Visual reference:** The browser assertions exercised the visible control path. Playwright removes passed-test screenshot artifacts during result cleanup, so no persistent image artifact remains for review.

## Cases

### RV-01 — outcome controls use an explicit Pre-Effect index

- **Trace:** `Outcome-payload controls render correct indexed names`; tasks 2.3, 3.3, 4.1.
- **Status:** `passed`
- **Fixture/setup:** E2E-027 imported `Ignifaxius Flammenstrahl` Item.
- **Visible player path:** Open the Item sheet and Pre-Effects section, inspect the failure-outcome control, then enable it.
- **Expected visible result:** The checkbox name is `system.preEffects.0.resistanceOutcomes.failure.enabled`; enabling it reveals the outcome controls.
- **Visual assertion:** Outcome card remains in its existing position and the enabling control is visible; Playwright's passed-test cleanup removed the temporary screenshot artifact.
- **State corroboration:** Item document retains the configured outcome after the auto-submit/reopen path.
- **`page.evaluate` use:** Fixture setup, state inspection, close, and cleanup only.
- **Console/page errors:** None reported by the passing Playwright run.
- **Evidence:** `npx playwright test e2e/cases/e2e-027-pre-effect-sheet-config/e2e-027-pre-effect-sheet-config.spec.ts --project=chromium --workers=1` passed on 2026-09-04 after `node utils/foundry-lifecycle.mjs Restart`; the new locator asserted the exact rendered name `system.preEffects.0.resistanceOutcomes.failure.enabled` before toggling it. The complete nine-test suite was rerun successfully after the E2E account became free.
- **Cleanup:** E2E fixture deletes its temporary Item.
- **Result / unverified boundary:** Passed. The outcome editor's normal interactive path is covered; no manual, separate theme review was performed.

### RV-02 — spell-modification auto-submit retains nested Pre-Effects

- **Trace:** `Structured spell modifications persist through auto-submit`; task 4.2.
- **Status:** `passed`
- **Fixture/setup:** Structured spell-modification E2E fixture.
- **Visible player path:** Toggle the visible resistance checkbox on a spell-modification Pre-Effect.
- **Expected visible result:** The same Pre-Effect list remains after rerender and reopen.
- **Visual assertion:** Relevant controls were visible in their established editor section; Playwright's passed-test cleanup removed the temporary screenshot artifact.
- **State corroboration:** Persisted modification contains the same number of Pre-Effects as before the toggle.
- **`page.evaluate` use:** Fixture setup, state inspection, and cleanup only.
- **Console/page errors:** None reported by the passing Playwright run.
- **Evidence:** `npx playwright test e2e/cases/e2e-038-spell-zone-lifecycle/e2e-038-spell-zone-lifecycle.spec.ts --project=chromium --workers=1 --grep "toggling a spell-modification"` passed on 2026-09-04. The test toggled `avoidTest.enabled` off and on, kept the visible card count unchanged, and verified the persisted `sturm.preEffects` remains an array of length one.
- **Cleanup:** Fixture cleanup.
- **Result / unverified boundary:** Passed. It verifies the selected structured modification profile; it does not exhaustively exercise every possible spell-modification control.

## Teardown record

- **Created IDs removed:** Both E2E fixtures delete their temporary world Items in `finally`; no persistent fixture IDs are retained.
- **Settings, targets, documents, chat, map objects, and effects restored:** No settings, actors, chat messages, map objects, or effects were changed; temporary Items were closed and deleted.
- **Termination/failure cleanup verified:** The structured-modification case uses `try`/`finally` cleanup; the E2E-027 fixture completes its own temporary-Item cleanup.

## Final assessment

- **Passed cases:** RV-01 and RV-02.
- **Failed / blocked / not-run cases:** None. The previously missing `resolveResistTargetActor` export was restored by the dedicated resistance-target-resolution change, and the full Jest suite now passes.
- **Unexpected console diagnostics and disposition:** None reported by the focused passing Playwright runs.
- **Runtime validation conclusion:** The repaired behavior is validated in the running Foundry world and the full validation gate is green.
