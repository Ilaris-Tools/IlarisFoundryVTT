## MODIFIED Requirements

### Requirement: Damage application supports healing

`_applyDamageDirectly` SHALL handle negative damage values as healing. When damage < 0, wounds SHALL be reduced instead of increased, with proper WS threshold calculation and a healing-specific chat message.

#### Scenario: Negative damage heals wounds

- **WHEN** `_applyDamageDirectly` is called with `damage: -12` and the target has `WS: 5` and `wounds: 3`
- **THEN** wounds SHALL be reduced by `Math.floor(12 / 5) = 2` (each full WS heals one wound)
- **AND** final wounds SHALL be `1`

#### Scenario: Healing does not create negative wounds

- **WHEN** healing would reduce wounds below 0
- **THEN** wounds SHALL be capped at 0

#### Scenario: Healing with insufficient damage has no effect

- **WHEN** `_applyDamageDirectly` is called with `damage: -4` and the target has `WS: 5`
- **THEN** wounds SHALL remain unchanged (4 < WS, no wound healed)

#### Scenario: Healing chat message differs from damage

- **WHEN** healing is applied
- **THEN** the chat message SHALL indicate healing (e.g., "heilt X Wunden") instead of damage

#### Scenario: Healing works with LEP system

- **WHEN** the LEP system is active and damage is negative
- **THEN** LEP SHALL be increased by `Math.abs(damage)`, capped at the actor's maximum LEP

#### Scenario: Healing with STUMPF damage type

- **WHEN** `_applyDamageDirectly` is called with `damage: -12` and `damageType: STUMPF`
- **THEN** Erschöpfung SHALL be reduced instead of wounds
