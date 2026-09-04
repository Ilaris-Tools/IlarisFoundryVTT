## Purpose

System settings management via IlarisSettingsDialog (AppV2) with compendium, general, and automation tabs.

## Requirements

### Requirement: Ilaris settings dialog

The system SHALL provide `IlarisSettingsDialog` (AppV2 via `HandlebarsApplicationMixin(DialogV2)`) with three tabs for configuring system settings without using Foundry's built-in settings UI.

#### Scenario: Compendium tab selects packs

- **WHEN** the "Benutzte Kompendien" tab is viewed
- **THEN** the dialog SHALL display dropdowns for selecting compendium packs for Fertigkeiten, Waffen, Talente, Manöver, Vorteile, Waffeneigenschaften, and Abgeleitete Werte

#### Scenario: General tab shows boolean settings

- **WHEN** the "Allgemein" tab is viewed
- **THEN** the dialog SHALL display toggles for LepSystem, realFumbleCrits, renameTriumphWithCrit, restrictEnergyCost, and other boolean settings, plus a text input for `defaultRangedDodgeTalent`

#### Scenario: Automation tab configures behavior

- **WHEN** the "Automatisierung" tab is viewed
- **THEN** the dialog SHALL display toggles for `useSceneEnvironment` and `useTargetSelection`

#### Scenario: Save persists all settings

- **WHEN** the save button (`data-action="saveSettings"`) is clicked
- **THEN** all settings from all three tabs SHALL be persisted and the page SHALL reload

#### Scenario: Reset restores defaults

- **WHEN** the reset button (`data-action="resetSettings"`) is clicked
- **THEN** all settings SHALL be restored to their default values

### Requirement: Weapon-damage roll expansion setting

The system SHALL register a GM-managed, world-scoped boolean setting that controls whether `WEAPON_DAMAGE` multiplier modifications expand the base weapon formula before it is rolled. The setting SHALL be registered through [`foundry.helpers.ClientSettings`](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html) with `config: false`, SHALL default to disabled, and SHALL be managed exclusively through `IlarisSettingsDialog`.

#### Scenario: Default preserves result multiplication

- **WHEN** a world has not enabled the weapon-damage roll expansion setting
- **THEN** the setting value SHALL be `false`
- **AND** weapon-damage multiplier behavior SHALL retain the current result-multiplication convention

#### Scenario: GM enables setting in Allgemein tab

- **WHEN** a GM enables the weapon-damage roll expansion setting in the Allgemein tab and saves Ilaris settings
- **THEN** the system SHALL persist the enabled value through `game.settings.set`
- **AND** all users in the world SHALL read the same setting value through `game.settings.get`

#### Scenario: Reset restores default

- **WHEN** a GM resets Ilaris settings
- **THEN** the weapon-damage roll expansion setting SHALL be restored to `false`

### Requirement: Registered game settings

The system SHALL register all game settings via `registerIlarisGameSettings()` with `config: false` (managed exclusively through IlarisSettingsDialog).

#### Scenario: Settings registered without Foundry UI

- **WHEN** `registerIlarisGameSettings()` runs on init
- **THEN** all settings SHALL be registered with `config: false` in Foundry's game settings

### Requirement: Setting name constants

The system SHALL define all setting name strings as constants in `configure-game-settings.model.js`.

#### Scenario: Setting name used from constant

- **WHEN** any code reads or writes a system setting
- **THEN** it SHALL use the constant from `configure-game-settings.model.js` rather than a string literal

### Requirement: World configures supernatural effect stacking

`registerIlarisGameSettings()` SHALL register a world-scoped setting named
`supernaturalEffectStacking`, managed through IlarisSettingsDialog and named
through the central setting-name constants. It SHALL offer `ilaris` as the
default and `foundry` as the alternative. Its German UI text SHALL explain
that `ilaris` retains supernatural effects and selects the stronger
supernatural component per overlap, while `foundry` adds distinct effects
normally and replaces all earlier ActiveEffects from the same supernatural
spell or liturgy source when it is recast.

#### Scenario: Default follows the Ilaris rule

- **WHEN** a world has no saved value for the setting
- **THEN** the resolver SHALL use `ilaris` mode
- **AND** a same-spell recast SHALL retain the existing effect document

#### Scenario: GM selects Foundry behavior

- **WHEN** a GM saves `foundry` in the Ilaris settings dialog
- **THEN** subsequent resolution SHALL add competing distinct effects normally
- **AND** a subsequent spell or liturgy application SHALL replace all earlier
  ActiveEffects from its same supernatural source
- **AND** the setting SHALL be persisted with world scope

## Data Model

### Settings

| Setting                          | Type    | Default     | Description                                                         |
| -------------------------------- | ------- | ----------- | ------------------------------------------------------------------- |
| `weaponSpaceRequirement`         | Boolean | true        | Whether weapons require hand slots                                  |
| `realFumbleCrits`                | Boolean | false       | Use "real" crit/fumble rules (nat 20 must succeed, nat 1 must fail) |
| `renameTriumphWithCrit`          | Boolean | false       | Rename "Triumph" to "Crit" in UI                                    |
| `restrictEnergyCostSetting`      | Boolean | false       | Prevent casting without sufficient energy                           |
| `hideSyncKampfstileButton`       | Boolean | false       | Hide the sync combat styles button                                  |
| `enableTabbingCharacterSheet`    | Boolean | false       | Enable tab navigation on character sheets                           |
| `hexTokenShapes`                 | Boolean | false       | Use hex-shaped tokens                                               |
| `defaultRangedDodgeTalent`       | String  | "Akrobatik" | Default dodge talent for ranged attacks                             |
| `lepSystem`                      | Boolean | false       | Use LEP (life points) system                                        |
| `expandWeaponDamageMultipliers`  | Boolean | false       | Expand `WEAPON_DAMAGE` multiplier formulas before rolling           |
| `lastSeenBreakingChangesVersion` | String  | ""          | Last version for which breaking changes were acknowledged           |
| `useSceneEnvironment`            | Boolean | true        | Apply scene environment modifiers to ranged attacks                 |
| `useTargetSelection`             | Boolean | true        | Show target selection dialog in combat                              |
| Plus 7 compendium pack settings  | String  | (pack keys) | Selected compendium packs for each item category                    |

## Cross-References

- [combat](../combat/spec.md) — `useSceneEnvironment` and `useTargetSelection` affect combat dialog behavior
- [dice](../dice/spec.md) — `realFumbleCrits` affects crit/fumble evaluation
- [release](../release/spec.md) — `lastSeenBreakingChangesVersion` drives the changelog notification
