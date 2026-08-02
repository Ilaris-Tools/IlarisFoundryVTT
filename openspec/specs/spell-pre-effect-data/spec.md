## Purpose

Pre-effect configurations authored on spells in the `zauberspruche-und-rituale` / `zauberspruche-und-rituale`-style compendia: instant damage, instant healing, and duration-based buffs/debuffs applied on successful casts.

## Requirements

### Requirement: Damage spells have instant pre-effects

Direct damage spells (elemental rays, single-target projectiles) in the `zauberspruche-und-rituale` compendium SHALL include pre-effect configurations that apply instant damage to the target's wounds.

#### Scenario: Ignifaxius applies 4W6 fire damage

- **WHEN** a GM casts Ignifaxius and the spell succeeds
- **THEN** the target SHALL receive `4W6` instant damage to `system.gesundheit.wunden` via `_applyDamageDirectly` with `damageType: FEUER`

#### Scenario: Mächtige Magie amplifies damage

- **WHEN** Ignifaxius is cast with Mächtige Magie QS 2
- **THEN** the damage formula SHALL evaluate `4W6+2W6+2W6` (base + maechtigBonus × QS)

#### Scenario: All \*faxius spells share the same pre-effect structure

- **WHEN** any \*faxius spell (Ignifaxius, Frigifaxius, Aquafaxius, Humofaxius, Archofaxius, Orcanofaxius) is examined
- **THEN** each SHALL have `preEffects[0].instant: true`, `changes[0].key: "system.gesundheit.wunden"`, `changes[0].amplifiedByMaechtigeMagie: true`, and `damageType` matching the spell's element

### Requirement: Heal spells have instant pre-effects

Heal spells in the compendium SHALL include pre-effect configurations that heal wounds using `damageType: "HEALING_WOUND"` with positive healing values.

#### Scenario: Balsam heals 2W6+4 wounds

- **WHEN** a GM casts Balsam and the spell succeeds
- **THEN** the target SHALL receive `2W6+4` healing via `_applyDamageDirectly` with `damageType: "HEALING_WOUND"`, which reduces wounds by WS thresholds
- **AND** the pre-effect change SHALL have `value: "2W6+4"` (positive, not negative)

#### Scenario: Mächtige Magie amplifies healing

- **WHEN** Balsam is cast with Mächtige Magie QS 1
- **THEN** the heal formula SHALL evaluate `2W6+4+4` (base + maechtigBonus × QS)

#### Scenario: All healing spells use HEALING_WOUND

- **WHEN** any healing spell (Balsam, Geistheilung, Hexenspeichel, Lach dich gesund, Tiere besprechen) is examined
- **THEN** each SHALL have `damageType: "HEALING_WOUND"` with a positive value formula

#### Scenario: Healing values are positive

- **WHEN** any healing spell pre-effect is examined
- **THEN** the `value` field SHALL be a positive formula (e.g., `"2W6+4"` not `"-2W6-4"`)

### Requirement: Buff spells have duration-based pre-effects

Simple buff spells (single stat modifier, Einzelperson target, non-instant duration) SHALL include pre-effect configurations that create ActiveEffects with Ilaris turn timing. Many buff spells require careful key path mapping — some effects map to derived/computed values not directly addressable as data model fields.

Rule-aware bonuses SHALL use semantic `ilarisModifiers` where a raw actor path
cannot express their scope or their non-stacking behavior; classical Foundry
changes remain available for ordinary path changes. During the first iteration,
every spell listed in `docs/develop/spell-liturgy-effect-inventory.md` that has
an affected effect configuration SHALL be migrated in its `_source/` data to
the appropriate native change or semantic Ilaris modifier representation.

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

### Requirement: Debuff spells have duration-based pre-effects

Simple debuff spells (single-target, non-instant duration, stat penalty or condition) SHALL include pre-effect configurations that create ActiveEffects with Ilaris turn timing. Avoid/resist tests are deferred — they depend on whether the spell text describes the effect as avoidable, not on `system.schwierigkeit`.

#### Scenario: Blitz dich find applies -2 debuff

- **WHEN** a GM casts Blitz dich find and the spell succeeds
- **THEN** an ActiveEffect with the geblendet/reduced-probe debuff SHALL be created on the target with `durationType: "ownerTurns"`

#### Scenario: Debuff duration uses Initiativephasen

- **WHEN** a debuff spell has `wirkungsdauer: "4 Initiativphasen"`
- **THEN** the pre-effect `baseDuration` SHALL be `4`
