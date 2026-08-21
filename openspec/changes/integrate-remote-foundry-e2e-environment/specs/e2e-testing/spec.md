## MODIFIED Requirements

### Requirement: Playwright test infrastructure

The system SHALL use Playwright for end-to-end testing with a shared fixture that handles Foundry login, world join, and helper utilities.

#### Scenario: Test fixture logs into Foundry

- **WHEN** a Playwright test runs with the shared Foundry fixture
- **THEN** the fixture SHALL navigate to the Foundry URL, log in, and join the configured world before the test begins

#### Scenario: Browser channel configured per platform

- **WHEN** running tests on Windows
- **THEN** Playwright SHALL use Microsoft Edge as the browser channel (required: Foundry V14 rejects bundled Chromium < 146)

#### Scenario: Browser channel configured for non-Windows

- **WHEN** running tests on macOS or Linux without an explicit browser executable
- **THEN** Playwright SHALL use Google Chrome as the browser channel

#### Scenario: Browser channel override

- **WHEN** `PLAYWRIGHT_CHROMIUM_CHANNEL` environment variable is set and no explicit browser executable is configured
- **THEN** Playwright SHALL use the specified channel regardless of platform

#### Scenario: Explicit remote browser executable

- **WHEN** `E2E_CHROMIUM_PATH` identifies an executable in a remote environment
- **THEN** Playwright SHALL launch that executable without applying a conflicting browser channel

### Requirement: Test execution model

The system SHALL run E2E tests sequentially with one worker. It SHALL use headed browser mode for local contributor execution by default and support explicit headless CI or remote modes. Both modes SHALL retain video and screenshot evidence on failure.

#### Scenario: Sequential execution

- **WHEN** E2E tests run
- **THEN** only one test SHALL execute at a time (`workers: 1`)

#### Scenario: Local visible browser

- **WHEN** E2E tests run without an explicit headless environment variable
- **THEN** Playwright SHALL use a visible browser (`headless: false`)

#### Scenario: CI headless browser

- **WHEN** `E2E_CI_HEADLESS` is explicitly enabled
- **THEN** Playwright SHALL use a headless browser (`headless: true`)

#### Scenario: Remote headless browser

- **WHEN** `E2E_HEADLESS` is explicitly enabled by a remote provider adapter
- **THEN** Playwright SHALL use a headless browser (`headless: true`)

#### Scenario: Video and screenshot on failure

- **WHEN** a test fails
- **THEN** Playwright SHALL capture a video and screenshot of the failure
