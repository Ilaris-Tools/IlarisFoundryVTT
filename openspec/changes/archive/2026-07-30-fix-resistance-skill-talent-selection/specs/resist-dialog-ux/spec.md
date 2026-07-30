## MODIFIED Requirements

### Requirement: Compendium-populated avoidTest field selects

The übernatürlich item sheet's pre-effects section SHALL render avoidTest.fertigkeit, avoidTest.talent, and avoidTest.attribut as select dropdowns populated from valid sources. The skill selector SHALL contain only profane fertigkeit entries from packs configured in Ilaris.fertigkeitenPacks. The optional talent selector SHALL contain only profane talent entries from packs configured in Ilaris.talentePacks and SHALL identify each talent's parent skill. Neither selector SHALL expose uebernatuerlicheFertigkeit, Zauber, Liturgie, or Anrufung entries.

#### Scenario: Skill dropdown populated from configured profane skill packs

- **WHEN** the pre-effects section renders on a Zauber/Liturgie/Anrufung sheet
- **THEN** the avoidTest.fertigkeit field SHALL be a select element containing all and only fertigkeit name values from packs configured in Ilaris.fertigkeitenPacks
- **AND** each option SHALL be grouped by pack source

#### Scenario: Talent dropdown populated from configured profane talent packs

- **WHEN** the pre-effects section renders on a Zauber/Liturgie/Anrufung sheet
- **THEN** the avoidTest.talent field SHALL be a select element containing all and only talent name values from packs configured in Ilaris.talentePacks
- **AND** each option SHALL identify its system.fertigkeit parent skill

#### Scenario: Talent choices are compatible with selected skill

- **WHEN** a GM selects avoidTest.fertigkeit as "Athletik"
- **THEN** the selectable avoidTest.talent choices SHALL be limited to talents whose system.fertigkeit is "Athletik"
- **AND** an empty option SHALL remain available to configure a skill check without a talent

#### Scenario: Supernatural entries are excluded

- **WHEN** a configured skill pack contains uebernatuerlicheFertigkeit entries
- **THEN** none of those entries SHALL appear in avoidTest.fertigkeit

#### Scenario: Skill dropdown includes currently-stored value even if not in compendium

- **WHEN** avoidTest.fertigkeit is set to a value not present in the current compendium indexes
- **THEN** the select SHALL include that value as an option with a visual indicator that it is no longer available

#### Scenario: Talent dropdown includes currently-stored value even if not in compendium

- **WHEN** avoidTest.talent is set to a value not present among the compatible current talent options
- **THEN** the select SHALL include that value as an option with a visual indicator that it is no longer available

#### Scenario: Attribute dropdown populated from CONFIG.ILARIS.attribute

- **WHEN** the pre-effects section renders
- **THEN** the avoidTest.attribut field SHALL be a select element with the 8 fixed attributes (KO, MU, GE, KK, IN, KL, CH, FF) from CONFIG.ILARIS.attribute

#### Scenario: Empty option available for all selects

- **WHEN** the pre-effects section renders
- **THEN** avoidTest.fertigkeit, avoidTest.talent, and avoidTest.attribut selects SHALL include an empty option to allow clearing the selection
