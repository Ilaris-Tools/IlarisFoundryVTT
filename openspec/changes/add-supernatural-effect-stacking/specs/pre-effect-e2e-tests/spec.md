## MODIFIED Requirements

### Requirement: E2E test verifies buff ActiveEffect creation

An E2E test SHALL verify that casting a spell with a non-instant pre-effect correctly creates an ActiveEffect on the target actor with its configured native changes, semantic Ilaris modifiers, source classification, and duration.

#### Scenario: Buff spell creates ActiveEffect on target

- **WHEN** a spell with `instant: false` and one or more changes or Ilaris
  modifiers is cast successfully
- **THEN** an ActiveEffect SHALL be created on the target with
  `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: ActiveEffect preserves configured native changes

- **WHEN** the ActiveEffect is created from a pre-effect with native changes
- **THEN** its `changes` array SHALL contain all configured native change
  entries

#### Scenario: ActiveEffect preserves configured semantic modifiers

- **WHEN** the ActiveEffect is created from a pre-effect with Ilaris modifiers
- **THEN** its `system.ilarisModifiers` array SHALL contain all configured
  semantic modifier entries
- **AND** it SHALL carry the übernatürlich source classification

#### Scenario: ActiveEffect has correct base duration

- **WHEN** the ActiveEffect is created
- **THEN** its duration SHALL match the pre-effect's `baseDuration` (in turns)

### Requirement: E2E test verifies competing supernatural buffs

An E2E test SHALL verify that two active spell buffs with an overlapping
context use only the stronger contribution in Ilaris rule mode and both
contributions in Foundry stack mode.

#### Scenario: Stronger spell bonus wins in Ilaris mode

- **WHEN** a GM creates two active competing übernatürliche modifiers for the
  same combat context in a world using Ilaris rule mode
- **THEN** the combat or probe result SHALL include only the stronger
  übernatürliche contribution

#### Scenario: World mode restores additive behavior

- **WHEN** the GM changes the world setting to Foundry stack mode
- **THEN** the same two active modifiers SHALL both contribute without
  recreating either effect
