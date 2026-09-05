# Add Test Integrity Guardrails

## Why

Agents are instructed to run `npm test`, but no repository rule defines how to react when an **existing** unit or E2E test fails after an implementation change. Without such a rule, autonomous agents are incentivized to weaken, skip, or delete tests to obtain a green suite — hiding real regressions and masking production bugs. The Pre-Effect Beta window (`c352cd3c..HEAD`) contains 18 commits touching ~101 test files, so the absence of this guardrail is already a practical risk. Additionally, no rule governs mock drift (tests mocking system modules that diverge from reality), flaky-E2E silencing (timeout/skip/retry instead of diagnosis), or new tests that merely restate the implementation. This change adds a vendor-neutral policy so every agent — regardless of provider — treats failing existing tests as regression evidence first, not as permission to change expectations.

## What Changes

- **`AGENTS.md` — Working Rules (additive):** New normative policy section _Test preservation and failure diagnosis_ plus guardrails for test modifications:
    - Existing test failures are regression evidence; tests SHALL NOT be changed merely to make the suite pass.
    - When a test fails, determine the cause first; fix the implementation if it violates intended behavior, and preserve the test.
    - Tests may be updated only with evidence of an intentional behavior change or an incorrect/outdated/flaky test; equivalent regression coverage must be preserved.
    - Prohibited: deleting/skipping failing tests, weakening assertions without justification, replacing specific assertions with broader ones, blind snapshot/expected-value updates, treating the implementation as authoritative over an existing spec.
    - New or updated tests SHALL assert observable behavior derived from the requirement (OpenSpec spec / documented intent), not implementation details; mock drift via `jest.mock` on system-internal modules is discouraged in favor of boundary mocks / `jest.spyOn` on real modules.
    - E2E tests SHALL remain deterministic: no `.skip`/`.fixme`/timeout/retry increases as substitutes for diagnosing flakiness; infrastructure failures (Foundry down, stale packs) are handled via the lifecycle script, not by modifying tests.
- **`.agents/BUILD_AND_DEVELOPMENT.md` (extend testing section):** Diagnosis workflow (decision tree), violation-pattern criteria table, concrete do/don't list, and the truth-order diagram (OpenSpec requirement → expected behavior → existing regression test → implementation).
- **`.agents/HANDOFFS_AND_STANDARDS.md` (one line in reviewer matrix):** Changed existing tests require a behavioral justification in the implementation report; the reviewer treats "test changed to green" as a review item.
- **Retrospective audit (part of this change):** Apply the new rules to the Pre-Effect Beta window `c352cd3c..HEAD` (including loose branch commits and `4ac96239 feat: add creature summoning`). Findings are recorded in `audit-findings.md` inside this change; confirmed violations are remediated (restore/strengthen tests, fix production code only if the weakened test hid a bug), ambiguous cases are logged as findings for the owner.
- **Vendor files (`CLAUDE.md`, `.github/copilot-instructions.md`) remain link-only** — per existing governance policy, no copies. The policy lives in the tool-agnostic `AGENTS.md` so all vendors adhere.

No production runtime behavior is changed. No Foundry VTT API classes, Hooks, or utilities are touched.

## Capabilities

### New Capabilities

- _(none — the change extends existing governance)_

### Modified Capabilities

- `agent-workflow-governance`: Requirements added for (1) test preservation and failure diagnosis, (2) integrity of test changes (mock drift, tautological tests, no-weakening), (3) E2E determinism and flake triage; the existing retrospective requirement is extended to cover audit of test changes.

## Impact

- **Files:** `AGENTS.md` (policy), `.agents/BUILD_AND_DEVELOPMENT.md` (workflow), `.agents/HANDOFFS_AND_STANDARDS.md` (reviewer note), `openspec/specs/agent-workflow-governance/spec.md` (delta), `openspec/changes/add-test-integrity-guardrails/audit-findings.md` (new), plus remediated test files (restored/strengthened) and — only where a hidden bug is confirmed — the corresponding production fix.
- **Foundry API:** none. No classes, Hooks, or `foundry.utils.*` helpers are touched; API doc links are therefore not applicable. (Verified against `openspec/config.yaml` rule: every touched Foundry API must be listed — empty by design.)
- **Dependencies:** none. No `npm install`, no compendium `_source/` changes → no `npm run pack-all`.
- **Behavior:** purely additive governance policy; no breaking changes, no migration.
- **Testing impact:** No new unit test scenarios or E2E cases are introduced by the policy itself. Existing tests are _audited_, and remediation may update them; affected existing E2E cases include `e2e-025`, `e2e-026`, `e2e-027`, `e2e-031`, `e2e-035`, `e2e-037`, `e2e-038`, `e2e-040`, `e2e-042`, `e2e-043` (files touched within the audit window; confirmation in `audit-findings.md`). E2E environment: dedicated world `ilaris-e2e-world-v14363-r1` on port 30000 with `e2e-gm`/`e2e-player` users; after any `_source/` change `PackAndRestart` is required (not applicable here — code/template only, `Restart` before E2E).

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Coverage is coherent — normative policy in `AGENTS.md`, workflow detail in `.agents/BUILD_AND_DEVELOPMENT.md`, reviewer note in `.agents/HANDOFFS_AND_STANDARDS.md`, plus one retrospective audit of the agreed window `c352cd3c..HEAD`. No vendor-file copies; no runtime code changes except a documented production fix only if a confirmed weakened test hid a bug.
- **Affected requirements:** Delta spec adds three requirements to `agent-workflow-governance` (test preservation & failure diagnosis; integrity of test changes; E2E determinism & flake triage). No existing requirement is modified; the existing retrospective requirement remains compatible.
- **API evidence:** None — no Foundry VTT classes, Hooks, or `foundry.utils.*` helpers are touched; explicitly documented in the design's API Surface.
- **Testing impact:** The change itself introduces no new tests; it audits ~101 existing test files across 19 commits and may restore/strengthen tests. Verification = `npm test`, focused E2E per remediated case, full E2E when multiple cases are touched.
- **Migration / rollback:** None required — documentation, OpenSpec artifacts, and tests only. Rollback = revert this change's commit(s).
- **UI ordering:** Not applicable — no UI is changed.
- **Notes:** (1) Audit verdicts depend on evidence gathered during apply; ambiguous cases remain findings and are not remediated. (2) Open question about an optional one-line pointer in `.github/copilot-instructions.md` is deferred — default is no vendor-file edit. (3) The audit includes `4ac96239 feat: add creature summoning` per owner decision; in-flight work of other agents is excluded.
