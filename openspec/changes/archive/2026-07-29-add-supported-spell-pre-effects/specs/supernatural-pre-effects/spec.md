## ADDED Requirements

### Requirement: Table-visible spell-named marker convention

The existing [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)-based pre-effect flow SHALL permit reviewed compendium entries to use a timed spell-named ActiveEffect as a table-visible marker when the rules require a condition identifier but no automatic enforcement.

#### Scenario: Marker requires no new actor schema

- **WHEN** a reviewed pre-effect records handlungsunfähig as a marker
- **THEN** it SHALL use the existing spell-named ActiveEffect and a no-op numeric change
- **AND** it SHALL NOT write an arbitrary actor-system field or introduce a generic marker schema

#### Scenario: Marker mechanics remain manual

- **WHEN** a spell-named marker ActiveEffect is present
- **THEN** the table SHALL be able to see its duration and source spell
- **AND** the system SHALL NOT claim that it automatically prevents actions
