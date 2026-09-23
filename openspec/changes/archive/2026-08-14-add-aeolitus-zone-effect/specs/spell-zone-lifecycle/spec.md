## ADDED Requirements

### Requirement: Zone profile authoring supports duration sources

The concrete supernatural Item sheet SHALL expose a persistent Zone's `Dauerquelle` directly after `Lebenszyklus`. It SHALL offer `Fester Wert` and `Attribut der zaubernden Person`. A fixed source SHALL show `Szenenrunden`; an attribute source SHALL show the configured main-attribute selector. The same order SHALL be used for a structured form's Zonenform before its Form-Pre-Effects, while the existing Zone section remains before structured forms and Pre-Effects.

#### Scenario: Author chooses a KO duration source

- **WHEN** a GM chooses `Attribut der zaubernden Person` and KO in a persistent Zone editor
- **THEN** the Item SHALL persist `duration.source: "casterAttribute"` and `duration.attribute: "KO"`
- **AND** no fixed Scene-round input SHALL be presented as the active source

### Requirement: A resolved duration source uses the standard Zone lifecycle

After a caster-attribute source is resolved, the created Region SHALL use the existing persistent Zone `sceneRounds` lifecycle and existing [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html) dispatch/expiry ordering. Existing numeric Zone profiles and persisted Regions SHALL retain their behavior.

#### Scenario: Final sourced round triggers before expiry

- **WHEN** a sourced persistent Zone has one resolved Scene round remaining and enables `onRoundStart`
- **THEN** it SHALL dispatch its current-occupant event before the Region is removed by normal duration expiry
