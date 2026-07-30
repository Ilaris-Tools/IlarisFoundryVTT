## MODIFIED Requirements

### Requirement: Test execution model

The system SHALL run E2E tests sequentially with one worker. It SHALL use headed browser mode for local contributor execution by default and SHALL support an explicit headless CI mode. Both modes SHALL retain video and screenshot evidence on failure.

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

## ADDED Requirements

### Requirement: Reproducible E2E environment

The system SHALL execute Playwright cases only against an isolated E2E world whose baseline data, runtime mode, and browser mode have been validated before feature interactions begin.

#### Scenario: E2E environment is ready

- **WHEN** an E2E run begins
- **THEN** the shared fixture SHALL connect only after the selected runtime mode and baseline-world preflight have completed successfully

#### Scenario: E2E environment cannot be validated

- **WHEN** runtime configuration, browser configuration, or baseline-world validation fails
- **THEN** the run SHALL fail before individual feature cases execute and provide an actionable configuration error
