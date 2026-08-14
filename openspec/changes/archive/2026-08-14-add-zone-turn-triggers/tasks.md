## 1. Foundry v14 lifecycle verification

- [x] 1.1 Verify against Foundry API docs (v14) the exact `combatTurn` and `combatRound` signatures, pre-update timing, positive/negative `updateOptions.direction`, destination `updateData.turn`, and `Combat`/`Combatant` Token resolution.
- [x] 1.2 Verify against Foundry API docs (v14) the `Scene`, `RegionDocument`, and `TokenDocument` containment APIs used by the turn dispatcher.
- [x] 1.3 Check foundryvtt.wiki for relevant Hook locality, Region flag, and `foundry.utils.deepClone` patterns before adding serialized trigger-window state.
- [x] 1.4 Review existing combat effect timing and Zone lifecycle hooks to avoid duplicate registration, unintended owner-turn timing interaction, or a round-boundary regression.

## 2. Unit Tests

- [x] 2.1 Extend `scripts/combat/zones/_spec/zone-profile.spec.js` for omitted/explicit `trigger.onTurnStart`, combined trigger flags, and passive-Zone exclusion.
- [x] 2.2 Extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for destination Token selection, current containment, forward `combatTurn`/`combatRound` dispatch, duplicate-window coalescing, a later-turn retrigger, rewind rejection, and scene isolation.
- [x] 2.3 Extend lifecycle unit coverage for a Zone created during the current turn and an unlinked Token Actor resistance/pre-effect context.

## 3. Zone Turn-Start Lifecycle

- [x] 3.1 Extend Zone profile normalization with backward-compatible `trigger.onTurnStart`, defaulting to `false`.
- [x] 3.2 Add an exported, active-GM-only turn-start dispatcher that resolves the destination combatant from `updateData`, checks current Region containment, and reuses the existing Zone trigger pipeline for one selected Token.
- [x] 3.3 Persist a bounded Region trigger-window identity before dispatch and coalesce concurrent local processing for the same Region/window without growing an unbounded ledger.
- [x] 3.4 Register the dispatcher on documented forward `combatTurn` and round-boundary `combatRound` events while excluding passive Zones and all non-forward transitions.
- [x] 3.5 Verify against Foundry API docs (v14) every final `Combat`, `Combatant`, `Scene`, `RegionDocument`, `TokenDocument`, and hook call used by the lifecycle implementation.

## 4. E2E Tests

- [x] 4.1 Extend `e2e/cases/e2e-038-spell-zone-lifecycle/e2e-038-spell-zone-lifecycle.spec.ts` for the `zone-turn-triggers` scenarios: UI-driven Zone creation, one forward turn-start outcome, departed Token skip, later-turn retrigger, and no rewind/duplicate result.
- [x] 4.2 Use a test-local Zone source/profile only as fixture setup; perform placement, casting, combat advancement, and visible outcome assertions through the actual Foundry UI, with exact chat/prompt deltas.
- [x] 4.3 Keep E2E setup/teardown idempotent for temporary Items, Regions, effects, targets, combat state, and any created chat messages; promote shared helpers only when reused.
- [x] 4.4 Before E2E, run `node utils/foundry-lifecycle.mjs Status`; use `Restart` for the code-only change in `ilaris-e2e-world-v14363-r1`.

## 5. Runtime Verification

- [x] 5.1 Use `$foundry-runtime-verification` to derive `runtime-verification.md` from this change before runtime validation.
- [x] 5.2 Record UI path, combat/Region/effect state, console diagnostics, exact teardown, and any manual user confirmation in the runtime checklist.

## 6. Validation

- [x] 6.1 Run `npm install`.
- [x] 6.2 Run `npm test`.
- [x] 6.3 Run `npm run lint`.
- [x] 6.4 Run `openspec validate add-zone-turn-triggers --strict`.
