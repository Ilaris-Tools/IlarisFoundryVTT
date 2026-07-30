## Purpose

Integration of testing awareness into the OpenSpec workflow (explore → propose → apply → archive). Testing is treated as a lens applied across all phases — not a separate phase or mandatory checklist — surfacing unit test and E2E test considerations where applicable.

## Requirements

### Requirement: Explore phase surfaces testing questions

During the explore phase, the agent SHALL naturally surface testing-related questions when relevant to the change being discussed. This is a lens, not a required checklist — testing questions are asked where applicable, not for every change.

#### Scenario: UI change surfaces E2E questions

- **WHEN** exploring a change that modifies a dialog or sheet
- **THEN** the explore agent SHALL note which existing E2E test cases exercise that UI and ask whether they should be regression-verified

#### Scenario: New pure function surfaces unit test opportunity

- **WHEN** exploring a change that introduces a new pure function or helper
- **THEN** the explore agent SHALL note that the function is unit-testable and ask whether a unit test task should be created

#### Scenario: Internal refactor does not force E2E questions

- **WHEN** exploring a change that is purely an internal refactor with no UI or API surface change
- **THEN** the explore agent MAY skip E2E testing questions and focus on unit test coverage only

### Requirement: Proposal captures testing impact

The proposal.md artifact SHALL include an optional "Testing Impact" section that captures new and existing test coverage relevant to the change.

#### Scenario: Testing Impact section populated for change with testing needs

- **WHEN** a change affects user-facing behavior or introduces new logic
- **THEN** the proposal SHALL list new unit test scenarios needed, existing unit tests to update, new E2E cases needed, and existing E2E cases affected

#### Scenario: Testing Impact captures E2E environment context

- **WHEN** a change requires new E2E tests
- **THEN** the Testing Impact section SHALL capture the players needed, world state requirements, and any shared code candidates to promote to `e2e/shared/`

#### Scenario: Testing Impact omitted for changes with no testing impact

- **WHEN** a change has no testing impact (e.g., documentation-only changes)
- **THEN** the Testing Impact section MAY be omitted

### Requirement: Design captures testing strategy

The design.md artifact SHALL include an optional "Testing Strategy" section that identifies testable units and E2E coverage for the change.

#### Scenario: Testing Strategy identifies testable units

- **WHEN** a design describes new or modified functions or classes
- **THEN** the Testing Strategy SHALL list which units are testable and which existing test patterns (pure function, dynamic import, jest.mock, Object.create) apply

#### Scenario: Testing Strategy identifies E2E coverage

- **WHEN** a design describes new or modified user flows
- **THEN** the Testing Strategy SHALL list which existing E2E cases cover those flows and which new cases are needed

### Requirement: Tasks include dedicated test groups

The tasks.md artifact SHALL include dedicated "Unit Tests" and "E2E Tests" task groups when the change requires testing. Test tasks SHALL be first-class task groups, not buried in a validation section.

#### Scenario: Unit test task group created

- **WHEN** a change requires new or updated unit tests
- **THEN** tasks.md SHALL contain a "Unit Tests" task group with individual tasks for each test file to create or update

#### Scenario: E2E test task group created

- **WHEN** a change requires new or updated E2E tests
- **THEN** tasks.md SHALL contain an "E2E Tests" task group with tasks for regression verification of affected cases and creation of new cases

#### Scenario: Test groups reference spec scenarios

- **WHEN** a task creates a new E2E test
- **THEN** the task description SHALL reference the spec scenario(s) the test implements

### Requirement: Apply phase uses test-first ordering

During the apply phase, when a code task has a corresponding unit test task, the apply agent SHALL execute the test task before the code task.

#### Scenario: Test written before implementation

- **WHEN** tasks.md contains both "Write unit test for X" and "Implement X"
- **THEN** the apply agent SHALL execute the test task first, verify it fails, then implement the code, then verify the test passes

#### Scenario: E2E test created from spec scenario

- **WHEN** an E2E test task references a spec scenario
- **THEN** the apply agent MAY use the E2E Spec Generator to create the `.spec.ts` skeleton, or generate it directly using the spec scenario's WHEN/THEN clauses

### Requirement: Archive phase verifies test coverage

During the archive phase, the archive agent SHALL check that test files exist for capabilities touched by the change, where applicable.

#### Scenario: Test files exist for touched capability

- **WHEN** archiving a change that added logic to a module
- **THEN** the archive agent SHALL verify that a corresponding `_spec_/` file exists or was created

#### Scenario: Missing test files noted but do not block

- **WHEN** a capability has no corresponding test file
- **THEN** the archive agent SHALL note the gap but SHALL NOT block archival — the "where applicable" principle applies

#### Scenario: E2E regression verification noted

- **WHEN** archiving a change that listed affected E2E cases in its proposal
- **THEN** the archive agent SHALL note whether those cases were regression-verified

## Data Model

N/A — This specification defines development workflow behavior, not persistent data structures.

## Cross-References

- [e2e-testing](../e2e-testing/spec.md) — E2E test infrastructure and the E2E Spec Generator agent
