# Design — Add Test Integrity Guardrails

## Context

The repository runs Jest unit tests (`_spec/`) and Playwright E2E tests against a dedicated world (`ilaris-e2e-world-v14363-r1`, port 30000, lifecycle via `node utils/foundry-lifecycle.mjs`). The Pre-Effect Beta window `c352cd3c..HEAD` (merge-base = release 14.1) contains 18 commits with test changes across ~101 unique test files, linked through GitHub Issue #507 (15 PRs). Existing guidance only tells agents to _run_ tests (`AGENTS.md` Working Rules, `.agents/BUILD_AND_DEVELOPMENT.md` Testing, `docs/develop/e2e-testing.md`); none defines how to treat a **failing existing test** or which test modifications are prohibited.

Precedence relevant for placement (from `AGENTS.md` + `.github/copilot-instructions.md`):

1. `.github/instructions/*` (path-scoped)
2. Provider baseline (`.github/copilot-instructions.md`, `CLAUDE.md`)
3. `AGENTS.md` non-workflow rules
4. `.agents/` knowledge base

For the shared workflow, `AGENTS.md` is authoritative; `openspec/specs/agent-workflow-governance/spec.md` requires provider files to _link_ to `AGENTS.md`/`OPENSPEC_OPERATIONS.md` and **not copy** their content.

## Goals / Non-Goals

**Goals:**

- Establish a vendor-neutral, normative policy in `AGENTS.md` so every agent (Copilot, Claude, Codex, local agents) treats failing existing tests as regression evidence and never weakens tests to become green.
- Provide a detailed diagnosis workflow (decision tree + criteria) in `.agents/BUILD_AND_DEVELOPMENT.md` for humans and agents.
- Add a reviewer gate hint in `.agents/HANDOFFS_AND_STANDARDS.md` so changed existing tests require a behavioral justification.
- Retrospectively audit the Pre-Effect Beta window with the new rules and remediate confirmed violations; record everything in `audit-findings.md`.

**Non-Goals:**

- No new unit/E2E test scenarios are authored by this change itself.
- No production runtime behavior changes (except a production fix only where a confirmed weakened test hid a real bug).
- No changes to `TESTING.md` (manual dice-manipulation guide; different purpose).
- No changes to E2E infrastructure, Playwright config, or the E2E baseline world.
- No vendor-file copies: `CLAUDE.md`, `.github/copilot-instructions.md` stay link-only.
- No changes to code authored by other agents that is still in flight (uncommitted or currently in an in-progress OpenSpec change).

## Decisions

### D1 — Normative policy lives in `AGENTS.md` (Working Rules); detail in `.agents/BUILD_AND_DEVELOPMENT.md`

- **Why:** `AGENTS.md` is the single tool-agnostic file every provider adapter routes to; `.agents/` is the vendor-neutral knowledge base. Provider files are adapter-specific and must not duplicate (governance spec).
- **Alternatives:** policy only in `.github/copilot-instructions.md` (rejected: Copilot-only; Claude/Codex miss it); policy only in `.agents/BUILD_AND_DEVELOPMENT.md` (rejected: rank 4, agents may not read it); one combined huge doc (rejected: precedence + maintainability).

### D2 — Audit split into automated pattern scan + manual evidence check

- **Step 1 (mechanical):** enumerate commits `c352cd3c..HEAD` touching `:(glob)**/_spec/**` / `:(glob)**/e2e/cases/**`; run `git diff -G '<pattern>' c352cd3c..HEAD -- <test paths>` for `.skip|.fixme|.only|xit|xdescribe|timeout:|retries|waitForTimeout|toMatchObject|toContain|expect.anything|mockImplementation|jest.mock`.
- **Step 2 (semantic):** for every hit, `git show <commit> -- <file>` and compare against the associated OpenSpec change delta spec (PR → commit → change mapping, see below). Truth order: **delta spec → expected behavior → existing regression test → implementation**.
- **Why two-step:** cheap recall first, then precision. Skips "safe" diff noise and focuses human/agent attention on semantic hits.
- **Alternatives:** full manual review of all 101 files (rejected: too much noise, same findings); only automated scan without spec check (rejected: misses intentional behavior changes and would flag legit test updates).

### D3 — Findings in `audit-findings.md` inside the change

- Stays in `openspec/changes/.../` and survives archiving; task list stays a checklist. **Alternatives:** findings only in tasks.md/handoff (rejected: lost at archive; no evidence trail).

### D4 — Classification schema and remediation policy

`LEGIT` (spec-backed change) → no action. `VERDACHT` (pattern hit, evidence unclear) → log + owner question, no edit. `VERSTOSS` (high confidence: test weakened/removed/added-tautological without spec backing) → remediate: restore/strengthen test; if the weakened test hid a production bug, fix production as a clearly separated task with its own validation. `UNKLAR` (no PR/change to anchor; e.g., loose branch commits) → log, don't touch.

- **Why conservative:** avoids reverting legitimate behavior changes (e.g., costs 4→6 example) and avoids witch-hunting past contributors.

### D5 — E2E flake rule pair

Policy prohibits `.skip`/`.fixme`/`.only`, timeout/retry increases, `waitForTimeout` as substitutes for diagnosis — complementing the existing `e2e-testing` spec rules (predicate waits, exact counts) that already bind the E2E Spec Generator. Operational facts (lifecycle script, world reset, `Restart`/`PackAndRestart`) remain in `e2e/README.md` and `docs/develop/e2e-testing.md`; the policy references them, it does not duplicate them.

### D6 — Audit window

`c352cd3c..HEAD`, i.e., release 14.1 tag → current branch tip (`feature/effect-extension-2`), **including** loose branch commits and `4ac96239 feat: add creature summoning` (per owner decision). Excluded: merge commits from `develop` (verify via first-parent inspection), commit `982dc82f` (#511 — verified NOT an ancestor of HEAD), and currently in-flight uncommitted work.

## Risks / Trade-offs

- **[Misclassification: a legit test update flagged as VERSTOSS]** → mitigation: D2's spec-anchored truth check; only high-confidence findings remediated; ambiguity stays as finding.
- **[Audit looks like blame on previous contributors]** → mitigation: D4 framing (evidence table, no personal attribution beyond commit), findings neutral, remediation with justification in the implementation report.
- **[E2E remediation destabilizes the suite]** → mitigation: remediate one case at a time; run focused E2E for touched cases; use `node utils/foundry-lifecycle.mjs Status`/`Restart` before running; never modify the baseline world or config.
- **[Policy drift between AGENTS.md and BUILD_AND_DEVELOPMENT.md]** → mitigation: normative text only in AGENTS.md; BUILD file is a workflow mirror, and the archive task includes a consistency check.
- **[Mock rule conflicts with existing `jest.mock` usage]** → mitigation: rule targets _new_ mocks and drift detection; existing established mocks (e.g., `config.js`, `skills-api.js`) are reviewed in the audit, not blanket-reverted.

## API Surface

**None.** This change touches no Foundry VTT classes, no Hook events, and no `foundry.utils.*` helpers. All edits are documentation, OpenSpec artifacts, and tests. Per `openspec/config.yaml`, no API doc links are required.

## Testing Strategy

- **Testable units:** none introduced. The audit is the test of the policy: it applies the guardrails to ~101 existing test files and records outcomes.
- **Verification:** `npm test` after any test remediation; ESLint/Prettier (`npm run lint`, `npm run prettier`) on changed files; focused E2E run (`npm run test:e2e -- e2e/cases/e2e-<n>/...`) for remediated E2E cases against `ilaris-e2e-world-v14363-r1` (Restart/Status via lifecycle script first). No new E2E cases.
- **E2E environment context:** users `e2e-gm`/`e2e-player`, actor `HatAlles`, compendia `kreaturen`/`zauberspruche-und-rituale`, active scene; settings `useTargetSelection`/`lepSystem`/`renameTriumphWithCrit` restored by tests themselves.

## Migration Plan

- Docs and artifacts only — no data migration, no pack-all, no schema change.
- Rollback: revert the change's commit(s); the policy is inert until archived/synced.
- Sequencing: policy docs first (measurement instrument) → audit → remediation → `npm test`/E2E → sync specs → archive.

## Open Questions

1. Should `.github/copilot-instructions.md` get a one-line pointer to the new policy in its "Precedence Rules" (link only, no copy)? Default per governance: no edit needed; decide during apply if reviewers report discoverability issues.
