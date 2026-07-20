## MODIFIED Requirements

### Requirement: E2E Spec Generator agent

The system SHALL provide an E2E Spec Generator agent, refactored from the E2E Testfall Assistant, that takes a spec scenario as input and generates a `.spec.ts` skeleton file. The agent SHALL follow mandatory quality rules that prevent known anti-patterns.

#### Scenario: Agent accepts spec scenario as input

- **WHEN** invoking the E2E Spec Generator
- **THEN** it SHALL accept a spec scenario reference (capability name and scenario name) as its primary input instead of conducting an 11-step intake

#### Scenario: Agent asks essential environment questions

- **WHEN** the E2E Spec Generator runs
- **THEN** it SHALL ask only essential questions: which players are needed, which world to use, and whether any shared fixtures or helpers should be promoted to `e2e/shared/`

#### Scenario: Agent generates valid Playwright spec skeleton

- **WHEN** the E2E Spec Generator completes
- **THEN** it SHALL produce a `.spec.ts` file that uses the existing shared fixtures (`foundry.ts`), follows existing E2E test patterns, and includes a `@spec` JSDoc tag linking to the canonical spec scenario

#### Scenario: Research phase copies patterns from existing tests

- **WHEN** the E2E Spec Generator begins generating a test
- **THEN** it SHALL find at least 2 existing `.spec.ts` files in the same feature area under `e2e/cases/` and extract their wait patterns, click patterns (including `dispatchEvent` fallback), and assertion patterns verbatim for reuse

#### Scenario: Playwright fixture isolation

- **WHEN** the E2E Spec Generator generates a test
- **THEN** it SHALL use Playwright's built-in fixture isolation (`test('name', async ({ page }) => { ... })`) and SHALL NOT create shared mutable state objects, manual `browser.newPage()` calls in `beforeAll`, or `as never` type casts

#### Scenario: Predicate-based waits

- **WHEN** the E2E Spec Generator writes wait logic
- **THEN** it SHALL use predicate-based waits (`waitForFunction`, `expect().toBeVisible()`, `waitForSelector`) and SHALL NOT use fixed-duration `waitForTimeout` calls

#### Scenario: AppV2 click fallback

- **WHEN** the E2E Spec Generator writes a click on a Foundry AppV2 dialog element
- **THEN** it SHALL include a `page.evaluate(() => node.dispatchEvent(new MouseEvent('click', ...)))` fallback after the primary click, following the pattern from existing tests (e.g., e2e-001, e2e-010)

#### Scenario: Exact message count assertions

- **WHEN** the E2E Spec Generator writes chat message verification logic
- **THEN** it SHALL assert exact message counts (`=== baseline + expected`) rather than loose greater-than checks (`> beforeCount`)

#### Scenario: Post-generation verification checklist

- **WHEN** the E2E Spec Generator has produced a `.spec.ts` file
- **THEN** it SHALL run a verification checklist: no shared mutable state, no `waitForTimeout`, has `dispatchEvent` fallback, uses exact message counts, uses Playwright fixture isolation, uses predicate-based waits — and SHALL fix any violations before presenting the output
