## ADDED Requirements

### Requirement: Login readiness waits

The E2E login fixture SHALL wait for world readiness through a predicate (`game.ready && game.messages`) and SHALL NOT rely on `waitForLoadState('networkidle')` as a readiness signal. When a page already has an active game session, the fixture SHALL fast-path directly to the readiness wait instead of re-navigating and re-joining.

#### Scenario: Fresh login waits on game readiness

- **WHEN** an E2E test logs into the world
- **THEN** the fixture SHALL wait until `game.ready` is true and the game data is available (e.g., `game.messages`) with a bounded timeout
- **AND** it SHALL not depend on `networkidle` (Foundry WebSockets keep the network active)

#### Scenario: Reused session fast-paths

- **WHEN** the page already shows the game UI for the configured world
- **THEN** the fixture SHALL skip navigation and login and SHALL only wait for world readiness
