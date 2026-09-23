## ADDED Requirements

### Requirement: Creature Actor compendium group

The Ilaris settings dialog SHALL add a creature compendium group to the existing "Benutzte Kompendien" tab. The group SHALL list packs whose indexes contain Actor entries with `type: "kreatur"`, use the `kreaturenPacks` setting for selection, and preserve the existing GM-only save and reset behavior.

#### Scenario: Creature group is visible to the GM

- **WHEN** a GM opens the compendium settings tab
- **THEN** a "Kreaturen Kompendien" group SHALL show all eligible Actor packs
- **AND** each entry SHALL expose its pack collection identifier and selected state

#### Scenario: Creature group is hidden from non-GMs

- **WHEN** a non-GM opens the settings dialog
- **THEN** they SHALL not be able to edit creature pack checkboxes
- **AND** the existing GM-only settings notice SHALL remain available

#### Scenario: Creature group saves through the shared handler

- **WHEN** the GM saves the compendium settings
- **THEN** the selected creature pack identifiers SHALL be serialized and written through `game.settings.set`
- **AND** the other compendium groups SHALL retain their current selections
