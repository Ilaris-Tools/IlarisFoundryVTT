## Purpose

UI/UX enhancements for the resist dialog (Widerstandsprobe) in the fertility skill check dialog. Ensures the target difficulty is visible in the preview summary, the dialog title differentiates resist tests from normal skill checks, and the item sheet's avoidTest fields are populated from validated compendium data rather than free-text input.

## Requirements

### Requirement: Resist difficulty displayed in FertigkeitDialog preview

FertigkeitDialog SHALL display the resolved numeric `success_val` as an immutable `Erschwernis` row in a resist-test preview. The value may originate from a fixed Pre-Effect value or a snapshot of the triggering roll, but the dialog SHALL not recalculate it while previewing the target's own test.

#### Scenario: Difficulty row appears in summary

- **WHEN** FertigkeitDialog renders with `this.success_val` set to a numeric value (e.g., 16)
- **THEN** the summary section SHALL include a row labeled "Erschwernis" showing the difficulty value

#### Scenario: No difficulty row when success_val is null

- **WHEN** FertigkeitDialog renders with `this.success_val` as `null` (normal skill check, no resist context)
- **THEN** the summary section SHALL NOT include an "Erschwernis" row

#### Scenario: Triggering-roll difficulty remains a prompt snapshot

- **WHEN** the user changes modifiers (Hohe Qualität, Modifikator) in a resist dialog whose difficulty came from a triggering roll
- **THEN** the `Erschwernis` row SHALL remain displayed with the unchanged triggering-roll total
- **AND** the system SHALL not re-evaluate the original roll

### Requirement: Resist dialog title differentiates from normal skill checks

When FertigkeitDialog is opened with `resistAgainst` set (spell name), the dialog title SHALL indicate a resist test context.

#### Scenario: Title shows "Widerstandsprobe" with spell name

- **WHEN** `openSkillDialog` is called with `resistAgainst: "Feuerball"`
- **THEN** the dialog window title SHALL be `"Widerstandsprobe: Athletik (gegen Feuerball)"`

#### Scenario: Title shows normal skill check when resistAgainst absent

- **WHEN** `openSkillDialog` is called without `resistAgainst`
- **THEN** the dialog window title SHALL remain `"Fertigkeitsprobe: Athletik"` (existing behavior)

### Requirement: Compendium-populated avoidTest field selects

The übernatürlich item sheet's pre-effects section SHALL render `avoidTest.fertigkeit`, `avoidTest.talent`, and `avoidTest.attribut` as select dropdowns populated from valid sources. The skill selector SHALL contain only profane fertigkeit entries from packs configured in `Ilaris.fertigkeitenPacks`. The optional talent selector SHALL contain only profane talent entries from packs configured in `Ilaris.talentePacks` and SHALL identify each talent's parent skill. Neither selector SHALL expose uebernatuerlicheFertigkeit, Zauber, Liturgie, or Anrufung entries.

#### Scenario: Skill dropdown populated from configured compendium packs

- **WHEN** the pre-effects section renders on a Zauber/Liturgie/Anrufung sheet
- **THEN** the `avoidTest.fertigkeit` field SHALL be a select element containing all and only fertigkeit name values from packs configured in `Ilaris.fertigkeitenPacks`
- **AND** each option SHALL be grouped by pack source

#### Scenario: Talent dropdown populated from configured profane talent packs

- **WHEN** the pre-effects section renders on a Zauber/Liturgie/Anrufung sheet
- **THEN** the avoidTest.talent field SHALL be a select element containing all and only talent name values from packs configured in `Ilaris.talentePacks`
- **AND** each option SHALL identify its system.fertigkeit parent skill

#### Scenario: Talent choices are compatible with selected skill

- **WHEN** a GM selects avoidTest.fertigkeit as "Athletik"
- **THEN** the selectable avoidTest.talent choices SHALL be limited to talents whose system.fertigkeit is "Athletik"
- **AND** an empty option SHALL remain available to configure a skill check without a talent

#### Scenario: Supernatural entries are excluded

- **WHEN** a configured skill pack contains uebernatuerlicheFertigkeit entries
- **THEN** none of those entries SHALL appear in avoidTest.fertigkeit

#### Scenario: Skill dropdown includes currently-stored value even if not in compendium

- **WHEN** `avoidTest.fertigkeit` is set to a value not present in the current compendium indexes
- **THEN** the `<select>` SHALL include that value as an option (with a visual indicator that it's no longer available)

#### Scenario: Talent dropdown includes currently-stored value even if not in compendium

- **WHEN** avoidTest.talent is set to a value not present among the compatible current talent options
- **THEN** the select SHALL include that value as an option with a visual indicator that it is no longer available

#### Scenario: Attribute dropdown populated from CONFIG.ILARIS.attribute

- **WHEN** the pre-effects section renders
- **THEN** the `avoidTest.attribut` field SHALL be a `<select>` element with the 8 fixed attributes (KO, MU, GE, KK, IN, KL, CH, FF) from `CONFIG.ILARIS.attribute`

#### Scenario: Empty option available for all selects

- **WHEN** the pre-effects section renders
- **THEN** avoidTest.fertigkeit, avoidTest.talent, and avoidTest.attribut selects SHALL include an empty option to allow clearing the selection
