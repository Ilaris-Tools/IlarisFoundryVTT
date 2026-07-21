## Why

The damage type dropdown in pre-effects is hardcoded with only 2 options (PROFAN, STUMPF). The system needs a configurable damage type list that serves multiple consumers — pre-effects today, weapon damage and combat dialogs in the future. Spells use elemental types (Feuer, Eis, Erz, Humus, Luft, Wasser), magical types (Magisch, Geweiht, Dämonisch), and house rules introduce custom ones (ENERGIE, EXPLOSION, PSIONIC). The spell pre-effect data population (`add-spell-pre-effects`) depends on having the right damage types available.

## What Changes

- **New world setting `damageTypes`**: JSON array of `{value, label}` objects. Default: 11 types (PROFAN, STUMPF, MAGISCH, GEWEIHT, DAEMONISCH, FEUER, EIS, ERZ, HUMUS, LUFT, WASSER). Fully customizable — GMs can replace the entire list. Designed as a shared setting for future consumers (weapons, combat dialogs).
- **Setting UI in IlarisSettingsDialog**: Editable list with add/remove rows, each with a key input and label input. Uses the same dynamic-row pattern as the pre-effects sheet.
- **First consumer: pre-effects template**: `UebernatuerlichTalentSheet._prepareContext()` reads the setting and passes `damageTypeOptions` to the template. Template replaces hardcoded `<option>` tags with `{{#each damageTypeOptions}}` loop.

## Capabilities

### New Capabilities

- `configurable-damage-types`: Shared world setting for damage types, with UI in IlarisSettingsDialog. First consumer is the pre-effects template; designed to serve weapons and combat dialogs later.

### Modified Capabilities

None — purely additive.

## Impact

- **`scripts/settings/configure-game-settings.model.js`**: Add `damageTypes` to `IlarisGameSettingNames`
- **`scripts/settings/configure-game-settings.js`**: Register new world setting with JSON default
- **`scripts/settings/ilaris-settings.dialog.js`**: Add damage type list UI to General tab + save/reset logic
- **`scripts/settings/templates/ilaris-settings_general.hbs`**: Add editable list section
- **`scripts/items/sheets/uebernatuerlich-talent.js`**: Read setting in `_prepareContext()`, pass `damageTypeOptions`
- **`scripts/items/templates/pre-effects.hbs`**: Replace hardcoded `<select>` with dynamic loop
