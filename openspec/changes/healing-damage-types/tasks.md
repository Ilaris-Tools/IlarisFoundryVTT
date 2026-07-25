## 1. Config: Add healing damage types and update defaults

- [ ] 1.1 Add `HEALING_WOUND` and `HEALING_EXHAUSTION` labels to `CONFIG.ILARIS.schadenstypen` in `scripts/core/config.js`
- [ ] 1.2 Update the `damageTypes` setting default in `scripts/settings/configure-game-settings.js` to include `HEALING_WOUND` and `HEALING_EXHAUSTION` with `behavior` objects, add `behavior` to `STUMPF` (`{"targetsErschoepfung": true}`), and include `bypassesArmor: false` on all defaults
- [ ] 1.3 Update the world reset defaults in `scripts/settings/ilaris-settings.dialog.js` `#onResetSettings` to match the new default schema

## 2. Core Logic: Behavior lookup and healing refactor

- [ ] 2.1 Implement `getDamageTypeBehavior(damageType)` function in `scripts/combat/dialogs/shared-dialog-helpers.js` that reads `damageTypes` setting and returns `{healing, targetsErschoepfung, bypassesArmor}`
- [ ] 2.2 Refactor `_applyDamageDirectly` healing branch: replace `if (damage < 0)` with `if (behavior.healing)`, remove `Math.abs()`, use behavior-derived stat key
- [ ] 2.3 Refactor `_applyDamageDirectly` damage branch: replace `damageType === 'STUMPF'` string check with `behavior.targetsErschoepfung`, integrate `behavior.bypassesArmor` into `trueDamage` resolution (`trueDamage || bypassesArmor`)
- [ ] 2.4 Verify Foundry API docs (v14) for `game.settings.get` and `ChatMessage.create` signatures used in the refactored code

## 3. Settings UI: DialogV2 edit popup and read-only list

- [ ] 3.1 Update `_parseDamageTypes()` in `scripts/settings/ilaris-settings.dialog.js` to parse the `behavior` field from each entry
- [ ] 3.2 Update `ilaris-settings_general.hbs`: replace inline text inputs with read-only list showing label, key, behavior summary, and edit/delete buttons
- [ ] 3.3 Create `scripts/settings/templates/damage-type-dialog.hbs` template with key, label inputs and behavior checkboxes (healing, targetsErschoepfung, bypassesArmor)
- [ ] 3.4 Implement DialogV2-based edit popup handler in `ilaris-settings.dialog.js`: `_onRender` registers click handlers for edit/add buttons that render the `.hbs` template via `renderTemplate`, wrap in a trusted `div`, and open `DialogV2.input()`
- [ ] 3.5 Update the `#onSaveSettings` damage types collector to read from the stored list (read-only rows) and serialize behavior objects correctly
- [ ] 3.6 Verify Foundry API docs (v14) for `DialogV2.input()` configuration options and `renderTemplate`

## 4. Compendium Data: Update healing spells

- [ ] 4.1 Update `Balsam_Salabunde`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [ ] 4.2 Update `Geistheilung`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [ ] 4.3 Update `Hexenspeichel`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [ ] 4.4 Update `Lach_dich_gesund`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-2W6-4"` → `"2W6+4"`
- [ ] 4.5 Update `Tiere_besprechen`: `damageType: "PROFAN"` → `"HEALING_WOUND"`, `value: "-4W6-8"` → `"4W6+8"`
- [ ] 4.6 Run `npm run pack-all` to rebuild compendium packs

## 5. LLM Prompt: Update healing conventions

- [ ] 5.1 Update `scripts/effects/utils/llm-prompt-builder.js` system message: change "Heilung: value negativ, z.B. `\"-2W6-4\"`" to "Heilung: damageType `HEALING_WOUND` oder `HEALING_EXHAUSTION`, value positiv z.B. `\"2W6+4\"`"
- [ ] 5.2 Update the damage type list in the system message to include the new healing types and describe their behavior (including `bypassesArmor` for RS-ignoring spells like Ignifaxius)

## 6. Unit Tests

- [ ] 6.1 Add tests for `getDamageTypeBehavior` in `scripts/combat/_spec/shared_dialog_helpers.test.js`: known type, unknown type, malformed JSON, absent behavior defaults
- [ ] 6.2 Update healing test cases in `scripts/combat/_spec/shared_dialog_helpers.test.js`: replace `'PROFAN'` → `'HEALING_WOUND'` with positive values, replace `'STUMPF'` → `'HEALING_EXHAUSTION'` with positive values
- [ ] 6.3 Add test for custom type with `{healing: true, targetsErschoepfung: true}` heals Erschöpfung
- [ ] 6.4 Add test for `STUMPF` with `{targetsErschoepfung: true}` dealing Erschöpfung damage (not healing)
- [ ] 6.5 Add test for `PROFAN` (no behavior) dealing Wunden damage (not healing)
- [ ] 6.6 Add test for damage type with `{bypassesArmor: true}` using WS instead of WS\* for wound calculation
- [ ] 6.7 Mock `damageTypes` setting with behavior objects in all test `beforeEach` blocks
- [ ] 6.8 Update `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`: expected damage type list includes HEALING_WOUND and HEALING_EXHAUSTION

## 7. E2E Tests

- [ ] 7.1 Verify existing E2E cases that involve healing spells still pass after the compendium data change
- [ ] 7.2 Verify existing E2E cases that open the IlarisSettingsDialog General tab still render correctly with the new read-only damage types list
- [ ] 7.3 If no existing E2E case covers healing, create a new case: cast Balsam Salabunde → verify chat message shows healing with correct wound reduction

## 8. Build & Verify

- [ ] 8.1 Run `npm test` and ensure all tests pass
- [ ] 8.2 Run `npm run lint` and fix any issues
- [ ] 8.3 Run `npm run pack-all` to finalize compendium data
- [ ] 8.4 Manually test in Foundry: open settings → verify damage types list → edit a type with DialogV2 → save → verify persistence across reload
