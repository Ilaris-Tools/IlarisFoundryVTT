## 1. API and Existing-Flow Verification

- [x] 1.1 Verify [`Game#settings`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings) and the existing AppV2 item-sheet rendering path against Foundry API docs (v14) before changing registry reads or sheet context.
- [x] 1.2 Check foundryvtt.wiki for world-setting, JSON registry, and relevant `foundry.utils.*` patterns before introducing or changing resolver normalization.
- [x] 1.3 Trace `CHANGE_DAMAGE_TYPE`, `damageType`, `trueDamage`, and `getDamageTypeBehavior()` from maneuver selection through melee/ranged damage application; record every current static-label and hard-coded bypass use.

## 2. Registry-Backed Damage Resolution

- [x] 2.1 Refactor the shared damage-type resolver so consumers receive the effective registry key, configured label, behavior flags, and missing-reference status without storing a display label as the damage identity.
- [x] 2.2 Preserve the German missing-type warning and safe `PROFAN` fallback; reset the warning cache when the raw `damageTypes` world-setting value changes.
- [x] 2.3 Update `CHANGE_DAMAGE_TYPE` processing to display the resolved label in the maneuver summary while storing the canonical key in `rollValues.damageType`.
- [x] 2.4 Initialize ordinary melee and ranged attack damage as `PROFAN`, and remove any execution-path dependency on the legacy `NORMAL` marker.
- [x] 2.5 Verify changed world-setting access against Foundry API docs (v14).
- [x] 2.6 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before finalizing cache and registry normalization code.

## 3. Maneuver Authoring and Built-In Data

- [x] 3.1 Expose the inherited world-registry `damageTypeOptions` in `ManoeverSheet` and render them in the `CHANGE_DAMAGE_TYPE` selector instead of static config entries.
- [x] 3.2 Verify AppV2 item-sheet context/template behavior against Foundry API docs (v14).
- [x] 3.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding any maneuver-option normalization.
- [x] 3.4 Update Stumpfer Schlag to retain `CHANGE_DAMAGE_TYPE: STUMPF` as a registry key.
- [x] 3.5 Update melee and ranged Rüstungsbrecher to use `CHANGE_DAMAGE_TYPE: TRUE_DAMAGE`, removing obsolete `ARMOR_BREAKING` and armor-bypass-only `SPECIAL_TEXT` modifications.
- [x] 3.6 Update the German maneuver quick reference to describe registry-controlled damage-type behavior rather than a chat-only Rüstungsbrecher special effect.
- [x] 3.7 Run `npm run pack-all` after modifying maneuver and journal `_source/` data.

## 4. Unit Tests

- [x] 4.1 Extend `scripts/combat/_spec/shared_dialog_helpers.test.js` for canonical key retention, registry-label summaries, `STUMPF` exhaustion behavior, `TRUE_DAMAGE` armor behavior, missing-key fallback, and warning-cache refresh after a settings change.
- [x] 4.2 Extend `scripts/items/sheets/_spec/manoever.spec.js` for custom world-registry options in the maneuver `CHANGE_DAMAGE_TYPE` selector.
- [x] 4.3 Extend or create maneuver compendium source-data tests for Stumpfer Schlag and both Rüstungsbrecher records, asserting canonical keys and no obsolete hard-coded bypass modifications.
- [x] 4.4 Run `npm install` and the focused unit suites.

## 5. E2E Tests

- [x] 5.1 Add a GM baseline-world E2E scenario proving Stumpfer Schlag produces the `STUMPF`/Erschöpfung outcome through the normal maneuver combat path.
- [x] 5.2 Add an E2E scenario proving both Rüstungsbrecher behavior and a temporarily removed referenced type: armor bypass uses the registry flag when present, then warns and falls back to Profan/Wunden when absent.
- [x] 5.3 Restore all changed world settings and actor state after each E2E case; promote registry snapshot/restore to `e2e/shared/` only if another suite reuses it.
- [x] 5.4 Run the new and affected maneuver/damage-type E2E cases in the dedicated baseline world with a GM, `HatAlles`, and `Testlauf-Npc`.

## 6. Final Validation

- [x] 6.1 Run `npm test`.
- [x] 6.2 Run `npm run lint`.
- [x] 6.3 Run `npm run pack-all`, reload Foundry, and confirm the three built-in maneuver records and updated quick reference are available.
- [x] 6.4 Run `openspec validate add-maneuver-damage-types --strict`.
