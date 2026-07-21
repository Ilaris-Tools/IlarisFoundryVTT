## 1. Register new world setting

- [x] 1.1 Add `damageTypes` to `IlarisGameSettingNames` in `configure-game-settings.model.js`
- [x] 1.2 Register setting in `configure-game-settings.js` with type `String`, scope `world`, and JSON default of 11 types
- [x] 1.3 Verify against Foundry API docs (v14) for `game.settings.register()`

## 2. Add setting UI to IlarisSettingsDialog

- [x] 2.1 In `_prepareContext()`, parse `damageTypes` setting and pass `damageTypes` array to context
- [x] 2.2 Add editable list section to `ilaris-settings_general.hbs` template with `{{#each damageTypes}}` rows, each with key input, label input, and delete button, plus an "Add" button
- [x] 2.3 In `_onRender()`, add click listeners for add/delete buttons (re-render on change)
- [x] 2.4 In `#onSaveSettings`, collect all rows, serialize to JSON, save to setting
- [x] 2.5 In `#onResetSettings`, reset to the default 11 types

## 3. Feed into pre-effects sheet context

- [x] 3.1 In `UebernatuerlichTalentSheet._prepareContext()`, read `damageTypes` setting, parse JSON, pass as `damageTypeOptions` to context (with try/catch fallback)

## 4. Update pre-effects template

- [x] 4.1 In `pre-effects.hbs`, replace hardcoded `<option value="PROFAN">` / `<option value="STUMPF">` with `{{#each @root.damageTypeOptions}}` loop rendering `<option value="{{value}}" {{#if (ifEq value ../../damageType)}}selected{{/if}}>{{label}}</option>`

## 5. Validation

- [x] 5.1 Run `npm run lint` and fix any issues
- [x] 5.2 Run `npm test` and verify no regressions
- [ ] 5.3 Manually test: open Ilaris settings, verify damage type list shows 11 defaults with add/delete buttons
- [ ] 5.4 Manually test: add a custom type, save, reopen — verify it persists
- [ ] 5.5 Manually test: open a Zauber sheet, verify damage type dropdown shows configured types
- [ ] 5.6 Manually test: reset settings, verify defaults are restored
