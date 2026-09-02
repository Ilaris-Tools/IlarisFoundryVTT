## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: E2E Spec Generator agent

The system SHALL provide an E2E Spec Generator agent, refactored from the E2E Testfall Assistant, that takes a spec scenario as input and generates a `.spec.ts` skeleton file.

#### Scenario: Agent accepts spec scenario as input

- **WHEN** invoking the E2E Spec Generator
- **THEN** it SHALL accept a spec scenario reference (capability name and scenario name) as its primary input instead of conducting an 11-step intake

#### Scenario: Agent asks essential environment questions

- **WHEN** the E2E Spec Generator runs
- **THEN** it SHALL ask only essential questions: which players are needed, which world to use, and whether any shared fixtures or helpers should be promoted to `e2e/shared/`

#### Scenario: Agent generates valid Playwright spec skeleton

- **WHEN** the E2E Spec Generator completes
- **THEN** it SHALL produce a `.spec.ts` file that uses the existing shared fixtures (`foundry.ts`), follows existing E2E test patterns, and includes a `@spec` JSDoc tag linking to the canonical spec scenario

### Requirement: Spec scenario to E2E test traceability

E2E test files SHALL reference the spec scenario they implement using a structured comment format.

#### Scenario: Spec reference in test file header

- **WHEN** viewing an E2E `.spec.ts` file
- **THEN** it SHALL contain a JSDoc header with `@spec` pointing to the capability spec file and `@scenario` naming the specific scenario

#### Scenario: E2E environment context in test comments

- **WHEN** an E2E test requires specific environment setup
- **THEN** the `.spec.ts` file SHALL document the required players, world, and any special setup in comments at the top of the file
