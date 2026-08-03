## ADDED Requirements

### Requirement: Successful casts can summon a configured Item for every target

The system SHALL create an independent Actor-owned Item for each selected
target of a successful `summonItem` pre-effect. It SHALL create the Item with
[Actor#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#createEmbeddedDocuments)
from the configured compendium source's
[Item#toObject](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html#toObject)
data and SHALL retain the source Item's embedded transferable effects.

#### Scenario: Each selected target receives an independent clone

- **WHEN** a successful summon-item pre-effect has two selected targets
- **THEN** each target SHALL receive one distinct owned Item with a distinct Item ID and application ID
- **AND** deleting or expiring one target's Item SHALL NOT alter the other target's Item

#### Scenario: Source Item effects transfer with the clone

- **WHEN** the configured source Item has transferable ActiveEffects
- **THEN** the created owned Item SHALL retain those effects
- **AND** the recipient's [Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects) SHALL include the transferred effects while the clone exists

### Requirement: Summoned clones retain provenance and expire independently

Every summon SHALL create a linked owner-turn marker ActiveEffect on the
recipient. The clone and marker SHALL store a common Ilaris application ID,
the source Item UUID, spell UUID, and pre-effect index. On marker expiry, the
system SHALL call
[Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments)
for only the linked clone before deleting the marker.

#### Scenario: Owner-turn expiry removes only its linked Item

- **WHEN** two copies from the same source exist on one Actor with different owner-turn durations
- **THEN** expiry of the first marker SHALL delete only its linked Item
- **AND** the second Item and marker SHALL remain active

#### Scenario: Missing linked Item does not block marker expiry

- **WHEN** a player manually deletes a summoned Item before its marker expires
- **THEN** marker expiry SHALL complete without an error
- **AND** it SHALL delete the marker without deleting another Item

### Requirement: Summoned weapons are equipped as main weapons

The system SHALL equip every summoned `nahkampfwaffe` and `fernkampfwaffe` as
its recipient's main weapon. It SHALL set the clone's `system.hauptwaffe` to
`true` and SHALL clear that flag on the
recipient's previously selected weapon of the same type. Expiry SHALL remove
the clone but SHALL NOT restore the previous selection.

#### Scenario: Summoned weapon is available in hand

- **WHEN** a target receives a summoned weapon
- **THEN** the weapon SHALL appear in that target's inventory
- **AND** it SHALL be selected as Hauptwaffe for its weapon type

### Requirement: Summoned copies ignore supernatural effect replacement

The system SHALL create a new summoned Item and marker for every successful
summon-item cast in both `ilaris` and `foundry` supernatural stacking modes.
It SHALL NOT replace a previously created summon merely because the spell UUID
or source Item UUID matches.

#### Scenario: Recasts create multiple copies in Ilaris mode

- **WHEN** a target receives the same summon twice while the world uses Ilaris stacking mode
- **THEN** the target SHALL have two independently tracked cloned Items

#### Scenario: Recasts create multiple copies in Foundry mode

- **WHEN** a target receives the same summon twice while the world uses Foundry stacking mode
- **THEN** the target SHALL have two independently tracked cloned Items

### Requirement: One-use expiry awaits an item-aware post-roll prerequisite

The summon-item capability SHALL support owner-turn expiry only. A source Item
that must disappear after an attack roll SHALL be configured only after a
separate, generic item-aware after-roll expiry capability is available.

#### Scenario: One-use source remains pending without the prerequisite

- **WHEN** a summoned Item is marked by its rules as disappearing after use
- **THEN** this change SHALL NOT infer removal from a combat roll
- **AND** the Item SHALL continue to use its owner-turn marker until the separate post-roll capability is delivered
