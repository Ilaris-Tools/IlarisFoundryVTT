## Context

The pre-effects system has three call chains that require E2E testing because they cross multiple files, involve DOM manipulation, hook orchestration, and actor mutations. Pure functions are covered by `add-pre-effect-unit-tests`.

Existing E2E infrastructure: Playwright, `e2e/shared/fixtures/foundry.ts`, sequential execution (1 worker, headless=false), Edge on Windows. Test actor is `HatAlles` — an actor with spells, weapons, and skills pre-configured.

The four E2E test candidates map to:

| ID     | Flow                                       | Complexity | E2E file                            |
| ------ | ------------------------------------------ | ---------- | ----------------------------------- |
| PRE-01 | Instant damage via spell cast              | Medium     | `e2e-025-pre-effect-instant-damage` |
| PRE-02 | Resist flow (chat→click→dialog→roll→hook)  | **High**   | `e2e-026-pre-effect-resist-flow`    |
| PRE-03 | Sheet configuration (add/delete/configure) | Medium     | `e2e-027-pre-effect-sheet-config`   |
| PRE-04 | Buff ActiveEffect creation                 | Medium     | `e2e-028-pre-effect-buff-creation`  |

## Goals / Non-Goals

**Goals:**

- Verify the complete instant damage pre-effect chain: spell cast → `applyPreEffects` → `_applyDamageDirectly` → actor wounds update → chat message
- Verify the complete resist chain: whisper ChatMessage → `.resist-button` click → `FertigkeitDialog` with correct Erschwernis → roll → `Ilaris.postSkillRoll` hook → effect applied/diminished
- Verify sheet CRUD: add pre-effect → configure avoidTest from compendium → select damage type → save → reopen → data persisted
- Verify buff creation: spell cast → `ActiveEffect.createDocuments` → effect visible on target with correct changes and duration
- Follow existing E2E patterns: `page.evaluate()` for game API access, actor snapshot capture/restore, shared fixture helpers

**Non-Goals:**

- Multi-user scenarios (socket routing, whisper delivery to other clients)
- LLM Generate button (network-dependent, flaky; better as manual test)
- Multi-target AoE pre-effects (complex setup, lower ROI)
- Edge cases like maechtigeQs=0 or target at full health
- Modifying application code — pure test addition

## Decisions

### Decision 1: E2E test structure follows existing patterns

**Chosen**: Each test case is a Playwright `.spec.ts` in `e2e/cases/e2e-0XX-<name>/`, using shared fixtures from `e2e/shared/fixtures/foundry.ts`. Tests use `page.evaluate()` to access `game.*` APIs, capture/restore actor snapshots in `test.afterEach`, and query the DOM via Playwright locators.

**Rationale**: All 21 existing E2E tests follow this pattern. Consistency reduces cognitive overhead and maintenance burden.

**Alternatives considered**: Separate test runner, Puppeteer, or Foundry's built-in test framework — rejected because Playwright is already configured and proven.

### Decision 2: Test actor is `HatAlles`

**Chosen**: Use the existing `HatAlles` actor which has spells (Ignifaxius, Balsam, Axxeleratus) and skills pre-configured. No new test actors needed.

**Rationale**: Avoids test setup complexity. The `HatAlles` actor is used by 15+ existing E2E tests.

### Decision 3: Resist flow test uses the spell's own avoidTest configuration

**Chosen**: The test reads the spell's `system.preEffects[].avoidTest` configuration at runtime, rather than hardcoding expected values. This makes the test resilient to compendium data changes.

**Rationale**: If someone updates the Ignifaxius pre-effect data, the test shouldn't break unless the behavior is actually wrong.

### Decision 4: New shared fixtures for pre-effect testing

**Chosen**: Add these helpers to `e2e/shared/fixtures/foundry.ts`:

| Helper                            | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `openItemSheet(page, itemName)`   | Opens an item sheet by name from the sidebar directory       |
| `getActorWounds(page, actorName)` | Returns `{wunden, erschoepfung}` via `page.evaluate`         |
| `openPreEffectsTab(itemWindow)`   | Clicks the pre-effects tab in an item sheet                  |
| `clickResistButton(page)`         | Finds and clicks `.resist-button` in the latest chat message |

**Rationale**: These will be reused across multiple pre-effect E2E tests.

### Decision 5: Resist flow test captures the full chain

**Chosen**: Single test that exercises the entire resist chain, rather than separate tests for each hop.

**Rationale**: The value of E2E testing is verifying the integration. If any hop breaks, the test fails — which is the point. Separate tests for each hop would require mocking, defeating the purpose.

### Decision 6: Sheet config test uses real compendium data

**Chosen**: The test opens the Ignifaxius item sheet from the compendium (or world item if imported), navigates to the pre-effects tab, and verifies the avoidTest dropdowns are populated with real compendium skill names.

**Rationale**: We need to verify compendium integration works, not just that an empty dropdown renders.

## API Surface

### Foundry Classes Used (via `page.evaluate`)

| Class          | Doc                                                                        | Usage                                           |
| -------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| `Actor`        | https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html        | `game.actors.getName()`, `.update()`, `.system` |
| `Item`         | https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html         | `game.items.getName()`, `.sheet`, `.system`     |
| `ActiveEffect` | https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html | `.appliedEffects`, `createDocuments()`          |
| `ChatMessage`  | https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html  | `game.messages.contents`, `.create()`           |
| `Roll`         | https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html              | Indirectly via `_applyDamageDirectly`           |

### Hook Events

| Hook                    | Doc                                                                                 | Test Relevance           |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| `renderChatMessageHTML` | https://foundryvtt.com/api/v14/classes/foundry.applications.hooks.ChatLogHooks.html | Resist button injection  |
| `Ilaris.postSkillRoll`  | Custom (non-standard)                                                               | Resist result processing |

### `foundry.utils.*` Helpers

| Helper                    | Usage                                     |
| ------------------------- | ----------------------------------------- |
| `foundry.utils.fromUuid`  | Caster/spell resolution in resist handler |
| `foundry.utils.randomID`  | Event ID generation                       |
| `foundry.utils.deepClone` | Defensive copy in sheet                   |

## Testing Strategy

### Unit Tests

None — this change is purely E2E. Unit tests for pure functions are covered by `add-pre-effect-unit-tests`.

### E2E Tests

| ID     | File                                | What It Tests                   | Key Assertions                                                                                             |
| ------ | ----------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| PRE-01 | `e2e-025-pre-effect-instant-damage` | Cast Ignifaxius → wounds update | `getActorWounds()` decreases, chat message contains damage flavor                                          |
| PRE-02 | `e2e-026-pre-effect-resist-flow`    | Full resist chain               | Whisper sent, FertigkeitDialog opens with "Widerstandsprobe", Erschwernis displayed, roll result processed |
| PRE-03 | `e2e-027-pre-effect-sheet-config`   | Sheet CRUD                      | Add/delete pre-effect, avoidTest dropdown populated, damage type select works, data persists after reopen  |
| PRE-04 | `e2e-028-pre-effect-buff-creation`  | Buff ActiveEffect               | ActiveEffect created on target, correct `system.ilarisTiming.durationType`, changes array populated        |

### E2E Environment

- Single GM user, `Vanilla Ilaris` world
- `HatAlles` actor with pre-configured spells
- Spells used: Ignifaxius (damage, avoidTest), Balsam (healing), Axxeleratus (buff)

## Risks / Trade-offs

| Risk                                                              | Mitigation                                                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Resist flow test is fragile (5-hop chain)                         | Keep assertions targeted; use `page.waitForFunction` for async hook resolution; add generous timeouts    |
| Playwright click on AppV2 sheets can be flaky                     | Use existing `clickSummaryWithFallback` pattern with `dispatchEvent` fallback from e2e-010               |
| Chat message DOM parsing depends on Handlebars template structure | Use `.resist-button` class selector (stable) rather than structural selectors                            |
| Actor state leakage between tests                                 | Use `captureActorDefaultSnapshot` / `restoreActorFromDefaultSnapshot` in `afterEach`                     |
| Spell item must exist in world or compendium                      | Document prerequisite: Ignifaxius, Balsam, Axxeleratus must be in compendium `zauberspruche-und-rituale` |
