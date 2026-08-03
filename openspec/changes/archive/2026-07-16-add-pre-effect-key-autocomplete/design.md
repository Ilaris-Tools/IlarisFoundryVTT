## Context

`IlarisActiveEffectConfig.#injectKeySuggestions()` collects `system.*` field paths from `CONFIG.Actor.dataModels` and creates a `<datalist>` for autocomplete on the ActiveEffect config's changes tab. The pre-effects section on übernatürlich item sheets (`UebernatuerlichTalentSheet`) feeds into the same ActiveEffect system — pre-effects ultimately create `IlarisActiveEffect` instances with the same `system.*` keys. But the pre-effects `key` field has no autocomplete.

The field path collection logic is currently locked inside private methods (`#injectKeySuggestions`, `#collectFieldPaths`, `#collectSchemaFieldPaths`) on `IlarisActiveEffectConfig`, making it inaccessible from other classes.

Foundry VTT v14 has no built-in Handlebars helper for `<datalist>` — only `selectOptions` for `<select>` elements. The autocomplete must be implemented via JS DOM manipulation in `_onRender()`.

## Goals / Non-Goals

**Goals:**

- Extract field path collection to a shared utility so both `IlarisActiveEffectConfig` and `UebernatuerlichTalentSheet` can use it
- Add `<datalist>` autocomplete to pre-effects change `key` fields with the same `system.*` paths
- Handle dynamic re-rendering (changes added/removed via "Add Change" / "Delete Change" buttons)
- Refactor `IlarisActiveEffectConfig` to use the shared utility (no behavioral change)

**Non-Goals:**

- Changing the pre-effects template (no new Handlebars helpers; datalist is injected via JS)
- Adding autocomplete to any other fields (value, maechtigBonus, etc.)
- Persisting datalist options across sheet re-opens (paths are re-collected from data models each render — stateless, no stale data)
- Adding a Handlebars-based `<datalist>` helper to the core (Foundry doesn't have one, and this is a single-use case)

## Decisions

### Decision 1: Extract to shared utility rather than duplicate

**Chosen**: Create `scripts/effects/utils/field-path-collector.js` with `export function collectActorSystemPaths()`. Both classes import it.

**Rationale**: The path collection is pure (no `this`, no state). Duplicating 30 lines across two files is maintenance debt. Extracting to a utility is low-risk and self-documenting.

**Alternative considered**: Copy the private methods into `UebernatuerlichTalentSheet`. Rejected — "don't repeat yourself" applies cleanly here.

### Decision 2: Selector uses `input[name$=".key"]` (attribute-ends-with)

**Chosen**: `input[name$=".key"]` to find all key inputs in the pre-effects section.

**Rationale**: The ActiveEffect config template (Foundry core) wraps key fields in `<div class="key">`, allowing `.key input`. Pre-effects has no such wrapper — the input sits directly in `<div class="form-group">`. The `$=` attribute selector matches any input whose `name` attribute ends with `.key`, which uniquely identifies key fields across all nesting levels.

### Decision 3: Datalist created once, re-attached on re-renders

**Chosen**: Check for existing datalist by ID (`#ilaris-pre-effect-keys`) before creating. Always re-query and re-attach `list` attribute to all key inputs on each `_onRender`.

**Rationale**: `submitOnChange: true` means `_onRender` fires on every field edit. Creating a new datalist each time would accumulate DOM elements. Guarding with `querySelector('#ilaris-pre-effect-keys')` prevents duplicates. Re-attaching `list` on every render handles the case where "Add Change" created new inputs.

### Decision 4: Datalist scoped to pre-effects section, not whole sheet

**Chosen**: Append `<datalist>` to `.pre-effects-section` and query key inputs within that section.

**Rationale**: Keeps DOM changes minimal and scoped. Prevents accidental attachment to other inputs on the sheet that happen to match the selector.

## API Surface

### Foundry classes used

- `CONFIG.Actor.dataModels` — read-only access to registered Actor data model classes (existing)
- `foundry.data.fields.SchemaField` — type check for recursive field path collection (existing)

### Hook events

- None triggered or listened to (pure DOM manipulation in `_onRender`)

### Foundry utils

- `foundry.utils.deepClone` — already used in `_onRender` (existing, no change)

## Risks / Trade-offs

- **[Risk] New utility module path doesn't match existing patterns** → Mitigation: `scripts/effects/utils/` follows the existing `scripts/waffe/properties/utils/` pattern of feature-scoped utilities
- **[Risk] `_onRender` performance on every keystroke** → Mitigation: The re-attach loop is trivial (querySelectorAll + setAttribute on <20 elements). No measurable impact.
- **[Trade-off] Datalist is purely client-side** → Same as ActiveEffect config. No server involvement needed.
