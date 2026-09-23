## MODIFIED Requirements

### Requirement: ActiveEffect configuration dialog

The system SHALL provide `IlarisActiveEffectConfig` extending [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html) (AppV2) with a fourth tab "Ilaris Dauer" for Ilaris-specific effect timing configuration.

#### Scenario: Ilaris Dauer tab renders

- **WHEN** an IlarisActiveEffect configuration sheet is opened
- **THEN** the sheet SHALL render a fourth tab labeled "Ilaris Dauer" alongside the core Details, Duration, and Changes tabs

#### Scenario: Duration type selection

- **WHEN** the user configures Ilaris timing on the effect
- **THEN** the UI SHALL offer duration type choices: `ownerTurns` (reduced on owner's turn) and `infinite` (never expires)

#### Scenario: Expiry point selection

- **WHEN** `durationType` is `ownerTurns`
- **THEN** the UI SHALL offer `expiresOn` choices: `turnStart` (expires at beginning of owner's turn) and `turnEnd` (expires at end of owner's turn)

#### Scenario: Attribute key autocomplete

- **WHEN** editing an effect change key
- **THEN** the sheet SHALL provide a `<datalist>` of valid attribute keys by recursively walking all registered Actor TypeDataModel schemas

#### Scenario: Long original duration shows its Ilaris hour or day equivalent

- **WHEN** an owner-turn effect has `originalValue` greater than 100 Initiativephasen
- **THEN** the duration tab SHALL keep the exact editable Initiativephase value visible
- **AND** it SHALL render a supplementary German equivalent in hours when the value is below 23,040 Initiativephasen and in days when it is at least 23,040 Initiativephasen

#### Scenario: Long remaining duration shows its Ilaris hour or day equivalent

- **WHEN** an owner-turn effect has `remaining` greater than 100 Initiativephasen
- **THEN** the duration tab SHALL keep the exact editable Initiativephase value visible
- **AND** it SHALL render the same supplementary German hours/days equivalent for the current remaining value

#### Scenario: Short duration does not show a redundant equivalent

- **WHEN** an owner-turn effect has an original or remaining value of 100 Initiativephasen or fewer
- **THEN** the duration tab SHALL not render a supplementary hours/days value for that field
