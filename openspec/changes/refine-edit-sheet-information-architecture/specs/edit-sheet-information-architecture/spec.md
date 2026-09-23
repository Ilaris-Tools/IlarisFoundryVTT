# edit-sheet-information-architecture Specification

## ADDED Requirements

### Requirement: Edit sheets organize authoring into four accordion areas

The [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)-based item edit sheets for `zauber`, `liturgie`, `anrufung`, and `manoever` SHALL organize the authoring UI into four areas: `Regeltext`, `Automatisierung`, `Strukturierte Zaubermodifikationen`, and `Erweitert`. Each area SHALL be a collapsible accordion; the sheet SHALL NOT use tab panels. All authoring controls SHALL remain reachable without navigating away from the sheet.

#### Scenario: Sheet shows all four areas

- **WHEN** a GM opens the edit sheet of a Zauber item
- **THEN** the sheet SHALL render the areas `Regeltext`, `Automatisierung`, `Strukturierte Zaubermodifikationen`, and `Erweitert`
- **AND** each area SHALL be collapsible via its header

#### Scenario: Maneuver sheet uses the same structure

- **WHEN** a GM opens the edit sheet of a Manöver item
- **THEN** it SHALL render the same four areas
- **AND** the `Regeltext` area SHALL contain maneuver authoring fields

### Requirement: Rule text stays separate from automation

The `Regeltext` area SHALL contain only the fachliche properties of the item (name, fertility, probe, preparation, target, range, duration, cost, mächtig, modifications, prerequisites, description). It SHALL NOT render automation configuration fields (pre-effects, zone, summon, resistance, armed combat).

#### Scenario: Automation fields are not in rule text

- **WHEN** a GM opens the edit sheet of a spell with zone automation
- **THEN** the zone controls SHALL appear in the `Automatisierung` area
- **AND** no zone or pre-effect control SHALL render inside the `Regeltext` area

### Requirement: Inactive automation features are not rendered

The edit sheet SHALL NOT render configuration fields for automation features that are inactive on the concrete item. An optional feature SHALL be added explicitly via an add-action; an enabled feature SHALL render its own visible block. Disabled features SHALL be absent from the UI rather than shown as disabled or empty sections.

#### Scenario: Spell without zone shows no zone fields

- **WHEN** a Zauber item has `system.zone` absent (or `null`)
- **THEN** the sheet SHALL render no zone fields inside `Automatisierung`
- **AND** it SHALL offer a `+ Zone hinzufügen` action instead

#### Scenario: Active feature renders its block

- **WHEN** a pre-effect has `avoidTest.enabled` true
- **THEN** the sheet SHALL render the Widerstandsprobe block with its test configuration
- **AND** that block SHALL be visible without activating anything first

### Requirement: Automation features are added consciously

The `Automatisierung` area SHALL offer `+ Automatisierung hinzufügen` actions that let the user choose which feature to add. The offered features SHALL be limited to the item type's capabilities. Adding a feature SHALL persist the corresponding entry via [Item#update](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) and SHALL render the new block immediately.

#### Scenario: User adds a resistance test

- **WHEN** a GM chooses `Widerstandsprobe` from the add-menu on a spell pre-effect
- **THEN** the item SHALL persist a pre-effect with `avoidTest.enabled` true
- **AND** the sheet SHALL render the Widerstandsprobe block

#### Scenario: Maneuver-only trigger is offered only for maneuvers

- **WHEN** a GM opens a Manöver item
- **THEN** the add-menu SHALL offer activation trigger options
- **AND** on a Zauber item the add-menu SHALL NOT offer maneuver activation triggers

### Requirement: Visibility is capability-driven

The system SHALL provide a capabilities module (`scripts/items/capabilities/pre-effect-capabilities.js`) that maps item types and editor contexts (`base` | `form`) to allowed pre-effect features. Sheets SHALL load the capability flags into the template context and SHALL gate rendering and add-menu options on them. The flags SHALL be derived from the item type, not from the data model.

#### Scenario: Capability module returns flags per type

- **WHEN** `getPreEffectCapabilities('manoever', 'base')` is called
- **THEN** it SHALL return `allowActivationTrigger: true` and the maneuver-appropriate feature set
- **AND** a Zauber lookup SHALL omit maneuver activation triggers

#### Scenario: Form pre-effects use form capabilities

- **WHEN** a structured spell-modification form renders its pre-effects
- **THEN** visibility SHALL be gated by `getPreEffectCapabilities(itemType, 'form')`
- **AND** form pre-effects SHALL not offer features excluded for the form context

### Requirement: Base and form editors share parametrised partials

The pre-effect editor and the zone editor SHALL be implemented as shared, path-prefix-parametrised Handlebars partials. The partials SHALL be used by the base editors (`system.preEffects[]`, `system.zone`) and by structured spell-modification forms (`system.spellModifications[i].preEffects[]`, `system.spellModifications[i].zone`). The sheet SHALL NOT contain a reduced duplicate inline copy of either editor.

#### Scenario: Form pre-effect uses the same partial as the base

- **WHEN** a form's pre-eﬀect with a `summonItem` is rendered
- **THEN** it SHALL render through the same partial as the base pre-effect editor
- **AND** its input names SHALL use the form-scoped path prefix (`system.spellModifications.<i>.preEffects.<j>.*`)

#### Scenario: Form zone uses the same partial as the base zone

- **WHEN** a spell-modification form overrides zone data
- **THEN** the zone controls SHALL render through the shared partial
- **AND** its input names SHALL use the form-scoped zone path (`system.spellModifications.<i>.zone.*`)

### Requirement: Accordion headers show derived summaries

Every accordion for an active automation block (zone, pre-effect or effect baustein) SHALL show a compact German summary in its header (for example `Kegel · 8 Schritt · beim Zaubernden`, `4W6 Feuer · Mächtig +2W6`). Summaries SHALL be derived from the persisted data by pure functions and SHALL NOT be stored. Missing values SHALL be rendered with a safe fallback.

#### Scenario: Zone summary reflects shape and anchor

- **WHEN** a spell has a cone zone with distance 8 and anchor `caster`
- **THEN** the zone card header SHALL contain `Kegel · 8 · beim Zaubernden`

#### Scenario: Summary updates after configuration change

- **WHEN** a GM changes the damage value of an effect baustein
- **THEN** the header summary SHALL reflect the new value after re-render
- **AND** no summary-specific data field SHALL be persisted

### Requirement: Zone acts as a single-instance card inside Automatisierung

The base zone (`system.zone`) SHALL render as one dedicated card inside the `Automatisierung` area for supernatural items. The card SHALL use the same visual style as pre-effect cards but SHALL keep its separate data path. `+ Zone hinzufügen` SHALL create the zone profile; `Zonenprofil entfernen` SHALL reset `system.zone` to `null`.

#### Scenario: Zone card is created and removed

- **WHEN** a GM clicks `+ Zone hinzufügen` on a spell without a zone
- **THEN** the item SHALL persist a default zone profile in `system.zone`
- **AND** the sheet SHALL render the card
- **AND** after `Zonenprofil entfernen` the sheet SHALL no longer render the card

#### Scenario: Form zone overrides stay per-form

- **WHEN** a spell-modification form has its own zone override
- **THEN** it SHALL remain part of that form's accordion
- **AND** it SHALL NOT be moved into the base zone card

### Requirement: Effect authoring uses fachliche Bausteine with per-baustein raw fields

The pre-effect authoring UI SHALL offer fachliche Bausteine (Schaden, Zustand, Ilaris-Modifikator, Marker, Beschwörung, Bewaffneter Kampfeffekt, Widerstandsprobe) as the default interface. Each baustein SHALL expose its raw fields (for example `type`, `key`, `priority`, diminished values, derived-amount inputs) behind an `Erweitert` fold-out that SHALL be closed by default. `Benutzerdefinierte Änderung` SHALL remain available as a raw escape hatch.

#### Scenario: Damage baustein shows raw change fields on demand

- **WHEN** a GM expands `Erweitert` on a Schaden baustein
- **THEN** the change's `type`, `key`, `priority`, and diminished-value inputs SHALL become visible
- **AND** they SHALL be hidden again when the fold-out is closed

#### Scenario: Custom change remains authorable

- **WHEN** a GM chooses `Benutzerdefinierte Änderung`
- **THEN** the raw key/type/value editor SHALL be available
- **AND** its persisted data SHALL match the existing `changes[]` structure

### Requirement: Sheet-level Erweitert is reduced to a minimal set

The `Erweitert` area SHALL contain only technical leftovers that do not belong to a specific baustein (for example technical identifiers and internal properties). Raw change/marker/input fields SHALL live in the fold-outs of their baustein, not in the sheet-level area.

#### Scenario: Raw fields are not duplicated at sheet level

- **WHEN** a GM opens `Erweitert` on the sheet
- **THEN** it SHALL not contain the raw change editor of an active pre-effect
- **AND** the raw field of a selected baustein SHALL be reachable in that baustein's fold-out

### Requirement: Persisted data paths remain unchanged

The refactored UI SHALL keep identical data paths and control names for all persisted fields. The shared form-submit normalization of `PreEffectItemSheet` (`system.preEffects`, nested arrays, spell-modification preEffects) SHALL remain the only persistence path.

#### Scenario: Existing pre-effect data survives re-render

- **WHEN** a pre-existing item with a configured `summonCreature` pre-effect is saved after the refactor
- **THEN** `system.preEffects` SHALL retain the same structure
- **AND** `summonCreature.overrides` SHALL remain an array

### Requirement: Complex concepts receive explanatory tooltips

Automation concepts that are not self-evident (Widerstandsprobe, Bewegungswiderstand, Erweiterte Eingaben) SHALL carry an info button or tooltip that explains purpose, usage, activation effect, and a short example. Labels SHALL remain understandable without the tooltip.

#### Scenario: Resistance test has an explanatory tooltip

- **WHEN** the Widerstandsprobe block is rendered
- **THEN** it SHALL offer an info element whose tooltip explains that targets may avoid part of the effect and gives a short example
- **AND** the block label SHALL already convey the concept without the tooltip
