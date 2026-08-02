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
that `ilaris` selects the stronger overnatürlicher effect per overlap while
`foundry` adds effects normally.

#### Scenario: Default follows the Ilaris rule

- **WHEN** a world has no saved value for the setting
- **THEN** the resolver SHALL use `ilaris` mode

#### Scenario: GM selects Foundry behavior

- **WHEN** a GM saves `foundry` in the Ilaris settings dialog
- **THEN** subsequent effect resolution SHALL add competing effects normally
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
| `lastSeenBreakingChangesVersion` | String  | ""          | Last version for which breaking changes were acknowledged           |
| `useSceneEnvironment`            | Boolean | true        | Apply scene environment modifiers to ranged attacks                 |
| `useTargetSelection`             | Boolean | true        | Show target selection dialog in combat                              |
| Plus 7 compendium pack settings  | String  | (pack keys) | Selected compendium packs for each item category                    |

## Cross-References

- [combat](../combat/spec.md) — `useSceneEnvironment` and `useTargetSelection` affect combat dialog behavior
- [dice](../dice/spec.md) — `realFumbleCrits` affects crit/fumble evaluation
- [release](../release/spec.md) — `lastSeenBreakingChangesVersion` drives the changelog notification
