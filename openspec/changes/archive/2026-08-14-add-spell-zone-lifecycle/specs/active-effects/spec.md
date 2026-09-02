## ADDED Requirements

### Requirement: Zone-origin effect context

ActiveEffects created by persistent zone triggers SHALL retain the originating Region identity, source spell UUID, application identity, and triggering token context in Ilaris flags. The existing `ActiveEffect` document and `Actor` embedded-document APIs SHALL be used: [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).

#### Scenario: Zone effect records origin

- **WHEN** a persistent zone creates an ActiveEffect after a failed resistance
- **THEN** its Ilaris flags SHALL identify the zone Region, spell, application, and triggering token

#### Scenario: Zone expiry removes future triggers

- **WHEN** the originating Region is deleted or expires
- **THEN** no new ActiveEffect or resistance prompt SHALL be created from that zone
