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

### Requirement: Context-sensitive summon authoring UI

The shared `pre-effects.hbs` template and the structured `uebernatuerlich_talent.hbs` template SHALL hide or disable fields unrelated to the currently selected configuration. Creature fields SHALL be visible only when creature summoning is enabled. Domination fields SHALL be visible only when `dominationChecks.enabled` is true. Attribute-specific fields SHALL be shown only for an attribute probe, and skill/talent-specific fields SHALL be shown only for a skill probe.

#### Scenario: Disabled creature summon hides creature fields

- **WHEN** the `summonCreature` option is disabled in an authoring form
- **THEN** creature-type, creature-source, and domination configuration fields SHALL not be shown as active inputs

#### Scenario: Disabled domination hides domination fields

- **WHEN** `summonCreature.dominationChecks.enabled` is false
- **THEN** the per-type domination difficulty and probe configuration fields SHALL be hidden or disabled

#### Scenario: Probe type shows only relevant fields

- **WHEN** the author selects an attribute or skill probe type
- **THEN** the form SHALL show only the matching attribute or skill/talent fields
- **AND** unrelated probe fields SHALL not be presented as active configuration inputs

### Requirement: Tutorial documentation for creature summoning

The system SHALL include a German tutorial or quick-reference entry in the existing tutorial-oriented compendium under `comp_packs/`. The entry SHALL explain creature-pack selection, `summonCreature` authoring, optional global domination-check enablement, per-type probe configuration, and the post-cast token and sheet behavior.

#### Scenario: GM follows the creature-summoning tutorial

- **WHEN** a GM opens the creature-summoning tutorial entry
- **THEN** the entry SHALL describe the required setup steps in their configuration order
- **AND** it SHALL explain that missing or disabled domination configuration does not prompt an additional roll

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

### Requirement: Optional domination check

The `summonCreature` payload MAY define a global `dominationChecks` object. Its `enabled` flag SHALL explicitly enable or disable domination checks for the complete spell. When enabled, each configured `kreaturentyp` entry SHALL contain a fixed difficulty and either an attribute target or a skill/talent target using the existing Ilaris probe conventions. The check SHALL be disabled when the global flag is false or when no configuration exists for the selected type.

#### Scenario: Attribute domination check is configured

- **WHEN** a spell configures an attribute domination check for a `kreaturentyp`
- **THEN** the casting flow SHALL use the summoner's configured attribute probe against the fixed difficulty after the creature token has been created

#### Scenario: Skill and talent domination check is configured

- **WHEN** a spell configures a skill and optional talent domination check for a `kreaturentyp`
- **THEN** the casting flow SHALL use the summoner's configured skill/talent probe against the fixed difficulty after the creature token has been created

#### Scenario: No domination check is configured

- **WHEN** the selected `kreaturentyp` has no domination-check configuration in the spell
- **THEN** the system SHALL disable and skip the domination roll
- **AND** the summoner SHALL not be required to make an additional probe

#### Scenario: Domination checks are globally disabled

- **WHEN** `summonCreature.dominationChecks.enabled` is false, regardless of any per-type entries
- **THEN** the system SHALL skip the domination roll
- **AND** the summoner SHALL not be required to make an additional probe

#### Scenario: Domination check fails

- **WHEN** the optional domination probe fails
- **THEN** the system SHALL display only that the domination check was unsuccessful
- **AND** the already-created token and opened creature sheet SHALL remain unchanged
- **AND** the failed check SHALL not undo or alter the successful summoning result

#### Scenario: Domination check succeeds

- **WHEN** the optional domination probe succeeds
- **THEN** the system SHALL display only that the domination check was successful
- **AND** the already-created token SHALL remain unchanged

### Requirement: Domination check occurs after creation

The system SHALL create the selected creature token and open its represented creature sheet before starting a configured domination check. The domination result SHALL not control token placement, token persistence, summoning cost, or spell success.

#### Scenario: Token and sheet precede domination check

- **WHEN** a selected creature has a configured domination check and the summon cast succeeds
- **THEN** the system SHALL persist the creature token and attempt to open its represented sheet before starting the domination probe
- **AND** the domination result SHALL not control token placement, token persistence, summoning cost, or spell success

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

### Requirement: Spell-defined bound resource cost

The `summonCreature` payload MAY define a `boundResourceCost` object with a resource of `gasp` or `gkap` and a positive numeric amount. The cost SHALL belong to the spell and SHALL not be read from the selected creature Actor. For the current scope, the held Actor performing the cast SHALL be treated as the summoner and SHALL pay the configured bound cost by increasing the corresponding bound resource field before the summon is finalized.

#### Scenario: gAsP binding cost is reserved

- **WHEN** a successful creature summon defines `boundResourceCost: { resource: "gasp", amount: 4 }`
- **THEN** the held summoner Actor SHALL receive a four-point gAsP reservation
- **AND** the created token SHALL record the summoner and reservation details needed for later release

#### Scenario: gKaP binding cost is reserved

- **WHEN** a successful creature summon defines `boundResourceCost: { resource: "gkap", amount: 3 }`
- **THEN** the held summoner Actor SHALL receive a three-point gKaP reservation
- **AND** the created token SHALL record the summoner and reservation details needed for later release

#### Scenario: No bound resource cost is configured

- **WHEN** `boundResourceCost` is absent or disabled on the summon spell
- **THEN** the system SHALL not change the summoner's gAsP or gKaP bound resource

#### Scenario: Insufficient bound resource prevents partial summoning

- **WHEN** the held summoner cannot pay the configured bound resource amount
- **THEN** the system SHALL follow the existing insufficient-resource failure and notification behavior
- **AND** the system SHALL not leave a partial resource reservation or created summon token

### Requirement: Bound resource is released on token deletion

The created summon token SHALL store enough provenance to identify the held summoner, bound resource type, amount, and whether the reservation has already been released. When a user deletes the summoned TokenDocument, the system SHALL release the recorded amount from the same held Actor exactly once.

#### Scenario: Deleting a gAsP-bound token releases gAsP

- **WHEN** a summoned token with a four-point gAsP reservation is deleted
- **THEN** the held summoner's gAsP bound resource SHALL be reduced by four
- **AND** the release SHALL occur exactly once

#### Scenario: Deleting a gKaP-bound token releases gKaP

- **WHEN** a summoned token with a three-point gKaP reservation is deleted
- **THEN** the held summoner's gKaP bound resource SHALL be reduced by three
- **AND** the release SHALL occur exactly once

#### Scenario: Summoner is unavailable during release

- **WHEN** a bound-resource token is deleted after its held summoner is unavailable
- **THEN** the system SHALL report the release issue without recreating the summoner or blocking token deletion

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
