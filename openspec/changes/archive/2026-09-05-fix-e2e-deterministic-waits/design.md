# Design — Fix E2E Deterministic Waits

## Context

The audit (`add-test-integrity-guardrails/audit-findings.md`) identified 6 fixed-duration `waitForTimeout` calls (F1–F4, VERSTOSS) and 3 VERDACHT findings (F5–F7). E2E runs against `ilaris-e2e-world-v14363-r1` via `node utils/foundry-lifecycle.mjs`; `e2e/README.md` and `docs/develop/e2e-testing.md` already document lifecycle, world reset, and fixtures. The `e2e-testing` spec currently only binds predicate waits to the E2E Spec Generator agent; this change adds the general requirement and fixes the existing violations.

## Goals / Non-Goals

**Goals:**

- Remove all fixed-duration `waitForTimeout` calls from `e2e/cases/` (window violations + opportunistic `e2e-009`).
- Replace each with a predicate wait that reflects the observable condition of the test scenario.
- Document the `test.skip` precondition (F5) and align the two mock drift risks (F6–F7) with the new guardrail.
- Add the general determinism requirement to the `e2e-testing` spec.

**Non-Goals:**

- No new E2E cases, no new fixtures, no Playwright config changes, no baseline-world changes.
- No production code changes.
- No changes to already-compliant `toBeVisible({ timeout })` waits (allowed per spec).
- No remediation of the LEGIT findings (F8–F12) or UNKLAR sampling (F13).

## Decisions

### D1 — Per-case predicate mapping

Each `waitForTimeout` is converted by reading the surrounding test context to determine the observable condition. Expected mapping (verify per file on apply):

| Current wait                                              | Context hint        | Replacement                                           |
| --------------------------------------------------------- | ------------------- | ----------------------------------------------------- |
| `e2e-039-target-magic-resistance:119` (250 ms)            | after dialog action | `await expect(dialogOrResult).toBeVisible()` / `poll` |
| `e2e-039-wall-traversal-trigger:280` (300 ms)             | movement/result     | `await expect(...).toBeVisible()`                     |
| `e2e-025-pre-effect-instant-damage:355` (250 ms)          | chat/wound update   | `expect.poll(...)` or `waitForFunction`               |
| `e2e-027-pre-effect-sheet-config:222,230` (250 ms)        | sheet re-render     | `expect(locator).toBeVisible()` / `waitForFunction`   |
| `e2e-017-kampfstile-manoever-im-kampfdialog:504` (500 ms) | dialog state        | `expect(locator).toBeVisible()`                       |
| `e2e-009-uebernatuerlich-dialog:512` (400 ms)             | debounce            | `expect(...).toBeVisible()` (or pattern from e2e-001) |

Where a debounce is semantically required, prefer a short predicate check on the debounced result rather than a raw sleep; if no predicate exists, use `waitForFunction` on the data state.

### D2 — Mock alignment (F6–F7)

- Prefer `jest.spyOn(<module>, 'openSkillDialog')` / `jest.spyOn(<module>, 'resolveElementalSideEffect')` where the real module can be imported without side effects in the Jest environment.
- If import is not feasible (heavy dependencies), keep the `jest.mock` boundary mock and add a contract assertion: a test verifying the real module exports the mocked names (import reality and compare shape) so drift is detected.
- Do not weaken any assertion in the process.

### D3 — Skip precondition (F5)

Update `e2e/README.md` prerequisites with: the tied-cast-skill scenario requires an actor with ≥2 linked supernatural skills (`HatAlles`); verify the baseline actor; keep the `test.skip` guard but reference the documented precondition so it is a known, tracked environment requirement (anchor: `resolve-tied-cast-skills`).

### D4 — Scope of e2e-009

Included opportunistically (same pattern, pre-existing) — conversion is low risk and removes the last `waitForTimeout` in the suite. If the surrounding test is already brittle, convert only after its focused run passes.

## Risks / Trade-offs

- **[Wrong predicate choice introduces new flakiness]** → Mitigation: convert one case at a time; run the focused spec 2–3× after conversion; pattern copied from already-passing cases (e2e-001, e2e-010 use `toBeVisible`/`dispatchEvent` fallbacks).
- **[e2e-027 is currently failing (exit 1 baseline)]** → Mitigation: run `Status` and a focused `e2e-027` before touching it; if the failure is unrelated/pre-existing, record it and convert only the waits in that file with a passing focused run already recorded — otherwise pause and report.
- **[SpyOn vs. mock changes break Jest module state]** → Mitigation: run `npx jest <file>` immediately after each change; keep `mockReset`/`mockRestore` hygiene.
- **[READ ME/ docs duplicated]** → Mitigation: only add the missing precondition sentence; no duplication of lifecycle documentation.

## API Surface

**None.** No Foundry VTT classes, Hook events, or `foundry.utils.*` helpers are touched.

## Testing Strategy

- **Unit:** after F6–F7: `npm test` full + focused `npm test -- --testPathPattern="effects|combat"`.
- **E2E:** `node utils/foundry-lifecycle.mjs Status` (Restart if needed) → focused runs for `e2e-039` ×2, `e2e-025`, `e2e-027`, `e2e-017`, `e2e-009` → full `npm run test:e2e` once.
- **No new tests:** the change enforces the existing/added determinism requirement on existing cases.

## Migration Plan

None — test code and docs only. Rollback: revert the change's commits.

## Open Questions

1. Is `e2e-009` in scope for this change (default: yes, opportunistic)?
2. Should the full E2E suite run be mandatory before archive, or are focused runs + `Status` sufficient given runtime cost (default: full suite once, per AGENTS.md before commit)?
