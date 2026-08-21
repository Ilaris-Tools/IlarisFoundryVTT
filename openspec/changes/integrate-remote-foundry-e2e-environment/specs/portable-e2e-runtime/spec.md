## MODIFIED Requirements

### Requirement: Contributor-managed Foundry server

The E2E runner SHALL require `E2E_FOUNDRY_URL` for an already-running, contributor-licensed Foundry VTT server. It SHALL never start or stop Foundry, create a data root, or access license material. A separate explicit remote provisioning command MAY prepare that server before the E2E runner is invoked.

#### Scenario: URL is configured

- **WHEN** a contributor runs `npm run test:e2e` with a valid `E2E_FOUNDRY_URL`
- **THEN** the runner SHALL execute Playwright against that server

#### Scenario: URL is missing or invalid

- **WHEN** `E2E_FOUNDRY_URL` is missing or not an absolute HTTP(S) URL
- **THEN** the runner SHALL stop before Playwright with an actionable configuration error

#### Scenario: Remote server was prepared separately

- **WHEN** a remote provisioning command has prepared a canonical E2E server and exports a valid `E2E_FOUNDRY_URL`
- **THEN** `npm run test:e2e` SHALL use that server without reading Foundry credentials or changing its lifecycle
