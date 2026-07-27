## Purpose

A world-scoped, GM-editable registry of damage types shared across the system (pre-effects, weapons, combat dialogs). The pre-effects damage type dropdown is its first consumer.

## Requirements

### Requirement: Configurable damage types setting

A world-scoped setting `damageTypes` SHALL store a JSON array of `{value, label, behavior}` objects defining which damage types are available throughout the system. The optional `behavior` object contains boolean flags (`healing`, `targetsErschoepfung`) describing what the type does. Designed as a shared setting for multiple consumers (pre-effects, weapons, combat dialogs).

#### Scenario: Default includes core, magical, elemental, and healing types

- **WHEN** the setting is first used (no prior value)
- **THEN** it SHALL default to 13 types: PROFAN, STUMPF, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER, HEALING_WOUND, HEALING_EXHAUSTION
- **AND** PROFAN, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER SHALL have `behavior: {}` (or absent, defaulting to non-healing Wunden damage)
- **AND** STUMPF SHALL have `behavior: {"targetsErschoepfung": true}`
- **AND** HEALING_WOUND SHALL have `behavior: {"healing": true}`
- **AND** HEALING_EXHAUSTION SHALL have `behavior: {"healing": true, "targetsErschoepfung": true}`

#### Scenario: GM can add custom types with behavior flags

- **WHEN** a GM adds a custom type `{"value":"ENERGIE","label":"Energie","behavior":{"healing":false,"targetsErschoepfung":false}}` via the settings UI
- **THEN** the saved setting SHALL include that type alongside existing ones

#### Scenario: Legacy types without behavior still work

- **WHEN** the setting contains types without a `behavior` key (old schema)
- **THEN** those types SHALL be treated as damage (`healing: false`) affecting Wunden (`targetsErschoepfung: false`)

#### Scenario: GM can remove all types and replace them

- **WHEN** a GM removes all default types and adds only `{"value":"STUMPF","label":"Erschöpfung","behavior":{"targetsErschoepfung":true}}`
- **THEN** the saved setting SHALL contain only that one type

#### Scenario: Malformed JSON falls back gracefully

- **WHEN** the setting value is corrupted or unparseable
- **THEN** the pre-effects damage type dropdown SHALL show an empty list (no crash)

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

The pre-effects damage type `<select>` SHALL be populated from the `damageTypes` setting as its first consumer.

#### Scenario: Dropdown shows configured types

- **WHEN** the pre-effects section renders on a Zauber item sheet
- **THEN** the damage type `<select>` SHALL contain one `<option>` per entry in the setting

#### Scenario: Currently selected type is preserved

- **WHEN** a pre-effect change has `damageType: "FEUER"` and the setting includes `{"value":"FEUER","label":"Feuer"}`
- **THEN** the "Feuer" option SHALL be selected in the dropdown
