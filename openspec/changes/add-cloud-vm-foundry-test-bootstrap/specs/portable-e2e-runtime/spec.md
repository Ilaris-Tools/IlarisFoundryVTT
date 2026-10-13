## MODIFIED Requirements

### Requirement: Contributor-managed Foundry server

The E2E runner SHALL require `E2E_FOUNDRY_URL` for an already-running,
contributor-licensed Foundry VTT server. It SHALL never start or stop Foundry,
create a data root, or access license material. A separate explicit remote
provisioning command or cloud-VM bootstrap MAY prepare that server before the
E2E runner is invoked.

#### Scenario: URL is configured

- **WHEN** a contributor runs `npm run test:e2e` with a valid `E2E_FOUNDRY_URL`
- **THEN** the runner SHALL execute Playwright against that server

#### Scenario: URL is missing or invalid

- **WHEN** `E2E_FOUNDRY_URL` is missing or not an absolute HTTP(S) URL
- **THEN** the runner SHALL stop before Playwright with an actionable
  configuration error

#### Scenario: Cloud bootstrap prepared the server

- **WHEN** the cloud-VM bootstrap has started an isolated canonical E2E server
  and supplies a valid local `E2E_FOUNDRY_URL` to its child process
- **THEN** `npm run test:e2e` SHALL execute against that server without reading
  Foundry credentials or changing its lifecycle
