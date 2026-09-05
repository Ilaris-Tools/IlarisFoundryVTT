# Fix E2E Deterministic Waits

## Why

The Pre-Effect Beta audit (evidence: `openspec/changes/add-test-integrity-guardrails/audit-findings.md`) found **6 fixed-duration `waitForTimeout` calls in 5 E2E files** (findings F1–F4, verdict VERSTOSS) that violate the existing `e2e-testing` spec, plus 3 VERDACHT findings (F5–F7: conditional `test.skip` on fixture data, 2 system-internal `jest.mock`s with mock-drift risk). The owner decided remediation is a separate follow-up change — this is it. Fixing these makes the E2E suite deterministic and compliant with the guardrails established by `add-test-integrity-guardrails`.

## What Changes

- **F1–F4 (VERSTOSS):** Replace the 6 fixed-duration `waitForTimeout` calls with predicate-based waits (`expect(...).toBeVisible()`, `waitForFunction`, `waitForSelector`) per the `e2e-testing` spec:
    - `e2e-039-target-magic-resistance` :119 (250 ms)
    - `e2e-039-wall-traversal-trigger` :280 (300 ms)
    - `e2e-025-pre-effect-instant-damage` :355 (250 ms)
    - `e2e-027-pre-effect-sheet-config` :222, :230 (250 ms, ×2)
    - `e2e-017-kampfstile-manoever-im-kampfdialog` :504 (500 ms)
    - Optional (same pattern, pre-existing): `e2e-009-uebernatuerlich-dialog` :512 (400 ms)
- **F5 (VERDACHT):** Document the `test.skip` precondition in `e2e/README.md` (≥2 tied supernatural skills on the E2E actor) and verify the baseline actor for the tied-cast-skill scenario (anchor: `resolve-tied-cast-skills`).
- **F6 (VERDACHT):** `scripts/effects/_spec/nachbrennen-effect.spec.js` — align the `jest.mock('../../skills/skills-api.js')` with the new guardrail: prefer `jest.spyOn` on the real module where importable, otherwise keep the boundary mock and add a contract check.
- **F7 (VERDACHT):** `scripts/combat/_spec/shared_dialog_helpers.test.js` — same alignment for `jest.mock('../../effects/nachbrennen-effect.js')`.
- No production runtime changes. Only E2E test code, unit test mocks, and `e2e/README.md`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `e2e-testing`: ADDED requirement "E2E test case determinism" — test cases SHALL use predicate-based waits and SHALL NOT use fixed-duration `waitForTimeout`. This makes the rule normative for all test cases (it currently only binds the E2E Spec Generator agent) and is the spec anchor for this remediation.

## Impact

- **Files:** 5–6 E2E spec files (`e2e/cases/e2e-039-*` ×2, `e2e-025-*`, `e2e-027-*`, `e2e-017-*`, optional `e2e-009-*`), `e2e/README.md`, `scripts/effects/_spec/nachbrennen-effect.spec.js`, `scripts/combat/_spec/shared_dialog_helpers.test.js`, delta spec `specs/e2e-testing/spec.md`.
- **Foundry API:** none — no classes, Hooks, or `foundry.utils.*` helpers touched; no API doc links required.
- **Dependencies:** none. No `_source/` compendium changes → no `npm run pack-all`.
- **Behavior:** test-only + E2E documentation; no breaking changes, no migration.
- **Testing impact:** No new unit test scenarios or new E2E cases. Verification: `npm test` (unit, after F6–F7), focused E2E runs per converted case, full suite once at the end. E2E environment: `ilaris-e2e-world-v14363-r1` on port 30000; run `node utils/foundry-lifecycle.mjs Status`/`Restart` first. Baseline note: the `e2e-027` run in the terminal returned exit code 1 (ongoing/other session) — verify the baseline before remediation.

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Coherent test-only remediation of audit findings F1–F7 (6 `waitForTimeout` conversions, `e2e/README.md` precondition, 2 mock alignments) plus one ADDED requirement in `e2e-testing`. No production code changes.
- **Affected requirements:** ADDED `e2e-testing` requirement "E2E test case determinism"; the governance requirements from `add-test-integrity-guardrails` are the behavioral anchor (synced separately). No existing requirement is modified.
- **API evidence:** None — no Foundry VTT classes, Hooks, or `foundry.utils.*` helpers touched.
- **Testing impact:** Remediation of existing tests, no new tests; verification via `npm test` and focused/full E2E runs. Pre-existing `e2e-027` failure (exit 1) must be understood before touching that file.
- **Migration / rollback:** None — revert commits; no data or schema changes.
- **UI ordering:** Not applicable — no UI changes (E2E tests only).
- **Notes:** (1) `e2e-009` conversion is opportunistic (pre-existing, outside the audit window) — default in scope, removable if unstable. (2) `jest.spyOn` feasibility depends on Jest import side effects; fallback is a boundary mock + contract test — no assertion may be weakened either way. (3) Full E2E suite run before archive per AGENTS.md; focused runs alone are not sufficient.
