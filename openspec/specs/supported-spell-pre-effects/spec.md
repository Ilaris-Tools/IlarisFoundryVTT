## Purpose

Structured pre-effect coverage for reviewed spell compendium source entries, including explicitly bounded damage-only approximations and the documented deferred-mechanics boundary.

## Requirements

### Requirement: Reviewed supported spells provide structured pre-effects

The compendium source Items for Axxeleratus Blitzgeschwind (Tiergeist), Fulminictus Donnerkeil, Plumbumbarum schwerer Arm, Tlalucs Odem Pestgestank, Hexengalle, and Fluch des Gewürms SHALL define `system.preEffects` matching their reviewed immediate-damage, timed-modifier, and resistance behavior.

#### Scenario: Direct damage uses the shared damage pipeline

- **WHEN** Fulminictus Donnerkeil, Hexengalle, or Tlalucs Odem Pestgestank succeeds against a selected target
- **THEN** its direct damage pre-effect SHALL use `TRUE_DAMAGE`
- **AND** its Mächtige Magie bonus SHALL be configured per QS where the spell text grants one

#### Scenario: Timed modifiers use the spell duration

- **WHEN** Axxeleratus Blitzgeschwind (Tiergeist) or Plumbumbarum schwerer Arm succeeds
- **THEN** its pre-effect SHALL create the reviewed modifier changes for its stated Initiativephase duration

#### Scenario: Explicit profane resistance guards the reviewed branch

- **WHEN** Tlalucs Odem Pestgestank, Hexengalle, or Fluch des Gewürms requires its stated profane resistance
- **THEN** the relevant pre-effect SHALL use the existing avoid-test configuration
- **AND** damage that is not contingent on that resistance SHALL remain a separate immediate pre-effect

### Requirement: Spell-named marker convention remains data-only

The failed-resistance handlungsunfähig outcomes for Hexengalle and Fluch des Gewürms SHALL be represented by timed spell-named ActiveEffects with no numeric modifier, using a zero-value change solely because the current processor requires at least one change.

#### Scenario: Marker has no numeric effect

- **WHEN** a target fails the configured resistance for Hexengalle or Fluch des Gewürms
- **THEN** the created ActiveEffect SHALL retain the spell name as the table-visible marker
- **AND** its zero-value change SHALL not alter the actor's global modifier

#### Scenario: Fluch des Gewürms successful resistance uses its alternate modifier

- **WHEN** a target succeeds the configured Willenskraft resistance against Fluch des Gewürms
- **THEN** the diminished-only branch SHALL apply a timed global `-4` modifier instead of the marker-only branch

### Requirement: Accepted partial damage remains explicitly bounded

Pandämonium, Seelenfeuer, and Wand aus Flammen SHALL define one-time direct-damage pre-effects only. Their ongoing zone, contact, crossing, and per-Initiativephase behavior SHALL remain documented as manual/deferred.

#### Scenario: Damage-only approximation is applied once

- **WHEN** one of the accepted partial spells succeeds against selected targets
- **THEN** the configured direct damage SHALL be applied once through the shared damage pipeline
- **AND** the system SHALL not claim to automate its omitted trigger or repeating behavior

### Requirement: Deferred candidates are separated from active inventory

The spell/liturgy effect inventory SHALL remove candidates requiring unsupported mechanics from its active lists and SHALL point to the deferred-mechanics documentation for their rationale. The corresponding compendium `_source` Items SHALL remain unchanged.

#### Scenario: Deferred mechanics remain discoverable

- **WHEN** a contributor reviews the inventory after this change
- **THEN** it SHALL identify that moving zones, delayed triggers, repeated damage, conditional modifiers, resource drains, and next-roll-only effects are deferred
- **AND** it SHALL link to the deferred-mechanics note
- **AND** the deferred spell and liturgy `_source` JSON SHALL remain present and unchanged
