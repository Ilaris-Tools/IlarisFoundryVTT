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

#### Scenario: Axxeleratus creates GS and modifier ActiveEffects

- **WHEN** a GM casts Axxeleratus and the spell succeeds
- **THEN** ActiveEffects targeting `system.abgeleitete.gs` (+4), `system.modifikatoren.nahkampfmod` (+2), and `system.modifikatoren.verteidigungmod` (+2) SHALL be created with `durationType: "ownerTurns"`

#### Scenario: Gardianum creates MR ActiveEffect

- **WHEN** a GM casts Gardianum and the spell succeeds
- **THEN** an ActiveEffect targeting `system.abgeleitete.mr` SHALL be created

#### Scenario: Buff spells with minutes duration map to turns

- **WHEN** a buff spell has `wirkungsdauer: "4 Minuten"`
- **THEN** the pre-effect `baseDuration` SHALL be `4`

#### Known key path mappings

| Concept              | Key path                               |
| -------------------- | -------------------------------------- |
| AT (Angriff)         | `system.modifikatoren.nahkampfmod`     |
| VT (Verteidigung)    | `system.modifikatoren.verteidigungmod` |
| GS (Geschwindigkeit) | `system.abgeleitete.gs`                |
| MR (Magieresistenz)  | `system.abgeleitete.mr`                |
| INI (Initiative)     | `system.abgeleitete.ini`               |
| RS (Rüstungsschutz)  | ❌ Derived from armor, no direct field |
| Elemental resist     | ❌ No resistance field exists          |
| Attribut bonus       | ❌ Multiple sub-fields per attribute   |

### Requirement: Debuff spells have duration-based pre-effects

Simple debuff spells (single-target, non-instant duration, stat penalty or condition) SHALL include pre-effect configurations that create ActiveEffects with Ilaris turn timing. Avoid/resist tests are deferred — they depend on whether the spell text describes the effect as avoidable, not on `system.schwierigkeit`.

#### Scenario: Blitz dich find applies -2 debuff

- **WHEN** a GM casts Blitz dich find and the spell succeeds
- **THEN** an ActiveEffect with the geblendet/reduced-probe debuff SHALL be created on the target with `durationType: "ownerTurns"`

#### Scenario: Debuff duration uses Initiativephasen

- **WHEN** a debuff spell has `wirkungsdauer: "4 Initiativphasen"`
- **THEN** the pre-effect `baseDuration` SHALL be `4`
