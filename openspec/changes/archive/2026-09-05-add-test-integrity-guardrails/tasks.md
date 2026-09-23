# Tasks — Add Test Integrity Guardrails

## 1. Policy Documentation

- [x] 1.1 Add normative policy "Test preservation and failure diagnosis" to `AGENTS.md` (Working Rules) per spec requirement: failing existing tests are regression evidence; fix implementation first, preserve test; update tests only with justification and equivalent regression coverage.
- [x] 1.2 Add guardrail "Integrity of test changes" to `AGENTS.md`: no deleting/skipping/weakening to green; no broader matchers without justification; no blind snapshot updates; new/updated tests assert observable behavior from the requirement; mocks at boundaries, prefer `jest.spyOn` on real module, don't mock the unit under test.
- [x] 1.3 Add guardrail "E2E determinism and flake triage" to `AGENTS.md`: no `.skip`/`.fixme`/`.only`/timeout/retry/`waitForTimeout` as substitutes for diagnosis; infrastructure issues via `node utils/foundry-lifecycle.mjs`; flake triage with tracked issue/tag; reference `e2e/README.md` and `docs/develop/e2e-testing.md` without duplicating operational facts.
- [x] 1.4 Extend `.agents/BUILD_AND_DEVELOPMENT.md` (Testing section) with the diagnosis workflow: decision tree (existing test fails → understand → check spec → fix code / update impl+test / update test with justification / investigate), violation criteria table (assertion weakened, skip/fixme/only, timeout/retry, mock drift, tautological test, blind snapshot), do/don't list, and the truth-order diagram (OpenSpec requirement → expected behavior → regression test → implementation).
- [x] 1.5 Add reviewer note to `.agents/HANDOFFS_AND_STANDARDS.md` (Evaluation Matrix, Regression Risk row): changed existing tests require a behavioral justification in the implementation report.
- [x] 1.6 Verify vendor neutrality: `CLAUDE.md` and `.github/copilot-instructions.md` contain no policy copy — only existing links to `AGENTS.md` (governance conformance).
- [x] 1.7 Verify `TESTING.md` remains untouched (manual dice guide, different purpose).

## 2. Retrospective Audit

- [x] 2.1 Build the PR → commit → OpenSpec-change mapping table in `audit-findings.md`: Issue #507 links 15 PRs (#493, #496, #502–#519); resolve each squash commit via `git log --oneline --all --grep="#<n>"`; map to existing change in `openspec/changes/` (e.g., #518 → `add-ballistic-spell-resolution`, #516 → `add-target-magic-resistance`, #517 → `add-summoned-actor-pre-effect`, #505 → `add-creature-summoning`, #495/#519 → verify existence; missing → mark as retrospective candidate).
- [x] 2.2 Enumerate the audit window: `git log --oneline --no-merges c352cd3c..HEAD -- ":(glob)**/_spec/**" ":(glob)**/e2e/cases/**"` — expected 19 commits (18 + `4ac96239 feat: add creature summoning`); exclude `testfall.md` from violation scope (context only).
- [x] 2.3 Run the automated pattern scan: `git diff -G '\.skip|\.fixme|\.only|xit|xdescribe|timeout:|retries|waitForTimeout|toMatchObject|toContain|expect\.anything|mockImplementation|jest\.mock' c352cd3c..HEAD -- ":(glob)**/_spec/**" ":(glob)**/e2e/cases/**"`; collect candidate hits.
- [x] 2.4 For each candidate hit, inspect with `git show <commit> -- <file>`; classify against the associated delta spec using the truth order (delta spec → expected behavior → existing regression test → implementation).
- [x] 2.5 Record every inspected hit in `audit-findings.md` as a table row: commit, PR/change, file, pattern, evidence, verdict (LEGIT / VERDACHT / VERSTOSS / UNKLAR), action.
- [x] 2.6 Mark loose commits without PR anchor (e.g., `9f88e9a8`, `bdbf7ecc`, `f90da293`, `3cda0e7d`) as UNKLAR where no OpenSpec anchor exists — no remediation without evidence.
- [x] 2.7 Run `npm test` before any remediation to record the baseline suite state.

## 3. Remediation — deferred to a follow-up change

Owner decision (2026-09-05): remediation is intentionally **not** part of this change. All findings (F1–F14) are documented in `audit-findings.md` in this change directory, including the proposed follow-up change name, scope, and acceptance criteria. The follow-up proposal derives its evidence base from this file.

## 4. Unit Tests

- [x] 4.1 Run `npm test` (full suite) as audit baseline — **70 suites / 853 tests, all green** (no pre-existing failures; recorded in `audit-findings.md`).
- [x] 4.2 Baseline verification only — no production or unit test code was modified by this change, so no re-run of focused feature suites is required.
- [x] 4.3 Confirm no `.skip`/`.only`/disabled assertions were introduced by this change (docs/audit only).

## 5. E2E Tests

- [x] 5.1 No E2E code was modified by this change — no lifecycle operations required. (Note: the pre-existing `e2e-027` run in the terminal returned exit code 1; this is a baseline condition to be verified by the follow-up remediation change, not by this change.)
- [x] 5.2 Not applicable — no remediated E2E cases in this change.
- [x] 5.3 Not applicable — no E2E suite run required.

## 6. Finalization

- [x] 6.1 Run `npm run prettier` on all changed files (docs/Markdown); fix formatting issues.
- [x] 6.2 Verify the proposal self-review record is present in `proposal.md` — **PASS_WITH_NOTES** recorded.
- [x] 6.3 Review the complete diff; ensure no unrelated or in-flight changes are included (e.g., other agents' uncommitted work).
- [x] 6.4 Sync delta specs to main specs and archive the change when implementation is complete (`openspec archive` workflow); commit with a concise message per AGENTS.md Git handoff rules. — Synced (2026-09-05) + archived to `openspec/changes/archive/2026-09-05-add-test-integrity-guardrails/`; commit pending.
