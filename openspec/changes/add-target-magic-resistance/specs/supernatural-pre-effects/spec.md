## ADDED Requirements

### Requirement: Target-Magieresistenz gates supernatural success effects

The system SHALL gate supernatural success effects on an accepted target-Magieresistenz difficulty.

For an effective profile with an accepted automatic target-Magieresistenz
challenge, `UebernatuerlichDialog` SHALL treat the resulting `MR + 1W20` total
as its spell difficulty. Existing Pre-Effects SHALL run only after that spell
roll succeeds; an unsuccessful result SHALL retain the existing no-effect and
Zone-draft cleanup behavior.

#### Scenario: Successful MR-gated cast applies its Pre-Effects

- **WHEN** a marked spell has an accepted target-MR total and the caster's
  evaluated spell roll meets or exceeds it
- **THEN** the system SHALL apply energy through the existing success path
- **AND** it SHALL dispatch the spell's configured Pre-Effects once

#### Scenario: Failed MR-gated cast applies no Pre-Effects

- **WHEN** a marked spell has an accepted target-MR total and the caster's
  evaluated spell roll fails it
- **THEN** the system SHALL use its existing failure path
- **AND** it SHALL NOT dispatch configured Pre-Effects

#### Scenario: No accepted target-MR result cannot dispatch Pre-Effects

- **WHEN** an automatic target-MR challenge is pending, invalid, or stale
- **THEN** the caster SHALL not be able to execute the spell roll
- **AND** the system SHALL NOT charge energy or dispatch Pre-Effects
