## MODIFIED Requirements

### Requirement: Resist resolution via FertigkeitDialog

Resist tests SHALL be resolved by opening FertigkeitDialog with resist metadata
attached as `_resistContext`, then listening for the existing
`Ilaris.postSkillRoll` hook. `avoidTest.resistDifficultySource` SHALL select
the difficulty source: a missing or invalid value is `fixed`, while
`triggeringRoll` uses the serialised final triggering-roll total. In `fixed`
mode, `resistDifficulty` SHALL default to 12 only when it is absent or null;
its explicit numeric value, including `0`, SHALL be retained. Each Mächtige
Magie/Liturgie quality stage (QS) the caster has active SHALL increase a
fixed-source difficulty by 4 and SHALL NOT alter a triggering-roll difficulty.
The dialog SHALL display the resolved target difficulty (`Erschwernis`) and a
resist-specific title.

#### Scenario: Fixed difficulty defaults to 12 and receives Mächtige Magie

- **WHEN** a resist test uses the `fixed` source and `resistDifficulty` is
  absent or null
- **THEN** FertigkeitDialog SHALL be opened with `options.success_val = 12 +
(QS × 4)`

#### Scenario: Explicit fixed zero is not a source sentinel

- **WHEN** a resist test uses the `fixed` source and `resistDifficulty` is `0`
- **THEN** FertigkeitDialog SHALL use `options.success_val = 0 + (QS × 4)`
- **AND** the system SHALL NOT substitute the default merely because the value
  is zero

#### Scenario: Triggering roll supplies the exact difficulty

- **WHEN** a resist test uses `resistDifficultySource: "triggeringRoll"` and
  its prompt contains a finite triggering-roll total
- **THEN** FertigkeitDialog SHALL use that total as `options.success_val`
- **AND** the system SHALL NOT add a fixed difficulty or a Mächtige
  Magie/Liturgie QS bonus

#### Scenario: Missing triggering roll falls back safely

- **WHEN** a resist test uses `resistDifficultySource: "triggeringRoll"` but
  its prompt does not contain a finite triggering-roll total
- **THEN** the system SHALL show a localized warning
- **AND** FertigkeitDialog SHALL use the documented default difficulty of 12

#### Scenario: Resist context attached to dialog

- **WHEN** a resist button is clicked and FertigkeitDialog is opened
- **THEN** `dialog._resistContext` SHALL be set to `{eventId, preEffectData,
spellUuid}` after dialog construction

#### Scenario: Resist dialog shows difficulty in preview

- **WHEN** FertigkeitDialog is opened for a resist test with `success_val` set
- **THEN** the preview summary SHALL include an "Erschwernis" row showing
  `success_val`

#### Scenario: Resist dialog shows spell context in title

- **WHEN** FertigkeitDialog is opened for a resist test with `resistAgainst`
  set to the spell name
- **THEN** the dialog title SHALL read `"Widerstandsprobe: <skill> (gegen
<spellName>)"`

#### Scenario: Resist handler detects its test via \_resistContext

- **WHEN** `Ilaris.postSkillRoll` fires
- **THEN** the resist handler SHALL check `dialog._resistContext` to determine
  if this is a resist test

#### Scenario: Successful resist avoids effect

- **WHEN** the resist handler detects a resist test with
  `rollResult.success === true` and `diminishedOnly === false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly applies diminished value (still amplified)

- **WHEN** the resist handler detects a resist test with
  `rollResult.success === true` and `diminishedOnly === true`
- **THEN** each change in `changes` SHALL use `diminishedValue` instead of
  `value` and `diminishedMaechtigBonus` instead of `maechtigBonus` (falling
  back to `''` if not set); if `amplifiedByMaechtigeMagie` is true,
  `diminishedMaechtigBonus` SHALL still be appended to the diminished value

#### Scenario: Failed resist applies full effect

- **WHEN** the resist handler detects a resist test with
  `rollResult.success === false`
- **THEN** each change in `changes` SHALL be applied with its full `value`
  (plus `maechtigBonus` if `amplifiedByMaechtigeMagie` is true)

## ADDED Requirements

### Requirement: Pre-effect authoring exposes resistance difficulty sources

The übernatürlich item-sheet Pre-Effect editor SHALL persist
`avoidTest.resistDifficultySource` with `fixed` as its default. When an avoid
test is enabled, it SHALL present the German selector `Schwierigkeit aus` with
the choices `Fester Wert` (`fixed`) and `Ergebnis der auslösenden Probe`
(`triggeringRoll`). The numeric `resistDifficulty` field SHALL remain
available for the fixed source and show its default value of 12.

#### Scenario: New avoid test defaults to a fixed difficulty

- **WHEN** a GM creates a Pre-Effect with an avoid test
- **THEN** its `avoidTest.resistDifficultySource` SHALL be `fixed`
- **AND** its `avoidTest.resistDifficulty` SHALL be 12

#### Scenario: GM selects triggering-roll difficulty

- **WHEN** a GM selects `Ergebnis der auslösenden Probe` for an enabled avoid
  test
- **THEN** the sheet SHALL persist
  `avoidTest.resistDifficultySource: "triggeringRoll"`
- **AND** the numeric fixed field SHALL not be presented as the active source
  of that test's difficulty

### Requirement: Resistance prompts carry a triggering-roll snapshot

The pre-effect processor SHALL serialize the finite total of the roll supplied
to `applyPreEffects` as `triggeringRollTotal` in the existing resistance
prompt. The prompt SHALL continue to use the existing
[ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
transport and shall not re-evaluate or look up the source roll when the target
clicks its button.

#### Scenario: Supernatural roll total is copied into the prompt

- **WHEN** a successful supernatural pre-effect with an avoid test receives a
  roll result containing `roll.total`
- **THEN** its resistance prompt data SHALL contain that total as
  `triggeringRollTotal`

#### Scenario: Calls without a roll do not invent a triggering total

- **WHEN** a pre-effect caller supplies no Roll or a non-finite `roll.total`
- **THEN** the resistance prompt data SHALL omit `triggeringRollTotal`
- **AND** fixed-source resistance behaviour SHALL remain available
