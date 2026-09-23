# Tasks — Optimize E2E Session Reuse

## 1. Infrastructure

- [x] 1.1 Add `createE2ESession(browser)` helper to `e2e/shared/fixtures/foundry.ts` (newPage + login + close wrapper).
- [x] 1.2 Add a short pattern doc (JSDoc) for beforeAll/afterAll usage.
- [x] 1.3 Fix race in `clearChatLog` discovered during rollout: the chat-delete confirmation can appear asynchronously after the "Leeren" click (reused sessions) — waits briefly for the confirm button (2 s) instead of an immediate `isVisible()` check.
- [x] 1.4 Eliminate idle waits at test start (measured 10–20 s): `clearChatLog` caps confirm wait at 2 s and uses the chat-empty predicate as the real signal; `openChatSidebar` scope locator timeout reduced from 10 s to 3 s.

## 2. Rollout per multi-test file

- [x] 2.1 `e2e-038-spell-zone-lifecycle` (11 tests) — session + browser ref per file; console listener moved to beforeAll
- [x] 2.2 `e2e-027-pre-effect-sheet-config` (9)
- [x] 2.3 `e2e-037-structured-spell-modifications` (7)
- [x] 2.4 `e2e-035-maneuver-pre-effects` (6) + `e2e-026-pre-effect-resist-flow` (6)
- [x] 2.5 `e2e-008-fernkampf-angriffsdialog` (5) + `e2e-035-creature-summoning` (4) + `e2e-034-summoned-items` (4)
- [x] 2.6 `e2e-017` (3) + `e2e-028` (3) + `e2e-025` (3) + `e2e-039-target` (3) — `e2e-039-target` skipped: only 1 of 3 tests is single-user (no win)
- [x] 2.7 2-test files — **done: `e2e-006` ✅, `e2e-031` ✅, `e2e-032-situative` ✅, `e2e-032-weapon` ✅, `e2e-033` ✅, `e2e-036` ✅, `e2e-039-wall` ✅, `e2e-042` ✅, `e2e-043` ✅** (batch verified: 18/18, 5.7 m)
- [x] 2.8 Do NOT convert single-test files (no win).

## 3. Verification

- [x] 3.1 Focused run per converted file (all green) — record any needed `page.reload()` adaptations. \*\*Batches: 1+2: 18/18 (5.7 m) | 3: 24/24 (2.4 m) | 4: 43/43 (6.4 m + 1.5 m re-run). Discovered during rollout: `clearChatLog` confirm race (fixed, 1.3); `closeOpenApplications` must keep core UI/directories (container-based); e2e-008 dialog environment selects persist across tests in a reused session (explicit neutral reset in scenario E); e2e-035-creature required the missing session hooks (beforeAll/afterAll) added in 2.5; e2e-038 keeps `loginAndJoinWorld`/`foundryConfig` for player contexts and the `page.reload()` re-login path.
- [ ] 3.2 Full suite once (`npm run test:e2e`) — all green; record duration (target ≤ 32 min vs. 36.6 m).

## 4. Finalization

- [ ] 4.1 Prettier/lint on changed files; diff review (only fixture + case files).
- [ ] 4.2 Verify proposal self-review record.
- [ ] 4.3 Sync delta specs, archive, commit per AGENTS.md (only when required E2E tests pass).
