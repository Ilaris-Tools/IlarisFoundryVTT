## ADDED Requirements

### Requirement: Disposable cloud Foundry bootstrap

The system SHALL provide one provider-neutral Node.js command that prepares an
isolated cloud-VM Foundry E2E runtime, runs caller-selected Playwright paths,
and stops its managed Foundry process when the command completes.

#### Scenario: Focused cloud E2E run succeeds

- **WHEN** a Linux VM invokes the bootstrap with valid environment credentials,
  a compatible browser, and one or more E2E paths
- **THEN** the system SHALL install or verify dependencies, provision the
  canonical `ilaris-e2e-world-v14363-r1` baseline, start Foundry locally, run
  those paths headlessly, and stop only its recorded Foundry process afterwards

#### Scenario: Test failure retains evidence and cleans up

- **WHEN** the selected Playwright paths fail after Foundry has started
- **THEN** the system SHALL retain Playwright failure artifacts and SHALL still
  stop only the Foundry process owned by that bootstrap invocation

### Requirement: Environment-only cloud credentials

The cloud bootstrap SHALL require `FOUNDRY_LICENSE_KEY` and either
`FOUNDRY_DOWNLOAD_URL` or both `FOUNDRY_USERNAME` and `FOUNDRY_PASSWORD` from
its inherited process environment. It SHALL NOT read a secrets file.

#### Scenario: Injected credentials are used

- **WHEN** the required credential values are injected into the cloud VM
  environment
- **THEN** the bootstrap SHALL use them without printing their values or
  writing them to the repository

#### Scenario: Credentials are absent

- **WHEN** the required process-environment credentials are absent
- **THEN** the bootstrap SHALL exit with an actionable soft-skip before
  downloading Foundry, starting a server, or running Playwright

### Requirement: Per-run isolation

The cloud bootstrap SHALL use a dedicated managed home and local port for each
run identity, unless explicitly supplied safe values identify an equivalent
isolated home and port.

#### Scenario: Parallel run identities differ

- **WHEN** two cloud tasks use different run identities
- **THEN** they SHALL receive distinct Foundry homes and ports and SHALL NOT
  share a mutable world database or process PID record

#### Scenario: Unsafe managed home is supplied

- **WHEN** a caller supplies a home outside the dedicated cloud-VM managed root
- **THEN** the bootstrap SHALL refuse to use or delete that path
