## Why

The ActiveEffect config sheet (`IlarisActiveEffectConfig`) already provides autocomplete suggestions for `system.*` field paths in its changes tab. The pre-effects section on übernatürlich item sheets feeds into the same ActiveEffect system — but its `key` fields are plain text inputs with no autocomplete. GMs must memorize or look up the correct `system.*` paths when configuring pre-effect changes. Adding the same autocomplete removes this friction and prevents typos.

## What Changes

- **Extract field path collection to shared utility**: Move `#collectFieldPaths` and `#collectSchemaFieldPaths` from `IlarisActiveEffectConfig` into a new `scripts/effects/utils/field-path-collector.js` as a pure function `collectActorSystemPaths()`
- **Refactor `IlarisActiveEffectConfig`** to use the shared utility (cleanup, no behavioral change)
- **Add datalist injection to `UebernatuerlichTalentSheet._onRender()`**: Inject a `<datalist>` with the same `system.*` paths into the pre-effects section, attaching to all `changes[].key` input fields
- **Handle dynamic re-rendering**: The datalist is created once and re-attached to new inputs when changes are added/removed

## Capabilities

### New Capabilities

- `pre-effect-key-autocomplete`: Datalist-based autocomplete for pre-effects change key fields, backed by Actor data model field paths

### Modified Capabilities

- `active-effects`: `IlarisActiveEffectConfig` refactored to use shared utility (no requirement change, implementation cleanup only)

## Impact

- **NEW**: `scripts/effects/utils/field-path-collector.js` — `collectActorSystemPaths()` pure function
- **MODIFIED**: `scripts/effects/ilaris-effect-config.js` — use shared utility instead of private methods
- **MODIFIED**: `scripts/items/sheets/uebernatuerlich-talent.js` — add datalist injection in `_onRender()`
- **API surface**: `CONFIG.Actor.dataModels` (existing, read-only), `foundry.data.fields.SchemaField` (existing, type check)
