## ADDED Requirements

### Requirement: Shared pre-effect authoring configures creature Actor summons

The shared pre-effect editor SHALL let a GM enable an Actor summon, select a
source UUID from available compendium Actors whose type is `kreatur`, select
the German placement and lifetime labels, set an activation delay, and edit
source-data overrides with Mächtige-Magie amplification. The editor SHALL
persist the UUID and structured values in `system.preEffects` and SHALL not
show non-creature Actor sources as valid choices.

#### Scenario: GM configures a creature source and lifecycle

- **WHEN** a GM enables `Kreatur beschwören` on a pre-effect
- **THEN** the editor SHALL offer creature Actor sources from available Actor compendia
- **AND** it SHALL persist the selected source UUID, placement, lifetime, delay, and overrides after save and reopen

#### Scenario: No Actor source selection leaks into summon-item authoring

- **WHEN** a GM configures only `Gegenstand beschwören`
- **THEN** the existing Item source-kind and Item source controls SHALL retain their current behavior
- **AND** no Actor summon operation SHALL be persisted unless its own control is enabled
