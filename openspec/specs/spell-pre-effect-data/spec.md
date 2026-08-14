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

Simple buff spells and liturgies (single target, fully representable numeric modifier, non-instant duration) SHALL include pre-effect configurations that create ActiveEffects using Ilaris owner-turn timing. Durations stated in minutes, hours, or days SHALL be converted at one minute = 16 Initiativephasen. Many buff spells require careful key path mapping — some effects map to derived/computed values not directly addressable as data model fields.

Rule-aware bonuses SHALL use semantic `ilarisModifiers` where a raw actor path
cannot express their scope or their non-stacking behavior; classical Foundry
changes remain available for ordinary path changes. During the reviewed duration-aware iteration, every source Item named in the selected-coverage scenario SHALL be migrated in its `_source/` data to the appropriate native change or semantic Ilaris modifier representation.

#### Scenario: Axxeleratus creates rule-aware GS, AT, and VT modifiers

- **WHEN** a GM casts Axxeleratus and the spell succeeds
- **THEN** it SHALL create an ActiveEffect with `durationType: "ownerTurns"`
- **AND** its GS bonus (+4) and its AT (+2) and VT (+2) bonuses SHALL be
  represented as Ilaris modifiers with übernatürlicher strongest-effect
  stacking semantics
- **AND** the AT and VT bonuses SHALL retain a general combat scope rather
  than being stored as duplicate `system.modifikatoren` path changes

#### Scenario: Psychostabilis creates an owner-turn semantic MR ActiveEffect

- **WHEN** a GM casts Psychostabilis and the spell succeeds
- **THEN** an ActiveEffect with `baseDuration: 960` SHALL be created
- **AND** it SHALL contain a prepare-phase `mr` Ilaris modifier with
  übernatürlicher strongest-effect stacking semantics
- **AND** it SHALL not contain a native `system.abgeleitete.mr` change
- **AND** the effect SHALL use `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: Buff spells with minutes duration use Initiativephasen

- **WHEN** a reviewed buff spell has `wirkungsdauer: "4 Minuten"`
- **THEN** its pre-effect SHALL use `baseDuration: 64`

#### Scenario: Selected converted-duration source Items are migrated

- **WHEN** the duration-aware iteration is prepared for packing
- **THEN** `Tanz der Schwerter`, `Adlerauge Luchsenohr`, `Adlerauge Luchsenohr (Tiergeist)`, `Innere Ruhe`, `Mondsilberzunge`, `Rahjas Wohlgefallen`, `Psychostabilis`, `Psychostabilis (Tiergeist)`, and `Tanz des Ungehorsams` SHALL each have the reviewed `_source/` pre-effect representation

#### Known key path mappings

| Concept              | Representation                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| AT (Angriff)         | Ilaris roll modifier targeting AT                                                  |
| VT (Verteidigung)    | Ilaris roll modifier targeting VT                                                  |
| GS (Geschwindigkeit) | Ilaris prepare modifier targeting GS                                               |
| MR (Magieresistenz)  | Ilaris prepare modifier targeting MR                                               |
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

### Requirement: Reviewed resistance-outcome spell source data

The reviewed spell source Items SHALL use explicit resistance outcome payloads
when their rules assign distinct persistent results to success and failure.
Their marker and modifier effects SHALL preserve the source spell provenance
required by the `supernatural-pre-effects` capability.

#### Scenario: Fluch des Gewürms has distinct resistance outcomes

- **WHEN** _Fluch des Gewürms_ is examined in compendium `_source/`
- **THEN** it SHALL define a Willenskraft 16 resistance Pre-Effect with a
  failure marker labelled `Handlungsunfähig` and a success payload applying a
  global `-4` Ilaris modifier for 16 Initiativephasen

#### Scenario: Krabbelnder Schrecken has distinct resistance outcomes

- **WHEN** _Krabbelnder Schrecken_ is examined in compendium `_source/`
- **THEN** it SHALL define the same reviewed Willenskraft 16 failure-marker
  and success-`-4` outcome pattern for 16 Initiativephasen

#### Scenario: Hexengalle uses a marker instead of a numeric placeholder

- **WHEN** _Hexengalle_ is examined in compendium `_source/`
- **THEN** its failed Zähigkeit 16 resistance result SHALL use a timed,
  spell-traceable `Handlungsunfähig` marker for two Initiativephasen
- **AND** it SHALL not use an unrelated zero-valued modifier merely to create
  an effect document

### Requirement: Reviewed spells author structured forms

The source compendium SHALL author forms for Attributo, Tlalucs Odem Pestgestank, Fortifex arkane Wand, and generic anti-magic talents. Attributo SHALL require exactly one attribute and apply roll-only modifiers without changing raw attributes/derived values. Miasmafaxius SHALL inherit Pestgestank's outcome while overriding its profile. Schimmernder Schild SHALL replace Fortifex's outcome. Every generic anti-magic talent SHALL require exactly one of Gegenzauber, Magie unterdruecken, Zauber aufheben, and Wesenheit bannen.

#### Scenario: Attributo is roll-only

- **WHEN** the FF Attributo form succeeds
- **THEN** it SHALL create +2 FF attribute-test and +1 FF-selected skill-test semantic modifiers
- **AND** it SHALL not change `system.attribute.FF.wert` or a derived value

#### Scenario: Anti-magic outcome is transparently player-managed

- **WHEN** a generic anti-magic form succeeds
- **THEN** cast output SHALL identify the selected form and its configured profile
- **AND** no misleading automatic reaction, zone, target-effect, or entity outcome SHALL be created
