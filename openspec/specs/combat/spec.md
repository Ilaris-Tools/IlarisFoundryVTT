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
