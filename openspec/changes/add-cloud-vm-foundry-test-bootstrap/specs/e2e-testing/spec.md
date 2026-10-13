## MODIFIED Requirements

### Requirement: Test execution model

The system SHALL run E2E tests sequentially with one worker. It SHALL use
headed browser mode for local contributor execution by default and support
explicit headless CI or cloud-VM modes. All modes SHALL retain video and
screenshot evidence on failure.

#### Scenario: Sequential execution

- **WHEN** E2E tests run
- **THEN** only one test SHALL execute at a time (`workers: 1`)

#### Scenario: Local visible browser

- **WHEN** E2E tests run without an explicit headless environment variable
- **THEN** Playwright SHALL use a visible browser (`headless: false`)

#### Scenario: CI headless browser

- **WHEN** `E2E_CI_HEADLESS` is explicitly enabled
- **THEN** Playwright SHALL use a headless browser (`headless: true`)

#### Scenario: Cloud-VM headless browser

- **WHEN** the disposable cloud-VM bootstrap explicitly enables `E2E_HEADLESS`
- **THEN** Playwright SHALL use a headless browser (`headless: true`) without
  changing local contributor defaults

#### Scenario: Video and screenshot on failure

- **WHEN** a test fails
- **THEN** Playwright SHALL capture a video and screenshot of the failure
