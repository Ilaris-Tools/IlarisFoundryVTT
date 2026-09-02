# structured-spell-modifications Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Supernatural Items persist structured spell modifications

Zauber, Liturgien, and Anrufungen SHALL support `system.spellModifications` and `system.spellModificationGroups`. A modification SHALL have a stable id, German display name/description, optional group id, profile overrides, optional `effectMode`, and a pre-effect array. A group SHALL define its id, label, and whether exactly one member is required. Missing data SHALL retain current Item behavior.

#### Scenario: Existing source remains valid

- **WHEN** a supernatural Item has no structured form data
- **THEN** it SHALL retain its current cast behavior and legacy text-modification fallback

#### Scenario: Form data persists

- **WHEN** a GM saves a form with id `miasmafaxius`
- **THEN** reopening the [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) SHALL retain its id, profile, group, and pre-effects

### Requirement: Structured forms are selected independently of maneuvers

The [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html) supernatural dialog SHALL render structured forms in a dedicated Zaubermodifikationen section. Ungrouped forms SHALL be independently optional; group members SHALL be mutually exclusive; a required group SHALL contain exactly one choice before casting. Choices SHALL be dialog-local and SHALL NOT update the source Item.

#### Scenario: Anti-magic permits one form

- **WHEN** Gegenzauber is selected in an anti-magic form group
- **THEN** Magie unterdruecken, Zauber aufheben, and Wesenheit bannen SHALL not also be selected

#### Scenario: Required Attributo form blocks a cast

- **WHEN** a player attempts Attributo without its required attribute choice
- **THEN** the dialog SHALL show a German validation message
- **AND** it SHALL not roll or spend energy

#### Scenario: Form has no maneuver identity

- **WHEN** a structured form and ordinary maneuvers are selected together
- **THEN** the form SHALL not affect maneuver count or maneuver-only bonuses

### Requirement: Effective cast profiles are resolved before rolling

The system SHALL create a non-persistent effective profile from the source Item and selected forms before calculating the cast. Difficulty contributions SHALL adjust base difficulty; cost rules SHALL apply before ordinary cost modifiers; target, range, duration, and permanent-cost text SHALL appear in the effective profile and cast summary. Invalid/conflicting selections SHALL block the cast.

#### Scenario: Miasmafaxius changes casting profile

- **WHEN** Miasmafaxius is selected for Tlalucs Odem
- **THEN** its authored difficulty, energy cost, and Einzelperson profile SHALL be used
- **AND** the source Item's persisted profile SHALL remain unchanged

### Requirement: Form effect modes compose pre-effects deterministically

An omitted `effectMode` SHALL mean `inherit`. `inherit` SHALL preserve the effective pre-effect list. `extend` SHALL append the form's entries. `replace` SHALL replace it with the form's entries. A successful cast SHALL apply only the resolved effective list.

#### Scenario: Default inherit preserves base outcomes

- **WHEN** a selected form omits `effectMode`
- **THEN** the effective pre-effect list SHALL remain the source Item's list

#### Scenario: Replacement excludes base outcomes

- **WHEN** a selected form has `effectMode: "replace"`
- **THEN** a successful cast SHALL apply only that form's pre-effects

#### Scenario: Extend appends an outcome

- **WHEN** a selected form has `effectMode: "extend"`
- **THEN** a successful cast SHALL apply source entries followed by its own entries

### Requirement: Forms are authorable through the Item sheet

The [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html) supernatural Item sheet SHALL allow a GM to add, edit, order, and remove form groups/forms, profiles, modes, and nested pre-effects using `Item#update`.

#### Scenario: Replacement summon form persists

- **WHEN** a GM saves a replacement form with a `summonItem` pre-effect
- **THEN** reopening its sheet SHALL show the same source kind, UUID, overrides, and mode

### Requirement: Text modifications have a progressive legacy fallback

The system SHALL generate the current parser maneuver controls from free-text `system.modifikationen` only when `system.spellModifications` is empty. When structured forms exist, text remains rules prose but SHALL not create duplicate temporary maneuvers.

#### Scenario: Legacy text still generates a maneuver

- **WHEN** a spell has text modifications and no structured forms
- **THEN** `CombatItem.setManoevers()` SHALL retain current generated-maneuver behavior

#### Scenario: Structured form suppresses duplicate parser controls

- **WHEN** a spell has text modifications and at least one structured form
- **THEN** the dialog SHALL show the structured section and no text-parser duplicate

### Requirement: Structured forms can override complete Zone lifecycle data

The effective-form resolver SHALL merge a selected form's Zone lifecycle, duration-source, and trigger values with the source Item's Zone profile before normalization. A form that omits these values SHALL retain the base Zone values. Form selection SHALL remain dialog-local.

#### Scenario: Langer Atem overrides only ongoing Zone behavior

- **WHEN** an instant base Zone selects a form that overrides lifecycle, duration, and triggers but uses `effectMode: "inherit"`
- **THEN** the resolved Zone SHALL use the form's persistent behavior
- **AND** the resolved Pre-Effect list SHALL remain the base list
