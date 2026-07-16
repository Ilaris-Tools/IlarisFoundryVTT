## Purpose

UI/UX enhancements for the resist dialog (Widerstandsprobe) in the fertility skill check dialog. Ensures the target difficulty is visible in the preview summary, the dialog title differentiates resist tests from normal skill checks, and the item sheet's avoidTest fields are populated from validated compendium data rather than free-text input.

## Requirements

### Requirement: Resist difficulty displayed in FertigkeitDialog preview

When FertigkeitDialog is opened with `success_val` set (resist test context), the preview summary SHALL display the target difficulty as an "Erschwernis" row.

#### Scenario: Difficulty row appears in summary

- **WHEN** FertigkeitDialog renders with `this.success_val` set to a numeric value (e.g., 16)
- **THEN** the summary section SHALL include a row labeled "Erschwernis" showing the difficulty value

#### Scenario: No difficulty row when success_val is null

- **WHEN** FertigkeitDialog renders with `this.success_val` as `null` (normal skill check, no resist context)
- **THEN** the summary section SHALL NOT include an "Erschwernis" row

#### Scenario: Difficulty row updates with live preview

- **WHEN** the user changes modifiers (Hohe Qualität, Modifikator) in a resist dialog
- **THEN** the "Erschwernis" row SHALL remain displayed unchanged (difficulty is static per resist test)

### Requirement: Resist dialog title differentiates from normal skill checks

When FertigkeitDialog is opened with `resistAgainst` set (spell name), the dialog title SHALL indicate a resist test context.

#### Scenario: Title shows "Widerstandsprobe" with spell name

- **WHEN** `openSkillDialog` is called with `resistAgainst: "Feuerball"`
- **THEN** the dialog window title SHALL be `"Widerstandsprobe: Athletik (gegen Feuerball)"`

#### Scenario: Title shows normal skill check when resistAgainst absent

- **WHEN** `openSkillDialog` is called without `resistAgainst`
- **THEN** the dialog window title SHALL remain `"Fertigkeitsprobe: Athletik"` (existing behavior)

### Requirement: Compendium-populated avoidTest field selects

The übernatürlich item sheet's pre-effects section SHALL render `avoidTest.fertigkeit` and `avoidTest.attribut` as `<select>` dropdowns populated from valid sources.

#### Scenario: Skill dropdown populated from configured compendium packs

- **WHEN** the pre-effects section renders on a Zauber/Liturgie/Anrufung sheet
- **THEN** the `avoidTest.fertigkeit` field SHALL be a `<select>` element containing all skill `name` values from packs configured in `Ilaris.fertigkeitenPacks`
- **AND** each option SHALL be grouped by pack source

#### Scenario: Skill dropdown includes currently-stored value even if not in compendium

- **WHEN** `avoidTest.fertigkeit` is set to a value not present in the current compendium indexes
- **THEN** the `<select>` SHALL include that value as an option (with a visual indicator that it's no longer available)

#### Scenario: Attribute dropdown populated from CONFIG.ILARIS.attribute

- **WHEN** the pre-effects section renders
- **THEN** the `avoidTest.attribut` field SHALL be a `<select>` element with the 8 fixed attributes (KO, MU, GE, KK, IN, KL, CH, FF) from `CONFIG.ILARIS.attribute`

#### Scenario: Empty option available for both selects

- **WHEN** the pre-effects section renders
- **THEN** both `avoidTest.fertigkeit` and `avoidTest.attribut` selects SHALL include an empty/missing option to allow clearing the selection
