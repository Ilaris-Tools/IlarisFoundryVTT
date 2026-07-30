## ADDED Requirements

### Requirement: E2E coverage for damage type settings CRUD

The E2E suite SHALL verify the GM-visible damage-type settings flow, including behavior flags and persistence, using the documented [Game settings API](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings).

#### Scenario: Add and persist a behavioral damage type

- **WHEN** a GM adds a custom damage type through `IlarisSettingsDialog`, enables one or more behavior flags, saves, closes, and reopens the dialog
- **THEN** the saved `damageTypes` world setting SHALL include that type with the selected behavior flags

#### Scenario: Delete a damage type

- **WHEN** a GM deletes a configured damage type and saves the settings dialog
- **THEN** the deleted type SHALL no longer be present in the saved `damageTypes` world setting
