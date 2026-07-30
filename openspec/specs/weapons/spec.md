## Purpose

Weapon subsystem with processor-based Eigenschaft architecture, TP computation, parameterized property parsing, and migration tools.

## Requirements

### Requirement: Weapon base class with TP computation

The system SHALL provide `WaffeItem` as the base class for all weapon items, computing TP (Trefferpunkte), AT (Attacke), VT (Verteidigung), and FK (Fernkampf) values from weapon stats and Eigenschaft modifiers.

#### Scenario: TP computed from weapon stats

- **WHEN** a weapon item is prepared via `prepareWeapon()`
- **THEN** `_calculateWeaponStats()` SHALL compute AT, VT, FK, and damage values from the weapon's base stats and all applicable Eigenschaft modifiers

#### Scenario: Wielding penalties applied

- **WHEN** a weapon has a two-handed requirement (`Schwer (4)`) and the wielder's strength is insufficient
- **THEN** the wielding processor SHALL apply the configured penalty to AT and VT

### Requirement: Processor-based Eigenschaft system

The system SHALL use a processor architecture with five processor types to apply weapon property modifiers.

#### Scenario: Modifier processor applies numeric changes

- **WHEN** a weapon has an Eigenschaft with numeric modifiers (e.g., `+2 AT`, `-1 VT`)
- **THEN** the `ModifierProcessor` SHALL add/subtract the values to the weapon's computed stats

#### Scenario: Wielding processor enforces requirements

- **WHEN** a weapon has a wielding Eigenschaft (e.g., `Zweihändig`, `Schwer`)
- **THEN** the `WieldingProcessor` SHALL check the wielder's attributes and apply penalties if requirements are not met

#### Scenario: Target effect processor registers on-hit effects

- **WHEN** a weapon has an Eigenschaft that applies an effect on hit (e.g., `Brennend`)
- **THEN** the `TargetEffectProcessor` SHALL populate `computed.targetEffects` with the effect data

#### Scenario: Passive processor delegates to name checks

- **WHEN** a weapon has a passive Eigenschaft (e.g., `Wuchtig`)
- **THEN** the `PassiveProcessor` SHALL no-op; consumers check for these by Eigenschaft name elsewhere

#### Scenario: Actor modifier processor changes wielder stats

- **WHEN** a weapon has an Eigenschaft that modifies the wielder (e.g., `Paradewaffe`)
- **THEN** the `ActorModifierProcessor` SHALL populate `actorModifiers` for the actor sheet to apply

### Requirement: Eigenschaft cache

The system SHALL maintain a global cache of Eigenschaft items, preloaded on init and lazily loaded on demand.

#### Scenario: Cache preloaded on init

- **WHEN** the system initializes
- **THEN** all Eigenschaft items from configured compendium packs SHALL be loaded into the global cache

#### Scenario: Cache queried by name

- **WHEN** a weapon references an Eigenschaft by name (e.g., `"Schwer (4)"`)
- **THEN** the cache SHALL return the matching Eigenschaft item data including its category and parameters

### Requirement: Parameterized property parsing

The system SHALL parse Eigenschaft names with parameters using `eigenschaft-parser.js`.

#### Scenario: Name with single parameter parsed

- **WHEN** an Eigenschaft name is `"Schwer (4)"`
- **THEN** the parser SHALL return `{name: "Schwer", params: [4]}`

#### Scenario: Name without parameters parsed

- **WHEN** an Eigenschaft name is `"Wuchtig"`
- **THEN** the parser SHALL return `{name: "Wuchtig", params: []}`

### Requirement: Eigenschaft migration

The system SHALL provide migration tools to convert weapons from the legacy boolean Eigenschaft format to the new array-based format.

#### Scenario: Legacy boolean format detected

- **WHEN** a weapon has `system.eigenschaften.wuchtig: true` (old format)
- **THEN** the migration SHALL convert it to `system.eigenschaften: ["Wuchtig"]` (new format)

#### Scenario: Batch migration via console

- **WHEN** the GM runs the batch migration command
- **THEN** all weapons in the world SHALL be migrated from the legacy format to the array format

### Requirement: Weapon sheets

The system SHALL provide separate AppV2 sheets for Nahkampfwaffe, Fernkampfwaffe, and Waffeneigenschaft item types.

#### Scenario: Melee weapon sheet renders

- **WHEN** a Nahkampfwaffe item sheet is opened
- **THEN** it SHALL display AT, VT, TP, and melee-specific fields

#### Scenario: Ranged weapon sheet renders

- **WHEN** a Fernkampfwaffe item sheet is opened
- **THEN** it SHALL display FK, range, and ranged-specific fields in addition to base weapon fields

## Data Model

### WaffeItem (`WaffeItem`)

| Field                     | Type        | Description                                                             |
| ------------------------- | ----------- | ----------------------------------------------------------------------- |
| `system.tp.w6`            | NumberField | Number of d6 for damage                                                 |
| `system.tp.bonus`         | NumberField | Flat bonus to damage                                                    |
| `system.at`               | NumberField | Attacke value (can be modified by Eigenschaften)                        |
| `system.vt`               | NumberField | Verteidigung value                                                      |
| `system.fk`               | NumberField | Fernkampf value (ranged only)                                           |
| `system.eigenschaften`    | ArrayField  | Array of Eigenschaft name strings (new format)                          |
| `system.reichweite`       | StringField | Range category (ranged only)                                            |
| `computed.targetEffects`  | ArrayField  | Effects to apply on hit (populated by TargetEffectProcessor)            |
| `computed.actorModifiers` | Object      | Modifiers to apply to the wielder (populated by ActorModifierProcessor) |

### Eigenschaft Item

| Field                  | Type        | Description                                                                              |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `system.kategorie`     | StringField | Processor category: `modifier`, `wielding`, `target_effect`, `passive`, `actor_modifier` |
| `system.effekt`        | StringField | Effect description or formula                                                            |
| `system.modifikatoren` | Object      | Numeric modifiers for AT, VT, FK, TP                                                     |

## Cross-References

- [combat](../combat/spec.md) — Combat dialogs consume `computed.targetEffects` for on-hit effect application
- [actor-sheets](../actor-sheets/spec.md) — Actor sheets apply `actorModifiers` to wielder stats
- [item-sheets](../item-sheets/spec.md) — Item sheet base patterns shared with weapon sheets
