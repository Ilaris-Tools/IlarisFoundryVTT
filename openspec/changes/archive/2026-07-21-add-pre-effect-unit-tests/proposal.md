## Why

Multiple recent changes added pre-effect functionality with no unit test coverage: the `_applyDamageDirectly` healing branch (from `add-spell-pre-effects`), the `toArray()` utility (from initial pre-effects implementation), and the `collectActorSystemPaths()` utility (from `add-pre-effect-key-autocomplete`). Only `llm-prompt-builder.js` has tests. The healing branch is particularly critical — if broken, heal spells silently fail.

## What Changes

- **Add tests for `_applyDamageDirectly` healing branch**: Test negative damage → wound reduction via WS thresholds, STUMPF healing, LEP system healing, chat messages, and boundary cases. Extend existing `scripts/combat/_spec/shared_dialog_helpers.test.js`.
- **Add tests for `toArray()`**: Test array passthrough, Foundry V14 ObjectField normalization `{0:{},1:{}}` → `[{},{}]`, and edge cases (null, undefined, empty). New file: `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js`.
- **Add tests for `collectActorSystemPaths()`**: Test sorted deduplicated paths, nested SchemaField recursion, and empty data models. New file: `scripts/effects/utils/_spec/field-path-collector.spec.js`.

## Capabilities

### New Capabilities

None — this is pure test coverage. No new features.

### Modified Capabilities

None — existing behavior is unchanged.

## Impact

- **NEW**: `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` — `toArray()` tests
- **NEW**: `scripts/effects/utils/_spec/field-path-collector.spec.js` — `collectActorSystemPaths()` tests
- **MODIFIED**: `scripts/combat/_spec/shared_dialog_helpers.test.js` — healing branch tests for `_applyDamageDirectly`

## Testing Impact

- All 3 test files use existing Jest patterns from `jest.setup.js` (global `foundry`, `game`, `CONFIG` mocks)
- `collectActorSystemPaths` mock: `global.CONFIG.Actor.dataModels` with fake model classes that implement `defineSchema()`
- `_applyDamageDirectly` mock: `targetActor` plain object with `system.gesundheit.wunden`, `system.abgeleitete.ws` etc., `game.settings.get()` mock for LEP check, `ChatMessage.create()` jest mock
- `toArray`: Pure function, zero mocking needed
