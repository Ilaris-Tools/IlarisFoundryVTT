## ADDED Requirements

### Requirement: Test preservation and failure diagnosis

Existing tests are regression evidence. When an existing unit or E2E test fails after an implementation change, an agent SHALL first determine why the test fails, compare the implementation, the test expectation, and the applicable OpenSpec requirement or documented intended behavior, and fix the implementation while preserving the test if the implementation violates the intended behavior. An agent SHALL NOT modify, weaken, skip, or delete an existing test merely to make the suite pass. An existing test SHALL be updated only when there is evidence that the expected behavior intentionally changed or that the test is incorrect, outdated, flaky, or based on an invalid assumption, and equivalent regression coverage SHALL be preserved for all behavior that remains required.

#### Scenario: Implementation violates intended behavior

- **WHEN** an existing test fails and the implementation contradicts the applicable OpenSpec requirement or documented intended behavior
- **THEN** the agent SHALL fix the implementation and SHALL preserve the test unchanged

#### Scenario: Intended behavior intentionally changed

- **WHEN** an OpenSpec change or documented decision intentionally alters the expected behavior (e.g., a spell cost changes from 4 to 6)
- **THEN** the agent SHALL update the implementation AND the affected tests, each with a behavioral justification recorded in the change artifacts or implementation report

#### Scenario: Pre-existing failure before the change

- **WHEN** the test suite is already failing before the agent starts its change
- **THEN** the agent SHALL report the pre-existing failure as a condition and SHALL not modify unrelated tests merely to obtain a green baseline

#### Scenario: Cause is unclear

- **WHEN** it is unclear whether the implementation or the test represents the intended behavior
- **THEN** the agent SHALL inspect the relevant specification, OpenSpec change, documentation, and surrounding tests before modifying either

### Requirement: Integrity of test changes

Existing tests SHALL NOT be weakened to make the suite pass. Agents SHALL NOT delete or skip a failing test to obtain a passing suite, weaken assertions without behavioral justification, replace specific assertions with broader assertions solely to accommodate the implementation, or update snapshots or expected values blindly. New or updated tests SHALL assert observable behavior derived from the requirement and SHALL be able to fail when the requirement is violated; tests that merely restate the implementation (tautological tests) and assertions only on internal implementation details are prohibited unless they represent a stable contract. Mocks SHALL be placed at module boundaries; an agent SHALL prefer `jest.spyOn` on the real module over `jest.mock` of a system-internal module, SHALL NOT mock the unit under test, and SHALL keep at least one test exercising the real module behind a mocked boundary so mock drift is detectable.

#### Scenario: Weakened assertion without justification

- **WHEN** an agent changes a specific assertion to a broader matcher, removes an assertion, or replaces an expectation to accommodate the implementation without a behavioral justification
- **THEN** the modification SHALL be treated as a violation and the original assertion SHALL be restored or a documented justification SHALL be added

#### Scenario: Implementation-mirroring test

- **WHEN** a new test asserts exactly what the implementation computes without reference to a requirement or documented behavior
- **THEN** the test SHALL be rewritten to assert observable behavior derived from the requirement, or removed if no requirement is covered

#### Scenario: Mock drift

- **WHEN** a test mocks a system-internal module and the real module's exported API changes
- **THEN** the test SHALL not silently stay green; the mock SHALL be replaced by a spy on the real module or a contract test SHALL detect the divergence

### Requirement: E2E determinism and flake triage

E2E tests SHALL be deterministic. An agent SHALL NOT use `.skip`, `.fixme`, `.only`, test timeouts increases, retry configuration changes, or fixed-duration waits as substitutes for diagnosing a failure. Infrastructure failures (Foundry not running, stale packs, missing baseline users) SHALL be resolved with the lifecycle tooling and documented procedures, not by modifying tests. A flaky E2E test SHALL be triaged: diagnose the underlying cause, add or restore deterministic isolation (setup/teardown that removes artifacts, settings restored, no reliance on prior test order), and only then quarantine with a tracked issue or tag plus a follow-up task. Existing tests SHALL remain order-independent and repeatable.

#### Scenario: Flaky test is diagnosed

- **WHEN** an E2E test fails intermittently
- **THEN** the agent SHALL identify the cause (leaked world state, settings, timing) and SHALL fix it with deterministic setup/teardown or predicate-based waits before considering any modification of expectations

#### Scenario: Infrastructure failure

- **WHEN** the E2E environment is unavailable or stale (Foundry down, pack out of date, baseline world incomplete)
- **THEN** the agent SHALL use the lifecycle script (`Status`, `Start`, `Restart`, `PackAndRestart`) or the documented world-reset procedure and SHALL not alter tests to compensate

#### Scenario: Flake quarantine

- **WHEN** a flaky test cannot be fixed immediately and is quarantined via `.skip`/`.fixme` or a tag
- **THEN** the quarantine SHALL be linked to a tracked issue or follow-up task and SHALL not be left as a silent, permanent skip
