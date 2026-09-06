# Optimize E2E Session Reuse

## Why

Every E2E test logs in with a fresh page (`loginAndJoinWorld` per test). After the `optimize-e2e-login-waits` fast-path, a login on an **already-connected** page is nearly free — but each test still creates a new page and pays `goto` + join + readiness (~3–6 s). 21 case files contain ≥2 tests (~85 of 120 tests), so reusing **one session per file** removes ~64 redundant logins (est. **−4–6 min** on the full suite) and reduces join-related flake surface. The pattern is already proven in-repo: `e2e-009` shares one page via `beforeAll` (`browser.newPage()` + single login + `afterAll` restore/close).

## What Changes

- **Shared helper** in `e2e/shared/fixtures/foundry.ts`: `createE2ESession(browser)` — opens a page, logs in once, returns `{ page, close }` (wraps the proven e2e-009 pattern).
- **Convert multi-test case files** (≥2 tests, ~21 files) to per-file sessions:
    - `beforeAll` → session (single login) + snapshot; `afterAll` → restore + close.
    - Tests use the shared page; per-test state hygiene stays (snapshot/restore where mutating, `clearChatLog`, settings restore) — same semantics as today.
    - Multi-user files (`e2e-038`, `e2e-039*`): the **GM/library page** is reused; player contexts stay per-test (short-lived, no login cost change).
    - Single-test files are not converted (no win).
- **Spec:** ADDED `e2e-testing` requirement _Per-file session reuse_ — multi-test cases SHALL reuse one session per file, with state restored between tests.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `e2e-testing`: ADDED requirement _Per-file session reuse_ (normative pattern: shared session per file, `beforeAll` login, `afterAll` close, per-test state hygiene).

## Impact

- **Files:** `e2e/shared/fixtures/foundry.ts` (+helper), ~21 `e2e/cases/**/*.spec.ts`, delta spec.
- **Foundry API:** none.
- **Dependencies:** none; no compendium changes → no `npm run pack-all`.
- **Behavior:** test-infrastructure only; identical assertions; `workers: 1` and sequential execution remain per spec.
- **Testing impact:** no new tests. Verification: per-file focused runs (all converted files) + full suite once with duration recording (target: 36.6 m → ≤32 m). E2E environment: `ilaris-e2e-world-v14363-r1`, lifecycle `Status` first.

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Test-infrastructure optimization — one shared session per multi-test file (helper + ~21 case-file conversions). No production code, no assertions changed, `workers: 1` and sequential execution unchanged.
- **Affected requirements:** ADDED `e2e-testing` _Per-file session reuse_; no existing requirement modified.
- **API evidence:** None — Playwright Browser/Page APIs only; Foundry `game` predicate unchanged.
- **Testing impact:** No new tests; per-file focused runs + full suite once; identical assertions; expected −4–6 min.
- **Migration / rollback:** None — revert commits; no data/schema.
- **UI ordering:** Not applicable — no UI changes (E2E only).
- **Notes:** (1) State hygiene is mandatory per converted file (existing snapshots/clearChatLog stay); files with page-reload assumptions get an explicit `page.reload()` via the (now cheap) fast-path. (2) Rollout is incremental — each file verified with a focused run before the full suite; if one file proves unstable, its conversion is reverted independently. (3) Multi-user files: only the main page is reused; player contexts remain per-test.
