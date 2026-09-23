## MODIFIED Requirements

### Requirement: Apply phase uses test-first ordering

During the apply phase, when a code task has a corresponding unit test task, the apply agent SHALL execute the test task before the code task. For a Foundry-facing change, the apply agent SHALL also invoke the repository-local runtime-verification workflow before marking runtime or E2E validation complete.

#### Scenario: Test written before implementation

- **WHEN** tasks.md contains both "Write unit test for X" and "Implement X"
- **THEN** the apply agent SHALL execute the test task first, verify it fails, then implement the code, then verify the test passes

#### Scenario: E2E test created from spec scenario

- **WHEN** an E2E test task references a spec scenario
- **THEN** the apply agent MAY use the E2E Spec Generator to create the `.spec.ts` skeleton, or generate it directly using the spec scenario's WHEN/THEN clauses

#### Scenario: Foundry-facing validation has a runtime checklist

- **WHEN** a change modifies Foundry-facing runtime, UI, compendium, data-lifecycle, or settings behavior
- **THEN** the apply agent SHALL derive and maintain the change-specific runtime checklist before marking validation complete
