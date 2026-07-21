## Context

Three pre-effect utilities/functions have zero test coverage despite being used across multiple features. The existing test infrastructure (`jest.setup.js`, `babel.config.cjs`) provides `global.foundry`, `global.game`, `global.CONFIG` mocks. Tests should follow the existing pattern of minimal mocking — mock only what the function under test accesses.

## Goals / Non-Goals

**Goals:**

- Test `toArray()` — pure function, zero mocking needed
- Test `collectActorSystemPaths()` — mock `CONFIG.Actor.dataModels` only
- Test `_applyDamageDirectly` healing branch — mock `targetActor`, `game.settings`, `ChatMessage`
- Use existing mock infrastructure from `jest.setup.js`
- Follow existing test file patterns (ESM imports, `describe`/`it`, `beforeEach`)

**Non-Goals:**

- Testing the non-healing path of `_applyDamageDirectly` (existing behavior, not changed)
- Testing `applyPreEffects`, `createActiveEffectFromPreEffect` (require full Foundry document lifecycle, not unit-testable)
- Testing `resist-handler.js` (requires DOM/chat message infrastructure, better suited for E2E)

## Decisions

### Decision 1: What to test vs skip

| Function                           | Testable?                              | Decision               |
| ---------------------------------- | -------------------------------------- | ---------------------- |
| `toArray()`                        | ✅ Pure function                       | Test now               |
| `collectActorSystemPaths()`        | ✅ With `CONFIG.Actor.dataModels` mock | Test now               |
| `_applyDamageDirectly` healing     | ✅ With Actor + settings mock          | Test now               |
| `_applyDamageDirectly` damage path | ✅ But unchanged                       | Skip (regression-safe) |
| `applyPreEffects()`                | ❌ Needs full dialog + actor + items   | Skip                   |
| `handleResistClick()`              | ❌ Needs DOM + actor items             | Skip                   |
| `#handleLLMGenerate()`             | ❌ Needs `fetch` + DOM                 | Skip                   |

### Decision 2: Mocking strategy for `_applyDamageDirectly`

**Chosen**: Use plain object for `targetActor` with shape `{system: {gesundheit: {wunden, erschoepfung}, abgeleitete: {ws}}}`. Mock `game.settings.get()` to return `false` (LEP disabled) or `true` (LEP enabled). Mock `ChatMessage.create()` as `jest.fn()`.

**Mocked globals** (from `jest.setup.js`):

- `global.game.settings.get` — already available, configure per-test
- `global.ChatMessage.create` — need to add to jest.setup.js or define inline
- `global.CONST.CHAT_MESSAGE_STYLES.OTHER` — need to add

The existing `jest.setup.js` already mocks `game.settings.get` but doesn't have `ChatMessage` or `CONST`. We'll add minimal stubs.

### Decision 3: Mocking strategy for `collectActorSystemPaths`

**Chosen**: Set `global.CONFIG.Actor.dataModels` to a map of fake model classes. Each model has `defineSchema()` returning objects. `SchemaField` instances use `foundry.data.fields.SchemaField` — already available in the global mock.

```
global.CONFIG.Actor.dataModels = {
    held: { defineSchema: () => ({ gesundheit: Schema(erschoepfung, wunden), attribute: Schema(KO: Schema(wert, pw)) }) }
}
```

Use the existing `foundry.data.fields.SchemaField` mock from `jest.setup.js`... wait, it's not there. Let me check.

Actually, looking at jest.setup.js, there's no `foundry.data.fields.SchemaField` mock. The field-path-collector uses `instanceof foundry.data.fields.SchemaField`. I need to make this available.

Options:

1. Add to `jest.setup.js` — but that affects all tests
2. Define in the test file's `beforeEach` — more isolated

I'll define it in the test file since it's only needed there.

## Testing Strategy

- **`toArray()`**: Pure function, no mocks. 4 test cases.
- **`collectActorSystemPaths()`**: Mock `CONFIG.Actor.dataModels` + `foundry.data.fields.SchemaField`. 4 test cases.
- **`_applyDamageDirectly` healing**: Mock `targetActor`, `game.settings.get`, `ChatMessage.create`, `CONST`. 6 test cases.
