## Purpose

A world-scoped, GM-editable registry of damage types shared across the system (pre-effects, weapons, combat dialogs). The pre-effects damage type dropdown is its first consumer.

## Requirements

### Requirement: Configurable damage types setting

A world-scoped setting `damageTypes` SHALL store a JSON array of `{value, label}` objects defining which damage types are available throughout the system. Designed as a shared setting for multiple consumers (pre-effects, weapons, combat dialogs).

#### Scenario: Default includes core, magical, and elemental types

- **WHEN** the setting is first used (no prior value)
- **THEN** it SHALL default to 11 types: PROFAN, STUMPF, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER

#### Scenario: GM can add custom types

- **WHEN** a GM adds a custom type `{"value":"ENERGIE","label":"Energie"}` via the settings UI
- **THEN** the saved setting SHALL include that type alongside existing ones

#### Scenario: GM can remove all types and replace them

- **WHEN** a GM removes all default types and adds only `{"value":"STUMPF","label":"Erschöpfung"}`
- **THEN** the saved setting SHALL contain only that one type

#### Scenario: Malformed JSON falls back gracefully

- **WHEN** the setting value is corrupted or unparseable
- **THEN** the pre-effects damage type dropdown SHALL show an empty list (no crash)

### Requirement: Damage type setting UI in IlarisSettingsDialog

The IlarisSettingsDialog General tab SHALL include an editable list for managing damage types.

#### Scenario: List shows current types with add button

- **WHEN** the settings dialog opens to the General tab
- **THEN** each configured damage type SHALL be displayed as a row with editable key and label inputs, plus a delete button
- **AND** an "Add" button SHALL be present to append a new empty row

#### Scenario: Add button creates new row

- **WHEN** the GM clicks "Add" on the damage type list
- **THEN** a new row with empty key and label inputs SHALL be appended

#### Scenario: Delete button removes row

- **WHEN** the GM clicks the delete button on a row
- **THEN** that row SHALL be removed from the list

#### Scenario: Save persists the list

- **WHEN** the GM clicks "Save" in the settings dialog
- **THEN** the current list of types SHALL be serialized to JSON and stored in the `damageTypes` setting

### Requirement: Pre-effects template uses configured damage types

The pre-effects damage type `<select>` SHALL be populated from the `damageTypes` setting as its first consumer.

#### Scenario: Dropdown shows configured types

- **WHEN** the pre-effects section renders on a Zauber item sheet
- **THEN** the damage type `<select>` SHALL contain one `<option>` per entry in the setting

#### Scenario: Currently selected type is preserved

- **WHEN** a pre-effect change has `damageType: "FEUER"` and the setting includes `{"value":"FEUER","label":"Feuer"}`
- **THEN** the "Feuer" option SHALL be selected in the dropdown
