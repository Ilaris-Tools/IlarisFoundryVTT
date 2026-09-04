## Purpose

Reusable Item sheet lifecycle for authoring the standard Pre-Effect structure.

## Requirements

### Requirement: Reusable Pre-Effect Item sheet base

The system SHALL provide a `PreEffectItemSheet` that extends the existing [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html)-based `IlarisItemSheet`. It SHALL own the standard `preEffects` Handlebars part, editor context, default factories, and mutation lifecycle for Item documents whose `system.preEffects` follows the standard Ilaris structure. A compatible concrete Item sheet SHALL be able to inherit that lifecycle while supplying only its own form part and source-specific context.

#### Scenario: A compatible child retains its own form

- **WHEN** a concrete Item sheet extends `PreEffectItemSheet`
- **THEN** it SHALL be able to define its own `form` Handlebars part
- **AND** it SHALL render the shared `preEffects` part without duplicating its editor handlers or default factories

#### Scenario: Shared editor normalizes indexed form data

- **WHEN** Foundry provides object-indexed `system.preEffects`, `changes`, or `ilarisModifiers` form data to the shared editor
- **THEN** add and remove operations SHALL normalize the structure before persisting it
- **AND** the operation SHALL preserve the remaining entries

### Requirement: Concrete sheets use sibling inheritance

`UebernatuerlichTalentSheet` and `ManoeverSheet` SHALL both extend `PreEffectItemSheet` directly. `ManoeverSheet` SHALL NOT inherit the supernatural item form, owned-supernatural-skill context, or LLM generation handler merely to author Pre-Effects.

#### Scenario: Maneuver sheet retains maneuver authoring

- **WHEN** a GM opens a maneuver item sheet
- **THEN** it SHALL render its maneuver form and the shared Pre-Effect editor
- **AND** its Pre-Effects SHALL expose maneuver activation and operation fields

#### Scenario: Supernatural sheet retains spell authoring

- **WHEN** a GM opens a Zauber or Liturgie item sheet
- **THEN** it SHALL render its supernatural form and the shared Pre-Effect editor
- **AND** an owned item SHALL retain its supernatural-fertigkeit selection

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

### Requirement: Shared form-submit normalizes nested array fields

The shared Pre-Effect form-submit handler SHALL normalize object-indexed form data for `system.spellModifications` — including each modification's nested `preEffects`, `changes`, `ilarisModifiers`, `summonItem.overrides`, `summonCreature.overrides`, `summonCreature.dominationChecks.entries`, and `resistanceOutcomes` outcome payloads — back to arrays before persisting via [Item.update](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), not only `system.preEffects`.

#### Scenario: Spell modification form controls survive auto-submit

- **WHEN** a GM toggles a checkbox inside a structured spell modification's Pre-Effect (for example `avoidTest.enabled`)
- **THEN** the submitted update SHALL persist that modification's Pre-Effects as an array
- **AND** the Item SHALL retain the same number of Pre-Effects in that modification

#### Scenario: Outcome-payload controls render correct indexed names

- **WHEN** the shared Pre-Effect editor renders a `resistanceOutcomes` outcome payload
- **THEN** each control name SHALL include the enclosing pre-effect index
- **AND** no control name SHALL contain an empty index segment (for example `system.preEffects..resistanceOutcomes.failure.enabled`)

### Requirement: Nested Pre-Effect controls persist complete values

The Pre-Effect item sheet SHALL persist a selected summon-item source kind and
render each newly added Ilaris modifier with its complete configured controls.

#### Scenario: Source kind persists and updates its catalog

- **WHEN** a GM selects `gegenstand` for a summon-item Pre-Effect source
- **THEN** the item SHALL persist `summonItem.sourceKind: "gegenstand"`
- **AND** reopening the sheet SHALL show the Gegenstand source catalog

#### Scenario: New Ilaris modifier exposes its target selector

- **WHEN** a GM adds an Ilaris modifier to a Pre-Effect
- **THEN** its target selector and other standard modifier controls SHALL be rendered
