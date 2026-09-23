## ADDED Requirements

### Requirement: Anti-magic spells author their forms in source data

The ten anti-magic [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) sources SHALL each define the four mutually exclusive forms _Gegenzauber_, _Magie unterdrücken_, _Zauber aufheben_, and _Wesenheit bannen_ through `spellModificationGroups` and `spellModifications`. No current compendium source SHALL use `spellModificationPreset`, and the system SHALL not retain an in-memory anti-magic preset or a `spellModificationPreset` schema field.

#### Scenario: An anti-magic source is loaded

- **WHEN** one of the ten current anti-magic compendium Items is loaded
- **THEN** it SHALL expose a required group containing exactly the four
  explicit form IDs
- **AND THEN** the selected form SHALL retain its current profile and
  effect-mode semantics

#### Scenario: Preset-only source data is loaded

- **WHEN** an Item only defines `spellModificationPreset: "antiMagic"`
- **THEN** it SHALL not receive implicit anti-magic forms

### Requirement: Dämonenbann suppresses Dämonisch casts while contained

After a successful _Dämonenbann: Magie unterdrücken_ cast and placement, the existing [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html) and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) lifecycle SHALL apply a persistent passive circle with a 16-step radius and one-hour duration. Each contained Token, including the caster when contained, SHALL receive a Zone-owned `-8` roll modifier scoped to `Dämonisch`; every selected Mächtige-Magie stage SHALL add `-4`.

#### Scenario: A contained actor casts Dämonisch

- **WHEN** an actor is contained in the active _Magie unterdrücken_ Region and
  makes a `Dämonisch` roll without Mächtige Magie
- **THEN** the existing modifier resolver SHALL include `-8` in that roll
- **AND THEN** a roll using another Fertigkeit SHALL not receive that modifier

#### Scenario: Mächtige Magie increases the suppression penalty

- **WHEN** the caster uses one applicable Mächtige-Magie stage while casting
  _Magie unterdrücken_
- **THEN** a contained `Dämonisch` roll SHALL receive `-12`

#### Scenario: A token leaves or the Region ends

- **WHEN** a contained Token leaves the Region, or the Region expires, is
  dismissed, or is deleted
- **THEN** the existing passive-zone ownership lifecycle SHALL remove only that
  Token's suppression modifier
