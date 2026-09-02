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

### Requirement: Charged source-Item effects can remove an exhausted summoned weapon

The system SHALL permit a transferable `ilarisArmedCombat` effect on a summoned
owned weapon to opt into `onExhaust: "deleteOwningItem"`. It SHALL allow that
terminal action only when the effect belongs to a summoned owned weapon. The
armed-attack resolver SHALL consume that effect only when the recipient uses
its owning Item for an eligible
attack. On final-charge exhaustion it SHALL delete that owned Item and its
linked owner-turn marker. It SHALL not infer disappearance from non-combat
Item use, nor consume the effect when another weapon is used.

#### Scenario: Eligible attack consumes Phexens Wurfstern

- **WHEN** a recipient uses a Phexens Wurfstern clone with a one-charge
  `deleteOwningItem` transferred effect for an eligible ranged attack
- **THEN** the charge SHALL be consumed regardless of whether that attack hits
  or is defended
- **AND** the clone and its linked marker SHALL be removed after the attack

#### Scenario: Different weapon does not consume the source-Item effect

- **WHEN** the recipient attacks with a different weapon while the Phexens
  Wurfstern clone exists
- **THEN** the Phexens Wurfstern effect, Item, and marker SHALL remain intact
