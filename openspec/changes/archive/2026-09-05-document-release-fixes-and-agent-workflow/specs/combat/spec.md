## MODIFIED Requirements

### Requirement: Damage application supports healing

`_applyDamageDirectly` SHALL determine healing behavior from the damage type's `behavior.healing` flag (obtained via `getDamageTypeBehavior(damageType)`) rather than from `damage < 0`. When `behavior.healing` is true, the damage value SHALL be interpreted as a positive healing amount. The health pool (Wunden vs Erschöpfung) SHALL be determined by `behavior.targetsErschoepfung`. Healing SHALL use the same wound threshold formula as damage: the value must **exceed** WS to heal a wound (`Math.floor((healAmount - 1) / ws)`).

#### Scenario: Healing type heals wounds

- **WHEN** `_applyDamageDirectly` is called with `damage: 12`, `damageType: "HEALING_WOUND"`, and the target has `WS: 5` and `wounds: 3`
- **THEN** wounds SHALL be reduced by `Math.floor((12 - 1) / 5) = 2` (each full WS exceeding heals one wound)
- **AND** final wounds SHALL be `1`

#### Scenario: Healing must exceed WS threshold

- **WHEN** `_applyDamageDirectly` is called with `damage: 5`, `damageType: "HEALING_WOUND"`, and the target has `WS: 5` and `wounds: 2`
- **THEN** wounds SHALL remain unchanged (healAmount 5 does not exceed WS 5)
- **AND** a chat message SHALL indicate "keine Heilung"

#### Scenario: Healing with insufficient amount has no effect

- **WHEN** `_applyDamageDirectly` is called with `damage: 4`, `damageType: "HEALING_WOUND"`, and the target has `WS: 5`
- **THEN** wounds SHALL remain unchanged (4 < WS, no wound healed)
- **AND** a chat message SHALL indicate "keine Heilung"

#### Scenario: Healing chat message indicates healing

- **WHEN** healing is applied
- **THEN** the chat message SHALL indicate healing (e.g., "heilt X Einschränkungen") instead of damage
- **AND** `ChatMessage.create` SHALL receive `style: CONST.CHAT_MESSAGE_STYLES.OTHER`

#### Scenario: LEP healing removes accumulated damage

- **WHEN** the LEP system is active and `behavior.healing` is true for a type targeting Wunden
- **THEN** the system SHALL reduce `system.gesundheit.wunden` by the positive healing amount, floored at `0`
- **AND** it SHALL not use a `wunden_max` field because LEP represents current health as maximum LEP minus accumulated `wunden` damage

#### Scenario: HEALING_EXHAUSTION heals Erschöpfung

- **WHEN** `_applyDamageDirectly` is called with `damage: 12`, `damageType: "HEALING_EXHAUSTION"`, and the target has `WS: 5` and `erschoepfung: 3`
- **THEN** Erschöpfung SHALL be reduced by `Math.floor(12 / 5) = 2`
- **AND** final Erschöpfung SHALL be `1`

#### Scenario: Damage types without healing flag still deal damage

- **WHEN** `_applyDamageDirectly` is called with `damage: 12` and `damageType: "PROFAN"` (no healing flag)
- **THEN** the system SHALL apply damage (not healing) to Wunden

#### Scenario: STUMPF damage type deals Erschöpfung damage

- **WHEN** `_applyDamageDirectly` is called with `damage: 12` and `damageType: "STUMPF"` (targetsErschoepfung: true)
- **THEN** the system SHALL apply damage to `system.gesundheit.erschoepfung`

#### Scenario: Custom type with both flags heals Erschöpfung

- **WHEN** `_applyDamageDirectly` is called with `damage: 12` and a custom type with `behavior: {healing: true, targetsErschoepfung: true}`
- **THEN** the system SHALL heal `system.gesundheit.erschoepfung`

#### Scenario: Damage type with bypassesArmor uses WS instead of WS\*

- **WHEN** `_applyDamageDirectly` is called with `damage: 12` and a damage type with `behavior: {bypassesArmor: true}`
- **THEN** the wound calculation SHALL use WS (not WS\*) as the threshold, same as `trueDamage`

#### Scenario: Damage path clamps negative values to zero

- **WHEN** `_applyDamageDirectly` is called with `damage: -5` and a non-healing damage type
- **THEN** the damage value SHALL be clamped to `0` via `Math.max(0, damage)` before wound calculation
- **AND** no wounds SHALL be dealt

#### Scenario: Healing does not create negative wounds

- **WHEN** healing would reduce wounds below 0
- **THEN** wounds SHALL be capped at 0

## ADDED Requirements

### Requirement: Akrobatik defense reads the active message-mode setting

The Akrobatik defense dialog SHALL initialize its roll-mode control from [`ClientSettings#get`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get) using the supported `core.messageMode` key.

#### Scenario: Akrobatik defense opens without a per-dialog mode selection

- **WHEN** an Akrobatik defense dialog is opened and its roll-mode input has no selected override
- **THEN** the dialog SHALL use the current `core.messageMode` setting
- **AND** it SHALL not access the removed `core.rollMode` setting
