## ADDED Requirements

### Requirement: Effect-extension outcome coverage

The system SHALL provide automated regression evidence for all branch-introduced pre-effect, resist, healing, configurable damage-type, and target-selection outcomes, rather than only proving dialog reachability.

#### Scenario: Outcome assertions use deterministic state

- **WHEN** an E2E case exercises a random damage, healing, resist, or duration flow
- **THEN** it SHALL control the relevant dice outcome or source value
- **AND** it SHALL assert the resulting Foundry document or chat state exactly

### Requirement: Focused pre-effect and resist unit coverage

The Jest suite SHALL cover the processor and registered resist-resolution listener through their public exports and observable Foundry interactions.

#### Scenario: Unit test preserves the production module API

- **WHEN** processor or resist behavior is unit tested
- **THEN** the test SHALL use mocked Foundry globals, document methods, or captured hook listeners
- **AND** it SHALL NOT require a production-only test export

### Requirement: Release evidence names branch coverage

Major-release guidance SHALL identify the automated E2E evidence for healing and configurable damage-type settings and distinguish that evidence from mandatory manual validation.

#### Scenario: Release guide maps new coverage

- **WHEN** a contributor prepares a major release that includes effect-extension behavior
- **THEN** the PR template and developer release guide SHALL reference E2E-030 for healing and E2E-031 for configurable damage-type settings
- **AND** they SHALL retain manual validation requirements where automation is not sufficient
