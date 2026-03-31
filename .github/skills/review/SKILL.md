---
name: 'review'
description: 'Structured code and change review for the Ilaris FoundryVTT system.'
---

# Review Skill

A reusable skill for performing risk-based code reviews with consistent gate decisions.

## When to Use

- After any code change before it's considered complete
- When reviewing PR-level changes
- When validating compendium data modifications
- When checking migration correctness

## Review Checklist

### 1. Understand the Change

- [ ] Read the original task/request
- [ ] Identify all modified files
- [ ] Understand the intent behind each change

### 2. Correctness Check

- [ ] Change accomplishes the stated goal
- [ ] No off-by-one errors, null pointer risks, or logic errors
- [ ] Foundry VTT API methods used correctly (verify against docs)
- [ ] Data model changes match `template.json` schema
- [ ] German/English language usage follows conventions

### 3. Regression Risk Assessment

- [ ] Existing tests still pass (`npm test`)
- [ ] No unintended changes to shared base classes
- [ ] No breaking changes to public APIs or data schemas
- [ ] Compendium data is still valid after changes
- [ ] Active effects system not inadvertently affected

### 4. Test Coverage

- [ ] New behaviors have corresponding tests in `_spec/`
- [ ] Edge cases are covered (empty data, missing fields, boundary values)
- [ ] Mocks are appropriate and not over-mocking

### 5. Style & Documentation

- [ ] Code passes `npm run lint`
- [ ] New public functions have JSDoc comments
- [ ] Behavioral changes are reflected in docs (if applicable)
- [ ] Changelog-worthy changes are noted

### 6. Foundry-Specific Checks

- [ ] Hooks are registered in the feature's `hooks.js`
- [ ] Sheet classes follow the AppV2 pattern (`DEFAULT_OPTIONS`, `PARTS`, `TABS`)
- [ ] Template paths use `systems/Ilaris/scripts/...` prefix
- [ ] `CONFIG.ILARIS` is used for system constants
- [ ] `_source/` JSON updated (not LevelDB directly) for compendium changes

## Gate Decision Logic

```
IF any HIGH severity issue found:
    → BLOCK (with actionable fix description)
ELSE IF any MEDIUM severity issues found:
    → PASS_WITH_NOTES (list issues as recommendations)
ELSE:
    → PASS
```

### Severity Guide

| Severity   | Examples                                                                               |
| ---------- | -------------------------------------------------------------------------------------- |
| **HIGH**   | Runtime error, data loss, security issue, broken existing feature, incorrect API usage |
| **MEDIUM** | Missing test, unhandled edge case, missing doc update, incomplete migration            |
| **LOW**    | Naming suggestion, style preference, optional optimization                             |

## Output

Use the Final Review Verdict Template from `.agents/HANDOFFS_AND_STANDARDS.md`.

## Consistency Rules

- Same input should produce the same gate decision across multiple runs.
- Severity classifications must follow the guide above — do not escalate LOW to HIGH.
- Every BLOCK must be fixable in a single follow-up pass.
