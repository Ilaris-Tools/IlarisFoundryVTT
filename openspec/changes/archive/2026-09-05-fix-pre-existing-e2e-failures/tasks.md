# Tasks — Fix Pre-Existing E2E Failures

## 1. Baseline

- [x] 1.1 Run `node utils/foundry-lifecycle.mjs Status`; ensure Foundry is ready.
- [x] 1.2 Re-run focused `e2e-003` and `e2e-031` to confirm both still fail (reproducibility evidence already recorded: 3 runs + stash proof). — baseline: `e2e-003` red (manuellermod=10 pollution), `e2e-031` red (reload dialog); root causes documented.

## 2. e2e-031 — Restart-dialog isolation

- [x] 2.1 Add a dismiss helper (or inline handling) that closes the `reload-world-confirm` dialog (`button[data-action="no"]`) when present. — wait-based (`waitFor visible, 5s` → click `no`; race-safe).
- [x] 2.2 Apply it after every `saveSettings` in `e2e-031-damage-type-settings.spec.ts` before subsequent interactions. — 4 call sites + beforeEach cleanup.
- [x] 2.3 Keep/verify the `afterEach` settings restoration; run focused `e2e-031` → green. — **2/2 passed (1.2m).**

## 3. e2e-003 — Deterministic setup (investigation completed: world-state pollution, no code/test bug)

- [x] 3.1 Investigation: `+7 = mod_at(-3) + globalermod(+10)` — `manuellermod = 10` in the E2E world (`Testlauf-Held`), no E2E writer found; expectation `-3` is correct. Documented in `proposal.md`/`design.md`.
- [x] 3.2 Verified: with `system.modifikatoren.manuellermod = 0` the focused run passes (1/1, 25.8 s).
- [x] 3.3 Implement deterministic setup in `e2e-003`: snapshot actor, set `manuellermod = 0` before the modifier assertions, restore actor in `afterEach` (pattern `e2e-017`/`e2e-028`).
- [x] 3.4 Run focused `e2e-003` → green. — **1/1 passed (25.8 s).**

## 4. Unit Tests

- [ ] 4.1 If production changed: `npx jest scripts/combat/_spec/angriff.spec.js` and `npm test` (full suite).

## 5. E2E Tests

- [x] 5.1 Focused runs: `e2e-003`, `e2e-031` — both green. — **e2e-003 1/1, e2e-031 2/2.**
- [x] 5.2 Full suite once (`npm run test:e2e`) — 120/120 green; record result. — **119/120 (43.7 m); sole failure `e2e-026` (Z. 534) was infrastructure (Foundry session lost — setup page, `game` undefined), verified green in isolation 6/6 (4.4 m) after `foundry-lifecycle.mjs Start`; no test change.**

## 6. Finalization

- [x] 6.1 Run `npm run prettier` and `npm run lint` on changed files. — prettier clean (unchanged).
- [x] 6.2 Review the diff; no unrelated/in-flight changes. — only e2e-003, e2e-031, delta/main spec, change dir.
- [x] 6.3 Verify the proposal self-review record is present in `proposal.md`. — PASS_WITH_NOTES recorded.
- [x] 6.4 Sync delta specs to main specs, archive the change, and commit per AGENTS.md Git handoff rules (only commit when required E2E tests pass). — sync + archive + commit (in progress; commit follows).
