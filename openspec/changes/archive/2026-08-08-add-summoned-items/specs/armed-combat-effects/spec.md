## MODIFIED Requirements

### Requirement: Charged armed effects resolve only their configured attack scope

Melee and ranged combat SHALL snapshot matching armed effects before the attack
roll and resolve only that snapshot. An effect transferred from an owned Item
and configured for source-Item-only matching SHALL be included only when that
same owned Item is used for the attack. Ordinary actor-level armed effects
retain their existing scope behavior.

#### Scenario: Transferred source-Item effect ignores another weapon

- **WHEN** an Actor has a charged transferred effect from a summoned ranged
  weapon and attacks with another ranged weapon
- **THEN** the transferred effect SHALL not be included in the snapshot
- **AND** its charge SHALL remain unchanged

### Requirement: Charged armed effects consume on attack resolution

Matching charged armed effects SHALL expend one charge after every matching
attack resolution, including misses and successful defenses. Attack-derived
damage SHALL be added only for a confirmed hit. An effect configured with
`onExhaust: "deleteOwningItem"` SHALL delete its owning summoned Item and its
linked owner-turn marker when its final charge is expended.

#### Scenario: Final charge removes the owning summon

- **WHEN** a one-charge transferred `deleteOwningItem` effect is consumed by
  its owning summoned weapon's eligible attack
- **THEN** the system SHALL remove the owned Item and its linked marker
- **AND** it SHALL not remove another summoned Item or marker
