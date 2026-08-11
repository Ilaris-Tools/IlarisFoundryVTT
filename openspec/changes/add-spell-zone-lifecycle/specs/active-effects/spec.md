## ADDED Requirements

### Requirement: Zone-origin effect context

ActiveEffects created by persistent zone triggers SHALL retain the originating measured-template identity, source spell UUID, application identity, and triggering token context in Ilaris flags. The existing `ActiveEffect` document and `Actor` embedded-document APIs SHALL be used: [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).

#### Scenario: Zone effect records origin

- **WHEN** a persistent zone creates an ActiveEffect after a failed resistance
- **THEN** its Ilaris flags SHALL identify the zone template, spell, application, and triggering token

#### Scenario: Zone expiry removes future triggers

- **WHEN** the originating measured template is deleted or expires
- **THEN** no new ActiveEffect or resistance prompt SHALL be created from that zone

### Requirement: Beginning-of-turn zone triggers integrate with turn timing

Zones configured with `onTurnStart` SHALL integrate with the existing GM-scoped `combatTurn` processing and SHALL not dispatch duplicate triggers when a combat turn is rewound or when non-GM clients receive the hook. The [Combat](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html) API and exact hook signature SHALL be verified before implementation.

#### Scenario: GM dispatches one turn-start trigger

- **WHEN** a GM processes a combatant's forward turn transition while the combatant is inside an enabled zone
- **THEN** the zone SHALL dispatch one turn-start event for that combatant

#### Scenario: Rewind does not trigger

- **WHEN** combat is moved backward
- **THEN** no zone turn-start event SHALL be dispatched
