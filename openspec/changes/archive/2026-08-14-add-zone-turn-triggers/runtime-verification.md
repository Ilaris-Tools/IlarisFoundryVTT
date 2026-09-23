# Runtime Verification: add-zone-turn-triggers

**Scope:** `runtime-relevant`
**Status:** `pass`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `worktree during add-zone-turn-triggers implementation`

## Applicability

The change alters persisted Region state and a combat-hook lifecycle that produces player-visible pre-effect or resistance outcomes. Runtime verification is required in addition to focused unit tests.

## Traceability

| Case  | Requirement scenario / task                                       | Player-visible behavior                                                            |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| RV-01 | Current occupant receives one turn-start trigger; 4.1-4.2         | A Zone's occupant receives one visible prompt/outcome when their turn begins.      |
| RV-02 | Departed Token is skipped; Later turn triggers again; 4.1         | Leaving prevents the next trigger; the next eligible turn creates one new outcome. |
| RV-03 | Duplicate event produces one result; Rewind does not trigger; 4.1 | Repeated/rewound combat movement does not add a second prompt or outcome.          |
| RV-04 | Runtime evidence preserves isolation; 4.3, 5.2                    | Created Region, Token, effects, chat, targets, and combat state are restored.      |

## Preconditions and baseline

- **World / user / scene:** active GM in `ilaris-e2e-world-v14363-r1`; the E2E combat Scene and player-owned target user are available.
- **Actors, items, packs, and settings:** target selection is enabled and restored; a test-local persistent triggered Zone profile has `onTurnStart: true` and a resistance Pre-Effect.
- **Baseline IDs/state to restore:** newly created Item, Token, Region, ChatMessages, combatants/combat state, and user targets.
- **Restart action:** `Restart`, because the lifecycle code changed and no compendium `_source/` data changed.
- **Foundry v14 API / wiki references consulted:** `combatTurn`, `combatRound`, Combat, RegionDocument, TokenDocument, and Hook locality documentation.

## Cases

### RV-01 — Forward turn triggers the occupant once

- **Trace:** Current occupant receives one turn-start trigger; 4.1-4.2.
- **Status:** `pass`
- **Fixture/setup:** a test-local Zone/item, contained player-owned Token, Region, and combat are created through fixture setup only.
- **Visible player path:** the real supernatural dialog places and casts the Zone; the Combat Tracker visibly starts combat and advances to the target's turn.
- **Expected visible result:** exactly one rendered resistance prompt appears for the target.
- **State corroboration:** the Region's `lastTurnStartWindow` records the round-1 target window; the player prompt delta is exactly one.
- **`page.evaluate` use:** fixture setup, state inspection, and cleanup only; it does not place/cast the Zone or advance the central combat action.
- **Console/page errors:** none observed; E2E-038's deprecation-warning guard remained green.
- **Evidence:** targeted E2E-038 passed in 1.5 minutes.
- **Cleanup:** exact-ID `finally` teardown.
- **Result / unverified boundary:** `pass`.

### RV-02 — Leaving suppresses; a later turn retriggers

- **Trace:** Departed Token is skipped; Later turn triggers again; 4.1.
- **Status:** `pass`
- **Fixture/setup:** continues from RV-01's recorded Region, Token, and Combat IDs.
- **Visible player path:** the contained Token advances to its next eligible turn, then is visibly dragged out through the map before the following turn.
- **Expected visible result:** exactly one new result appears at the later eligible turn; no result appears while the Token is outside.
- **State corroboration:** the round-2 window is recorded, then current Region target resolution excludes the departed Token at round 3, turn 1.
- **`page.evaluate` use:** state inspection and cleanup only; movement and combat controls use the rendered UI.
- **Console/page errors:** none observed.
- **Evidence:** targeted E2E-038 passed in 1.5 minutes.
- **Cleanup:** exact-ID `finally` teardown.
- **Result / unverified boundary:** `pass`.

### RV-03 — Repeated or rewound transitions do not replay

- **Trace:** Duplicate event produces one result; Rewind does not trigger; 4.1.
- **Status:** `pass`
- **Fixture/setup:** recorded target, Region, and combat.
- **Visible player path:** the Combat Tracker's visible previous-turn control is used immediately after the first prompt, followed by normal forward advancement.
- **Expected visible result:** rewind does not add a prompt; the later, distinct round-2 target window adds only its one permitted prompt.
- **State corroboration:** exact prompt deltas and the final round-2 `lastTurnStartWindow` are asserted.
- **`page.evaluate` use:** state inspection and cleanup only.
- **Console/page errors:** none observed.
- **Evidence:** targeted E2E-038 passed in 1.5 minutes.
- **Cleanup:** exact-ID `finally` teardown.
- **Result / unverified boundary:** `pass`.

### RV-04 — Runtime state is restored

- **Trace:** 4.3, 5.2.
- **Status:** `pass`
- **Fixture/setup:** the test captures exact document IDs and setting/combat baseline before RV-01.
- **Visible player path:** no separate player action.
- **Expected visible result:** no leftover test Zone, token, effect, chat message, target, setting, or altered combat state after the case.
- **State corroboration:** `finally` asserts absence of the exact created Region, Token, Item, Combat, and chat IDs, restoration of earlier active combats, and the original target-selection setting.
- **`page.evaluate` use:** cleanup and verification only.
- **Console/page errors:** none observed.
- **Evidence:** targeted E2E-038 passed in 1.5 minutes.
- **Cleanup:** targeted `finally` teardown.
- **Result / unverified boundary:** `pass`.

## Teardown record

- **Created IDs removed:** exact temporary combat, Region, Token, Item, and test-created chat IDs were asserted absent after teardown.
- **Settings, targets, documents, chat, map objects, and effects restored:** active-combat state and `Ilaris.useTargetSelection` were asserted restored; the test did not create an Active Effect or persistent target selection.
- **Termination/failure cleanup verified:** the same targeted `finally` path runs for success/failure; the passing execution verified its cleanup result directly.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary |
| ------ | ----------------- | ------ | ------------------------------------------ |
| —      | —                 | —      | —                                          |

## Final assessment

- **Passed cases:** RV-01 through RV-04.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** none observed; E2E-038's deprecation-warning guard remained green.
- **Runtime validation conclusion:** pass — E2E-038 provides visible player-path, state, duplicate/rewind, departure, later-turn, and exact-teardown evidence for the changed lifecycle.
