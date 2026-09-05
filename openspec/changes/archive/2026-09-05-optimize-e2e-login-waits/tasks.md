# Tasks — Optimize E2E Login Waits

## 1. Baseline

- [x] 1.1 Run `node utils/foundry-lifecycle.mjs Status`; ensure Foundry is ready.
- [x] 1.2 Record baseline durations: focused runs of `e2e-003`, `e2e-026`, `e2e-027`, `e2e-031` (known: e2e-027 2.5 m, e2e-026 4.4 m, e2e-003 25.8 s, e2e-031 1.2 m).

## 2. Fixture Implementation

- [x] 2.1 Add `waitForWorldReady(page)` helper (`game.ready && game.messages`, 30 s) in `e2e/shared/fixtures/foundry.ts`.
- [x] 2.2 Move the fast-path to the top of `loginAndJoinWorld` (`/game` + world UI visible → `waitForWorldReady` → return).
- [x] 2.3 Remove the `waitForLoadState('networkidle', 15 s)` call; keep `domcontentloaded` for navigation.
- [x] 2.4 Run Prettier on `foundry.ts` — clean; type-check via Playwright runner (TS compiled by the runner).

## 3. Verification

- [x] 3.1 Focused runs with duration recording: `e2e-003`, `e2e-026`, `e2e-027`, `e2e-031` — all green, record before/after times. — **18 passed (6.1 m) vs. ~8.5 m before (−28 %/Test, Ø 20.4 s).**
- [x] 3.2 Full suite once (`npm run test:e2e`) — all green; record total duration (target: significantly below 44 min). — **120/120 green in 36.6 m (was 43.7 m → −16 %); no failures, no flake.**

## 4. Finalization

- [ ] 4.1 Review the diff (only `foundry.ts` + change artifacts); no unrelated changes.
- [ ] 4.2 Verify the proposal self-review record is present.
- [ ] 4.3 Sync delta specs to main specs, archive the change, and commit per AGENTS.md Git handoff rules (only commit when required E2E tests pass).
