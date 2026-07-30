## ADDED Requirements

### Requirement: Contributor-managed Foundry server

The E2E runner SHALL require `E2E_FOUNDRY_URL` for an already-running, contributor-licensed Foundry VTT server. It SHALL never start or stop Foundry, create a data root, or access license material.

#### Scenario: URL is configured

- **WHEN** a contributor runs `npm run test:e2e` with a valid `E2E_FOUNDRY_URL`
- **THEN** the runner SHALL execute Playwright against that server

#### Scenario: URL is missing or invalid

- **WHEN** `E2E_FOUNDRY_URL` is missing or not an absolute HTTP(S) URL
- **THEN** the runner SHALL stop before Playwright with an actionable configuration error
