## Purpose

A world-scoped, GM-editable registry of damage types shared across the system (pre-effects, weapons, combat dialogs). The pre-effects damage type dropdown is its first consumer.

## Requirements

### Requirement: Configurable damage types setting

A world-scoped setting `damageTypes` SHALL store a JSON array of `{value, label, behavior}` objects defining which damage types are available throughout the system. The optional `behavior` object contains boolean flags (`healing`, `targetsErschoepfung`) and an optional `elementalSideEffect` string describing rule effects of the type. Designed as a shared setting for multiple consumers (pre-effects, weapons, combat dialogs).

#### Scenario: Default includes core, magical, elemental, and healing types

- **WHEN** the setting is first used (no prior value)
- **THEN** it SHALL default to 13 types: PROFAN, STUMPF, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER, HEALING_WOUND, HEALING_EXHAUSTION
- **AND** every default type SHALL explicitly define `behavior.elementalSideEffect`
- **AND** FEUER SHALL set `behavior.elementalSideEffect` to `"nachbrennen"`
- **AND** every other default type SHALL set `behavior.elementalSideEffect` to `null`
- **AND** STUMPF SHALL have `behavior: {"targetsErschoepfung": true}`
- **AND** HEALING_WOUND SHALL have `behavior: {"healing": true}`
- **AND** HEALING_EXHAUSTION SHALL have `behavior: {"healing": true, "targetsErschoepfung": true}`

#### Scenario: GM can add custom types with behavior flags

- **WHEN** a GM adds a custom type with an `elementalSideEffect` through the settings UI
- **THEN** the saved setting SHALL preserve that named side effect alongside existing behavior flags

#### Scenario: GM can rebind a default damage type side effect

- **WHEN** a GM changes a default type's `elementalSideEffect` value in the settings UI
- **THEN** subsequent resolved damage of that type SHALL use the saved value
- **AND** an empty or `null` value SHALL dispatch no elemental side effect

#### Scenario: Legacy types without behavior still work

- **WHEN** the setting contains types without a `behavior` key
- **THEN** those types SHALL be treated as damage affecting Wunden with no elemental side effect

#### Scenario: GM can remove all types and replace them

- **WHEN** a GM removes all default types and adds only `{"value":"STUMPF","label":"Erschöpfung","behavior":{"targetsErschoepfung":true}}`
- **THEN** the saved setting SHALL contain only that one type

#### Scenario: Malformed JSON falls back gracefully

- **WHEN** the setting value is corrupted or unparseable
- **THEN** the pre-effects damage type dropdown SHALL show an empty list (no crash)

### Requirement: Consumers retain configured damage-type keys

Any consumer that selects a configured damage type SHALL retain its registry `value` key for downstream behavior resolution; it SHALL use the `label` only for display. This includes `CHANGE_DAMAGE_TYPE` maneuver modifications consumed by the combat damage pipeline.

#### Scenario: Maneuver applies configured behavior by key

- **WHEN** a maneuver's `CHANGE_DAMAGE_TYPE` modification selects configured type `{"value":"STUMPF","label":"Stumpf (Erschöpfung)","behavior":{"targetsErschoepfung":true}}`
- **THEN** the combat pipeline SHALL receive `damageType: 'STUMPF'`
- **AND** [`getDamageTypeBehavior`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get) SHALL resolve `targetsErschoepfung: true`

#### Scenario: Label changes do not change behavior lookup

- **WHEN** a GM changes the label of a configured damage type while preserving its `value`
- **THEN** downstream damage behavior SHALL continue to resolve by the unchanged `value`

### Requirement: Damage type setting UI in IlarisSettingsDialog

The IlarisSettingsDialog General tab SHALL include a read-only list of configured damage types, each showing its label, value key, and a summary of its behavior. Each row SHALL have an edit button that opens a DialogV2 popup for editing key, label, and behavior checkboxes.

#### Scenario: List shows current types with behavior summary

- **WHEN** the settings dialog opens to the General tab
- **THEN** each configured damage type SHALL be displayed as a row showing the label, value key, and a summary (e.g., "Schaden · Wunden", "Heilung · Erschöpfung")
- **AND** each row SHALL have an edit (✎) button and a delete (✕) button

#### Scenario: Edit button opens DialogV2 popup

- **WHEN** the GM clicks the edit button on a damage type row
- **THEN** a DialogV2 SHALL open with inputs for key, label, and behavior checkboxes (healing, targetsErschoepfung), pre-filled with the current values

#### Scenario: DialogV2 saves edited type

- **WHEN** the GM submits the DialogV2 with modified values
- **THEN** the damage type in the list SHALL be updated and the setting SHALL be persisted

#### Scenario: Add button opens DialogV2 for new type

- **WHEN** the GM clicks "+ Typ hinzufügen"
- **THEN** a DialogV2 SHALL open with empty key/label inputs and unchecked behavior checkboxes

#### Scenario: Add button creates new empty row (fallback)

- **WHEN** the GM clicks "+ Typ hinzufügen" and the DialogV2 approach is not yet available
- **THEN** a new row with empty key and label inputs SHALL be appended (preserving backward compatibility during implementation)

#### Scenario: Delete button removes row

- **WHEN** the GM clicks the delete button on a row
- **THEN** that row SHALL be removed from the list

#### Scenario: Save persists the list

- **WHEN** the GM clicks "Save" in the settings dialog
- **THEN** the current list of types SHALL be serialized to JSON and stored in the `damageTypes` setting, including behavior objects for each entry

### Requirement: Pre-effects template uses configured damage types

The pre-effects damage type `<select>` and the maneuver `CHANGE_DAMAGE_TYPE` `<select>` SHALL be populated from the `damageTypes` setting as consumers of the shared registry.

#### Scenario: Dropdown shows configured types

- **WHEN** the pre-effects section renders on a Zauber item sheet
- **THEN** the damage type `<select>` SHALL contain one `<option>` per entry in the setting

#### Scenario: Currently selected type is preserved

- **WHEN** a pre-effect change or maneuver modification has a `damageType` or `value` of `FEUER` and the setting includes `{"value":"FEUER","label":"Feuer"}`
- **THEN** the "Feuer" option SHALL be selected in the corresponding dropdown

#### Scenario: Maneuver dropdown shows configured types

- **WHEN** a Manoever item sheet renders a `CHANGE_DAMAGE_TYPE` modification
- **THEN** its damage type `<select>` SHALL contain one `<option>` per entry in the setting

### Requirement: E2E coverage for damage type settings CRUD

The E2E suite SHALL verify the GM-visible damage-type settings flow, including behavior flags and persistence, using the documented [Game settings API](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings).

#### Scenario: Add and persist a behavioral damage type

- **WHEN** a GM adds a custom damage type through `IlarisSettingsDialog`, enables one or more behavior flags, saves, closes, and reopens the dialog
- **THEN** the saved `damageTypes` world setting SHALL include that type with the selected behavior flags

#### Scenario: Delete a damage type

- **WHEN** a GM deletes a configured damage type and saves the settings dialog
- **THEN** the deleted type SHALL no longer be present in the saved `damageTypes` world setting
