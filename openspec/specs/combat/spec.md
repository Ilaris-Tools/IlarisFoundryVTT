## Purpose

Combat dialog system with melee, ranged, and supernatural dialogs, target selection, defense prompts, damage application, maneuver integration, and global hook mirroring.

## Requirements

### Requirement: Combat dialog base class

The system SHALL provide a `CombatDialog` base class (AppV2 via `HandlebarsApplicationMixin(DialogV2)`) with common initialization, targeting, token context, and summary rendering shared by all combat dialog types.

#### Scenario: Dialog opens with attacker context

- **WHEN** a combat dialog is opened via `openCombatDialog()`
- **THEN** the dialog SHALL receive the attacking actor, token, weapon/item, and target context

#### Scenario: Summary context prepared

- **WHEN** a combat dialog renders
- **THEN** `_prepareContext()` SHALL include attacker stats, weapon stats, target modifiers, and available maneuvers

### Requirement: Melee combat dialog (AngriffDialog)

The system SHALL provide `AngriffDialog` extending `CombatDialog` for melee combat resolution including attack roll, defense prompt, and damage application.

#### Scenario: Melee attack roll

- **WHEN** the user initiates an attack in `AngriffDialog`
- **THEN** the system SHALL dispatch a melee attack roll via `wuerfelwurf()` with the weapon's AT value

#### Scenario: Defense prompt after successful hit

- **WHEN** an attack roll succeeds (meets or exceeds target's VT)
- **THEN** the system SHALL dispatch whispered ChatMessage defense prompts to each selected target via socket routing

#### Scenario: Damage application after failed defense

- **WHEN** a target fails their defense roll (or defense is not applicable)
- **THEN** the system SHALL call `applyDamageToTarget()` with the damage roll result, attacker context, and token metadata

### Requirement: Ranged combat dialog (FernkampfAngriffDialog)

The system SHALL provide `FernkampfAngriffDialog` extending `CombatDialog` for ranged combat with environment modifiers (distance, light, weather, cover).

#### Scenario: Environment modifiers applied

- **WHEN** a ranged attack is made with `useSceneEnvironment` setting enabled
- **THEN** the dialog SHALL include GZKL (distance modifier), Licht (light), Wetter (weather), and Deckung (cover) modifiers

#### Scenario: Akrobatik dodge for ranged attacks

- **WHEN** a ranged attack hits and the target has the configured dodge talent (default: Akrobatik)
- **THEN** the defense prompt SHALL offer dodge as an alternative to standard defense

### Requirement: Supernatural combat dialog (UebernatuerlichDialog)

The system SHALL provide `UebernatuerlichDialog` extending `CombatDialog` for supernatural abilities including energy cost tracking, Blutmagie, and Verbotene Pforten.

#### Scenario: Energy cost enforcement

- **WHEN** `restrictEnergyCost` setting is enabled and the caster lacks sufficient Astralenergie/Karmaenergie
- **THEN** the dialog SHALL prevent the action

#### Scenario: Blutmagie conversion

- **WHEN** the caster uses Blutmagie (blood magic)
- **THEN** energy costs SHALL be converted to health damage at the configured ratio

### Requirement: Target selection

The system SHALL provide `TargetSelectionDialog` for selecting nearby actors/tokens with distance calculation, syncing with Foundry's built-in targeting system.

#### Scenario: Nearby targets displayed with distance

- **WHEN** `TargetSelectionDialog` opens
- **THEN** all tokens on the current scene SHALL be listed with their distance from the attacker

#### Scenario: Target selection syncs with Foundry targeting

- **WHEN** a target is selected in `TargetSelectionDialog`
- **THEN** the Foundry user target SHALL be updated to match

#### Scenario: Target selection is configurable

- **WHEN** `useTargetSelection` setting is disabled
- **THEN** the dialog SHALL skip target selection and use only Foundry's built-in targeting

### Requirement: Global hook mirroring

The system SHALL mirror 10 combat hooks as `Ilaris.global.*` events for use by world scripts and macros.

#### Scenario: preCombatDialog mirrored

- **WHEN** `Ilaris.preCombatDialog` hook fires
- **THEN** `Ilaris.global.preCombatDialog` SHALL also fire with the same arguments

#### Scenario: All 10 hooks mirrored

- **WHEN** any of the Ilaris combat hooks fire (`preCombatDialog`, `postAngriff`, `preVerteidigung`, `postVerteidigung`, `preSchaden`, `postSchaden`, etc.)
- **THEN** a corresponding `Ilaris.global.*` hook SHALL fire

### Requirement: Multiplayer defense routing

The system SHALL route defense prompts and damage application to the correct client using socket communication, preserving token context for unlinked actors.

#### Scenario: Defense prompt sent to target's client

- **WHEN** an attack hits a target controlled by another user
- **THEN** the defense prompt SHALL be sent via socket to the target's controlling client

#### Scenario: Token context preserved for unlinked actors

- **WHEN** applying damage to an unlinked token actor (`actorLink === false`)
- **THEN** the system SHALL resolve the actor from the token first, not the world actor

#### Scenario: GM permission escalation

- **WHEN** a non-GM client needs to apply damage to a target they don't own
- **THEN** the GM client SHALL handle the damage application via socket payload with full token metadata

### Requirement: Maneuver integration

The system SHALL integrate maneuvers (Manöver) into all three combat dialog types via `handleModifications()`.

#### Scenario: Maneuvers modify attack parameters

- **WHEN** a maneuver (e.g., Wuchtschlag, Gezielter Schlag) is selected
- **THEN** the attack roll modifiers SHALL reflect the maneuver's effects

#### Scenario: Maneuvers consume resources

- **WHEN** a maneuver with an energy or health cost is used
- **THEN** the cost SHALL be deducted from the attacker

### Requirement: Configurable weapon-damage multiplier roll behavior

The combat modifier pipeline SHALL apply the world weapon-damage roll expansion setting only to `WEAPON_DAMAGE` modifications with the `MULTIPLY` operator. When expansion is enabled, the system SHALL use [`foundry.dice.Roll#alter`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html#alter) to multiply both dice terms and numeric terms in the base weapon formula before damage is rolled. When expansion is disabled, the system SHALL retain result multiplication.

#### Scenario: Default result multiplication

- **WHEN** a `WEAPON_DAMAGE` multiplier of `2` is applied to base weapon damage `2W6+3` while the setting is disabled
- **THEN** the generated weapon-damage formula SHALL represent `(2W6+3)*2`
- **AND** the weapon-damage result SHALL be doubled after the base formula is evaluated

#### Scenario: Opt-in formula expansion

- **WHEN** a `WEAPON_DAMAGE` multiplier of `2` is applied to base weapon damage `2W6+3` while the setting is enabled
- **THEN** the generated weapon-damage formula SHALL represent `4W6+6`
- **AND** the damage roll SHALL roll four six-sided dice and include a flat bonus of six

#### Scenario: Flat damage remains outside weapon multiplier

- **WHEN** a weapon-damage multiplier is expanded while a separate flat `DAMAGE` modifier also applies
- **THEN** only the base weapon formula SHALL be expanded
- **AND** the flat damage modifier SHALL be applied after the weapon formula without being multiplied

#### Scenario: Other modifier types remain unchanged

- **WHEN** the weapon-damage roll expansion setting is enabled and a modifier type other than `WEAPON_DAMAGE` is processed
- **THEN** that modifier SHALL retain its existing operator behavior

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

#### Scenario: Healing works with LEP system

- **WHEN** the LEP system is active and `behavior.healing` is true
- **THEN** LEP SHALL be increased by the damage amount, capped at the actor's maximum LEP

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

## Data Model

### CombatDialog context

| Field          | Source  | Description                                                |
| -------------- | ------- | ---------------------------------------------------------- |
| `attacker`     | Actor   | The attacking actor (resolved from token if unlinked)      |
| `weapon`       | Item    | The weapon or ability item being used                      |
| `targets`      | Token[] | Selected target tokens                                     |
| `modifiers`    | Object  | Accumulated modifiers from maneuvers, environment, effects |
| `tokenContext` | Object  | `{tokenId, actorId, actorLink}` for the attacker           |

## Cross-References

- [dice](../dice/spec.md) — `wuerfelwurf()` dispatch and crit/fumble evaluation
- [weapons](../weapons/spec.md) — Weapon TP computation and Eigenschaft modifiers
- [active-effects](../active-effects/spec.md) — Target effects triggered on hit
- [settings](../settings/spec.md) — `useSceneEnvironment`, `useTargetSelection`, `realFumbleCrits`
