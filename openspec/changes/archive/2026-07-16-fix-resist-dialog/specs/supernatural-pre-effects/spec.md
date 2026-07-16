## MODIFIED Requirements

### Requirement: Avoid/resist test

When a pre-effect has `avoidTest.enabled: true`, the target SHALL receive a whispered chat prompt with a resist button after the spell succeeds. The `avoidTest.fertigkeit` and `avoidTest.attribut` fields on the item sheet SHALL be populated from compendium data and fixed config respectively.

#### Scenario: Resist prompt sent to target

- **WHEN** a spell with avoidTest succeeds against a target
- **THEN** a whispered ChatMessage with `.resist-button` SHALL be sent to the target's controlling client via socket routing

#### Scenario: Resist test uses FertigkeitDialog with correct skill resolution

- **WHEN** the target clicks the resist button and `avoidTest.fertigkeit` is set to a skill `name` (e.g., "Athletik")
- **THEN** the resist handler SHALL find the skill in `actor.profan.fertigkeiten` by `name`, extract its array index, `system.pw`, and `system.talente`
- **AND** `FertigkeitDialog` SHALL be opened with `probeType: 'fertigkeit'`, `fertigkeitKey: <index>`, `pw: <resolved PW>`, and `talentList: <resolved talents>`

#### Scenario: Resist test uses FertigkeitDialog with correct attribute resolution

- **WHEN** the target clicks the resist button and `avoidTest.attribut` is set (e.g., "KO") with no `avoidTest.fertigkeit`
- **THEN** the resist handler SHALL compute `pw` from `actor.system.attribute["KO"].pw`
- **AND** `FertigkeitDialog` SHALL be opened with `probeType: 'attribut'`, `fertigkeitKey: "KO"`, `fertigkeitName: "Konstitution"`, and `pw: <computed PW>`

#### Scenario: Resist test warns when skill not found on actor

- **WHEN** the configured `avoidTest.fertigkeit` name is not found in `actor.profan.fertigkeiten`
- **THEN** the resist handler SHALL show a warning notification and SHALL NOT open FertigkeitDialog

#### Scenario: Successful resist avoids effect

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `true`
- **THEN** the effect SHALL be applied with `diminishedValue` replacing `change.value` and `diminishedMaechtigBonus` replacing `change.maechtigBonus` (or `''` if not set)

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test
- **THEN** the pre-effect SHALL be applied with full `change.value`

### Requirement: Resist resolution via FertigkeitDialog

Resist tests SHALL be resolved by opening FertigkeitDialog with resist metadata attached as `_resistContext`, then listening for the existing `Ilaris.postSkillRoll` hook. Each Mächtige Magie quality stage (QS) the caster has active SHALL increase the resist difficulty by 4. The dialog SHALL display the target difficulty ("Erschwernis") and a resist-specific title.

#### Scenario: Mächtige Magie increases resist difficulty

- **WHEN** a resist test is opened and the caster has Mächtige Magie/Liturgie with QS > 0
- **THEN** FertigkeitDialog SHALL be opened with `options.success_val = avoidTest.resistDifficulty + (QS × 4)`, where `resistDifficulty` defaults to 12 if not set

#### Scenario: Resist context attached to dialog

- **WHEN** a resist button is clicked and FertigkeitDialog is opened
- **THEN** `dialog._resistContext` SHALL be set to `{eventId, preEffectData, spellUuid}` after dialog construction

#### Scenario: Resist dialog shows difficulty in preview

- **WHEN** FertigkeitDialog is opened for a resist test with `success_val` set
- **THEN** the preview summary SHALL include an "Erschwernis" row showing `success_val`

#### Scenario: Resist dialog shows spell context in title

- **WHEN** FertigkeitDialog is opened for a resist test with `resistAgainst` set to the spell name
- **THEN** the dialog title SHALL read `"Widerstandsprobe: <skill> (gegen <spellName>)"`

#### Scenario: Resist handler detects its test via \_resistContext

- **WHEN** `Ilaris.postSkillRoll` fires
- **THEN** the resist handler SHALL check `dialog._resistContext` to determine if this is a resist test

#### Scenario: Successful resist avoids effect

- **WHEN** the resist handler detects a resist test with `rollResult.success === true` and `diminishedOnly === false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly applies diminished value (still amplified)

- **WHEN** the resist handler detects a resist test with `rollResult.success === true` and `diminishedOnly === true`
- **THEN** each change in `changes` SHALL use `diminishedValue` instead of `value` and `diminishedMaechtigBonus` instead of `maechtigBonus` (falling back to `''` if not set); if `amplifiedByMaechtigeMagie` is true, `diminishedMaechtigBonus` SHALL still be appended to the diminished value

#### Scenario: Failed resist applies full effect

- **WHEN** the resist handler detects a resist test with `rollResult.success === false`
- **THEN** each change in `changes` SHALL be applied with its full `value` (plus `maechtigBonus` if `amplifiedByMaechtigeMagie` is true)
