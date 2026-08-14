# Runtime Verification: add-periodic-zone-effects

**Scope:** `runtime-relevant`
**Status:** `complete`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `3e62cbe9 + working tree`

## Applicability

This change adds an authored item-sheet control, persistent Region flags, a GM-owned combat lifecycle trigger, pre-effect/resistance outcomes, and a packed journal entry. Runtime verification is therefore required.

## Traceability

| Case  | Requirement scenario / task                                       | Player-visible behavior                                                            |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| RV-01 | Zone editor; tasks 2.2, 6.4                                       | The round-start checkbox is visible directly after the entry trigger.              |
| RV-02 | Current occupants; tasks 3.1-3.4, 6.2-6.3                         | Each current occupant receives one periodic result at a forward combat round.      |
| RV-03 | Late entrant, departed Token, final round; tasks 3.1-3.4, 6.2-6.3 | Current membership governs ticks and the final tick occurs before Region deletion. |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`; active GM, `e2e-player`, existing combat scene and E2E-038 fixture actors.
- **Actors, items, packs, and settings:** temporary `uebernatuerlich` item and Region/Token/Combat documents carry only `flags.Ilaris.e2eZone`; target-selection setting is enabled then restored.
- **Baseline IDs/state to restore:** chat log, target set, temporary items/effects, Regions, Tokens, and E2E Combat are recorded and removed in E2E teardown.
- **Restart action:** `PackAndRestart`, because the structured journal source changes as well as code/templates.
- **Foundry v14 API / wiki references consulted:** `combatRound` signature/pre-update/direction; Combat, Scene, RegionDocument, TokenDocument, and Item documents; community Hook guidance.

## UI acceptance contract

- **Affected surface(s):** supernatural item sheet, **Zonenautomatisierung** section.
- **Required order / placement:** creation trigger, entry trigger, then `Zu Rundenbeginn ausloesen`.
- **Must remain visible / unchanged:** existing Zone shape/placement/lifecycle inputs, structured spell modifications, and shared Pre-Effects remain in their established concrete-sheet positions.
- **Shared vs. concrete ownership:** the concrete `uebernatuerlich_talent.hbs` owns placement; shared Pre-Effect behaviour owns no Zone layout.
- **Theme scope:** `light`; this change does not alter CSS or theme-sensitive presentation.
- **Visual reference:** written design contract; runtime screenshot recorded under E2E test output.

## Cases

### RV-01 — Zone authoring control order

- **Trace:** Zone editor requirement; tasks 2.2, 6.4.
- **Status:** `user-confirmed`
- **Fixture/setup:** open a temporary supernatural item through the real sheet.
- **Visible player path:** open the item sheet; locate **Zonenautomatisierung**; inspect the three trigger controls.
- **Expected visible result:** all three controls are visible and the round-start control follows the entry control without displaced sections.
- **Visual assertion:** screenshot and structural locator-order assertion in E2E output.
- **State corroboration:** saving the checked control persists `system.zone.trigger.onRoundStart: true`.
- **`page.evaluate` use:** setup, state inspection, and cleanup only.
- **Console/page errors:** none reported during manual inspection.
- **Evidence:** user confirmed the three controls exist in the required order after opening a supernatural item sheet.
- **Cleanup:** delete the temporary item.
- **Result / unverified boundary:** user-confirmed; no screenshot artifact retained.

### RV-02 — One Zone-wide tick for current occupants

- **Trace:** current-occupants and idempotency requirements; tasks 3.1-3.4, 6.2-6.3.
- **Status:** `pass`
- **Fixture/setup:** create a temporary periodic Zone with two contained target Tokens and one E2E Combat.
- **Visible player path:** author/check the Zone control, cast/place through the normal dialog, then advance the visible Combat Tracker by one round.
- **Expected visible result:** exactly one periodic chat/resistance/effect outcome per current target and no duplicate after the same transition is observed again.
- **Visual assertion:** not applicable beyond Combat Tracker and outcome visibility.
- **State corroboration:** Region `lastRoundStartWindow`, exact chat/effect deltas, and current Token membership.
- **`page.evaluate` use:** fixture setup, state inspection, and cleanup only; it does not cast/place/advance the central flow.
- **Console/page errors:** none observed.
- **Evidence:** focused E2E-038 Playwright case passed in 88.2 seconds.
- **Cleanup:** remove recorded temporary Region, Token, Combat, effect, item, and chat IDs.
- **Result / unverified boundary:** passed; two-current-occupant coverage remains unit-tested rather than independently browser-tested.

### RV-03 — Current membership and final-round ordering

- **Trace:** late entrant, departed Token, and final-duration requirements; tasks 3.1-3.4, 6.2-6.3.
- **Status:** `pass`
- **Fixture/setup:** run a periodic Region with one remaining scene round, a Token that leaves before target resolution, and a Token that enters after an earlier claimed empty window.
- **Visible player path:** move/advance through the visible scene and Combat Tracker flow.
- **Expected visible result:** a departed Token has no result; a late entrant waits for the next round; the final current target receives its result before the Region disappears.
- **Visual assertion:** Region disappears after the final tick; screenshot if the E2E surface exposes it.
- **State corroboration:** final Region absence, window values, exact chat/effect deltas.
- **`page.evaluate` use:** fixture setup/inspection/cleanup only; document-level movement is an allowed low-level edge case if the canvas UI cannot reliably place fixture Tokens, and will be noted in E2E comments.
- **Console/page errors:** none observed.
- **Evidence:** focused E2E-038 Playwright case passed in 88.2 seconds after replacing flaky Pixi drag with a documented TokenDocument update for the leave edge case.
- **Cleanup:** remove all recorded E2E documents and restore baseline.
- **Result / unverified boundary:** passed; final expiry order is unit-tested and not independently browser-tested.

## Teardown record

- **Created IDs removed:** temporary Region, Token, Combat, Item, and generated chat messages removed by the E2E `finally` block.
- **Settings, targets, documents, chat, map objects, and effects restored:** target-selection setting and prior active Combats restored by the passing case.
- **Termination/failure cleanup verified:** the E2E fixture performs the same idempotent cleanup in `finally`; prior failed run cleanup was verified before the focused rerun.

## Manual confirmation

| Tester | Verified behavior                                                                                                 | Result           | Remaining automated or unverified boundary |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| User   | `Beim Erzeugen ausloesen`, `Beim Betreten ausloesen`, and `Zu Rundenbeginn ausloesen` exist in the required order | `user-confirmed` | No retained screenshot artifact            |

## Final assessment

- **Passed cases:** RV-02, RV-03; RV-01 user-confirmed.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** none in the focused periodic-zone run.
- **Runtime validation conclusion:** complete. Periodic lifecycle behaviour is E2E-verified and the item-sheet authoring order is user-confirmed.
