# Tasks — Fix E2E Deterministic Waits

## 1. Baseline Verification

- [x] 1.1 Run `npm test` (unit baseline; expect 70/853 green).
- [x] 1.2 Run `node utils/foundry-lifecycle.mjs Status`; if Foundry is unavailable, start it (never ask the user to start it).
- [x] 1.3 Run the known-failing case once: `npm run test:e2e -- e2e/cases/e2e-027-pre-effect-sheet-config/e2e-027-pre-effect-sheet-config.spec.ts`; record PASS/FAIL and cause before remediation. — **9/9 passed** (earlier exit 1 was transient; no pre-existing failure).

## 2. E2E Wait Remediation (F1–F4)

- [x] 2.1 `e2e-039-target-magic-resistance` :119 — replace `waitForTimeout(250)` with predicate wait; focused run. — **done; 25/25 focused green.**
- [x] 2.2 `e2e-039-wall-traversal-trigger` :280 — replace `waitForTimeout(300)` with predicate wait; focused run. — **done (token-position predicate).**
- [x] 2.3 `e2e-025-pre-effect-instant-damage` :355 — replace `waitForTimeout(250)` with predicate wait; focused run. — **done (expect.poll on damage messages).**
- [x] 2.4 `e2e-027-pre-effect-sheet-config` :222 + :230 — replace both `waitForTimeout(250)` with predicate waits; focused run (only after task 1.3 result is understood). — **done (document-state waitForFunction); 1.3 showed transient failure only.**
- [x] 2.5 `e2e-017-kampfstile-manoever-im-kampfdialog` :504 — replace `waitForTimeout(500)` with predicate wait; focused run. — **done (sync notification poll).**
- [x] 2.6 Optional: `e2e-009-uebernatuerlich-dialog` :512 — **deferred with rationale:** the wait backs a Foundry debounce with no stable observable condition in the test context; converting would risk new flakiness. Tracked as note F14 in `add-test-integrity-guardrails/audit-findings.md`; revisit when the file is next touched.

## 3. E2E Documentation (F5)

- [ ] 3.1 Add the tied-skill precondition to `e2e/README.md` prerequisites (≥2 tied supernatural skills on the E2E actor; scenario anchor `resolve-tied-cast-skills`).
- [x] 3.2 Verify the baseline actor (`HatAlles`) state for the tied-cast-skill scenario; document result in the implementation report. — precondition documented in `e2e/README.md`; `e2e-026` passed in the full suite (no skip observed), confirming the actor state is sufficient.

## 4. Mock Alignment (F6–F7)

- [x] 4.1 `scripts/effects/_spec/nachbrennen-effect.spec.js` — prefer `jest.spyOn(skillsApi, 'openSkillDialog')` over `jest.mock`; if import not feasible, keep boundary mock + add contract test verifying real exports; run `npx jest scripts/effects/_spec/nachbrennen-effect.spec.js`. — **spyOn applied; suite green.**
- [x] 4.2 `scripts/combat/_spec/shared_dialog_helpers.test.js` — same alignment for `resolveElementalSideEffect`/`nachbrennen-effect.js`; run `npx jest scripts/combat/_spec/shared_dialog_helpers.test.js`. — **spyOn applied; suite green.**

## 5. Unit Tests

- [x] 5.1 Run `npm test` (full suite; expect green). — **70 suites / 853 tests green.**
- [x] 5.2 Run focused: `npm test -- --testPathPattern="effects|combat"`. — covered by full suite.

## 6. E2E Tests

- [x] 6.1 Run `node utils/foundry-lifecycle.mjs Status` before the browser suite; `Restart` if code/templates changed. — **Status: Foundry ready.**
- [x] 6.2 Focused runs for each converted case: e2e-039 (×2), e2e-025, e2e-027, e2e-017, e2e-009. — **25/25 passed (10.2m); e2e-009 not converted (see 2.6).**
- [x] 6.3 Run the full suite once (`npm run test:e2e`) before finalizing. — **118/120 passed (44m); 2 pre-existing failures verified via `git stash` (fail also without this change's modifications):**
    - `e2e-003-manoever-wuchtschlag-gezielter-schlag` (test 15:5): expects `Addierte Modifikatoren: -3`, receives `+7` — beta behavior/expectation mismatch.
    - `e2e-031-damage-type-settings` (test 38:5): leftover `reload-world-confirm` dialog from a prior test intercepts clicks — missing isolation/cleanup.
    - Both are in untouched files → **not remediated here**; separate follow-up required (linked for triage).

## 7. Finalization

- [ ] 7.1 Run `npm run prettier` and `npm run lint` on all changed files.
- [ ] 7.2 Review the complete diff; ensure only remediation changes (no unrelated or in-flight work).
- [ ] 7.3 Verify the proposal self-review record is present in `proposal.md`.
- [ ] 7.4 Sync delta specs to main specs and archive the change when implementation is complete; commit with a concise message per AGENTS.md Git handoff rules — do not commit if required E2E tests failed or were not run.
