## Why

Healing spells currently use `damageType: "PROFAN"` with negative values (e.g., `"-2W6-4"`) to heal wounds, and `damageType: "STUMPF"` to heal Erschöpfung. This is semantically confusing — "Profan" means mundane damage and "Stumpf" means blunt damage, neither suggesting healing. Additionally, the system determines which health pool to affect via hardcoded string comparisons (`damageType === 'STUMPF'`), which silently breaks if a GM renames the type in world settings.

## What Changes

- **BREAKING**: Add two new damage types: `HEALING_WOUND` and `HEALING_EXHAUSTION`, with positive values for healing amounts (e.g., `"2W6+4"` instead of `"-2W6-4"`)
- **BREAKING**: Extend the `damageTypes` setting schema from `{value, label}` to `{value, label, behavior: {healing, targetsErschoepfung}}` — a key-value map of boolean flags describing what a type does
- **BREAKING**: Replace hardcoded `damageType === 'STUMPF'` string checks in `_applyDamageDirectly` with behavioral lookups from the damage type registry
- **BREAKING**: Replace the `damage < 0` healing detection with `behavior.healing === true`
- When the damage-type registry is empty, malformed, or does not contain a referenced type, fall back safely to non-healing Wunden damage and warn once per missing type; the pre-effect selector remains empty and does not crash
- Add a `DialogV2` popup for editing individual damage types (key, label, behavior checkboxes), replacing inline text inputs in the settings page with a read-only list + edit button
- Update 5 healing spell compendium entries (`damageType: "PROFAN"` → `"HEALING_WOUND"`, negative → positive values)
- Update unit tests for the new behavioral logic and healing types
- Update the LLM pre-effect prompt to document the new healing type conventions

## Capabilities

### New Capabilities

- `damage-type-behavior`: Behavioral property map (`{healing, targetsErschoepfung}`) on each damage type entry in the `damageTypes` world setting, decoupling what a type is named from what it does

### Modified Capabilities

- `configurable-damage-types`: Setting schema extended with `behavior` object; settings UI replaced with read-only list + DialogV2 edit popup; default types include HEALING_WOUND and HEALING_EXHAUSTION
- `combat`: Healing detection switches from `damage < 0` to `behavior.healing`; stat selection switches from `damageType === 'STUMPF'` to `behavior.targetsErschoepfung`; healing spells use positive values
- `spell-pre-effect-data`: 5 healing spells updated to use `damageType: "HEALING_WOUND"` with positive values; healing value convention in compendium data changes from negative to positive

## Impact

| Area              | Affected Files                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Settings          | `configure-game-settings.js`, `ilaris-settings.dialog.js`, `ilaris-settings_general.hbs`, `configure-game-settings.model.js` |
| Settings UI (new) | New `damage-type-dialog.js` (DialogV2)                                                                                       |
| Combat logic      | `scripts/combat/dialogs/shared-dialog-helpers.js`                                                                            |
| Config            | `scripts/core/config.js` (`schadenstypen`)                                                                                   |
| Compendium data   | 5 entries in `comp_packs/zauberspruche-und-rituale/_source/`                                                                 |
| Unit tests        | `scripts/combat/_spec/shared_dialog_helpers.test.js`, `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`               |
| LLM prompt        | `scripts/effects/utils/llm-prompt-builder.js`                                                                                |
| Pre-effects       | `scripts/effects/pre-effects/pre-effects-processor.js` (verify, no logic change expected)                                    |

**Foundry API surfaces touched**: `DialogV2` (new usage for damage type editor), `game.settings.get`/`game.settings.set` (damageTypes read/write), `ChatMessage.create` (healing chat messages), `CONFIG.ILARIS.schadenstypen` (label fallback for chat messages).

## Testing Impact

### New Unit Test Scenarios

- Healing with `HEALING_WOUND` damage type and positive value reduces Wunden
- Healing with `HEALING_EXHAUSTION` damage type and positive value reduces Erschöpfung
- Custom type with `{healing: true, targetsErschoepfung: true}` heals Erschöpfung
- Damage with `PROFAN` (no healing flag) still deals Wunden-Schaden
- Damage with `STUMPF` (targetsErschoepfung flag) still deals Erschöpfung-Schaden
- Unknown damage type (missing from registry) falls back to Wunden + non-healing
- Empty damage-type registry (`[]`) falls back to Wunden + non-healing for existing references, warns once per referenced type, and leaves the pre-effect selector empty without crashing
- `behavior` object absent → all flags default to `false`

### Existing Unit Tests to Update

- `scripts/combat/_spec/shared_dialog_helpers.test.js`: Replace `'PROFAN'` → `'HEALING_WOUND'` in healing tests; replace `'STUMPF'` → `'HEALING_EXHAUSTION'` in Erschöpfung healing tests; update mock `damageTypes` setting to include behavior objects; update negative value assertions to positive
- `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`: Update expected damage type list

### New E2E Cases

- Cast Balsam Salabunde → verify chat message says "heilt" with correct wound reduction
- Open settings → edit damage type behavior → verify healing flag persists across save/reload
- Custom damage type with healing flag → apply via pre-effect → verify healing occurs

### Existing E2E Cases Affected

- `e2e/cases/e2e-003` (if it involves healing spells): verify behavior is unchanged
- Any case that opens the IlarisSettingsDialog General tab: verify the new damage types list renders
