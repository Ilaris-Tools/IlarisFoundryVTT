# Design — Optimize E2E Session Reuse

## Context

Full suite: 120 tests / 36.6 min after step 1. Per-test login still costs ~3–6 s. 21 files have ≥2 tests; `e2e-009` already demonstrates the shared-session pattern (beforeAll page, single login, afterAll restore+close).

## Goals / Non-Goals

**Goals:**

- One login per multi-test file (target: full suite ≤ 32 min).
- Zero semantic change: same assertions, same state semantics (restore between tests).
- Enable the proven pattern for all multi-test files.

**Non-Goals:**

- No parallelism (workers: 1 stays).
- No changes to single-test files.
- No changes to test content/coverage.

## Decisions

### D1 — Helper `createE2ESession(browser)`

In `e2e/shared/fixtures/foundry.ts`:

```ts
export async function createE2ESession(browser: Browser) {
    const page = await browser.newPage()
    await loginAndJoinWorld(page)
    return {
        page,
        close: async () => page.close().catch(() => {}),
    }
}
```

Plus the established pairing in each converted file:

```
beforeAll: session = await createE2ESession(browser); snapshot = await captureActorDefaultSnapshot(...)
afterAll:  restore snapshot; session.close()
```

### D2 — State hygiene per test

- Tests that mutate actors keep their existing `captureActorDefaultSnapshot`/`restoreActorFromDefaultSnapshot` and `clearChatLog` — unchanged.
- Settings changes keep `setFoundrySettingForTest`/`restoreFoundrySetting`.
- Tests that relied on a fresh page (e.g., page reload assumptions) get an explicit `page.reload()` + fast-path login (cheap now) via the fast-path in `loginAndJoinWorld`.

### D3 — Multi-user files

- `e2e-038`, `e2e-039-target`, `e2e-039-wall`: reuse the main GM page per file; `browser.newContext()` player/GM-extra contexts stay per-test (they are isolated, short-lived).
- `e2e-011`: single test — untouched.

### D4 — Rollout order (largest win first)

`e2e-038` (11), `e2e-027` (9), `e2e-037` (7), `e2e-035-maneuver` (6), `e2e-026` (6), `e2e-008` (5), `e2e-035-creature` (4), `e2e-034` (4), then the 3–2-test files. `e2e-009` stays as reference.

## Risks / Trade-offs

- **[State bleed across tests of a file]** → Mitigation: D2 hygiene (existing snapshots), plus file-level `clearChatLog`; each converted file gets a focused run before the full suite.
- **[Page reload assumptions]** → Mitigation: D2 `page.reload()` + fast-path (nearly free now).
- **[Longer per-file test time = harder to attribute failure]** → Mitigation: keep `test.describe.configure({ mode: 'serial' })`? Not required (already serial); per-test `expect` labels unchanged; Playwright reports per test regardless.

## API Surface

**None.** Browser/Page APIs only (Playwright); no Foundry API touched beyond existing `game` predicates.

## Testing Strategy

- Focused runs per converted file (list: e2e-038, e2e-027, e2e-037, e2e-035×2, e2e-026, e2e-008, e2e-034, e2e-017, e2e-028, e2e-025, e2e-039×2, e2e-043, e2e-036, e2e-042, e2e-033, e2e-032×2, e2e-031, e2e-006) — all green.
- Full suite once with duration comparison (target ≤ 32 min).
- No new tests; identical assertions.

## Migration Plan

None — test infrastructure only; rollback = revert commits.

## Open Questions

1. Should `createE2ESession` also pre-register overlay handlers/changelog dismissals (shared with `loginAndJoinWorld`)? — Yes, reuse via `loginAndJoinWorld` (already registers handlers); no separate handling needed.
