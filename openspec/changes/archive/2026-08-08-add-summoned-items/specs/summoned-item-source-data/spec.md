## ADDED Requirements

### Requirement: Audited summoned Item sources are manually authored before implementation

Before the first implementation slice begins, contributors SHALL manually
create and review canonical source Items for Phexens Wurfstern and Armalion.
The remaining audited sources are subsequent content work. The system SHALL
NOT infer any source's statistics, Item types, effects, or disappearance rules
from spell text.

#### Scenario: Apply remains blocked until sources are reviewed

- **WHEN** Phexens Wurfstern or Armalion has not been manually created and reviewed
- **THEN** contributors SHALL NOT begin `/opsx:apply` for this change

### Requirement: Reviewed supernatural sources configure summon-item pre-effects

After manual source authoring, each reviewed spell or liturgy SHALL reference
its canonical source Item by UUID in a `summonItem` pre-effect. The source
reference SHALL declare the matching `sourceKind`, be available from that
world-configured weapon or Gegenstände compendium catalog, and use owner-turn
durations only.

#### Scenario: Phexens Sternenwurf references its reviewed source Item

- **WHEN** Phexens Sternenwurf is reviewed after its canonical Item exists
- **THEN** its pre-effect SHALL reference Phexens Wurfstern
- **AND** its duration SHALL be 64 owner turns
- **AND** its canonical source Item SHALL define the manually reviewed
  transferable charged effect that removes that clone after its eligible
  attack is resolved

#### Scenario: Armalion references its reviewed source Item

- **WHEN** Segen der Heiligen Ardare is reviewed after its canonical Item exists
- **THEN** its pre-effect SHALL reference Armalion
- **AND** its duration SHALL be 16 owner turns

### Requirement: Source Item overrides model reviewed Mächtige Magie values

The system SHALL materialize reviewed spell-specific Mächtige-Magie Item
overrides on the summoned clone. Where a reviewed summoned Item receives such
a bonus, its pre-effect SHALL configure an Item-data override that is materialized on
the clone. The value SHALL remain scoped to that clone and SHALL disappear
with it.

#### Scenario: Phexens Wurfstern adds W20 damage per quality stage

- **WHEN** Phexens Sternenwurf succeeds with Mächtige Magie quality stages
- **THEN** the created Phexens Wurfstern clone SHALL receive `+1W20` TP for each configured quality stage
- **AND** unrelated weapons on the recipient SHALL remain unchanged
