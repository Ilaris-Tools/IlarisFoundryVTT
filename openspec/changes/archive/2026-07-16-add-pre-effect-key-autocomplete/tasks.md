## 1. Extract shared field path collector utility

- [x] 1.1 Create `scripts/effects/utils/field-path-collector.js` with `export function collectActorSystemPaths()` that collects `system.*` leaf paths from `CONFIG.Actor.dataModels` recursively (same logic as `#collectFieldPaths` + `#collectSchemaFieldPaths`)
- [x] 1.2 Verify against Foundry API docs (v14) for `foundry.data.fields.SchemaField` type check

## 2. Refactor IlarisActiveEffectConfig to use shared utility

- [x] 2.1 Import `collectActorSystemPaths` in `ilaris-effect-config.js`
- [x] 2.2 Replace the collection loop in `#injectKeySuggestions()` with a call to `collectActorSystemPaths()`
- [x] 2.3 Remove `#collectFieldPaths` and `#collectSchemaFieldPaths` private methods
- [x] 2.4 Verify no behavioral change — datalist shows same paths as before

## 3. Add datalist autocomplete to pre-effects section

- [x] 3.1 Import `collectActorSystemPaths` in `uebernatuerlich-talent.js`
- [x] 3.2 In `_onRender()`, after `super._onRender()`, inject a `<datalist id="ilaris-pre-effect-keys">` into `.pre-effects-section` (guarded: only create if not already present)
- [x] 3.3 Populate datalist with `<option>` elements from `collectActorSystemPaths()`
- [x] 3.4 Attach `list="ilaris-pre-effect-keys"` to all `input[name$=".key"]` within `.pre-effects-section` (run on every render to cover newly added changes)

## 4. Validation

- [x] 4.1 Run `npm run lint` and fix any issues
- [x] 4.2 Run `npm test` and verify no regressions
- [ ] 4.3 Manually test: open a Zauber item sheet with pre-effects, add a change, verify the key field shows autocomplete suggestions matching the ActiveEffect config
- [ ] 4.4 Manually test: add/remove changes, verify new key inputs also have autocomplete
- [ ] 4.5 Manually test: open ActiveEffect config, verify autocomplete still works (no regression)
