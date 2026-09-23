## ADDED Requirements

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
