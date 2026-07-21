## Why

The pre-effects system has zero E2E test coverage for its three critical user flows: instant damage application, resist dialog orchestration, and sheet-based pre-effect configuration. The resist flow in particular is a 5-hop chain (ChatMessage → click → FertigkeitDialog → roll → hook → effect) that crosses four source files and cannot be tested at the unit level. E2E tests are the only way to verify this chain works end-to-end.

The companion change `add-pre-effect-unit-tests` covers pure functions (`toArray`, `collectActorSystemPaths`, `_applyDamageDirectly` healing math), but the DOM-dependent and hook-driven flows remain untested.

## What Changes

- **New E2E spec**: `e2e/cases/e2e-025-pre-effect-instant-damage/` — Cast a damage spell with pre-effects, verify wounds update and chat message appears
- **New E2E spec**: `e2e/cases/e2e-026-pre-effect-resist-flow/` — Full resist chain: whisper with resist button → click → FertigkeitDialog with correct Erschwernis → roll → hook processes result → effect applied or diminished
- **New E2E spec**: `e2e/cases/e2e-027-pre-effect-sheet-config/` — GM opens item sheet → pre-effects tab → add/delete pre-effect → configure avoidTest from compendium → verify key autocomplete and damage type select
- **New E2E spec**: `e2e/cases/e2e-028-pre-effect-buff-creation/` — Cast a buff spell with pre-effects → ActiveEffect created on target → correct changes and duration applied

All changes are purely additive — new test files only, no application code changes.

## Capabilities

### New Capabilities

None. This change introduces only E2E tests; it does not add new system capabilities.

### Modified Capabilities

None. No existing spec requirements are changing. These tests verify that existing specs (`supernatural-pre-effects`, `resist-dialog-ux`, `item-sheets`) work correctly.

## Impact

- **New files**: 4 E2E spec directories under `e2e/cases/` with `.spec.ts` files
- **Shared fixtures**: May extend `e2e/shared/fixtures/foundry.ts` with new helper functions (e.g., `openItemSheet`, `clickResistButton`, `getActorWounds`)
- **No code changes**: Application code is not modified
- **Test runtime**: Each E2E test interacts with a live Foundry instance; adds ~5-10 minutes to total E2E suite runtime

## Testing Impact

This change IS the testing. Once implemented:

- **Unit test coverage**: Already handled by `add-pre-effect-unit-tests` (parallel change)
- **E2E coverage**: PRE-01 (instant damage), PRE-02 (resist flow), PRE-03 (sheet config), PRE-04 (buff creation)
- **Existing E2E cases affected**: None — these are additive
- **E2E environment**: Same as existing E2E suite — single GM user, `HatAlles` test actor, `Vanilla Ilaris` world. No multi-user scenarios in initial scope.
- **Shared code candidates**: `openItemSheet()`, `clickResistButton()`, `getActorWounds()` could be promoted to `e2e/shared/fixtures/foundry.ts`
