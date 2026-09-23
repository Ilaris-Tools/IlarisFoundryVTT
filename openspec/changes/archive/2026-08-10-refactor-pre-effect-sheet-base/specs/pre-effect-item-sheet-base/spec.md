## ADDED Requirements

### Requirement: Reusable Pre-Effect Item sheet base

The system SHALL provide a `PreEffectItemSheet` that extends the existing
[ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html)-based
`IlarisItemSheet`. It SHALL own the standard `preEffects` Handlebars part,
editor context, default factories, and mutation lifecycle for Item documents
whose `system.preEffects` follows the standard Ilaris structure. A compatible
concrete Item sheet SHALL be able to inherit that lifecycle while supplying
only its own form part and source-specific context.

#### Scenario: A compatible child retains its own form

- **WHEN** a concrete Item sheet extends `PreEffectItemSheet`
- **THEN** it SHALL be able to define its own `form` Handlebars part
- **AND** it SHALL render the shared `preEffects` part without duplicating its
  editor handlers or default factories

#### Scenario: Shared editor normalizes indexed form data

- **WHEN** Foundry provides object-indexed `system.preEffects`, `changes`, or
  `ilarisModifiers` form data to the shared editor
- **THEN** add and remove operations SHALL normalize the structure before
  persisting it
- **AND** the operation SHALL preserve the remaining entries

### Requirement: Concrete sheets use sibling inheritance

`UebernatuerlichTalentSheet` and `ManoeverSheet` SHALL both extend
`PreEffectItemSheet` directly. `ManoeverSheet` SHALL NOT inherit the
supernatural item form, owned-supernatural-skill context, or LLM generation
handler merely to author Pre-Effects.

#### Scenario: Maneuver sheet retains maneuver authoring

- **WHEN** a GM opens a maneuver item sheet
- **THEN** it SHALL render its maneuver form and the shared Pre-Effect editor
- **AND** its Pre-Effects SHALL expose maneuver activation and operation
  fields

#### Scenario: Supernatural sheet retains spell authoring

- **WHEN** a GM opens a Zauber or Liturgie item sheet
- **THEN** it SHALL render its supernatural form and the shared Pre-Effect
  editor
- **AND** an owned item SHALL retain its supernatural-fertigkeit selection
