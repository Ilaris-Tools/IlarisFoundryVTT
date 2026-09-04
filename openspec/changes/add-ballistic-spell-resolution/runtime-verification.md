# Runtime Verification: add-ballistic-spell-resolution

**Scope:** `runtime-relevant`  
**Status:** `blocked`  
**World:** `ilaris-e2e-world-v14363-r1`  
**Server:** `http://127.0.0.1:30000`  
**Source revision:** `88a37290` plus this change's working tree

## Applicability

This change alters the visible supernatural casting, ranged-defense, chat, and
damage/pre-effect path for authored ballistic compendium spells.
Runtime verification is required.

## Traceability

| Case  | Requirement scenario / task                              | Player-visible behavior                                               |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| RV-01 | Ballistic cast keeps normal dialog layout; tasks 4.3–4.4 | Ignifaxius dialog retains targets, roll controls, and summaries.      |
| RV-02 | Undefended target receives spell effects; task 4.3       | Visible cast and no-defense path apply damage exactly once.           |
| RV-03 | Successful defense prevents all target effects; task 4.3 | Target-owned ranged defense leaves the target unaffected.             |
| RV-04 | Unmarked spell retains existing behavior; task 4.5       | Existing non-ballistic and affected defense/zone flows remain intact. |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, active GM, active grid Scene.
- **Actors, items, packs, and settings:** HatAlles owns/receives Ignifaxius; an owned target Token is placed; `useTargetSelection` is enabled only for the case and restored afterward.
- **Baseline IDs/state to restore:** target selection, setting value, temporary Tokens/Walls/Combatants, created chat messages, and target wounds/effects.
- **Restart action:** `PackAndRestart`, because authoritative spell `_source/` data changes.
- **Foundry v14 API / wiki references consulted:** Actor, TokenDocument,
  ChatMessage, and community helper guidance. No new `foundry.utils.*` helper
  is required. Caster-to-target line-of-sight, cover, and collision checks are
  intentionally outside this change's scope.

## UI acceptance contract

- **Affected surface(s):** existing Übernatürlich dialog and combat chat/defense prompt.
- **Required order / placement:** no new dialog section; the existing selected-target list, Würfelaktionen controls, and summary blocks retain their established order.
- **Must remain visible / unchanged:** target list, spell-roll control, energy controls, and summaries.
- **Shared vs. concrete ownership:** ballistic state/handlers are shared combat behavior; `UebernatuerlichDialog` owns its existing layout and no template insertion is permitted.
- **Theme scope:** `not applicable`; no theme-sensitive styles change.
- **Visual reference:** `test-results/e2e-042-ballistic-dialog.png` captures the rendered Ignifaxius dialog with the selected target, roll controls, and energy summary visible in their existing order.

## Cases

### RV-01 — Dialog layout remains intact

- **Trace:** `Ballistic cast keeps the normal dialog layout`; task 4.4.
- **Status:** `passed`
- **Fixture/setup:** active GM, HatAlles with Ignifaxius, one selected target Token.
- **Visible player path:** open actor sheet, open Ignifaxius, select target, inspect dialog, cast.
- **Expected visible result:** existing target list, roll control, energy control, and summaries remain visible in order.
- **Visual assertion:** `test-results/e2e-042-ballistic-dialog.png` inspected; no layout insertion or ordering regression.
- **State corroboration:** none beyond rendered dialog and resulting chat.
- **`page.evaluate` use:** setup/inspection/cleanup only; never for cast, defense, or result selection.
- **Console/page errors:** none observed before the cast action.
- **Evidence:** real Playwright dialog screenshot.
- **Cleanup:** restore target/settings/chat.
- **Result / unverified boundary:** passed for the layout inspection.

### RV-02 — Undefended visible target resolves once

- **Trace:** `Undefended visible target receives the spell effects`; task 4.3.
- **Status:** `passed`
- **Fixture/setup:** selected visible target with captured wound baseline.
- **Visible player path:** cast Ignifaxius through the dialog and leave the visible defense request unresolved/declined according to the supported defense flow.
- **Expected visible result:** one ranged-defense prompt and one target damage/pre-effect outcome.
- **Visual assertion:** chat prompt/result screenshot pending.
- **State corroboration:** exact target wound/effect and chat-message delta.
- **`page.evaluate` use:** setup, baseline inspection, and cleanup only.
- **Console/page errors:** pending.
- **Evidence:** focused `e2e-042-ballistic-spell-resolution` passed on 2026-08-31. It resets Ignifaxius from the packed compendium source, visibly opens Chat after the actor sheet changes the sidebar, selects `Nicht verteidigen`, and asserts the unlinked target receives the authored fire damage exactly once.
- **Cleanup:** actor snapshot, target selection, setting, created token, chat, and Dice override were restored by `afterEach`.
- **Result / unverified boundary:** passed; the user also manually confirmed this player path.

### RV-03 — Successful defense gates effects

- **Trace:** `Successful defense prevents all target effects`; task 4.3.
- **Status:** `passed`
- **Fixture/setup:** selected visible target with an available ranged-defense option.
- **Visible player path:** cast Ignifaxius, use the rendered target-owned defense prompt, and complete a successful defense.
- **Expected visible result:** defense outcome is shown and no target damage or later Pre-Effect is applied.
- **Visual assertion:** chat prompt/defense/result screenshot pending.
- **State corroboration:** unchanged wounds/effects and exact chat delta.
- **`page.evaluate` use:** setup, result inspection, and cleanup only.
- **Console/page errors:** pending.
- **Evidence:** focused `e2e-042-ballistic-spell-resolution` passed on 2026-08-31. It visibly selects `Verteidigen mit Akrobatik`, completes the rendered defense dialog successfully, and asserts the target wounds remain unchanged.
- **Cleanup:** actor snapshot, target selection, setting, created token, chat, and Dice override were restored by `afterEach`.
- **Result / unverified boundary:** passed; the user also manually confirmed this player path.

### RV-04 — Regression paths

- **Trace:** `Unmarked spell retains existing behavior`; task 4.5.
- **Status:** `not-run`
- **Fixture/setup:** current targeted spell, ranged-defense, magic-resistance, and zone case baselines.
- **Visible player path:** execute the affected existing Playwright cases.
- **Expected visible result:** their prior visible paths remain unchanged.
- **Visual assertion:** existing cases provide their own relevant output; no new layout is introduced.
- **State corroboration:** existing assertions.
- **`page.evaluate` use:** governed by each existing case.
- **Console/page errors:** pending.
- **Evidence:** `e2e-008-fernkampf-angriffsdialog` completed without a failure artifact. The wider run was blocked in existing `e2e-009-uebernatuerlich-dialog`: its shared fixture selects a spell that has no roll control and then waits for `[data-action="angreifen"]`; after that failure its browser session keeps `e2e-gm` connected, preventing a clean retry without a lifecycle restart. This is outside the marked ballistic source and resolution path.
- **Cleanup:** owned by each case.
- **Result / unverified boundary:** not-run.

## Teardown record

- **Created IDs removed:** focused `e2e-042` removed its recorded temporary Token.
- **Settings, targets, documents, chat, map objects, and effects restored:** focused `e2e-042` restored its actor snapshot, setting, target selection, chat messages, and Dice override.
- **Termination/failure cleanup verified:** verified for focused `e2e-042`; the separate E2E-009 failure leaves its user session connected.

## Final assessment

- **Passed cases:** RV-01, RV-02, and RV-03.
- **Failed / blocked / not-run cases:** RV-04 remains blocked by the existing E2E-009 fixture/session failures.
- **Unexpected console diagnostics and disposition:** Playwright emits only its `NO_COLOR`/`FORCE_COLOR` environment warning during focused E2E; no page or console error was observed in the passing E2E-042 cases.
- **Runtime validation conclusion:** the change's player paths are automated and manually verified; the unrelated regression E2E-009 failure still prevents completion of task 4.5.
