## ADDED Requirements

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
