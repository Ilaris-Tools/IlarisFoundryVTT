# Optimize E2E Login Waits

## Why

The full E2E suite (120 tests, ~44 min) waits per test in `loginAndJoinWorld` (`e2e/shared/fixtures/foundry.ts`):

1. `page.goto` + `waitForURL` + `waitForLoadState('networkidle', 15 s)` **always run before** the "already in game" check — `networkidle` rarely fires on a Foundry page (persistent WebSockets), so each login burns up to the full 15 s timeout, silently swallowed by `.catch(() => {})`.
2. The readiness predicate (`game.ready && game.messages`) runs afterwards anyway, making the `networkidle` wait redundant.

Estimated waste: up to ~20–30 min per full-suite run. This change removes the `networkidle` dependency, puts the reused-session fast-path first, and documents the rule in the `e2e-testing` spec — no behavioral change, no new tests.

## What Changes

- **`e2e/shared/fixtures/foundry.ts` — `loginAndJoinWorld`:**
    - Move the fast-path to the top: if the page is already in `/game` with the world UI visible, wait for world readiness (`game.ready && game.messages`) and return without `goto`.
    - Replace `waitForLoadState('networkidle', 15 s)` with the world-readiness predicate (`waitForFunction` on `game.ready && game.messages`, 30 s) in the login path.
    - Extract a small `waitForWorldReady(page)` helper used by both paths (single source for the readiness condition).
- **Spec:** ADDED `e2e-testing` requirement _Login readiness waits_ — E2E login SHALL wait on the `game.ready` predicate and SHALL NOT rely on `networkidle`; reused sessions SHALL fast-path.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `e2e-testing`: ADDED requirement _Login readiness waits_ — normative statement for the login fixture behavior (predicate waits, fast-path for reused sessions, no `networkidle`).

## Impact

- **Files:** `e2e/shared/fixtures/foundry.ts` (login helper), delta spec `specs/e2e-testing/spec.md`.
- **Foundry API:** none — the `game` global is only read via predicate (`game.ready`, `game.messages`); no classes/Hooks touched; no API doc links required.
- **Dependencies:** none; no compendium changes → no `npm run pack-all`.
- **Behavior:** test-infrastructure only — identical login semantics, faster. No breaking change, no migration.
- **Testing impact:** No new test cases. Verification: focused runs with before/after duration comparison (e.g., `e2e-027` — 9 tests, baseline 2.5 min; `e2e-026` — 6 tests, 4.4 min; `e2e-003`, `e2e-031`), then the full suite once. E2E environment: `ilaris-e2e-world-v14363-r1` (port 30000), lifecycle via `node utils/foundry-lifecycle.mjs` (`Status` first).

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Fixture-only optimization of `loginAndJoinWorld` (fast-path first, predicate instead of `networkidle`) plus one ADDED `e2e-testing` requirement. No test assertions, no production code, no baseline changes.
- **Affected requirements:** ADDED `e2e-testing` _Login readiness waits_; existing requirements (`Sequential execution`, `Stateful E2E case restoration`, `Full-suite reproducibility`) are unchanged.
- **API evidence:** none — only the `game` global is read in page predicates; no Foundry classes/Hooks/utilities.
- **Testing impact:** no new tests; verification via focused duration comparison + full suite; expected same behavior, faster.
- **Migration / rollback:** none — revert commit; no data/schema change.
- **UI ordering:** Not applicable — no UI changes (E2E fixture only).
- **Notes:** (1) The win is estimated, not yet measured — if the full-suite time hardly changes, the apply pauses to re-verify before proceeding (measurement is part of the tasks). (2) This is step 1; per-file session reuse (step 2) is deliberately out of scope here. (3) The `networkidle` wait is swallowed by `.catch(() => {})`, so its cost is invisible in logs — expected, not a defect.
