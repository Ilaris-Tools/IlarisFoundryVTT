## ADDED Requirements

### Requirement: Pre-effects support armed combat configuration

The shared übernatürlich pre-effect schema SHALL support an optional
`armedCombat` object and its bounded numeric input descriptors. The
übernatürlich item-sheet Pre-Effects editor SHALL allow authors to configure
the trigger, attack scope, attack or damage contribution, and numeric input
metadata without editing raw JSON.
metadata without editing raw JSON. When an armed effect has charges, the editor
SHALL expose its base charge count and optional Mächtige-Magie/Liturgie charge
amplification fields.

#### Scenario: Existing pre-effect remains unchanged without armed data

- **WHEN** a pre-effect omits `armedCombat`
- **THEN** its existing instant, duration, resistance, and semantic-modifier
  behavior SHALL remain unchanged

#### Scenario: Item author configures a numeric armed input

- **WHEN** an item author adds an armed pre-effect input with key, German label,
  default, minimum, and maximum
- **THEN** the sheet SHALL persist that configuration under the pre-effect

#### Scenario: Charge amplifier fields are conditional

- **WHEN** an item author enables armed charges
- **THEN** the sheet SHALL display a base charge count and the optional
  `Verstärkt durch Mächtige Magie` control with its charge-per-QS value
- **AND** the charge amplification controls SHALL not affect an armed effect
  without charges

### Requirement: UebernatuerlichDialog collects declared armed inputs

The UebernatuerlichDialog SHALL render one numeric input for each declared armed
pre-effect input before a cast is committed. On a successful cast, the
pre-effect processor SHALL pass the submitted values to the generated
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
payload.

#### Scenario: Dialog renders Neun-Streiche count control

- **WHEN** the user opens Neun Streiche in einem
- **THEN** the dialog SHALL show a control labeled `Bisherige Treffer auf Ziel`
  with a value in the configured `0..8` range

#### Scenario: Failed cast does not persist input state

- **WHEN** the supernatural cast fails
- **THEN** no armed ActiveEffect or submitted armed input value SHALL be
  created
