# Design — Optimize E2E Login Waits

## Context

`loginAndJoinWorld` (`e2e/shared/fixtures/foundry.ts:57`) runs per E2E test. Current flow: `registerFoundryOverlayHandlers` → `page.goto` → `waitForURL(/join|/game|/setup/, 30s)` → **`networkidle` (15s, rarely fires — WebSockets)** → `isWorldUiVisible` check → login form/join → `waitForURL(/game/)` → world-ready `waitForFunction(30s)`. The `networkidle` wait is both redundant (readiness is checked later) and wasteful (full 15s timeout per login).

## Goals / Non-Goals

**Goals:**

- Remove the `networkidle` wait; wait instead on `game.ready && game.messages`.
- Let already-connected sessions fast-path (skip `goto`/login) — this is the enabler for per-file session reuse (step 2, separate change).
- Keep login semantics identical (same selectors, warnings handling, baseline checks).

**Non-Goals:**

- No session-reuse rollout across test files (step 2).
- No parallelism (`workers: 1` unchanged, per `e2e-testing` spec).
- No changes to test assertions or world baseline.

## Decisions

### D1 — Readiness helper

Extract `waitForWorldReady(page)`:

```ts
async function waitForWorldReady(page: Page) {
    await page.waitForFunction(
        () => typeof game !== 'undefined' && game.ready && !!game.messages,
        undefined,
        { timeout: 30000 },
    )
}
```

Used in both the fresh-login path and the fast-path — single source of truth for readiness semantics (this exact condition already exists in the current fast-path).

### D2 — Fast-path first

At the top of `loginAndJoinWorld`, after `registerFoundryOverlayHandlers`:

```ts
if (page.url().includes('/game') && (await isWorldUiVisible(page))) {
    await waitForWorldReady(page)
    return
}
```

Replaces the current late check (which pays `goto` + `waitForURL` + `networkidle` first). For a fresh page (`about:blank`), the check is cheap (url + one visibility eval) and falls through to the normal login.

### D3 — Remove networkidle

In the login path, delete `waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})`; the world-ready predicate (30s) right after `waitForURL(/game/)` covers readiness. `waitForLoadState('domcontentloaded')` stays for the initial navigation.

## Risks / Trade-offs

- **[Predicate returns before UI fully painted]** → Mitigation: same readiness condition already used by passing tests; all tests follow with explicit `toBeVisible` expectations (15s), and `isWorldUiVisible` re-checks `#chat-log`/`#sidebar` in the fast-path. No assertion relies on `networkidle`.
- **[Faster than before could expose latent timing assumptions]** → Mitigation: run focused regression set (`e2e-003`, `e2e-026`, `e2e-027`, `e2e-031`) + full suite before finalizing; any flake is triaged per E2E policy (infra vs. test), not silenced.
- **[networkidle removal on slow machine]** → Mitigation: 30s readiness timeout is more generous than the old 15s network idle and bounds actual readiness.

## API Surface

**None.** Only the `game` global is read inside page predicates (existing pattern); no Foundry classes, Hooks, or `foundry.utils` helpers touched.

## Testing Strategy

- Duration comparison (before/after) on representative files: `e2e-027` (9 tests, baseline 2.5 min), `e2e-026` (6 tests, 4.4 min), `e2e-003` (25.8 s), `e2e-031` (1.2 min).
- Full suite once after focused runs; lifecycle `Status` first.
- No new tests; same assertions.

## Migration Plan

None — fixture-only change; rollback = revert commit.

## Open Questions

1. Target runtime after this change: ~15–25 min full suite (est.) — measured in apply; if the win is much smaller, revisit the measurement before step 2 (session reuse).
