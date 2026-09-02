## Why

The configurable `damageTypes` world setting already controls spell pre-effects, but maneuver damage changes still use a static label map or hard-coded armor bypass. Consequently, Stumpfer Schlag does not reliably retain the `STUMPF` registry key, and Rüstungsbrecher cannot respect a GM removing or redefining the damage type that provides armor bypass.

## What Changes

- Modify maneuver `CHANGE_DAMAGE_TYPE` resolution to carry the configured type key through the combat and damage pipeline, while displaying the current world-configured label in the roll summary.
- Extend maneuver authoring to populate its damage-type selector from the `damageTypes` world setting, matching spell pre-effect authoring.
- Migrate Stumpfer Schlag to `STUMPF`, and both Rüstungsbrecher variants to `TRUE_DAMAGE`; remove their parallel hard-coded armor-bypass/special-text behavior.
- Treat a missing maneuver-referenced type exactly like a missing spell type: show the existing localized warning once and fall back to Profan/Wunden behavior.
- Correct normal melee and ranged attacks to begin with the registered `PROFAN` key rather than the legacy, non-registry `NORMAL` marker.
- Update the German maneuver configuration quick reference to explain registry-backed damage-type behavior.

This change modifies existing combat and maneuver behavior and removes the old hard-coded armor-bypass path from the migrated maneuvers. It is not breaking for worlds that retain the default registry; worlds that intentionally remove a referenced type receive the established warning and safe fallback.

## Capabilities

### New Capabilities

- `maneuver-damage-types`: Maneuver authoring and execution use the world damage-type registry by key, including the migration of the built-in Stumpfer Schlag and Rüstungsbrecher maneuvers.

### Modified Capabilities

- `configurable-damage-types`: The registry becomes the source of maneuver damage-type options as well as pre-effect options.
- `damage-type-behavior`: Missing damage-type references retain the safe fallback and localized warning consistently for maneuver-driven damage.
- `combat`: Melee and ranged maneuver changes resolve registry keys and behavior flags instead of static labels or hard-coded armor bypass.

## Impact

- Combat resolution: `scripts/combat/dialogs/shared-dialog-helpers.js`, `angriff.js`, and `fernkampf-angriff.js`.
- Maneuver sheet/template: `scripts/items/sheets/manoever.js` and `scripts/items/templates/manoever.hbs`.
- Compendium source data: Stumpfer Schlag and the melee/ranged Rüstungsbrecher maneuver JSON documents; repack with `npm run pack-all`.
- Documentation: maneuver section of `comp_packs/kurzuebersichten/_source/templates/kurzitpage003.html` and its packed journal source.
- Foundry API: reads the world registry through [`Game#settings`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings). The existing AppV2 `ManoeverSheet` rendering path is updated, but no Foundry Document API or Hook event is added or intercepted.
- Foundry utilities: no new `foundry.utils.*` helper is expected; the implementation must nevertheless check the community wiki before introducing any data-normalization helper.

## Testing Impact

- Unit: extend `scripts/combat/_spec/shared_dialog_helpers.test.js` for key preservation, registry labels, `STUMPF` exhaustion behavior, `TRUE_DAMAGE` armor behavior, and a missing-key warning/fallback.
- Unit: extend the maneuver-sheet tests to assert custom world damage types populate the selector, replacing the static options.
- Unit: add compendium assertions for the three migrated maneuvers and ensure no hard-coded `ARMOR_BREAKING`/`SPECIAL_TEXT` behavior remains.
- E2E: add a melee/ranged maneuver damage-type scenario in the dedicated GM baseline world with the existing controllable source and target actors; verify Stumpfer Schlag affects Erschöpfung, Rüstungsbrecher respects a registry armor-bypass type, and a deleted referenced key warns/falls back safely.
- Existing E2E combat and damage-type-settings cases remain regression cases. No player client is required; one GM, `HatAlles`, and `Testlauf-Npc` are sufficient. A shared E2E helper is only warranted if the registry mutation/restore sequence is reused by another case.
