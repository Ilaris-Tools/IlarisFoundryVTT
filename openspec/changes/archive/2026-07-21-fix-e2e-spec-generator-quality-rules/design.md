## Context

The `integrate-testing-into-openspec` change created the E2E Spec Generator, a lighter replacement for the E2E Testfall Assistant. It takes a spec scenario as input and generates a `.spec.ts` skeleton. However, it lost the mechanical quality rules that made the old assistant's output robust.

New tests generated since (e2e-025 through e2e-028) exhibit systematic anti-patterns:

| Anti-Pattern                                       | Consequence                               | Old Rule That Prevented It                          |
| -------------------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| Shared mutable state (`const s = {} as never`)     | State leaks between tests                 | Rule 7: Research → find Playwright fixtures pattern |
| `waitForTimeout(1500)` instead of predicate waits  | Flaky, slow, non-deterministic            | Rule 4: Robust locator strategy                     |
| No `dispatchEvent` fallback for AppV2 clicks       | Clicks silently fail on flaky dialogs     | Rule 7: Research → find click fallback pattern      |
| `> beforeCount` instead of `=== baseline + N`      | Doesn't verify correct number of messages | Rule 4+7: Exact assertions from existing patterns   |
| `browser.newPage()` bypassing Playwright isolation | State pollution between tests             | Rule 7: Research → find corrected fixture usage     |

The fix is to add concrete mandatory quality rules back into the E2E Spec Generator, derived from the old assistant's rules 4, 7, 8, and 10 but adapted for the spec-driven workflow.

## Goals / Non-Goals

**Goals:**

- Prevent the six identified anti-patterns from appearing in new E2E tests
- Make research-before-generation concrete (find N reference tests, copy their patterns)
- Add a post-generation verification checklist to the agent
- Update the e2e-testing spec to codify these quality rules as mandatory scenarios

**Non-Goals:**

- Revert to the full 11-step E2E Testfall Assistant
- Reintroduce `testfall.md` as a required artifact
- Rewrite existing tests 025-028 (they need rewriting but that's a separate task)
- Change the agent's interface (still takes spec scenario as input)

## Decisions

### Decision 1: Quality rules as mandatory agent rules, not optional guidance

**Chosen**: Add 6 concrete mandatory rules to the E2E Spec Generator agent definition, each with a specific anti-pattern it prevents.

**Alternatives considered**:

- Add rules to the `openspec/config.yaml` — rejected because these rules are agent-specific, not artifact-wide
- Put rules in a separate "E2E testing style guide" document — rejected because separation means they won't be followed
- Make rules optional "best practices" — rejected because the current "follow existing patterns" guidance is already ignored

**Rationale**: The old agent's success came from its hard rules (numbered, mandatory, with clear consequences). Vague guidance doesn't work.

### Decision 2: Research phase must find N reference tests, not just "check"

**Chosen**: The research step SHALL find at least 2 existing test files in the same feature area and extract their wait/click/assertion patterns verbatim.

**Rationale**: "Check existing tests" is too vague. The anti-patterns in 025-028 all trace to not copying existing patterns. Making the copy step mechanical ensures patterns propagate.

### Decision 3: Post-generation verification checklist

**Chosen**: After generating a `.spec.ts`, the agent SHALL run a 6-point checklist: no shared mutable state, no `waitForTimeout`, has `dispatchEvent` fallback, uses exact message counts, uses Playwright fixture isolation, uses `waitForFunction`/`expect().toBeVisible()` for waits.

**Rationale**: The old agent had a Reviewer gate (Rule 10). The new agent needs an equivalent — a mechanical checklist that catches anti-patterns before the file is written.

## Risks / Trade-offs

- **Rules may be too rigid for edge cases** → Mitigation: rules say SHALL (mandatory) but the agent can apply judgment; the checklist catches violations before output
- **Copying patterns may propagate bugs from old tests** → Mitigation: reference tests are the 21 well-structured ones (001-024), not the broken new ones
- **Post-generation checklist adds friction** → Acceptable: the cost of bad tests (debugging, flakiness, rewrites) is higher than the cost of a checklist
