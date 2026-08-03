## Purpose

Character and rule data import from Sephrasto XML files and database dumps into Ilaris actors and compendiums.

## Requirements

### Requirement: XML character import

The system SHALL provide `XmlCharacterImporter` for importing character data from Sephrasto XML files, mapping XML elements to Ilaris actor and item data.

#### Scenario: Attributes imported from XML

- **WHEN** a Sephrasto XML file is imported
- **THEN** all 8 base attributes SHALL be mapped from the XML to the Held actor data model

#### Scenario: Skills imported with compendium lookup

- **WHEN** a skill is referenced in the XML
- **THEN** the importer SHALL look up the skill in configured compendium packs by name (not ID) and create an embedded item

#### Scenario: Talents and advantages imported

- **WHEN** talents, advantages, or supernatural skills are in the XML
- **THEN** each SHALL be created as an embedded item on the actor with compendium lookup

#### Scenario: Weapons and armor imported

- **WHEN** weapons or armor are in the XML
- **THEN** they SHALL be created as embedded items with their stats mapped from XML attributes

#### Scenario: Legacy type aliases handled

- **WHEN** the XML references a type `freiestalent` or `freie_fertigkeit`
- **THEN** the importer SHALL map them to the current type names `freiesTalent` and `freieFertigkeit`

### Requirement: XML rule import

The system SHALL provide `XMLRuleImporter` for importing rule data (skills, talents, spells, liturgies, advantages, maneuvers, weapons) into compendium packs.

#### Scenario: Rule data imported into compendiums

- **WHEN** the rule import is executed with source XML files
- **THEN** the importer SHALL create or update entries in the target compendium packs

#### Scenario: Converters transform XML to item data

- **WHEN** a rule XML element is processed
- **THEN** the appropriate converter (skill, talent, spell, liturgie, advantage, maneuver, weapon, armor, abgeleiteter-wert) SHALL transform the XML to Ilaris item format

### Requirement: Sephrasto database import

The system SHALL provide `SephrastoImporter` for creating all item types from an embedded Sephrasto database dump.

#### Scenario: All item types created from database

- **WHEN** the Sephrasto database import runs
- **THEN** items of all supported types SHALL be created in the world

### Requirement: Import progress overlay

The system SHALL display a full-screen loading overlay with a spinner during import operations.

#### Scenario: Progress overlay shown during import

- **WHEN** an import operation begins
- **THEN** a full-screen overlay with spinner SHALL be displayed

#### Scenario: Progress overlay hidden on completion

- **WHEN** an import operation completes (success or failure)
- **THEN** the overlay SHALL be removed

### Requirement: Import confirmation dialogs

The system SHALL provide `XmlCharacterImportDialogs` for confirming import/sync operations with the user.

#### Scenario: Confirmation before overwriting existing character

- **WHEN** importing a character that already exists in the world
- **THEN** the user SHALL be prompted to confirm overwrite or sync

## Data Model

The importer does not define its own persistent data model. It maps external formats (Sephrasto XML, Sephrasto database) to Ilaris actor and item data models.

## Cross-References

- [actor-sheets](../actor-sheets/spec.md) — Target data model for imported characters
- [item-sheets](../item-sheets/spec.md) — Target data models for imported items
- [e2e-testing](../e2e-testing/spec.md) — E2E test case e2e-016 covers XML import
