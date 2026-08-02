## ADDED Requirements

### Requirement: World configures supernatural effect stacking

`registerIlarisGameSettings()` SHALL register a world-scoped setting named
`supernaturalEffectStacking`, managed through IlarisSettingsDialog and named
through the central setting-name constants. It SHALL offer `ilaris` as the
default and `foundry` as the alternative. Its German UI text SHALL explain
that `ilaris` selects the stronger overnatürlicher effect per overlap while
`foundry` adds effects normally.

#### Scenario: Default follows the Ilaris rule

- **WHEN** a world has no saved value for the setting
- **THEN** the resolver SHALL use `ilaris` mode

#### Scenario: GM selects Foundry behavior

- **WHEN** a GM saves `foundry` in the Ilaris settings dialog
- **THEN** subsequent effect resolution SHALL add competing effects normally
- **AND** the setting SHALL be persisted with world scope
