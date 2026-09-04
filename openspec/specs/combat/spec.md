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

The system SHALL provide `UebernatuerlichDialog` extending `CombatDialog` for supernatural abilities including energy cost tracking, Blutmagie, Verbotene Pforten, and player/GM-managed contextual Vorteil conditions. The dialog SHALL pass selected, session-local condition tags to the roll-phase Ilaris modifier resolver for its supernatural Probe and show any applied ordinary contribution in its summary. When `useTargetSelection` is enabled and the item has a normalized zone profile, the dialog SHALL show one `Zone platzieren` control above the right-column `Würfelaktionen`, create and retain an inert draft Region before rolling, enable roll actions only while that draft exists, and defer all zone effects or persistence until a successful cast. When that setting is disabled, zone automation SHALL not run and the spell retains its manual outcome path.

#### Scenario: Energy cost enforcement

- **WHEN** `restrictEnergyCost` setting is enabled and the caster lacks sufficient Astralenergie/Karmaenergie
- **THEN** the dialog SHALL prevent the action

#### Scenario: Blutmagie conversion

- **WHEN** the caster uses Blutmagie (blood magic)
- **THEN** energy costs SHALL be converted to health damage at the configured ratio

#### Scenario: Contextual Vorteil is selected for one supernatural roll

- **WHEN** the player or GM selects a relevant condition in the supernatural dialog
- **THEN** its matching ordinary Vorteil Probe modifier SHALL affect that dialog's preview and roll
- **AND** the selection SHALL not be persisted on the Actor or Item

#### Scenario: Zone placement precedes the roll

- **WHEN** a supernatural item has a normalized zone profile and target automation is enabled
- **THEN** the dialog SHALL show `Zone platzieren` above `Würfelaktionen` and keep roll actions unavailable until placement is confirmed
- **AND** the confirmed shape SHALL remain visible as an inert draft Region until the spell is resolved, replaced, cancelled, or the dialog is closed

#### Scenario: Zone placement can be redone

- **WHEN** the user activates `Zone platzieren` while a draft is present
- **THEN** the dialog SHALL discard the current draft and reopen zone placement without rolling or paying energy

#### Scenario: Zone automation is disabled with target selection

- **WHEN** `useTargetSelection` is disabled
- **THEN** a zone spell SHALL not open template placement or resolve automatic zone targets
- **AND** the dialog SHALL retain the existing manual outcome path

#### Scenario: Zone placement requires a caster token and active scene

- **WHEN** zone automation is enabled but the caster token or active Scene cannot be resolved
- **THEN** the dialog SHALL notify the user and abort before rolling or charging energy

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

The system SHALL integrate maneuvers (Manöver) into all three combat dialog types via `handleModifications()`. Maneuver damage-type changes SHALL retain their registry key through damage application, and unmodified melee and ranged attacks SHALL initialize with the registered `PROFAN` key.

#### Scenario: Maneuvers modify attack parameters

- **WHEN** a maneuver (e.g., Wuchtschlag, Gezielter Schlag) is selected
- **THEN** the attack roll modifiers SHALL reflect the maneuver's effects

#### Scenario: Maneuvers consume resources

- **WHEN** a maneuver with an energy or health cost is used
- **THEN** the cost SHALL be deducted from the attacker

#### Scenario: Maneuver damage type reaches damage application by key

- **WHEN** a selected maneuver uses `CHANGE_DAMAGE_TYPE` with a configured registry value
- **THEN** `applyDamageToTarget()` SHALL receive that registry value rather than its display label
- **AND** the configured damage-type behavior SHALL determine the affected health pool and armor handling

#### Scenario: Ordinary attacks start as Profan damage

- **WHEN** a melee or ranged attack resolves without a damage-type-changing maneuver
- **THEN** the damage application path SHALL receive `PROFAN`

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

### Requirement: Combat resolves contextual Ilaris effect modifiers

Melee and ranged combat dialogs SHALL request roll-phase Ilaris modifiers with
the acting actor, weapon Fertigkeit, weapon Talent, and the resolved combat
context. The resulting AT, VT, TP, and Waffenschaden contributions SHALL be
included in the corresponding roll or damage calculation and displayed in the
dialog summary as an effect-derived modifier.

#### Scenario: Klingenwaffen attack receives its matching AT bonus

- **WHEN** an actor attacks with a weapon whose Fertigkeit is Klingenwaffen
- **THEN** a matching `fertigkeit: ["Klingenwaffen"]` AT modifier SHALL be
  included in the attack result

#### Scenario: Defense applies a separate VT modifier

- **WHEN** a combatant makes a defense roll
- **THEN** matching VT modifiers SHALL be resolved for the defending actor and
  included independently of the attacker's AT modifiers

#### Scenario: Damage effect comparison and contribution are maneuver-independent

- **WHEN** competing übernatürliche TP or Waffenschaden effect modifiers use
  fixed values or linear W6 formulas and a later maneuver modifies ordinary
  weapon damage
- **THEN** combat SHALL select the stronger effect from the raw configured or
  expected comparison magnitudes
- **AND** it SHALL add the selected effect contribution after maneuver
  transformations without multiplying, halving, or otherwise changing it

### Requirement: Combat summaries show applied and suppressed effect results

Combat dialog summaries SHALL always show the total and source of every
applied Ilaris effect modifier in the normal modifier breakdown. When the
resolver suppresses one or more matching contributions, the summary SHALL show
an accessible suppression icon or button with a localized label. Activating it
SHALL reveal the suppressed entries and their suppression reason; the detailed
entries SHALL be collapsed by default.

#### Scenario: Applied combat modifier is immediately visible

- **WHEN** a resolved combat context includes an applied Ilaris AT, VT, or
  damage modifier
- **THEN** the dialog summary SHALL display that applied modifier without
  requiring the user to open suppression details

#### Scenario: Suppression details are available on demand

- **WHEN** one or more matching combat modifiers were suppressed
- **THEN** the dialog summary SHALL display the suppression indicator
- **AND** activating it SHALL reveal each suppressed modifier and the stronger
  contribution that suppressed it

### Requirement: Combat resolves armed attack snapshots

Melee and ranged dialogs SHALL serialize matching armed-effect snapshots through defense handling, consume charges once after each matching attack resolution, and apply snapshot damage only on confirmed hits.

#### Scenario: Armed snapshot resolves once after the final outcome

- **WHEN** an attack has a matching armed-effect snapshot with available charges
- **THEN** the combat flow SHALL carry that snapshot through defense resolution
- **AND** it SHALL consume one charge after the matching attack resolution
- **AND** it SHALL apply its damage contribution only on a confirmed hit

### Requirement: Melee outcome resolution activates selected maneuver pre-effects

The melee combat dialogs SHALL evaluate selected maneuver pre-effects only at their final attack-versus-defense resolution. They SHALL pass the dialog's existing selected targets and the maneuver user's Actor to the generic pre-effect service. They SHALL not invoke maneuver effects from an intermediate attack roll that can still be defeated by a defense.

#### Scenario: A confirmed melee hit dispatches offensive pre-effects once

- **WHEN** a melee attacker wins a final resolution with a selected `onConfirmedHit` maneuver pre-effect
- **THEN** the dialog SHALL dispatch that maneuver pre-effect once for the resolved defender

#### Scenario: A successful defense dispatches defensive pre-effects once

- **WHEN** a melee defender wins a final resolution with a selected `onSuccessfulDefense` maneuver pre-effect
- **THEN** the defense flow SHALL dispatch that maneuver pre-effect once for the attacking actor

### Requirement: Maneuver pre-effects retain their activating roll

The combat dialog SHALL pass the final result of the roll that satisfied a maneuver pre-effect's activation to the common pre-effect processor when it creates a resistance prompt. The processor SHALL make that result available as the resistance prompt's `triggeringRollTotal`; it SHALL use the evaluated [Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) total and shall not repeat the roll.

#### Scenario: Confirmed-hit maneuver uses the attack total

- **WHEN** an `onConfirmedHit` maneuver Pre-Effect with a triggering-roll resistance source is dispatched after a confirmed hit
- **THEN** its target's resistance prompt SHALL contain the attack roll's final total

#### Scenario: Successful-defense maneuver uses the defense total

- **WHEN** an `onSuccessfulDefense` maneuver Pre-Effect with a triggering-roll resistance source is dispatched after a successful defense
- **THEN** its target's resistance prompt SHALL contain the defense roll's final total

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
