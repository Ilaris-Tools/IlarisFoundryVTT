## ADDED Requirements

### Requirement: Versioned dedicated baseline world

The E2E environment SHALL use the published `ilaris-e2e-world-v14363-r1` archive in a dedicated Foundry world, never a contributor's personal game world.

#### Scenario: Contributor prepares the world

- **WHEN** a contributor installs the archive according to the developer documentation
- **THEN** the world SHALL provide the documented E2E users, actors, ownership, settings, compendiums, and active scene

#### Scenario: Resetting the world

- **WHEN** a contributor needs a fresh test state
- **THEN** they SHALL stop Foundry and re-extract the verified archive into the dedicated world directory
