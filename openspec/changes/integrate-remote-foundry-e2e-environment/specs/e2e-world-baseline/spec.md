## MODIFIED Requirements

### Requirement: Versioned dedicated baseline world

The E2E environment SHALL use the published `ilaris-e2e-world-v14363-r1` archive in a dedicated Foundry world, never a contributor's personal game world. Local lifecycle tooling and remote/web-agent provisioning SHALL consume the versioned baseline manifest/archive; neither SHALL construct a separate minimal world or synthetic replacement baseline data.

#### Scenario: Contributor prepares the world

- **WHEN** a contributor installs the archive according to the developer documentation
- **THEN** the world SHALL provide the documented E2E users, actors, ownership, settings, compendiums, and active scene

#### Scenario: Remote agent prepares the world

- **WHEN** a credentialed remote provisioning command prepares an empty dedicated data root
- **THEN** it SHALL install the archive identified by the baseline manifest and SHALL provide the same documented E2E users, actors, ownership, settings, compendiums, and active scene

#### Scenario: Resetting the world

- **WHEN** a contributor needs a fresh test state
- **THEN** they SHALL stop Foundry and re-extract the verified archive into the dedicated world directory
