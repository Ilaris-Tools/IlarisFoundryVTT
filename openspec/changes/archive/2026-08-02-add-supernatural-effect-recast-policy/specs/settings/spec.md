## MODIFIED Requirements

### Requirement: World configures supernatural effect stacking

`registerIlarisGameSettings()` SHALL register a world-scoped setting named
`supernaturalEffectStacking`, managed through IlarisSettingsDialog and named
through the central setting-name constants. It SHALL offer `ilaris` as the
default and `foundry` as the alternative. Its German UI text SHALL explain
that `ilaris` retains supernatural effects and selects the stronger
supernatural component per overlap, while `foundry` adds distinct effects
normally and replaces all earlier ActiveEffects from the same supernatural
spell or liturgy source when it is recast.

#### Scenario: Default follows the Ilaris rule

- **WHEN** a world has no saved value for the setting
- **THEN** the resolver SHALL use `ilaris` mode
- **AND** a same-spell recast SHALL retain the existing effect document

#### Scenario: GM selects Foundry behavior

- **WHEN** a GM saves `foundry` in the Ilaris settings dialog
- **THEN** subsequent resolution SHALL add competing distinct effects normally
- **AND** a subsequent spell or liturgy application SHALL replace all earlier
  ActiveEffects from its same supernatural source
- **AND** the setting SHALL be persisted with world scope
