## ADDED Requirements

### Requirement: E2E test case determinism

E2E test cases SHALL use predicate-based waits (`expect(...).toBeVisible()`, `waitForFunction`, `waitForSelector`) for asynchronous UI state and SHALL NOT use fixed-duration `waitForTimeout` calls as substitutes for waiting on an observable condition.

#### Scenario: Predicate-based wait is used

- **WHEN** an E2E test case needs to wait for UI state (dialog visible, chat message present, effect applied)
- **THEN** the test SHALL wait on a predicate (`expect(...).toBeVisible()`, `waitForFunction`, `waitForSelector`) with a bounded timeout instead of a fixed `waitForTimeout`

#### Scenario: Fixed-duration wait is prohibited

- **WHEN** an E2E test case contains a `waitForTimeout` call
- **THEN** the call SHALL be removed and replaced with a predicate-based wait derived from the observable condition of the scenario
