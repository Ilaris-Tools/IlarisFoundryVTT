## Why

The E2E Spec Generator, created in the `integrate-testing-into-openspec` change, produces structurally broken tests. It lost the mechanical quality rules that made the old E2E Testfall Assistant's output robust. New tests (e2e-025 through e2e-028) exhibit shared mutable state (`const s = {} as never`), time-based waits (`waitForTimeout`), missing click fallbacks for AppV2, loose message assertions (`>` instead of `===`), and manual `browser.newPage()` that bypasses Playwright's test isolation. The old agent had 10 concrete rules that prevented each of these anti-patterns — the new generator has only vague "follow existing patterns" guidance with no enforcement.

## What Changes

- **MODIFIED**: E2E Spec Generator agent definition (`.github/agents/e2e-spec-generator.md`) — add back 6 mandatory quality rules derived from the old E2E Testfall Assistant's rules 4 (robust locators), 7 (research before generation), 8 (no regression), and 9/10 (reviewer gate)
- **ADDED**: Concrete quality rules to the agent: Playwright fixture isolation (no shared mutable state), predicate-based waits (no `waitForTimeout`), AppV2 click fallback via `dispatchEvent`, exact message count assertions, mandatory research phase (find and copy patterns from 2+ existing tests in the same feature area), post-generation verification checklist
- **MODIFIED**: `e2e-testing` spec — update the "E2E Spec Generator agent" requirement to include the quality rules as mandatory scenarios

## Capabilities

### Modified Capabilities

- `e2e-testing`: The E2E Spec Generator requirement SHALL include concrete mechanical quality rules that prevent the anti-patterns found in tests 025-028

## Impact

- **Files modified**: `.github/agents/e2e-spec-generator.md` (add quality rules section), `openspec/specs/e2e-testing/spec.md` (update E2E Spec Generator requirement)
- **New hooks**: None
- **Foundry APIs touched**: None — agent definition change only
- **Type**: Modifies existing agent behavior (additive — adds rules, does not change agent interface)
- **Testing Impact**: Existing E2E cases are unaffected (only the agent that generates new ones changes). The broken tests 025-028 will need to be rewritten using the corrected agent.
