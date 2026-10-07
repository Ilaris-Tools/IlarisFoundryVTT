## ADDED Requirements

### Requirement: Contextual actor item suggestions

Actor-sheet item add controls SHALL open one shared picker scoped to the requested source item type or supported creature conversion types, without immediately creating an item. Advantage creation SHALL use this picker across accessible packs. ActiveEffect creation SHALL retain its direct flow.

API: [ActorSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html), [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html).

#### Scenario: Add a melee weapon

- **WHEN** an actor owner clicks the Nahkampfwaffe add control
- **THEN** a contextual German picker opens showing only compatible melee weapon suggestions
- **AND** the actor item count remains unchanged

#### Scenario: Advantages across sources

- **WHEN** an actor owner invokes advantage creation
- **THEN** the picker offers matching advantages from all readable Item packs instead of opening a hard-coded pack

#### Scenario: Direct active effects

- **WHEN** an actor owner invokes ActiveEffect creation
- **THEN** the existing direct effect-creation workflow remains available without an item picker

### Requirement: Accessible indexed discovery

The picker SHALL discover only readable and visible Item compendiums from system, world, and modules using CompendiumCollection.getIndex. It SHALL retain available results if another eligible pack fails, show loading/partial-failure/empty state in German, and SHALL fetch full documents only for preview or import.

API: [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html).

#### Scenario: Owning player cannot read a pack

- **WHEN** an owning player opens the picker with both readable and inaccessible compendiums present
- **THEN** only readable Item packs and their entries appear
- **AND** inaccessible packs are not queried for their indexes

#### Scenario: Partial index failure

- **WHEN** one readable pack fails to load while another succeeds
- **THEN** successful matching entries remain usable and a German failure message appears

#### Scenario: Discovery uses indexes

- **WHEN** a picker opens and the user filters its results
- **THEN** it uses pack indexes without loading all full documents

### Requirement: Combined filters and stable source identity

The picker SHALL combine contextual item type, normalized case-insensitive name search, and an optional compendium filter. Each row SHALL show its source and retain an identity based on pack plus document id. The picker SHALL clear a selection that no longer belongs to the visible result set.

API: [SearchFilter](https://foundryvtt.com/api/v14/classes/foundry.applications.ux.SearchFilter.html), [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html).

#### Scenario: Same names in house-rule and system packs

- **WHEN** two compatible items have the same name in different accessible packs
- **THEN** both appear as distinct selectable rows with their source labels

#### Scenario: Search combines with source filter

- **WHEN** the user enters a name query and chooses one pack
- **THEN** only contextual items matching both filters remain visible

#### Scenario: Hidden selection cannot be imported

- **WHEN** filters exclude the selected result
- **THEN** selection clears and Hinzufügen becomes disabled

### Requirement: Preview without creation

Clicking a result name SHALL resolve its full Item through CompendiumCollection.getDocument after checking current access/type, and open a source preview without editable controls. Preview SHALL NOT create an embedded actor item.

API: [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html), [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), [DocumentSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DocumentSheetV2.html).

#### Scenario: Read before importing

- **WHEN** the user opens an entry preview
- **THEN** its details are shown without changing the actor item count or editing the compendium source

### Requirement: Single complete item import

Explicit Hinzufügen SHALL resolve and validate the selected full source, check actor ownership/current pack access/type, and await one Actor.createEmbeddedDocuments operation. Ordinary item import SHALL preserve source system data, image, flags and effects using Item.toObject while giving the embedded item its own identity. Creature skill import SHALL apply existing category conversion to exactly one freiesTalent. Repeated clicks while an operation is pending SHALL NOT duplicate creation.

API: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html).

#### Scenario: Import a complete equipment item once

- **WHEN** the owner selects an equipment item and confirms Hinzufügen, including a repeated click while pending
- **THEN** exactly one embedded copy is created with its source image, system data, flags and effects preserved
- **AND** the source compendium item remains unchanged

#### Scenario: Creature conversion creates one talent

- **WHEN** a creature owner imports a supported skill source
- **THEN** exactly one freiesTalent with the corresponding category and mapped values is created
- **AND** the original skill is not also embedded

#### Scenario: Source unavailable or access revoked

- **WHEN** a selected source is deleted, changes to an incompatible type, or becomes unreadable before import
- **THEN** the picker reports a recoverable German error and creates nothing

#### Scenario: Actor permission revoked

- **WHEN** actor ownership is lost before import
- **THEN** no item is created

#### Scenario: Creation fails

- **WHEN** the embedded document operation fails
- **THEN** the picker remains usable, reports the failure, and allows an explicit retry

### Requirement: Explicit blank creation and harmless cancellation

The picker SHALL provide explicit own-item creation using the existing German name/type/default data and open its item sheet after successful creation. The own-item action SHALL remain usable with empty or failed discovery. Creature own advantage creation SHALL create Eigenschaft, consistent with the existing guidance to use Eigenschaften. Cancel or closing before a creation operation starts SHALL create nothing, including when asynchronous retrieval is still pending.

API: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html).

#### Scenario: Create own item from empty results

- **WHEN** the user chooses own-item creation while no suggestions are available
- **THEN** exactly one blank item with the existing defaults is created and its sheet opens

#### Scenario: Blank creature advantage

- **WHEN** the creature owner chooses own-item creation from advantage suggestions
- **THEN** one Eigenschaft is created with the existing creature defaults

#### Scenario: Cancel or close

- **WHEN** the user cancels or closes before creation begins, including during source retrieval
- **THEN** no embedded item is created and later retrieval completion cannot create one

### Requirement: Consistent accessible picker layout

The picker SHALL use ApplicationV2 with HandlebarsApplicationMixin and feature templates, native labelled controls, keyboard-visible focus, small result images, subtle row separation, and styles scoped to its own window. Content ordering SHALL be filters, status/results, then a persistent footer with own creation, Abbrechen, and Hinzufügen. Results SHALL scroll independently, and typing SHALL preserve input focus.

API: [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html), [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html).

#### Scenario: Search a long result list

- **WHEN** the user types and scrolls through many matches
- **THEN** input focus is preserved, the result list scrolls, and footer actions remain reachable

#### Scenario: Keyboard selection and disabled import

- **WHEN** the user navigates through the picker with the keyboard
- **THEN** labelled controls, preview actions and selection are reachable with visible focus
- **AND** Hinzufügen is disabled until a valid visible result is selected
