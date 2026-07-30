## MODIFIED Requirements

### Requirement: Buff spells have duration-based pre-effects

Simple buff spells (single stat modifier, Einzelperson target, non-instant duration) SHALL include pre-effect configurations that create ActiveEffects with Ilaris turn timing. Rule-aware bonuses SHALL use semantic `ilarisModifiers` where a raw actor path cannot express their scope or their non-stacking behavior; classical Foundry changes remain available for ordinary path changes.

During the first iteration, every spell listed in `docs/develop/spell-liturgy-effect-inventory.md` that has an affected effect configuration SHALL be migrated in its `_source/` data to the appropriate native change or semantic Ilaris modifier representation.

#### Scenario: Axxeleratus creates rule-aware GS, AT, and VT modifiers

- **WHEN** a GM casts Axxeleratus and the spell succeeds
- **THEN** it SHALL create an ActiveEffect with `durationType: "ownerTurns"`
- **AND** its GS bonus (+4) and its AT (+2) and VT (+2) bonuses SHALL be
  represented as Ilaris modifiers with übernatürlicher strongest-effect
  stacking semantics
- **AND** the AT and VT bonuses SHALL retain a general combat scope rather
  than being stored as duplicate `system.modifikatoren` path changes

#### Scenario: Gardianum creates MR ActiveEffect

- **WHEN** a GM casts Gardianum and the spell succeeds
- **THEN** an ActiveEffect targeting `system.abgeleitete.mr` SHALL be created

#### Scenario: Buff spells with minutes duration map to turns

- **WHEN** a buff spell has `wirkungsdauer: "4 Minuten"`
- **THEN** the pre-effect `baseDuration` SHALL be `4`

#### Scenario: Complete first-iteration inventory is migrated

- **WHEN** the first implementation iteration is prepared for packing
- **THEN** every spell listed in `docs/develop/spell-liturgy-effect-inventory.md` with an
  affected effect configuration SHALL have its corresponding `_source/` entry
  migrated to the selected representation

#### Known key path mappings

| Concept              | Representation                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| AT (Angriff)         | Ilaris roll modifier targeting AT                                                  |
| VT (Verteidigung)    | Ilaris roll modifier targeting VT                                                  |
| GS (Geschwindigkeit) | Ilaris prepare modifier targeting GS                                               |
| MR (Magieresistenz)  | `system.abgeleitete.mr`                                                            |
| INI (Initiative)     | `system.abgeleitete.ini`                                                           |
| RS (Rüstungsschutz)  | ❌ Derived from armor, no direct field                                             |
| Elemental resist     | ❌ No resistance field exists                                                      |
| Attribut bonus       | Ilaris roll modifier matched to the tested attribute; never changes derived values |
