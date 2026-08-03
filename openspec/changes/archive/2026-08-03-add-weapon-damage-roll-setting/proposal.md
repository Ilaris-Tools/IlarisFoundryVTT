## Why

Hammerschlag currently doubles the evaluated weapon-damage result. Some worlds instead use the historical behavior of expanding the weapon formula, so `2W6+3` becomes `4W6+6`. The system needs a world-wide, opt-in rule variant that supports that interpretation without changing the default ruleset.

## What Changes

- Register a new world-scoped boolean setting for expanding `WEAPON_DAMAGE` multipliers into additional dice and numeric terms.
- Add the setting to the GM-controlled Allgemein tab of `IlarisSettingsDialog`, including save and reset behavior.
- Keep result multiplication as the default when the setting is disabled.
- When the setting is enabled, transform a multiplied base weapon formula such as `2W6+3` and multiplier `2` into `4W6+6` before rolling it.
- Apply the rule only to `WEAPON_DAMAGE` multiplier modifications. Attack, defense, flat `DAMAGE`, resource, and other modifier types are out of scope.

This is an additive, opt-in behavior change. Existing worlds retain their current damage behavior unless a GM enables the setting.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings`: Register, display, persist, and reset the new world-scoped weapon-damage rolling rule setting.
- `combat`: Apply the configured weapon-damage multiplier behavior while processing `WEAPON_DAMAGE` modifications.

## Impact

- Affected code: `scripts/settings/configure-game-settings.model.js`, `scripts/settings/configure-game-settings.js`, `scripts/settings/ilaris-settings.dialog.js`, `scripts/settings/templates/ilaris-settings_general.hbs`, and `scripts/combat/dialogs/shared-dialog-helpers.js`.
- Foundry VTT API: [`foundry.helpers.ClientSettings`](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html) via `game.settings.register`, `get`, and `set`; [`foundry.dice.Roll`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) via `Roll#alter` to expand dice and numeric terms. No Foundry Hooks or `foundry.utils.*` utilities are introduced or changed.
- No compendium data migration or package rebuild is required because the existing Hammerschlag `WEAPON_DAMAGE` multiplier data remains unchanged.

## Testing Impact

- Update `scripts/combat/_spec/shared_dialog_helpers.test.js` with result-multiplier default coverage, opt-in `2W6+3` to `4W6+6` expansion coverage, and coverage proving flat `DAMAGE` modifiers remain outside the transformed weapon formula.
- Add or update settings tests for registration, dialog persistence, and reset of the new setting if an existing settings test seam is available.
- Add an E2E scenario for a GM in a world with a weapon and Hammerschlag available: verify the default formula remains result-multiplied, enable the setting in Ilaris settings, then verify the damage roll displays an expanded formula. No player client or target actor is required when invoking the damage roll directly. No shared E2E helper is currently identified.
- Existing `e2e-031-damage-type-settings` exercises the settings dialog and should be regression-verified, but it does not cover weapon damage.
