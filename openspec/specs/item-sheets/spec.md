## Purpose

Item sheets for all 22 item types with AppV2 architecture, TypeDataModel registration, and effects manager mixin.

## Requirements

### Requirement: Item sheet base class

The system SHALL provide item sheets (AppV2 via `HandlebarsApplicationMixin(ItemSheetV2)`) for all 22 item types, using TypeDataModel with `static defineSchema()` for data definitions.

#### Scenario: Item sheet renders with type-specific template

- **WHEN** an item sheet of any type is opened
- **THEN** it SHALL render using the Handlebars template registered for that item type

### Requirement: Item type registration

The system SHALL register all 22 item types in `scripts/core/model-data/type-data-models.js` with their corresponding TypeDataModel classes and sheet classes.

#### Scenario: TypeDataModel registered for all types

- **WHEN** the system initializes
- **THEN** all 22 item types SHALL have a registered TypeDataModel class

#### Scenario: Sheet class registered for all types

- **WHEN** the system initializes
- **THEN** all 22 item types SHALL have a registered sheet class (AppV2)

### Requirement: Item type categories

The system SHALL organize 22 item types into five groups:

- **Group A (Weapons)**: Nahkampfwaffe, Fernkampfwaffe, Angriff, Waffeneigenschaft
- **Group B (Skills)**: Fertigkeit, ÜbernatürlicheFertigkeit, Talent, FreieFertigkeit, FreiesTalent
- **Group C (Supernatural)**: Zauber, Liturgie, Anrufung
- **Group D (Equipment)**: Rüstung, Gegenstand
- **Group E (Meta)**: Vorteil, Manöver, Eigenheit, Eigenschaft, Info, AbgeleiteterWert, EffectItem

#### Scenario: Weapon items are in Group A

- **WHEN** a Nahkampfwaffe or Fernkampfwaffe or Angriff or Waffeneigenschaft item is created
- **THEN** it SHALL use the weapon category data models and sheets

#### Scenario: Skill items are in Group B

- **WHEN** a Fertigkeit or ÜbernatürlicheFertigkeit or Talent or FreieFertigkeit or FreiesTalent item is created
- **THEN** it SHALL use the skill category data models and sheets

### Requirement: Effects manager mixin

The system SHALL provide an `effects-manager.js` mixin for item sheets to create, edit, delete, and toggle ActiveEffects directly on items.

#### Scenario: Effects section renders on item sheets

- **WHEN** an item sheet with the effects manager mixin is opened
- **THEN** the effects section SHALL render using `effects-section.hbs` template

#### Scenario: Effect can be toggled from item sheet

- **WHEN** a user toggles an effect on an item sheet
- **THEN** the effect SHALL be enabled/disabled on the parent actor

## Data Model

Item data models are defined per type in `scripts/items/data/`. Shared templates (e.g., `waffe`, `fertigkeit`, `gegenstand`) are used across related types.

Key shared templates:

| Template     | Used By                                   | Key Fields                                     |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| `waffe`      | Nahkampfwaffe, Fernkampfwaffe, Angriff    | `tp`, `at`, `vt`, `fk`, `eigenschaften`        |
| `fertigkeit` | Fertigkeit, FreieFertigkeit, FreiesTalent | `probe` (attribute check), `wert`, `kategorie` |
| `gegenstand` | Gegenstand, Rüstung                       | `preis`, `gewicht`, `menge`                    |

## Cross-References

- [weapons](../weapons/spec.md) — Weapon sheets extend the item sheet base
- [actor-sheets](../actor-sheets/spec.md) — Actor sheets embed item sheets in inventory/ability tabs
- [active-effects](../active-effects/spec.md) — Effects manager interacts with IlarisActiveEffect
- [importer](../importer/spec.md) — XML importer creates items using these data models
