## ADDED Requirements

### Requirement: Structured spell profiles preserve target-Magieresistenz

The system SHALL retain valid target-Magieresistenz data through structured spell-modification normalization and effective-profile resolution.

Structured spell-modification normalization and effective-profile resolution
SHALL retain the optional `magicResistance` data. A selected form with an
explicit valid target-MR value SHALL replace the base profile's target-MR
value using the same deterministic override policy as other profile fields.

#### Scenario: Base profile exposes automatic MR

- **WHEN** a supernatural Item authors valid base `magicResistance.enabled: true`
- **THEN** its resolved effective profile SHALL expose the same enabled
  target-MR requirement

#### Scenario: Selected form replaces base MR behavior

- **WHEN** a selected structured spell modification authors a valid explicit
  target-MR profile value
- **THEN** the resolved effective profile SHALL use that form's value
- **AND** its casting dialog SHALL follow the resulting automatic or manual
  behavior

#### Scenario: Invalid form data does not enable automation

- **WHEN** base or selected form target-MR data is absent, malformed, or disabled
- **THEN** effective-profile resolution SHALL treat it as disabled
- **AND** it SHALL not create a target-MR challenge
