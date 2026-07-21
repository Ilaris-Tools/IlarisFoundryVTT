## Context

The pre-effects damage type `<select>` in `pre-effects.hbs` has 2 hardcoded options. Spells need more — the spell exploration identified 11 relevant damage types. The setting must support fully custom types that don't exist in `CONFIG.ILARIS.schadenstypen`.

The IlarisSettingsDialog already has a General tab with checkboxes and a select. This is the first "editable list" setting in the dialog.

## Goals / Non-Goals

**Goals:**

- Store configurable `{value, label}` pairs as a world-scoped JSON setting named `damageTypes`
- Designed as a shared setting — first consumer is pre-effects, future consumers include weapons and combat dialogs
- Provide add/remove UI in IlarisSettingsDialog General tab
- Feed the setting into pre-effects template via `damageTypeOptions` context
- Support completely custom types with arbitrary value/label pairs

**Non-Goals:**

- Validating that damage types are recognized by the damage pipeline (GMs are responsible for choosing valid types)
- Changing how `_applyDamageDirectly` handles damage types
- Adding a "reset to defaults" button for just this setting (covered by global reset)

## Decisions

### Decision 1: Store `{value, label}` objects, not just keys

**Chosen**: JSON array of `{value, label}` objects. E.g., `[{"value":"PROFAN","label":"Profan (Wunden)"}]`.

**Rationale**: Custom types (ENERGIE, PSIONIC) won't have labels in `CONFIG.ILARIS.schadenstypen`. The setting is self-contained — no runtime label resolution needed. The default labels come from `CONFIG.ILARIS.schadenstypen` at proposal time only.

### Decision 2: Dynamic rows via re-render (Option A)

**Chosen**: Add/remove rows trigger `this.render()` — same pattern as the pre-effects sheet's add/delete change buttons.

**Rationale**: The pre-effects sheet already proves this works. The settings dialog has `_onRender` available for event listener setup. Simple and consistent.

**Alternative**: DOM-only manipulation. Rejected — adds complexity for no benefit in a low-frequency operation (settings changes).

### Decision 3: UI in General tab

**Chosen**: Add damage type list to the existing General tab in IlarisSettingsDialog.

**Rationale**: The General tab already has world-scoped gameplay settings (LEP-System, weapon space, hex tokens). Damage types are a similar category. No need for a new tab.

### Decision 4: Setting stored as JSON string

**Chosen**: `type: String` with JSON-serialized array. Same pattern as `fertigkeitenPacks`, `waffenPacks`, etc.

**Rationale**: Foundry settings don't natively support object arrays. JSON string is the established pattern in this codebase.

## API Surface

### Foundry settings API

- `game.settings.register('Ilaris', 'damageTypes', ...)` — register new setting

### No new hooks, no new Foundry classes

## Risks / Trade-offs

- **[Risk] Re-render on add/remove loses scroll position** → Mitigation: The settings dialog has `scrollable: ['']` on the General tab part. Acceptable UX for a settings page.
- **[Risk] Malformed JSON in setting** → Mitigation: Default value is always valid. `_prepareContext` wraps `JSON.parse` in try/catch, falls back to empty array.
- **[Trade-off] No per-type validation** → GMs can add any string. If they add a type the damage pipeline doesn't recognize, it'll be treated as PROFAN-like. This is acceptable — GM responsibility.
