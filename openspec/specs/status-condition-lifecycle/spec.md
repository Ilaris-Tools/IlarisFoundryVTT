## Purpose

Canonical status condition effects with independent manual and automated sources.

## Requirements

### Requirement: Canonical status condition effect

The system SHALL materialize at most one active condition effect for a given actor and Ilaris status ID. It SHALL derive its name, icon, status identity, and native changes from `CONFIG.statusEffects` and persist it as an embedded [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) on the [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).

#### Scenario: First source creates Liegend from Position4

- **WHEN** an actor receives its first `Position4` condition source
- **THEN** the system SHALL create one Liegend status-bearing ActiveEffect
- **AND** that effect SHALL contain Position4's native `-4` melee and defence changes exactly once

#### Scenario: Later source reuses existing condition

- **WHEN** an actor already has an active Position4 condition and receives another Position4 source
- **THEN** the system SHALL update its condition-source ledger
- **AND** it SHALL NOT create a second effect or a second set of Position4 changes

### Requirement: Independent condition sources

The system SHALL persist each manual or automated cause of a condition as a stable source entry on the condition effect. A source removal SHALL remove only that entry and SHALL delete the embedded effect with [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments) only after its final source has been removed.

#### Scenario: Manual source survives maneuver-source removal

- **WHEN** Position4 has one manual source and one Niederwerfen source
- **AND** the Niederwerfen source is removed or expires
- **THEN** the Position4 effect SHALL remain active with its manual source

#### Scenario: Final source clears condition

- **WHEN** the final source of a Position4 condition is removed
- **THEN** the system SHALL delete only that Position4 embedded ActiveEffect

### Requirement: Manual picker source semantics

The system SHALL integrate the existing status picker with the condition source ledger. Enabling an inactive configured condition SHALL add a manual source; disabling an active condition SHALL remove a manual source only and SHALL NOT delete an automated-only condition.

#### Scenario: Picker adds manual source

- **WHEN** a GM enables inactive Liegend through the status picker
- **THEN** the system SHALL create or add a manual Position4 source

#### Scenario: Picker does not cancel automated Liegend

- **WHEN** Position4 is active only because of an automated maneuver source
- **AND** a GM uses the status picker to disable it
- **THEN** the maneuver source and Position4 condition SHALL remain active
- **AND** the UI SHALL communicate that an automated source remains

### Requirement: Automated pre-effects request canonical conditions

The system SHALL allow an automated pre-effect to declare a canonical status condition instead of duplicating native changes. The pre-effect processor SHALL create or update the condition source with the pre-effect's provenance and timing semantics.

#### Scenario: Niederwerfen applies canonical Liegend

- **WHEN** Niederwerfen succeeds and its KK resistance fails
- **THEN** the system SHALL add a Position4 source for the defender
- **AND** it SHALL NOT create a separate Niederwerfen effect containing copied Position4 changes

#### Scenario: Umreißen shares canonical Liegend

- **WHEN** Umreißen succeeds and its configured resistance fails
- **THEN** the system SHALL add a Position4 source for the defender
- **AND** it SHALL share an existing Position4 effect with any other active Liegend source
