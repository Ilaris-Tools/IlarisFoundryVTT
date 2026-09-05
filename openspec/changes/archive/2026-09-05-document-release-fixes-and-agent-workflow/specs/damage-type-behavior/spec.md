## MODIFIED Requirements

### Requirement: Damage type behavior lookup function

A shared utility function `getDamageTypeBehavior(damageType)` SHALL read the `damageTypes` world setting via [`game.settings.get`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get) and return the behavior flags for a given registry value key.

#### Scenario: Lookup returns correct flags for known type

- **WHEN** `getDamageTypeBehavior('HEALING_WOUND')` is called
- **AND** the setting contains `{"value":"HEALING_WOUND","behavior":{"healing":true}}`
- **THEN** it SHALL return `{healing: true, targetsErschoepfung: false}`

#### Scenario: Lookup returns defaults for unknown type

- **WHEN** `getDamageTypeBehavior('NONEXISTENT')` is called
- **THEN** it SHALL return `{healing: false, targetsErschoepfung: false}`

#### Scenario: Absent type uses default behavior

- **WHEN** `getDamageTypeBehavior` is called without a damage type
- **THEN** it SHALL return default non-healing Wunden behavior
- **AND** it SHALL not emit an unknown-type warning

#### Scenario: Legacy NORMAL sentinel uses default behavior

- **WHEN** `getDamageTypeBehavior('NORMAL')` is called
- **THEN** it SHALL return default non-healing Wunden behavior
- **AND** it SHALL not emit an unknown-type warning
