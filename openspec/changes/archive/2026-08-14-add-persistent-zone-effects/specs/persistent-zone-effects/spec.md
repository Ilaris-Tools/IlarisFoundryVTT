## ADDED Requirements

### Requirement: Persistent Zone profiles opt into passive effects explicitly

The system SHALL normalize `effectMode` to `"triggered"` by default. It SHALL accept `effectMode: "passive"` only for a persistent Zone with `lifecycle: "persistent"`; a passive Zone SHALL process only non-instant Pre-Effects whose `avoidTest.enabled` is not true.

#### Scenario: Existing triggered Zone retains its behavior

- **WHEN** a persistent Zone does not author `effectMode`
- **THEN** its normalized mode SHALL be `"triggered"`
- **AND** the existing creation, entry, and re-entry trigger path SHALL remain unchanged

#### Scenario: Passive mode rejects resistance and instant effects

- **WHEN** a passive Zone contains an instant Pre-Effect or one with `avoidTest.enabled: true`
- **THEN** the system SHALL not create a passive ActiveEffect or resistance prompt for that Pre-Effect
- **AND** it SHALL report the invalid authoring configuration to a GM-facing authoring path

#### Scenario: Dunkelheit applies a stationary darkness marker

- **WHEN** _Dunkelheit_ is successfully cast in its base form and another Token is inside its persistent Zone
- **THEN** that Token SHALL receive the marker-only passive ActiveEffect while it remains inside
- **AND** the caster SHALL not receive the marker
- **AND** the system SHALL not alter Foundry map lighting or Token vision

### Requirement: Passive Zone applications follow Region membership

The active GM SHALL use [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html) containment to reconcile each persistent passive Zone at creation, active-scene readiness, and token membership updates. It SHALL create a passive application for every current or newly entered target and remove the application when that target leaves.

#### Scenario: Initial occupant receives a passive application

- **WHEN** a persistent passive Region is created with a Token already inside it
- **THEN** the active GM SHALL create one passive ActiveEffect application for that Token
- **AND** it SHALL not create a duplicate entry application during Region initialization

#### Scenario: Leaving removes only the Zone application

- **WHEN** a Token leaves a persistent passive Region
- **THEN** the active GM SHALL remove only the ActiveEffects owned by that Region for that Token
- **AND** effects from another Region, spell, or manual source SHALL remain active

#### Scenario: Re-entry creates a fresh application

- **WHEN** a Token has left a persistent passive Region and later re-enters it
- **THEN** the active GM SHALL create one new passive application for that Token

#### Scenario: Scene readiness reconciles an existing passive Region

- **WHEN** the active Scene becomes ready with a persistent passive Region and a Token already inside it
- **THEN** the active GM SHALL create a missing passive application exactly once

### Requirement: Passive applications retain durable Zone ownership

Each passive ActiveEffect SHALL persist a passive-Zone marker, the source Region ID, the source Region application ID, target Token ID, spell UUID, and Pre-Effect index in its Ilaris flags. The system SHALL use all of those ownership fields when finding effects to remove.

#### Scenario: Separate Zones from one spell coexist

- **WHEN** the same spell creates two passive Regions affecting the same Actor
- **THEN** each Region SHALL create and retain its own ActiveEffect application
- **AND** removing one Region SHALL not remove the other Region's application

#### Scenario: Unlinked Token Actor retains Token-specific ownership

- **WHEN** a passive Region affects an unlinked Token Actor
- **THEN** the system SHALL resolve that Token Actor before any world Actor with the same Actor ID
- **AND** the created effect SHALL retain that Token ID in its flags

### Requirement: Passive Zone effect lifetime is controlled by the Region

Passive Zone ActiveEffects SHALL use Ilaris infinite timing and SHALL not expire through owner-turn timing. Region expiry or deletion SHALL remove all matching passive applications through documented [`Actor#deleteEmbeddedDocuments`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments) behavior.

#### Scenario: Effect remains while the Token remains inside

- **WHEN** a passive Zone remains active across one or more combatant turns and its target remains inside
- **THEN** its Zone-owned ActiveEffect SHALL remain active

#### Scenario: Expired or deleted Region cleans up effects

- **WHEN** a persistent passive Region expires or is deleted
- **THEN** the system SHALL remove every matching passive application owned by that Region
- **AND** it SHALL not remove any non-matching ActiveEffect

### Requirement: Passive Zone lifecycle is GM-authoritative and idempotent

Only the active GM SHALL create or delete passive Zone applications. Repeated Token updates, Scene readiness, or duplicate lifecycle events SHALL not create duplicate applications or cause an error when the matching effect is already absent.

#### Scenario: Repeated containment update does not duplicate an effect

- **WHEN** the same contained Token causes repeated membership updates without leaving the Region
- **THEN** the system SHALL retain exactly one passive application for the Region, Token, and Pre-Effect

#### Scenario: Non-GM client does not mutate passive effects

- **WHEN** a non-GM client receives a passive Zone lifecycle event
- **THEN** it SHALL not create or delete an ActiveEffect
