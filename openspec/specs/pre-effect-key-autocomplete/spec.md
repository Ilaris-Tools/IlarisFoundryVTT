## Purpose

Autocomplete support for pre-effects change key fields on übernatürlich item sheets (Zauber, Liturgie, Anrufung). Provides a `<datalist>` with valid Actor `system.*` field paths — the same set shown in the ActiveEffect config changes tab — so GMs can configure pre-effect keys without memorizing data model paths. Backed by a shared utility (`collectActorSystemPaths()`) that both the ActiveEffect config and pre-effects sheet consume.

## Requirements

### Requirement: Pre-effect change key fields have autocomplete suggestions

The übernatürlich item sheet's pre-effects section SHALL provide a `<datalist>` with valid Actor `system.*` field paths for autocomplete on each change's `key` input field.

#### Scenario: Autocomplete appears when sheet opens

- **WHEN** a Zauber/Liturgie/Anrufung item sheet with a pre-effects section is opened
- **THEN** a `<datalist id="ilaris-pre-effect-keys">` SHALL be injected into the pre-effects section containing all leaf `system.*` paths from `CONFIG.Actor.dataModels`
- **AND** all `changes[].key` input fields in the pre-effects section SHALL have their `list` attribute set to `"ilaris-pre-effect-keys"`

#### Scenario: Autocomplete re-attached after adding a change

- **WHEN** the user clicks "Add Change" and a new change card is rendered
- **THEN** the new change's `key` input SHALL have its `list` attribute set to `"ilaris-pre-effect-keys"`

#### Scenario: Autocomplete survives sheet re-renders

- **WHEN** the sheet re-renders due to field edits (submitOnChange)
- **THEN** the datalist SHALL NOT be duplicated (only one `#ilaris-pre-effect-keys` element exists)
- **AND** all key inputs SHALL still reference the datalist

#### Scenario: Autocomplete shows same paths as ActiveEffect config

- **WHEN** the datalist is populated
- **THEN** the set of suggested paths SHALL be identical to those shown in `IlarisActiveEffectConfig`'s changes tab (collected from the same `CONFIG.Actor.dataModels` source)

### Requirement: Field path collection is a shared utility

Field path collection from Actor data models SHALL be implemented as a reusable pure function in `scripts/effects/utils/field-path-collector.js`.

#### Scenario: Utility returns sorted deduplicated paths

- **WHEN** `collectActorSystemPaths()` is called
- **THEN** it SHALL return a sorted array of unique `system.*` dotted paths collected recursively from all models in `CONFIG.Actor.dataModels`

#### Scenario: Utility handles nested SchemaFields

- **WHEN** a data model contains nested `SchemaField` instances (e.g., `system.attribute.KO.pw`)
- **THEN** the utility SHALL recursively descend and include all leaf paths

#### Scenario: Both consumers use the same utility

- **WHEN** `IlarisActiveEffectConfig` or `UebernatuerlichTalentSheet` needs field paths
- **THEN** it SHALL import and call `collectActorSystemPaths()` from the shared utility
