## Purpose

Actor sheets (Held, Kreatur, NSC) with AppV2 architecture and TypeDataModel-backed data models.

## Requirements

### Requirement: Held (Hero) sheet

The system SHALL provide a Held actor sheet (AppV2 via `HandlebarsApplicationMixin(ActorSheetV2)`) with tabs for attributes, skills, combat, inventory, talents, supernatural abilities, effects, notes, and biography.

#### Scenario: Sheet renders with all tabs

- **WHEN** a Held actor sheet is opened
- **THEN** all configured tabs SHALL render with their respective Handlebars templates and data

#### Scenario: Attribute changes update derived values

- **WHEN** a base attribute (e.g., Körperkraft) is modified
- **THEN** derived values (e.g., attack, defense, HP) SHALL be recalculated

#### Scenario: WS change triggers HP recalculation

- **WHEN** Willenskraft (WS) is modified
- **THEN** the actor's HP total SHALL be recalculated

### Requirement: Kreatur (Creature) sheet

The system SHALL provide a Kreatur actor sheet (AppV2) with creature-specific fields and a simplified tab structure compared to Held.

#### Scenario: Creature sheet renders creature-specific data

- **WHEN** a Kreatur actor sheet is opened
- **THEN** it SHALL display creature-specific fields such as size category, type, and simplified stats

### Requirement: NSC (NPC) sheet

The system SHALL provide an NSC actor sheet (AppV2) for non-player characters with a simplified view.

#### Scenario: NPC sheet renders with NPC context

- **WHEN** an NSC actor sheet is opened
- **THEN** it SHALL display appropriate NPC fields and tabs

### Requirement: Actor data models

Each actor type SHALL have a TypeDataModel registered in `scripts/core/model-data/type-data-models.js` with `static defineSchema()` defining all data fields.

#### Scenario: Held data model defines attributes

- **WHEN** a Held actor is created
- **THEN** its data model SHALL include `system.attribute` (8 base attributes), `system.abgeleitete` (derived values), `system.gesundheit` (health), and `system.energie` (energy pools)

#### Scenario: Kreatur data model extends shared template

- **WHEN** a Kreatur actor is created
- **THEN** its data model SHALL share common templates (gesundheit, energie) with Held but with creature-specific fields

## Data Model

### Held/NSC Actor (`held`, `nsc` types)

| Field                               | Type        | Description                              |
| ----------------------------------- | ----------- | ---------------------------------------- |
| `system.attribute.mut`              | NumberField | Mut (Courage)                            |
| `system.attribute.klugheit`         | NumberField | Klugheit (Intelligence)                  |
| `system.attribute.intuition`        | NumberField | Intuition                                |
| `system.attribute.charisma`         | NumberField | Charisma                                 |
| `system.attribute.fingerfertigkeit` | NumberField | Fingerfertigkeit (Dexterity)             |
| `system.attribute.gewandtheit`      | NumberField | Gewandtheit (Agility)                    |
| `system.attribute.konstitution`     | NumberField | Konstitution (Constitution)              |
| `system.attribute.koerperkraft`     | NumberField | Körperkraft (Strength)                   |
| `system.abgeleitete.*`              | Various     | Derived combat values (AT, VT, FK, etc.) |
| `system.gesundheit.wunden`          | NumberField | Current wounds                           |
| `system.gesundheit.erschoepfungen`  | NumberField | Current exhaustion                       |
| `system.gesundheit.leP`             | NumberField | Current life points                      |
| `system.energie.astralenergie`      | NumberField | Current astral energy                    |
| `system.energie.karmaenergie`       | NumberField | Current karma energy                     |

### Kreatur Actor (`kreatur` type)

Inherits `gesundheit` and `energie` templates from Held, adds creature-specific fields for type, size, and simplified combat stats.

## Cross-References

- [active-effects](../active-effects/spec.md) — Effects applied to actors, attribute key autocomplete
- [weapons](../weapons/spec.md) — `actorModifiers` applied to wielder stats
- [item-sheets](../item-sheets/spec.md) — Item sheets embedded in actor sheet inventory tabs

### Requirement: Held effect rows display remaining duration and armed charges

The Held Effekte tab SHALL display the authoritative remaining duration and, for armed effects, `Ladungen: <remaining>`. Owner-turn effects use `system.ilarisTiming.remaining`; other timed effects use the prepared native duration.
