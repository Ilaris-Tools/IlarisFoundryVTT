## Purpose

Unit test coverage for pre-effect processing utilities and the damage application healing branch.

## Requirements

### Requirement: `toArray()` utility has unit test coverage

The `toArray()` function in `pre-effects-processor.js` SHALL have unit tests verifying Foundry V14 ObjectField normalization.

#### Scenario: Array passes through unchanged

- **WHEN** `toArray()` is called with `[{a:1}, {b:2}]`
- **THEN** it SHALL return the same array reference

#### Scenario: ObjectField normalized to array

- **WHEN** `toArray()` is called with `{0: {a:1}, 1: {b:2}}`
- **THEN** it SHALL return `[{a:1}, {b:2}]`

#### Scenario: Null returns empty array

- **WHEN** `toArray()` is called with `null` or `undefined`
- **THEN** it SHALL return `[]`

#### Scenario: Empty object returns empty array

- **WHEN** `toArray()` is called with `{}`
- **THEN** it SHALL return `[]`

### Requirement: `collectActorSystemPaths()` utility has unit test coverage

The `collectActorSystemPaths()` function SHALL have unit tests verifying recursive field path collection from Actor data models.

#### Scenario: Returns sorted deduplicated paths

- **WHEN** `collectActorSystemPaths()` is called with data models containing `{gesundheit: {wunden, erschoepfung}}`
- **THEN** it SHALL return `["system.gesundheit.erschoepfung", "system.gesundheit.wunden"]`

#### Scenario: Handles nested SchemaFields

- **WHEN** a data model contains `attribute: new SchemaField({KO: new SchemaField({wert, pw})})`
- **THEN** the returned paths SHALL include `system.attribute`, `system.attribute.KO`, `system.attribute.KO.wert`, `system.attribute.KO.pw`

#### Scenario: Handles empty data models

- **WHEN** `CONFIG.Actor.dataModels` is empty or undefined
- **THEN** `collectActorSystemPaths()` SHALL return `[]`

### Requirement: `_applyDamageDirectly` healing branch has unit test coverage

The healing branch (negative damage) in `_applyDamageDirectly` SHALL have unit tests verifying wound reduction, WS threshold calculation, and chat messages.

#### Scenario: Negative damage reduces wounds by WS thresholds

- **WHEN** `_applyDamageDirectly` is called with `damage: -12`, `WS: 5`, and `wounds: 3`
- **THEN** wounds SHALL be reduced by `Math.floor(12/5) = 2` to `1`

#### Scenario: Healing caps wounds at 0

- **WHEN** healing would reduce wounds below 0
- **THEN** wounds SHALL be set to 0

#### Scenario: Insufficient healing has no effect

- **WHEN** `_applyDamageDirectly` is called with `damage: -4`, `WS: 5`
- **THEN** wounds SHALL remain unchanged and a "keine Heilung" chat message SHALL be sent

#### Scenario: STUMPF healing reduces Erschöpfung

- **WHEN** `_applyDamageDirectly` is called with `damage: -12`, `damageType: "STUMPF"`
- **THEN** Erschöpfung SHALL be reduced instead of wounds

#### Scenario: LEP system healing restores HP

- **WHEN** the LEP system is active and damage is `-10`
- **THEN** LEP SHALL be increased by 10, capped at `wunden_max`

#### Scenario: Healing sends correct chat message

- **WHEN** healing is applied
- **THEN** `ChatMessage.create` SHALL be called with content containing "heilt"
