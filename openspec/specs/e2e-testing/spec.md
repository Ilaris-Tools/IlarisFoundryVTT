## Purpose

End-to-end testing infrastructure with Playwright, 21 test cases, shared fixtures, and browser channel configuration.

## Requirements

### Requirement: Playwright test infrastructure

The system SHALL use Playwright for end-to-end testing with a shared fixture that handles Foundry login, world join, and helper utilities.

#### Scenario: Test fixture logs into Foundry

- **WHEN** a Playwright test runs with the shared Foundry fixture
- **THEN** the fixture SHALL navigate to the Foundry URL, log in, and join the configured world before the test begins

#### Scenario: Browser channel configured per platform

- **WHEN** running tests on Windows
- **THEN** Playwright SHALL use Microsoft Edge as the browser channel (required: Foundry V14 rejects bundled Chromium < 146)

#### Scenario: Browser channel configured for non-Windows

- **WHEN** running tests on macOS or Linux
- **THEN** Playwright SHALL use Google Chrome as the browser channel

#### Scenario: Browser channel override

- **WHEN** `PLAYWRIGHT_CHROMIUM_CHANNEL` environment variable is set
- **THEN** Playwright SHALL use the specified channel regardless of platform

### Requirement: Test execution model

The system SHALL run E2E tests sequentially with one worker. It SHALL use headed browser mode for local contributor execution by default and support an explicit headless CI mode. Both modes SHALL retain video and screenshot evidence on failure.

#### Scenario: Sequential execution

- **WHEN** E2E tests run
- **THEN** only one test SHALL execute at a time (`workers: 1`)

#### Scenario: Local visible browser

- **WHEN** E2E tests run without the explicit CI headless mode
- **THEN** Playwright SHALL use a visible browser (`headless: false`)

#### Scenario: CI headless browser

- **WHEN** E2E tests run with the explicit CI headless mode
- **THEN** Playwright SHALL use a headless browser (`headless: true`)

#### Scenario: Video and screenshot on failure

- **WHEN** a test fails
- **THEN** Playwright SHALL capture a video and screenshot of the failure

### Requirement: Test case structure

Each E2E test case SHALL consist of a Playwright `.spec.ts` file. The canonical test specification SHALL be the corresponding scenario in `openspec/specs/<capability>/spec.md`. The `testfall.md` file is deprecated for new test cases and SHALL NOT be created going forward. Existing `testfall.md` files are retained for reference.

#### Scenario: Spec file contains Playwright test with spec reference

- **WHEN** looking at an E2E test case directory
- **THEN** it SHALL contain a `.spec.ts` file with the Playwright test implementation that references the spec scenario it implements via a JSDoc `@spec` tag

#### Scenario: Testfall no longer created for new cases

- **WHEN** creating a new E2E test case
- **THEN** no `testfall.md` file SHALL be generated; the spec scenario in `openspec/specs/` serves as the test specification

#### Scenario: Existing testfall files retained

- **WHEN** existing E2E test case directories contain `testfall.md` files
- **THEN** those files SHALL be retained as-is for reference

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

### Requirement: Spec scenario to E2E test traceability

E2E test files SHALL reference the spec scenario they implement using a structured comment format.

#### Scenario: Spec reference in test file header

- **WHEN** viewing an E2E `.spec.ts` file
- **THEN** it SHALL contain a JSDoc header with `@spec` pointing to the capability spec file and `@scenario` naming the specific scenario

#### Scenario: E2E environment context in test comments

- **WHEN** an E2E test requires specific environment setup
- **THEN** the `.spec.ts` file SHALL document the required players, world, and any special setup in comments at the top of the file

### Requirement: Test coverage

The system SHALL have E2E test coverage for all major features.

#### Scenario: Combat dialog tests exist

- **WHEN** checking E2E test coverage
- **THEN** test cases SHALL exist for melee attack (e2e-001), ranged attack (e2e-008), supernatural dialog (e2e-009), targeting/defense/damage (e2e-010), and multiplayer (e2e-011)

#### Scenario: Sheet and UI tests exist

- **WHEN** checking E2E test coverage
- **THEN** test cases SHALL exist for hero sheet (e2e-007), inventory (e2e-013), effects tab (e2e-015), notes tab (e2e-018), and supernatural tab (e2e-014)

#### Scenario: Skill and maneuver tests exist

- **WHEN** checking E2E test coverage
- **THEN** test cases SHALL exist for skill dialog (e2e-006), free skill dialog (e2e-019), maneuvers (e2e-003, e2e-017), and mounted combat style (e2e-012)

#### Scenario: Migration and import tests exist

- **WHEN** checking E2E test coverage
- **THEN** test cases SHALL exist for XML import (e2e-016) and legacy type migration (e2e-020)

### Requirement: Test helpers and fixtures

The system SHALL provide shared test helpers for XML integrity validation and Foundry-specific interactions.

#### Scenario: XML integrity validator available

- **WHEN** an XML import test runs
- **THEN** the `xml-integrity-validator.ts` fixture SHALL be available to validate imported XML structure

#### Scenario: Foundry globals declared

- **WHEN** TypeScript compilation runs for test files
- **THEN** Foundry global types SHALL be available via `foundry-globals.d.ts`

## Data Model

N/A — E2E testing does not define persistent data.

## Cross-References

## Additional Requirements

### Requirement: Default configuration baseline

The published E2E world SHALL use documented default settings. A test requiring a non-default setting SHALL apply and restore it through a shared fixture.

### Requirement: Stateful E2E case restoration

E2E cases SHALL restore mutated actors, chat, settings, scenes, tokens, and other shared resources before completion.

### Requirement: Full-suite reproducibility

Stateful E2E cases SHALL pass in isolation and in the serial full suite.

### Requirement: Visible control reachability

Critical E2E assertions SHALL prove controls are visibly reachable through layout or scrolling before activation.

- [importer](../importer/spec.md) — XML import tested by e2e-016
- [combat](../combat/spec.md) — Combat dialogs tested by e2e-001 through e2e-012
- [actor-sheets](../actor-sheets/spec.md) — Actor sheets tested by e2e-007, e2e-013
