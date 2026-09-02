## Purpose

Damage types in the `damageTypes` world setting carry an extensible `behavior` map that decouples what a type is named from what it does, enabling the system to determine healing/damage direction and health pool selection without hardcoded string matching.

## Requirements

### Requirement: Behavior property on damage type entries

Each entry in the `damageTypes` world setting SHALL support an optional `behavior` object with boolean flags. When `behavior` is absent or `undefined`, all flags SHALL default to `false`.

#### Scenario: Behavior map with healing flag

- **WHEN** a damage type entry has `"behavior": {"healing": true}`
- **THEN** the system SHALL treat positive values for this type as healing amounts

#### Scenario: Behavior map with targetsErschoepfung flag

- **WHEN** a damage type entry has `"behavior": {"targetsErschoepfung": true}`
- **THEN** the system SHALL apply damage or healing to `system.gesundheit.erschoepfung` instead of `system.gesundheit.wunden`

#### Scenario: Behavior map with both flags

- **WHEN** a damage type entry has `"behavior": {"healing": true, "targetsErschoepfung": true}`
- **THEN** the system SHALL treat positive values as healing applied to Erschöpfung

#### Scenario: Behavior map with bypassesArmor flag

- **WHEN** a damage type entry has `"behavior": {"bypassesArmor": true}`
- **THEN** the system SHALL use WS instead of WS\* for wound calculation, effectively bypassing Rüstungsschutz

#### Scenario: Absent behavior defaults to false

- **WHEN** a damage type entry has no `behavior` key (old schema: `{"value":"FEUER","label":"Feuer"}`)
- **THEN** the system SHALL treat it as damage (`healing: false`) affecting Wunden (`targetsErschoepfung: false`)

#### Scenario: Malformed JSON does not crash

- **WHEN** the `damageTypes` setting contains unparseable JSON
- **THEN** the system SHALL return `{healing: false, targetsErschoepfung: false}` for any damage type lookup

### Requirement: Default damage types include healing types

The default value of the `damageTypes` setting SHALL include `HEALING_WOUND` and `HEALING_EXHAUSTION` with appropriate behavior flags.

#### Scenario: Default includes HEALING_WOUND

- **WHEN** the setting is first used (no prior value)
- **THEN** the default types SHALL include `{"value":"HEALING_WOUND","label":"Heilung (Wunden)","behavior":{"healing":true,"targetsErschoepfung":false}}`

#### Scenario: Default includes HEALING_EXHAUSTION

- **WHEN** the setting is first used (no prior value)
- **THEN** the default types SHALL include `{"value":"HEALING_EXHAUSTION","label":"Heilung (Erschöpfung)","behavior":{"healing":true,"targetsErschoepfung":true}}`

#### Scenario: Default includes STUMPF with targetsErschoepfung behavior

- **WHEN** the setting is first used (no prior value)
- **THEN** the default types SHALL include `{"value":"STUMPF","label":"Stumpf (Erschöpfung)","behavior":{"healing":false,"targetsErschoepfung":true}}`

### Requirement: Damage type behavior lookup function

A shared utility function `getDamageTypeBehavior(damageType)` SHALL read the `damageTypes` world setting via `game.settings.get('Ilaris', 'damageTypes')` at https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings and return the behavior flags for a given damage type value.

#### Scenario: Lookup returns correct flags for known type

- **WHEN** `getDamageTypeBehavior('HEALING_WOUND')` is called
- **AND** the setting contains `{"value":"HEALING_WOUND","behavior":{"healing":true}}`
- **THEN** it SHALL return `{healing: true, targetsErschoepfung: false}`

#### Scenario: Lookup returns defaults for unknown type

- **WHEN** `getDamageTypeBehavior('NONEXISTENT')` is called
- **THEN** it SHALL return `{healing: false, targetsErschoepfung: false}`

### Requirement: Missing registry references warn and use Profan fallback

All damage-type consumers SHALL resolve a configured type key against the `damageTypes` world setting through [`foundry.Game`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings). If the requested key is absent, the system SHALL notify the user in German and use `PROFAN` behavior and label for that resolution.

#### Scenario: Missing maneuver key falls back once

- **WHEN** a selected maneuver references `STUMPF` and the current registry no longer contains `STUMPF`
- **THEN** the system SHALL display `Schadenstyp "STUMPF" existiert nicht in den Einstellungen. Standard (Profan / Wunden) wird verwendet.` once for that key and registry state
- **AND** the damage SHALL affect Wunden without armor bypass

#### Scenario: A changed registry can warn for a newly missing key

- **WHEN** a damage type was available during an earlier resolution and is subsequently removed from the world setting
- **THEN** the next resolution referencing that key SHALL produce the missing-type warning
