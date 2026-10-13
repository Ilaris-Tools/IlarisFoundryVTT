## ADDED Requirements

### Requirement: Agent-neutral remote Foundry provisioning

The system SHALL provide a documented, opt-in cross-platform Node.js provisioning command for local and web-agent environments that prepares and starts a real Foundry VTT server with the repository system linked from the working tree.

#### Scenario: Remote agent starts a canonical test server

- **WHEN** a contributor or web-based agent on Windows, macOS, or Linux provides the required Foundry credentials and runs the provisioning command
- **THEN** the command SHALL prepare a dedicated data root outside the repository, link the working-tree Ilaris system, start Foundry on the configured port, and publish an `E2E_FOUNDRY_URL` suitable for the existing E2E runner

#### Scenario: Credentials are unavailable

- **WHEN** a remote agent runs the provisioning command without required Foundry credentials
- **THEN** the command SHALL exit before downloading, licensing, or launching Foundry with a documented soft-skip result

#### Scenario: Repository command runs on a supported platform

- **WHEN** a contributor invokes a repository-owned lifecycle or provisioning command on Windows, macOS, or Linux
- **THEN** the command SHALL run through the Node.js entry point and SHALL either complete using the platform adapter or report the missing external prerequisite without requiring a shell-only repository script

### Requirement: Shared lifecycle facade with isolated backends

The system SHALL provide `utils/foundry-lifecycle.mjs` as the cross-platform Node.js lifecycle facade for local and remote E2E Foundry servers. It SHALL expose a consistent action vocabulary while selecting explicit local CLI and remote provisioning backends.

#### Scenario: Local lifecycle action is requested

- **WHEN** a contributor selects the local lifecycle mode and runs a supported lifecycle action
- **THEN** the facade SHALL use the configured official Foundry CLI and the dedicated local E2E world without reading remote credentials

#### Scenario: Remote lifecycle action is requested

- **WHEN** a remote agent selects the remote lifecycle mode and runs a supported lifecycle action
- **THEN** the facade SHALL delegate setup/start/stop details to the dedicated remote data root and SHALL stop only the recorded remote process

### Requirement: Manifest-driven canonical baseline provisioning

The remote provisioning command SHALL use `e2e/fixtures/baselines/manifest.json` as the authoritative source for the E2E world archive, world identity, Foundry version, and required baseline content.

#### Scenario: Fresh remote data root is provisioned

- **WHEN** the provisioning command prepares an empty remote data root
- **THEN** it SHALL install the manifest's published archive as `ilaris-e2e-world-v14363-r1` and SHALL not create a separate `vanilla-ilaris` world or synthetic users/actors

#### Scenario: Baseline archive is invalid

- **WHEN** the downloaded baseline archive does not match the manifest checksum
- **THEN** provisioning SHALL stop before extracting or starting Foundry and SHALL report the validation failure

### Requirement: Provider adapters and manual remote entry point

The system SHALL provide thin optional adapters for Claude Web and GitHub Copilot, and SHALL document the equivalent manual setup command for other web-based agents, CI, and Linux contributors.

#### Scenario: Provider-specific startup is configured

- **WHEN** a supported provider starts a remote coding session with credentials configured
- **THEN** its adapter SHALL call the shared provisioning command without copying provisioning logic

#### Scenario: Unsupported or generic web agent is used

- **WHEN** a web-based agent has no repository-specific adapter
- **THEN** the developer documentation SHALL identify the required environment variables and the shared manual provisioning command

### Requirement: Developer-owned secret and sharing controls

The remote environment SHALL read credentials only from process environment variables or a developer-owned secrets file, with process environment variables taking precedence. Optional public sharing SHALL be a separate manual operation with an explicit security warning and teardown path.

#### Scenario: Environment values override the secrets file

- **WHEN** a credential is present in both the process environment and the developer-owned secrets file
- **THEN** provisioning SHALL use the process environment value and SHALL not print either secret

#### Scenario: Remote server sharing is requested

- **WHEN** a developer explicitly runs the sharing command
- **THEN** the command SHALL display that anyone with the short-lived URL can access the unauthenticated test server and SHALL provide a documented way to stop the share
