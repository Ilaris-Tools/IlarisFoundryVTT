## Purpose

Maneuver damage-type selection and resolution through the world registry.

## Requirements

### Requirement: Maneuver damage types use the world registry

The system SHALL populate a maneuver `CHANGE_DAMAGE_TYPE` selector from the world-scoped `damageTypes` setting through [`foundry.Game`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings), using each entry's `value` as the stored option value and `label` as its displayed text. Maneuver execution SHALL carry that `value` key into damage application; labels SHALL be used only for the combat summary.

#### Scenario: GM can select a custom maneuver damage type

- **WHEN** a GM adds `{"value":"SCHATTEN","label":"Schatten","behavior":{}}` to the world registry and opens a maneuver with `CHANGE_DAMAGE_TYPE`
- **THEN** the maneuver sheet SHALL offer an option with value `SCHATTEN` and visible label `Schatten`
- **AND** saving that option SHALL persist `SCHATTEN` as the modification value

#### Scenario: Stumpfer Schlag carries the canonical key

- **WHEN** Stumpfer Schlag is selected during an attack
- **THEN** the resolved attack damage type SHALL be `STUMPF`, not the display label `Stumpf`
- **AND** the default `STUMPF` behavior SHALL apply the resulting damage to Erschöpfung

### Requirement: Built-in armor-breaking maneuvers use damage-type behavior

The built-in melee and ranged Rüstungsbrecher maneuvers SHALL reference `TRUE_DAMAGE` through `CHANGE_DAMAGE_TYPE`. They SHALL NOT retain a parallel `ARMOR_BREAKING` or armor-bypass-only `SPECIAL_TEXT` modification.

#### Scenario: Default Rüstungsbrecher ignores armor through the registry

- **WHEN** either built-in Rüstungsbrecher is selected and the registry contains `TRUE_DAMAGE` with `bypassesArmor: true`
- **THEN** damage application SHALL use WS instead of WS\* according to the registry behavior

#### Scenario: Removed TRUE_DAMAGE safely falls back

- **WHEN** a GM removes `TRUE_DAMAGE` from the world registry and uses a built-in Rüstungsbrecher
- **THEN** the system SHALL issue the localized missing-damage-type warning
- **AND** the attack SHALL resolve as Profan/Wunden damage without bypassing armor
