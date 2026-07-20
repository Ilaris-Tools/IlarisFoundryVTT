## 1. Create `toArray()` tests — `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js`

- [ ] 1.1 Create test file with `import { toArray }` from `pre-effects-processor.js`
- [ ] 1.2 Test: array passes through unchanged
- [ ] 1.3 Test: ObjectField `{0:{a}, 1:{b}}` → `[{a}, {b}]`
- [ ] 1.4 Test: `null` → `[]`, `undefined` → `[]`
- [ ] 1.5 Test: `{}` → `[]`

## 2. Create `collectActorSystemPaths()` tests — `scripts/effects/utils/_spec/field-path-collector.spec.js`

- [ ] 2.1 Create test file with `import { collectActorSystemPaths }`
- [ ] 2.2 Mock `global.CONFIG.Actor.dataModels` with fake model classes using `Object.defineProperty` for `SchemaField`
- [ ] 2.3 Test: returns sorted deduplicated paths from flat schema
- [ ] 2.4 Test: handles nested SchemaField recursion
- [ ] 2.5 Test: returns `[]` for empty/undefined `CONFIG.Actor.dataModels`

## 3. Add `_applyDamageDirectly` healing tests — extend `scripts/combat/_spec/shared_dialog_helpers.test.js`

- [ ] 3.1 Import `_applyDamageDirectly` from `shared-dialog-helpers.js`
- [ ] 3.2 Add `global.ChatMessage.create = jest.fn()` and `global.CONST.CHAT_MESSAGE_STYLES = {OTHER: 0}` in `beforeEach`
- [ ] 3.3 Test: negative damage reduces wounds by WS thresholds
- [ ] 3.4 Test: healing caps wounds at 0
- [ ] 3.5 Test: insufficient healing has no effect, sends "keine Heilung" chat message
- [ ] 3.6 Test: STUMPF healing reduces Erschöpfung
- [ ] 3.7 Test: LEP system healing restores HP (mock `game.settings.get` → `true`)
- [ ] 3.8 Test: healing sends chat message containing "heilt"

## 4. Validation

- [ ] 4.1 Run `npm run lint` and fix any issues
- [ ] 4.2 Run `npm test` and verify all new tests pass
