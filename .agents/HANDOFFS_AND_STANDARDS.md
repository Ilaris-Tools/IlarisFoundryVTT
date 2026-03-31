# Handoff Contracts & Output Standards

This document defines the mandatory handoff formats between agent roles (Planner → Specialist → Reviewer) and standardized output templates.

## Handoff Contract

Every transition between agent roles must follow this contract:

### Planner → Specialist

```markdown
## Task Assignment

### Objective

[Single-sentence goal for the specialist]

### Context

- Files involved: [list of file paths]
- Related patterns: [reference to PATTERNS_AND_EXAMPLES.md section]
- Constraints: [any limitations or requirements]
- Prior findings: [research results if available]

### Scope

- **In scope**: [what to do]
- **Out of scope**: [what NOT to do]

### Acceptance Criteria

1. [Concrete, testable criterion]
2. [Concrete, testable criterion]

### Validation Steps

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] [Manual check description]
```

### Specialist → Reviewer

```markdown
## Implementation Report

### Task

[Reference to original objective]

### Changes Made

| File                | Change Type | Description                |
| ------------------- | ----------- | -------------------------- |
| path/to/file.js     | Modified    | [What was changed and why] |
| path/to/new-file.js | Created     | [Purpose of new file]      |

### Artifacts

- [List of created/modified files with full paths]

### Testing

- `npm test`: [PASS/FAIL — details]
- `npm run lint`: [PASS/FAIL — details]
- Manual checks: [description and results]

### Notes

- [Anything the reviewer should pay attention to]
- [Design decisions made and rationale]

### Status

[completed | blocked | needs-review]
```

### Reviewer → Orchestrator

```markdown
## Review Verdict

### Task

[Reference to original objective]

### Gate Decision: [PASS | PASS_WITH_NOTES | BLOCK]

### Summary

[1-3 sentence summary]

### Findings

| #   | Severity     | File         | Finding | Recommendation |
| --- | ------------ | ------------ | ------- | -------------- |
| 1   | HIGH/MED/LOW | path/to/file | [Issue] | [Fix]          |

### Validation Evidence

- [ ] `npm test` — [PASS/FAIL]
- [ ] `npm run lint` — [PASS/FAIL]

### Follow-up Items

- [Optional improvements for future work]
```

---

## Output Templates

### Research Report Template

```markdown
## Research Report: [Topic]

### Question

[What was asked]

### Findings

1. [Finding with source reference]
2. [Finding with source reference]

### Source Evidence

- [File/URL] — [What it proves]

### Recommendations

- [Actionable recommendation]

### Unknowns

- [What couldn't be determined]
```

### Implementation Plan Template

```markdown
## Implementation Plan: [Feature/Fix Name]

### Objective

[Single sentence]

### Assumptions

- [Assumption 1]
- [Assumption 2] `[NEEDS INPUT]`

### Steps

1. **[Step name]** — [Description]
    - Where: `path/to/file.js`
    - Specialist: [code/compendium/setup/docs]
    - Depends on: none
2. **[Step name]** — [Description]
    - Where: `path/to/other.js`
    - Specialist: [code/compendium/setup/docs]
    - Depends on: Step 1

### Validation

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] [Feature-specific check]

### Delegation Map

| Step | Specialist | Input     | Expected Output |
| ---- | ---------- | --------- | --------------- |
| 1    | code       | [context] | [artifact]      |
| 2    | compendium | [context] | [artifact]      |
```

### Final Review Verdict Template

```markdown
## Final Review Verdict

### Task: [Task name]

### Gate Decision: [PASS | PASS_WITH_NOTES | BLOCK]

### Evaluation Matrix

| Criterion       | Status | Notes     |
| --------------- | ------ | --------- |
| Correctness     | ✅/❌  | [details] |
| Regression Risk | ✅/❌  | [details] |
| Test Coverage   | ✅/❌  | [details] |
| Documentation   | ✅/❌  | [details] |
| API Compliance  | ✅/❌  | [details] |
| Style/Lint      | ✅/❌  | [details] |

### Blocking Issues

[Only if BLOCK — concrete, actionable fix descriptions]

### Recommendations

[Non-blocking suggestions]
```

---

## QA Checklist for Agent Definitions

Use this checklist to validate any new or modified agent profile:

### Scope & Boundaries

- [ ] Agent has a clearly defined role (single responsibility)
- [ ] Boundaries explicitly state what the agent **does** and **does not** do
- [ ] No overlap with other agent roles

### Instructions

- [ ] Instructions are unambiguous and deterministic
- [ ] No conflicting rules within the profile
- [ ] Context sources are listed with priority order

### Tools & Capabilities

- [ ] Only necessary tools/capabilities are included
- [ ] Tool usage is scoped to the agent's role
- [ ] No tools that could cause unintended side effects outside scope

### Output Contract

- [ ] Mandatory output format is defined
- [ ] Output format includes all fields needed for the next handoff
- [ ] Example output is provided or referenced

### Testability

- [ ] Success criteria are concrete and measurable
- [ ] At least one validation step can be automated (`npm test`, `npm run lint`)
- [ ] Expected behavior is distinguishable from other agents' behavior
