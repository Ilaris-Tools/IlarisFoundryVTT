## ADDED Requirements

### Requirement: Creature summon pre-effect configuration

A supernatural Item or structured spell form SHALL support an optional `summonCreature` pre-effect payload. The payload SHALL identify whether creature summoning is enabled and SHALL store an author-configured list of allowed `kreaturentyp` values. The runtime-selected creature UUID SHALL be transient casting context and SHALL not replace the author-configured type list.

#### Scenario: GM configures allowed creature types

- **WHEN** a GM edits a summonCreature pre-effect
- **THEN** the sheet SHALL persist the enabled state and the allowed `kreaturentyp` values
- **AND** the sheet SHALL not require a single fixed creature UUID

#### Scenario: Structured form inherits creature summon data

- **WHEN** a structured spell form inherits or extends a source pre-effect containing summonCreature
- **THEN** the effective pre-effect list SHALL contain the resolved summonCreature payload using the existing structured-form merge mode

### Requirement: Creature compendium setting

The system SHALL register `IlarisGameSettingNames.kreaturenPacks` as a GM-managed world-scoped JSON string setting with `config: false` and default value `["Ilaris.kreaturen"]`. The Ilaris settings dialog SHALL discover and display packs containing Actor entries of type `kreatur`, and saving or resetting the compendium tab SHALL persist this selection.

#### Scenario: Default creature pack is available

- **WHEN** a world is initialized without a saved creature-pack value
- **THEN** `game.settings.get` for `kreaturenPacks` SHALL return a JSON selection containing `Ilaris.kreaturen`

#### Scenario: GM selects creature packs

- **WHEN** a GM checks or unchecks creature compendium entries and saves Ilaris settings
- **THEN** the selected pack collection identifiers SHALL be persisted as a JSON array in the world setting
- **AND** non-creature packs SHALL not be shown in the creature group solely because they contain other document types

#### Scenario: Reset restores creature pack default

- **WHEN** a GM resets Ilaris settings
- **THEN** the creature pack setting SHALL be restored to `["Ilaris.kreaturen"]`

### Requirement: Creature selector stages

The supernatural casting dialog SHALL provide two dependent selectors for an enabled summonCreature pre-effect: one selector for the allowed creature types and one selector for matching creature Actors from the configured creature packs. The second selector SHALL contain only Actors whose `system.kreaturentyp` matches the selected type.

#### Scenario: Type selection filters creatures

- **WHEN** the caster selects a creature type
- **THEN** the creature selector SHALL list all matching `kreatur` Actors from the configured packs
- **AND** each option SHALL expose the Actor name and source UUID needed for runtime resolution

#### Scenario: No matching creature exists

- **WHEN** the selected creature type has no matching Actor in the configured packs
- **THEN** the creature selector SHALL be empty or disabled
- **AND** the cast SHALL not proceed as a creature summon until a valid creature is selected

#### Scenario: Selected creature survives effective-form resolution

- **WHEN** the caster selects a valid creature and the spell succeeds
- **THEN** the selected source UUID SHALL be passed into the effective pre-effect context
- **AND** the processor SHALL not use an unselected creature from another form or target

### Requirement: Creature profile replaces spell profile

For a successful summonCreature cast, the selected creature's `system.summoningDifficulty` SHALL replace the normal spell difficulty and `system.summoningCost` SHALL replace the normal spell energy cost. Both values SHALL normalize omitted, invalid, or legacy values to numeric `12`.

#### Scenario: Creature values replace ordinary values

- **WHEN** a selected creature has `summoningDifficulty: 18` and `summoningCost: 7`
- **THEN** the casting dialog SHALL use difficulty 18 and energy cost 7 for the summon
- **AND** it SHALL not add those values to the ordinary spell difficulty or cost

#### Scenario: Missing creature values use defaults

- **WHEN** a selected creature omits either summoning field
- **THEN** the effective difficulty or cost for the missing field SHALL be 12

### Requirement: Successful cast creates an adjacent creature token

After a successful summonCreature cast, the processor SHALL resolve the selected source using `fromUuid`, validate that it is a `kreatur` Actor, prepare a token with [Actor#getTokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#gettokendocument), and persist it on the active [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html) using `Scene#createEmbeddedDocuments("Token", ...)`. The source Actor SHALL remain in its compendium and the created token SHALL be unlinked.

#### Scenario: Successful summoning creates a token

- **WHEN** a summonCreature pre-effect runs after a successful cast with a valid source Actor and active Scene
- **THEN** the system SHALL create exactly one unlinked TokenDocument on that Scene
- **AND** the token SHALL represent the selected creature Actor
- **AND** the source compendium Actor SHALL remain unchanged

#### Scenario: Token is placed beside the summoner when possible

- **WHEN** the summoner has at least one available adjacent grid space
- **THEN** the created token SHALL be placed in the first valid adjacent space according to the deterministic candidate order

#### Scenario: Placement expands when adjacent spaces are occupied

- **WHEN** all directly adjacent spaces are occupied but a later ring contains a valid space
- **THEN** the system SHALL place the token in the first valid space from the next available ring

#### Scenario: No valid placement exists

- **WHEN** no valid position exists within the configured placement search bound
- **THEN** the cast SHALL remain successful
- **AND** no token SHALL be created
- **AND** the system SHALL show a warning that the creature could not be placed

### Requirement: Creature sheet opens after summoning

After [Scene#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html#createembeddeddocuments) returns the created TokenDocument, the system SHALL open the sheet for the created token's represented creature Actor using the existing AppV2 sheet lifecycle.

#### Scenario: Created creature sheet is opened

- **WHEN** a creature token is successfully persisted
- **THEN** the created creature Actor sheet SHALL be rendered
- **AND** the sheet SHALL represent the created scene token rather than the source compendium document

#### Scenario: Sheet opening failure does not undo token creation

- **WHEN** token creation succeeds but sheet rendering fails or is unavailable
- **THEN** the token SHALL remain on the Scene
- **AND** the system SHALL report the sheet error without creating a duplicate token

### Requirement: Manual summon lifecycle

Creature summon tokens SHALL not receive automatic expiration or automatic deletion from the summon pre-effect. The token SHALL remain until a user with sufficient Scene permission deletes it manually through the normal [Scene#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html#deleteembeddeddocuments) workflow.

#### Scenario: Summoned token remains after casting

- **WHEN** a summonCreature cast succeeds
- **THEN** the created token SHALL remain present after the casting dialog closes and after normal turn progression

#### Scenario: GM manually deletes summoned token

- **WHEN** a GM deletes the summoned TokenDocument
- **THEN** the token SHALL be removed normally
- **AND** no orphan World Actor SHALL be created by the summon
