## 1. Create `toArray()` tests — `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js`

- [x] 1.1 Create test file with `import { toArray }` from `pre-effects-processor.js`
- [x] 1.2 Test: array passes through unchanged
- [x] 1.3 Test: ObjectField `{0:{a}, 1:{b}}` → `[{a}, {b}]`
- [x] 1.4 Test: `null` → `[]`, `undefined` → `[]`
- [x] 1.5 Test: `{}` → `[]`

## 2. Create `collectActorSystemPaths()` tests — `scripts/effects/utils/_spec/field-path-collector.spec.js`

- [x] 2.1 Create test file with `import { collectActorSystemPaths }`
- [x] 2.2 Mock `global.CONFIG.Actor.dataModels` with fake model classes using `Object.defineProperty` for `SchemaField`
- [x] 2.3 Test: returns sorted deduplicated paths from flat schema
- [x] 2.4 Test: handles nested SchemaField recursion
- [x] 2.5 Test: returns `[]` for empty/undefined `CONFIG.Actor.dataModels`

## 3. Add `_applyDamageDirectly` healing tests — extend `scripts/combat/_spec/shared_dialog_helpers.test.js`

- [x] 3.1 Import `_applyDamageDirectly` from `shared-dialog-helpers.js`
- [x] 3.2 Add `global.ChatMessage.create = jest.fn()` and `global.CONST.CHAT_MESSAGE_STYLES = {OTHER: 0}` in `beforeEach`
- [x] 3.3 Test: negative damage reduces wounds by WS thresholds
- [x] 3.4 Test: healing caps wounds at 0
- [x] 3.5 Test: insufficient healing has no effect, sends "keine Heilung" chat message
- [x] 3.6 Test: STUMPF healing reduces Erschöpfung
- [x] 3.7 Test: LEP system healing restores HP (mock `game.settings.get` → `true`)
- [x] 3.8 Test: healing sends chat message containing "heilt"

## 4. Validation

- [x] 4.1 Run `npm run lint` and fix any issues
- [x] 4.2 Run `npm test` and verify all new tests pass
