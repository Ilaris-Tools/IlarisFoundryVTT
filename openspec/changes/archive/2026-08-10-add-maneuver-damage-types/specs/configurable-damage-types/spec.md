## MODIFIED Requirements

### Requirement: Pre-effects template uses configured damage types

The pre-effects damage type `<select>` and the maneuver `CHANGE_DAMAGE_TYPE` `<select>` SHALL be populated from the `damageTypes` setting as consumers of the shared registry.

#### Scenario: Pre-effect dropdown shows configured types

- **WHEN** the pre-effects section renders on a Zauber item sheet
- **THEN** the damage type `<select>` SHALL contain one `<option>` per entry in the setting

#### Scenario: Maneuver dropdown shows configured types

- **WHEN** a Manoever item sheet renders a `CHANGE_DAMAGE_TYPE` modification
- **THEN** its damage type `<select>` SHALL contain one `<option>` per entry in the setting

#### Scenario: Currently selected type is preserved

- **WHEN** a pre-effect change or maneuver modification has `damageType` or `value` of `FEUER` and the setting includes `{"value":"FEUER","label":"Feuer"}`
- **THEN** the `Feuer` option SHALL be selected in the corresponding dropdown
