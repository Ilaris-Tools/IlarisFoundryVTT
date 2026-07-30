## MODIFIED Requirements

### Requirement: E2E test verifies resist flow end-to-end

An E2E test SHALL verify the complete resist flow: whisper with resist button → button click → FertigkeitDialog with correct parameters → roll → hook processes result. It SHALL cover attribute resistance and profane skill resistance with an optional configured talent.

#### Scenario: Resist whisper sent to target

- **WHEN** a spell with avoidTest.enabled: true is successfully cast
- **THEN** a whisper ChatMessage SHALL be created containing a .resist-button element

#### Scenario: Resist button click opens FertigkeitDialog

- **WHEN** the .resist-button in the resist whisper is clicked
- **THEN** a FertigkeitDialog SHALL open with the dialog title containing "Widerstandsprobe"

#### Scenario: Resist dialog displays correct Erschwernis

- **WHEN** the FertigkeitDialog opens for a resist test
- **THEN** the difficulty ("Erschwernis") SHALL be displayed as resistDifficulty + maechtigeQs \* 4

#### Scenario: Configured possessed profane talent is preselected

- **WHEN** a target receives a resistance prompt configured with a profane skill and one of that target's profane talents
- **THEN** the Widerstandsprobe SHALL open for the configured skill
- **AND** the configured talent SHALL be the selected talent option
- **AND** the preview SHALL use PWT

#### Scenario: Missing configured profane talent uses PW

- **WHEN** a target receives a resistance prompt configured with a profane skill and a talent the target does not own
- **THEN** the Widerstandsprobe SHALL open for the configured skill with ohne Talent selected
- **AND** the preview SHALL use PW

#### Scenario: Successful resist prevents effect application

- **WHEN** the target succeeds their resist roll and diminishedOnly is false
- **THEN** the pre-effect SHALL NOT be applied to the target

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist roll
- **THEN** the pre-effect SHALL be applied in full (instant damage or ActiveEffect creation)

#### Scenario: Diminished resist applies reduced effect

- **WHEN** the target succeeds their resist roll and diminishedOnly is true
- **THEN** the diminished value SHALL be applied instead of the full value

### Requirement: E2E test verifies pre-effect sheet configuration

An E2E test SHALL verify that the GM can configure pre-effects on an übernatürlich item sheet, including adding/deleting pre-effect entries, selecting only profane avoidTest skills and talents from compendium data, selecting damage types, and persisting data.

#### Scenario: Add and delete pre-effect entry

- **WHEN** the GM opens an item sheet and navigates to the pre-effects tab
- **THEN** they SHALL be able to add a new pre-effect entry and delete an existing one

#### Scenario: AvoidTest selects contain only profane compatible entries

- **WHEN** the avoidTest section is enabled and the GM opens the skill and talent selects
- **THEN** the skill dropdown SHALL contain profane skill names from configured compendium packs
- **AND** it SHALL NOT contain uebernatuerlicheFertigkeit entries
- **AND** the talent dropdown SHALL contain only profane talents compatible with the selected skill

#### Scenario: Damage type select populated from settings

- **WHEN** the GM clicks the damage type select
- **THEN** the dropdown SHALL contain damage types from the world setting damageTypes

#### Scenario: Pre-effect talent data persists after save and reopen

- **WHEN** the GM configures an avoidTest skill and optional talent, saves the item, closes the sheet, and reopens it
- **THEN** all configured pre-effect fields, including avoidTest.talent, SHALL retain their values
