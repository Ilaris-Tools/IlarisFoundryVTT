## MODIFIED Requirements

### Requirement: Configurable damage types setting

A world-scoped setting `damageTypes` SHALL store a JSON array of `{value, label, behavior}` objects defining which damage types are available throughout the system. The optional `behavior` object contains boolean flags (`healing`, `targetsErschoepfung`) and an optional `elementalSideEffect` string describing rule effects of the type. Designed as a shared setting for multiple consumers (pre-effects, weapons, combat dialogs).

#### Scenario: Default includes core, magical, elemental, and healing types

- **WHEN** the setting is first used (no prior value)
- **THEN** it SHALL default to 13 types: PROFAN, STUMPF, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER, HEALING_WOUND, HEALING_EXHAUSTION
- **AND** FEUER SHALL have `behavior: {"elementalSideEffect":"nachbrennen"}`
- **AND** STUMPF SHALL have `behavior: {"targetsErschoepfung": true}`
- **AND** HEALING_WOUND SHALL have `behavior: {"healing": true}`
- **AND** HEALING_EXHAUSTION SHALL have `behavior: {"healing": true, "targetsErschoepfung": true}`

#### Scenario: GM can add custom types with behavior flags

- **WHEN** a GM adds a custom type with an `elementalSideEffect` through the settings UI
- **THEN** the saved setting SHALL preserve that named side effect alongside existing behavior flags

#### Scenario: Legacy types without behavior still work

- **WHEN** the setting contains types without a `behavior` key
- **THEN** those types SHALL be treated as damage affecting Wunden with no elemental side effect

#### Scenario: GM can remove all types and replace them

- **WHEN** a GM removes all default types and adds only a configured STUMPF type
- **THEN** the saved setting SHALL contain only that one type

#### Scenario: Malformed JSON falls back gracefully

- **WHEN** the setting value is corrupted or unparseable
- **THEN** the pre-effects damage type dropdown SHALL show an empty list and SHALL not crash
