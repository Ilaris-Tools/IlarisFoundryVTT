## Purpose

End-to-end (Playwright) test coverage for the pre-effect feature: instant damage chains, the resist flow, sheet configuration, and buff ActiveEffect creation.

## Requirements

### Requirement: E2E test verifies instant damage pre-effect chain

An E2E test SHALL verify that casting a spell with an instant damage pre-effect correctly updates the target actor's wounds by the computed amount and creates the expected chat message.

#### Scenario: Cast instant damage spell updates target wounds

- **WHEN** a spell with `instant: true` and a deterministic damage formula is cast successfully against a target
- **THEN** the target actor's `system.gesundheit.wunden` SHALL increase by the computed damage amount
- **AND** a ChatMessage SHALL be created with content describing the damage

#### Scenario: Instant damage respects WS threshold

- **WHEN** deterministic instant damage is below the target's WS threshold
- **THEN** wounds SHALL increase by 0 (no damage)
- **AND** a ChatMessage SHALL indicate no damage was dealt

### Requirement: E2E test verifies resist flow end-to-end

An E2E test SHALL verify the complete resist flow: whisper with resist button → button click → FertigkeitDialog with correct parameters → deterministic roll → hook processes result. It SHALL cover attribute resistance and profane skill resistance with an optional configured talent.

#### Scenario: Resist whisper sent to target

- **WHEN** a spell with `avoidTest.enabled: true` is successfully cast
- **THEN** a whisper ChatMessage SHALL be created containing a `.resist-button` element

#### Scenario: Resist button click opens FertigkeitDialog

- **WHEN** the `.resist-button` in the resist whisper is clicked
- **THEN** a `FertigkeitDialog` SHALL open with the dialog title containing "Widerstandsprobe"

#### Scenario: Resist dialog displays correct Erschwernis

- **WHEN** the FertigkeitDialog opens for a resist test
- **THEN** the difficulty ("Erschwernis") SHALL be displayed as `resistDifficulty + maechtigeQs * 4`

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

- **WHEN** the target succeeds their resist roll and `diminishedOnly` is `false`
- **THEN** the pre-effect SHALL NOT be applied to the target

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist roll
- **THEN** the pre-effect SHALL be applied in full (instant damage or ActiveEffect creation)

#### Scenario: Diminished resist applies reduced effect

- **WHEN** the target succeeds their resist roll and `diminishedOnly` is `true`
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
- **THEN** the dropdown SHALL contain damage types from the world setting `damageTypes`

#### Scenario: Pre-effect talent data persists after save and reopen

- **WHEN** the GM configures an avoidTest skill and optional talent, saves the item, closes the sheet, and reopens it
- **THEN** all configured pre-effect fields, including avoidTest.talent, SHALL retain their values

### Requirement: E2E test verifies buff ActiveEffect creation

An E2E test SHALL verify that casting a spell with a non-instant pre-effect correctly creates an ActiveEffect on the target actor with every configured change and exact duration/timing data.

#### Scenario: Buff spell creates ActiveEffect on target

- **WHEN** a spell with `instant: false` and one or more changes is cast successfully
- **THEN** an ActiveEffect SHALL be created on the target with `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: ActiveEffect contains all configured changes

- **WHEN** the ActiveEffect is created
- **THEN** its `changes` array SHALL contain every source pre-effect entry with the expected key, mode, value, and priority

#### Scenario: ActiveEffect has correct base duration

- **WHEN** the ActiveEffect is created
- **THEN** `duration.turns`, `system.ilarisTiming.remaining`, and `system.ilarisTiming.original` SHALL match the effective pre-effect duration
