## 1. Config: Add healing damage types and update defaults

- [x] 1.1 Add `HEALING_WOUND` and `HEALING_EXHAUSTION` labels to `CONFIG.ILARIS.schadenstypen` in `scripts/core/config.js`
- [x] 1.2 Update the `damageTypes` setting default in `scripts/settings/configure-game-settings.js` to include `HEALING_WOUND` and `HEALING_EXHAUSTION` with `behavior` objects, add `behavior` to `STUMPF` (`{"targetsErschoepfung": true}`), and include `bypassesArmor: false` on all defaults
- [x] 1.3 Update the world reset defaults in `scripts/settings/ilaris-settings.dialog.js` `#onResetSettings` to match the new default schema

## 2. Core Logic: Behavior lookup and healing refactor

- [x] 2.1 Implement `getDamageTypeBehavior(damageType)` function in `scripts/combat/dialogs/shared-dialog-helpers.js` that reads `damageTypes` setting and returns `{healing, targetsErschoepfung, bypassesArmor}`
- [x] 2.2 Refactor `_applyDamageDirectly` healing branch: replace `if (damage < 0)` with `if (behavior.healing)`, remove `Math.abs()`, use behavior-derived stat key
- [x] 2.3 Refactor `_applyDamageDirectly` damage branch: replace `damageType === 'STUMPF'` string check with `behavior.targetsErschoepfung`, integrate `behavior.bypassesArmor` into `trueDamage` resolution (`trueDamage || bypassesArmor`)
- [x] 2.4 Handle an empty `damageTypes` registry (`[]`) like an unknown type: return all behavior flags as `false`, apply Wunden damage for existing references, and warn once per referenced type
- [x] 2.5 Verify Foundry API docs (v14) for `game.settings.get` and `ChatMessage.create` signatures used in the refactored code

## 3. Settings UI: DialogV2 edit popup and read-only list

- [x] 3.1 Update `_parseDamageTypes()` in `scripts/settings/ilaris-settings.dialog.js` to parse the `behavior` field from each entry
- [x] 3.2 Update `ilaris-settings_general.hbs`: replace inline text inputs with read-only list showing label, key, behavior summary, and edit/delete buttons
- [x] 3.3 Create `scripts/settings/templates/damage-type-dialog.hbs` template with key, label inputs and behavior checkboxes (healing, targetsErschoepfung, bypassesArmor)
- [x] 3.4 Implement DialogV2-based edit popup handler in `ilaris-settings.dialog.js`: `_onRender` registers click handlers for edit/add buttons that render the `.hbs` template via `renderTemplate`, wrap in a trusted `div`, and open `DialogV2.input()`
- [x] 3.5 Update the `#onSaveSettings` damage types collector to read from the stored list (read-only rows) and serialize behavior objects correctly
- [x] 3.6 Verify Foundry API docs (v14) for `DialogV2.input()` configuration options and `renderTemplate`

## 4. Compendium Data: Update healing spells

- [x] 4.1 Update `Balsam_Salabunde`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [x] 4.2 Update `Geistheilung`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [x] 4.3 Update `Hexenspeichel`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [x] 4.4 Update `Lach_dich_gesund`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [x] 4.5 Update `Tiere_besprechen`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-4W6-8"` → `"4W6+8"`
- [x] 4.6 Run `npm run pack-all` to rebuild compendium packs

## 5. LLM Prompt: Update healing conventions

- [x] 5.1 Update `scripts/effects/utils/llm-prompt-builder.js` system message: change "Heilung: value negativ, z.B. `\"-2W6-4\"`" to "Heilung: damageType `HEALING_WOUND` oder `HEALING_EXHAUSTION`, value positiv z.B. `\"2W6+4\"`"
- [x] 5.2 Update the damage type list in the system message to include the new healing types and describe their behavior (including `bypassesArmor` for RS-ignoring spells like Ignifaxius)

## 6. Unit Tests

- [x] 6.1 Add tests for `getDamageTypeBehavior` in `scripts/combat/_spec/shared_dialog_helpers.test.js`: known type, unknown type, empty registry (`[]`), malformed JSON, absent behavior defaults
- [x] 6.2 Update healing test cases in `scripts/combat/_spec/shared_dialog_helpers.test.js`: replace `'PROFAN'` → `'HEALING_WOUND'` with positive values, replace `'STUMPF'` → `'HEALING_EXHAUSTION'` with positive values
- [x] 6.3 Add test for custom type with `{healing: true, targetsErschoepfung: true}` heals Erschöpfung
- [x] 6.4 Add test for `STUMPF` with `{targetsErschoepfung: true}` dealing Erschöpfung damage (not healing)
- [x] 6.5 Add test for `PROFAN` (no behavior) dealing Wunden damage (not healing)
- [x] 6.6 Add test for damage type with `{bypassesArmor: true}` using WS instead of WS\* for wound calculation
- [x] 6.7 Mock `damageTypes` setting with behavior objects in all test `beforeEach` blocks
- [x] 6.8 Update `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`: expected damage type list includes HEALING_WOUND and HEALING_EXHAUSTION
- [x] 6.9 Add a pre-effect selector test for an empty `damageTypes` registry in `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js`: it renders no options and does not crash

## 7. E2E Tests

- [x] 7.1 Verify existing E2E cases that involve healing spells still pass after the compendium data change (no existing healing case; E2E-030 provides this coverage)
- [x] 7.2 Verify existing E2E cases that open the IlarisSettingsDialog General tab still render correctly with the new read-only damage types list (verified by E2E-031 against a live Foundry world)
- [x] 7.3 If no existing E2E case covers healing, create a new case: cast Balsam Salabunde → verify chat message shows healing with correct wound reduction

## 8. Build & Verify

- [x] 8.1 Run `npm test` and ensure all tests pass
- [x] 8.2 Run `npm run lint` and fix any issues
- [x] 8.3 Run `npm run pack-all` to finalize compendium data
- [x] 8.4 Manually test in Foundry: open settings → verify damage types list → edit a type with DialogV2 → save → verify persistence across reload (verified by E2E-031 against a live Foundry world)
