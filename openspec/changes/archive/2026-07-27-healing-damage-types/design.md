## Context

The Ilaris system currently uses `damageType` field conventions to determine healing behavior: negative value = healing, `STUMPF` type = affects Erschöpfung. This conflates two concerns (damage/healing direction and health pool selection) into string comparisons against damage type identifiers. If a GM renames `"STUMPF"` in world settings, both damage and healing silently break — the system applies effects to the wrong stat with no error.

The proposal introduces dedicated healing damage types (`HEALING_WOUND`, `HEALING_EXHAUSTION`) with behavioral properties and positive healing values, replacing the fragile string-matching and negative-value conventions.

## Goals / Non-Goals

**Goals:**

- Replace hardcoded `damageType === 'STUMPF'` checks with behavioral property lookups from the `damageTypes` world setting
- Replace `damage < 0` healing detection with `behavior.healing === true`
- Allow healing spell values to be positive (e.g., `"2W6+4"` instead of `"-2W6-4"`)
- Provide an extensible `behavior` map on each damage type entry
- Provide a DialogV2-based edit UI for damage type editing (key, label, behavior)

**Non-Goals:**

- Changing weapon property handling (weapon `stumpf` is separate from damage type `STUMPF`)
- Adding Foundry Items for damage types (world setting remains the registry)
- Changing the pre-effects data model beyond `damageType` values
- Changing how `schadenstypen` labels appear in damage chat messages (these still use `CONFIG.ILARIS.schadenstypen`)

## Decisions

### Decision 1: Behavior map as `{healing, targetsErschoepfung}` object

**Chosen**: A `behavior` object with boolean flags on each damage type entry:

```json
{
    "value": "HEALING_WOUND",
    "label": "Heilung (Wunden)",
    "behavior": { "healing": true, "targetsErschoepfung": false, "bypassesArmor": false }
}
```

Current flags:
| Flag | Default | Effect |
|---|---|---|
| `healing` | `false` | Positive value = healing instead of damage |
| `targetsErschoepfung` | `false` | Affects Erschöpfung instead of Wunden |
| `bypassesArmor` | `false` | Uses WS instead of WS\* for wound calculation (Rüstung ignorieren) |

**Alternatives considered**:

- _Two separate boolean fields at top level_: Rejected because adding future behavioral flags (e.g., `bypassesArmor`, `affectsMorale`) would pollute the top-level schema. A nested `behavior` map is self-documenting and easily extended.
- _Single enum string_ (e.g., `mode: "damage_wounds"`): Rejected because orthogonal concerns (healing vs damage, Wunden vs Erschöpfung) would combinatorially explode the enum.

**Rationale**: The map approach treats behavioral properties as independent orthogonal flags. Future extensions (e.g., `affectsMorale`, stacking behavior modifiers) can add new keys without changing the existing schema.

### Decision 2: Default behavior when `behavior` key is absent

**Chosen**: Absent or `undefined` `behavior` → all flags default to `false`. This means:

- `healing: false` → value is damage (not healing)
- `targetsErschoepfung: false` → affects Wunden

**Rationale**: Backward compatible with the old schema `{value, label}` (no `behavior` key). Existing damage types like `PROFAN`, `FEUER`, `EIS` continue to work as Wunden-Schaden without modification.

### Decision 3: Positive values for healing

**Chosen**: Healing spells use positive values with `behavior.healing: true`. The `_applyDamageDirectly` function checks `isHealing` instead of `damage < 0`.

**Before**:

```json
{ "value": "-2W6-4", "damageType": "PROFAN" }
```

**After**:

```json
{ "value": "2W6+4", "damageType": "HEALING_WOUND" }
```

**Rationale**: The negative-value convention was a workaround because the damage type had no way to signal "this is healing." With `behavior.healing`, the value naturally represents the healing amount — no sign inversion needed.

### Decision 4: Settings UI — read-only list + DialogV2 edit popup (Option A)

**Chosen**: The IlarisSettingsDialog General tab shows a read-only list of damage types (label, summary of behavior). Each row has an "Edit" button that opens a `DialogV2.input()` dialog with key, label, and behavior checkboxes.

**Template for read-only list**:

```hbs
<div class='damage-type-list'>
    {{#each damageTypes}}
        <div class='damage-type-row flexrow'>
            <span class='type-label'>{{label}}</span>
            <span class='type-key'>{{value}}</span>
            <span class='type-behavior'>
                {{#if behavior.healing}}Heilung{{else}}Schaden{{/if}}
                ·
                {{#if behavior.targetsErschoepfung}}Erschöpfung{{else}}Wunden{{/if}}
            </span>
            <button class='edit-damage-type' data-index='{{@index}}'>✎</button>
            <button class='delete-damage-type' data-index='{{@index}}'>✕</button>
        </div>
    {{/each}}
    <button class='add-damage-type'>+ Typ hinzufügen</button>
</div>
```

**Handlebars template** for the DialogV2 content — `scripts/settings/templates/damage-type-dialog.hbs`:

```hbs
<div class="form-group">
  <label>Key (Wert):</label>
  <input name="value" value="{{value}}" required>
</div>
<div class="form-group">
  <label>Anzeigename:</label>
  <input name="label" value="{{label}}" required>
</div>
<fieldset>
  <legend>Verhalten</legend>
  <label><input type="checkbox" name="healing" {{#if behavior.healing}}checked{{/if}}> Heilung (statt Schaden)</label>
  <label><input type="checkbox" name="targetsErschoepfung" {{#if behavior.targetsErschoepfung}}checked{{/if}}> Betrifft Erschöpfung (statt Wunden)</label>
</fieldset>
```

**DialogV2 invocation** — renders the template via `renderTemplate`, then wraps in a trusted `div`:

```js
import { renderTemplate } from '../../helpers/template-loader.js'

const templatePath = 'systems/Ilaris/scripts/settings/templates/damage-type-dialog.hbs'
const html = await renderTemplate(templatePath, {
    value: existing?.value || '',
    label: existing?.label || '',
    behavior: existing?.behavior || {},
})

const content = document.createElement('div')
content.innerHTML = html

const result = await DialogV2.input({
    window: { title: existing ? 'Schadenstyp bearbeiten' : 'Neuer Schadenstyp' },
    content,
    ok: { label: 'Übernehmen' },
})
```

**Alternatives considered**:

- _Option B: Full DialogV2 list + sub-dialog_: Rejected because DialogV2 is not designed for nested application-like UIs. Keeping the list in the settings page maintains the existing pattern where all settings are in one place.
- _Inline checkboxes in settings page_: Rejected because checkboxes in a dynamic add/delete list are fragile in Handlebars and prone to index-mismatch bugs.

### Decision 5: Behavior lookup function

**Chosen**: A shared utility function that reads the `damageTypes` setting and returns the behavior for a given type. Uses a string-comparison cache to avoid re-parsing JSON on every call, and warns once per session when an unknown type is encountered:

```js
let _cachedRaw = null
let _cachedTypes = null
const _warnedTypes = new Set()

/**
 * Get the behavior flags for a damage type from the world setting.
 * Parses the setting only when it has changed since the last call.
 * Warns once per session when the type is not found in the registry.
 * @param {string} damageType - The damage type value (e.g., "HEALING_WOUND")
 * @returns {{healing: boolean, targetsErschoepfung: boolean}}
 */
export function getDamageTypeBehavior(damageType) {
    try {
        const raw = game.settings.get('Ilaris', 'damageTypes')
        if (raw !== _cachedRaw) {
            _cachedTypes = JSON.parse(raw || '[]')
            _cachedRaw = raw
        }
        const dt = _cachedTypes.find((t) => t.value === damageType)
        if (!dt && !_warnedTypes.has(damageType)) {
            _warnedTypes.add(damageType)
            ui.notifications.warn(
                `Schadenstyp "${damageType}" existiert nicht in den Einstellungen. ` +
                    `Standard (Profan / Wunden) wird verwendet.`,
            )
        }
        return {
            healing: dt?.behavior?.healing ?? false,
            targetsErschoepfung: dt?.behavior?.targetsErschoepfung ?? false,
        }
    } catch {
        return { healing: false, targetsErschoepfung: false }
    }
}
```

**Rationale**: Single source of truth for the behavior lookup. The cache avoids re-parsing JSON across multiple targets. The per-session warning set makes the problem visible when a GM removes a damage type that spells still reference, without flooding the UI on repeated hits.

### Decision 6: Wound formula — healing/damage symmetry and damage safeguard

**Chosen**: Healing and damage use the **same** wound threshold formula: the value must **exceed** WS (or WS\*) to cause or heal a wound, not just equal it.

```js
// Unified formula for both paths:
const woundsToAdd = value > threshold ? Math.floor((value - 1) / threshold) : 0

// Damage path uses this with WS* (or WS if bypassesArmor):
const threshold = trueDamage || bypassesArmor ? ws : ws_stern
const wounds =
    Math.max(0, damage) > threshold ? Math.floor((Math.max(0, damage) - 1) / threshold) : 0

// Healing path uses WS only (healing inherently bypasses armor):
const woundsToRemove = healAmount > ws ? Math.floor((healAmount - 1) / ws) : 0
```

Key points:

- **Healing formula fixed**: Previously `Math.floor(healAmount / ws)` allowed healing at exactly WS. Now uses `Math.floor((healAmount - 1) / ws)`, requiring healAmount > WS — same threshold logic as damage. Symmetrical and intuitive.
- **Damage safeguard**: `Math.max(0, damage)` ensures damage never goes negative. Previously impossible because negative damage was the healing signal; now that healing uses `behavior.healing`, the damage path can safely clamp.
- **Healing always uses WS**: Unlike damage (where `bypassesArmor` toggles WS vs WS\*), healing always ignores armor. The threshold for healing is always WS. This is correct: Balsam and Fulminictus both heal against WS.

This replaces the two hardcoded `damageType === 'STUMPF'` checks and the `damage < 0` guard in `_applyDamageDirectly`.

### Decision 7: Warning on unknown damage types

**Chosen**: When `getDamageTypeBehavior` does not find the requested damage type in the registry (see Decision 5 for implementation), it applies the safe default (Wunden-Schaden) but also issues a `ui.notifications.warn` once per damage type per session. This alerts the GM that a spell or weapon references a damage type that no longer exists in the settings.

**Rationale**: Silent fallback is a debugging nightmare — the GM changes their damage type list and suddenly healing spells deal damage instead, with no indication why. A one-time warning per type makes the problem visible without flooding the UI. The `Set` resets on page reload (module re-evaluation), which is the right granularity: the GM sees the warning at least once after changing settings.

## API Surface

### Foundry Classes Used

- `DialogV2` (new): `DialogV2.input()` for damage type edit popup
    - https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html

### Foundry Utilities

- `game.settings.get('Ilaris', 'damageTypes')` — read damage type registry
- `game.settings.set('Ilaris', 'damageTypes', json)` — write damage type registry
- `foundry.utils.randomID(16)` — already used in `routeDamageToOwner`

### No New Hooks

- No Hook events are added, listened to, or triggered by this change

## Risks / Trade-offs

- **[Risk] World setting JSON parsing on every damage application**: `getDamageTypeBehavior` reads `damageTypes` on every call. In an AoE spell hitting 5 targets, that's 5 `game.settings.get` + 5 `JSON.parse` calls for the same unchanged setting.
  → **Mitigation**: Cache the parsed array by comparing the raw setting string. `JSON.parse` only re-runs when the setting value actually changes — otherwise it's a cheap string equality check and an array `.find()`. This keeps the per-target overhead to O(n) array lookup (n ≈ 13) with no allocations.

- **[Risk] STUMPF damage type rename by GM**: If a GM renames `"STUMPF"` to something else, spells or maneuvers dealing Erschöpfung damage would lose their targeting behavior unless they use the new behavioral flag.
  → **Mitigation**: The whole point of this change. With behavioral properties, the GM keeps `targetsErschoepfung: true` on their renamed type and it continues to work. The value string no longer matters.

## Future Considerations

- **Converging weapon/spell/maneuver damage**: Weapons currently use `damageType = 'NORMAL'` regardless of weapon properties. Spells use the configurable `damageTypes` registry via pre-effects. Maneuvers have their own damage type handling in `handleModifications()`. A future change should consider unifying all three under the behavioral lookup system so that weapon properties like "Stumpf" could set `targetsErschoepfung` behavior, and damage type labels consistently appear in chat messages across all attack types.

## Testing Strategy

### Testable Units

| Unit                                    | Location                                | Test Pattern                             |
| --------------------------------------- | --------------------------------------- | ---------------------------------------- |
| `getDamageTypeBehavior`                 | `shared-dialog-helpers.js` (new export) | Pure function (mock `game.settings.get`) |
| `_applyDamageDirectly` — healing branch | `shared-dialog-helpers.js`              | Dynamic import (jest.isolateModules)     |
| `_applyDamageDirectly` — damage branch  | `shared-dialog-helpers.js`              | Dynamic import (jest.isolateModules)     |
| `_parseDamageTypes`                     | `ilaris-settings.dialog.js`             | Pure function (mock `game.settings.get`) |

### Unit Test Scenarios

- `getDamageTypeBehavior('HEALING_WOUND')` returns `{healing: true, targetsErschoepfung: false}`
- `getDamageTypeBehavior('PROFAN')` returns `{healing: false, targetsErschoepfung: false}`
- `getDamageTypeBehavior('UNKNOWN')` returns `{healing: false, targetsErschoepfung: false}`
- `getDamageTypeBehavior` with malformed JSON returns `{healing: false, targetsErschoepfung: false}`
- Healing with `HEALING_WOUND` + positive value → reduces Wunden
- Healing with `HEALING_EXHAUSTION` + positive value → reduces Erschöpfung
- Damage with `STUMPF` (targetsErschoepfung: true) → deals to Erschöpfung
- Custom type `{healing: true, targetsErschoepfung: true}` → heals Erschöpfung

### Existing Tests to Update

- `scripts/combat/_spec/shared_dialog_helpers.test.js`:
    - Replace `'PROFAN'` → `'HEALING_WOUND'` in healing test cases
    - Replace `'STUMPF'` → `'HEALING_EXHAUSTION'` in Erschöpfung healing test
    - Mock `damageTypes` setting with behavior objects
    - Update negative value assertions → positive values
- `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`:
    - Update expected damage type list to include HEALING_WOUND and HEALING_EXHAUSTION

### E2E Coverage

- Cast Balsam Salabunde → verify correct wound healing in chat
- Open settings → edit damage type behavior → save → verify persists across reload
- Custom damage type with healing flag → apply via pre-effect → verify healing
- Regression: existing damage spells (Ignifaxius) still apply correct damage
