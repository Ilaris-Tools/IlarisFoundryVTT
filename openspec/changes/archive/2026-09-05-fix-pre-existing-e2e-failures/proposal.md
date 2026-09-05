# Fix Pre-Existing E2E Failures

## Why

The full E2E suite on `feature/effect-extension-2` is not green: **2 cases fail reliably** and are **independent of recent changes** (verified in the `add-test-integrity-guardrails`/`fix-e2e-deterministic-waits` work via three runs and a `git stash` proof — they fail with and without those modifications):

- **`e2e-003-manoever-wuchtschlag-gezielter-schlag`** — the attack modifier total shows `Addierte Modifikatoren: +7` while the individual items display `Gezielter Schlag (Schildarm): -2`, `Schildspalter: +2`, `Wuchtschlag: -3`. **Investigation result (completed):** the `+7` comes from the actor's `system.modifikatoren.manuellermod = 10` in the (mutable) E2E world — `globalermod` (wundabzuege + furchtabzuege + manuellermod) is added by `getAttackSummaryContext` as `statusMods` (`-3 + 10 = +7`). No E2E test writes `+10` (only `e2e-004`→0, `e2e-007`→−3, `e2e-028`→`HatAlles`+2 with cleanup), and `e2e-003` runs before those alphabetically. The `+10` is leftover world state, not a code or test-expectation bug. With `manuellermod = 0` the test passes (verified 1/1).
- **`e2e-031-damage-type-settings`** — after saving settings, Foundry opens a `Reload Application?` dialog (`reload-world-confirm`); the case never dismisses it, so subsequent clicks (e.g., `.delete-damage-type`) are intercepted by the open dialog. This violates the existing `e2e-testing` requirement _Stateful E2E case restoration_.

Skipping or weakening these tests is not an option (test preservation policy, `agent-workflow-governance`). They need to be fixed, and the e2e-003 case needs a rule-backed decision.

## What Changes

- **e2e-031 (test isolation fix):** dismiss the `reload-world-confirm` dialog (click `No` / `data-action="no"`) after each settings save that triggers it (before continuing with subsequent interactions), and ensure settings are still restored in `afterEach`. Implements the existing _Stateful E2E case restoration_ requirement.
- **e2e-003 (deterministic setup — investigation completed):** the test SHALL set `system.modifikatoren.manuellermod = 0` in its setup (with snapshot/restore per the `e2e-017`/`e2e-028` pattern) so it is independent of persisted world state. The expectation `-3` remains unchanged and correct; no production change. (Runs after the world was manually reset; `+7` was caused by leftover `manuellermod = 10`.)
- **Spec:** ADDED requirement in `e2e-testing` — restart-dialog isolation for E2E cases (general rule, anchors the e2e-031 fix). A `combat`-capability delta is only added if the e2e-003 investigation concludes a spec-level behavior change is needed.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `e2e-testing`: ADDED requirement _Restart-dialog isolation_ — E2E cases SHALL dismiss Foundry reload/restart confirmation dialogs they trigger before continuing, and SHALL restore affected settings.

## Impact

- **Files:** `e2e/cases/e2e-031-damage-type-settings/e2e-031-damage-type-settings.spec.ts` (isolation fix), `e2e/cases/e2e-003-manoever-wuchtschlag-gezielter-schlag/e2e-003-manoever-wuchtschlag-gezielter-schlag.spec.ts` (expectation update only if rules confirm), possibly a production fix in `scripts/combat/dialogs/` (e.g., `combat-dialog.js` `_buildTotalModifierData` / `angriff.js` `updateManoeverMods`/`getSummaryContext`) if the total calculation is wrong; delta spec `specs/e2e-testing/spec.md`.
- **Foundry API:** only if a production fix is required — then the affected dialog classes/methods are verified against the Foundry v14 API docs (none assumed).
- **Dependencies:** none; no compendium changes → no `npm run pack-all`.
- **Behavior:** test infrastructure + (conditional) combat modifier total; no breaking change, no migration.
- **Testing impact:** no new test cases; verification = focused `e2e-003`/`e2e-031` + full `npm run test:e2e`, `npm test` if production code changes, `node utils/foundry-lifecycle.mjs Status` first. E2E environment: `ilaris-e2e-world-v14363-r1` (port 30000).

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Two reproducible pre-existing failures; e2e-031 is a defined test-isolation fix, e2e-003 requires an investigation with a rule-backed decision (production fix preserving the test, or justified expectation update). No test weakening/skipping anywhere.
- **Affected requirements:** ADDED `e2e-testing` requirement _Restart-dialog isolation_; the existing _Stateful E2E case restoration_ requirement is the anchor for e2e-031. A `combat` delta is conditional on the investigation result (explicitly noted in design).
- **API evidence:** None assumed; if a `CombatDialog`/`AngriffDialog` production fix is needed, methods are verified against Foundry v14 API docs before editing (no property/signature guessing).
- **Testing impact:** No new tests; existing assertions preserved or strengthened; verification via focused + full E2E and targeted/full unit runs.
- **Migration / rollback:** None — tests (+ conditional prod fix) only; revert commits.
- **UI ordering:** Not applicable — no user-facing UI changes (E2E tests + conditional internal modifier calculation).
- **Notes:** (1) The e2e-003 verdict depends on the rules; if the investigation remains ambiguous, the test stays untouched and a finding is logged. (2) Both failures were proven pre-existing (3 runs + stash) and are unrelated to `fix-e2e-deterministic-waits`/`add-test-integrity-guardrails`. (3) This proposal is created by request after the user confirmed reproducibility; apply only when you want the fix.
