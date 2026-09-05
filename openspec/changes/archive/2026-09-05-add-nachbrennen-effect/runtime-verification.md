# Runtime Verification: add-nachbrennen-effect

**Scope:** `runtime-relevant`
**Status:** `passed`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `feature/wound-effects` working tree

## Applicability

This change adds a world setting control, a target-side KO countercheck, a visible target ActiveEffect, a four-owner-phase combat lifecycle, a chat result, and manual effect removal. Runtime verification is required for the cast-to-cleanup path.

## Traceability

| Case  | Requirement scenario / task                    | Player-visible behavior                                                                                |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| RV-01 | Failed fire side-effect check; tasks 4.2–4.3   | Ignifaxius causes a visible KO-20 dialog and, on failure, visible Nachbrennen status.                  |
| RV-02 | Fourth owner phase applies one wound; task 4.3 | Four target phases remove the pending status, add one wound, and show completion chat.                 |
| RV-03 | Extinguishing prevents final wound; task 4.4   | Removing the pending effect prevents completion while another source remains.                          |
| RV-04 | Damage-type setting scenarios; task 4.5        | The existing GM damage-type editor persists a named side effect and renders without layout regression. |

## Preconditions and baseline

- **World / user / scene:** active GM `e2e-gm`, active scene, temporary unlinked target token, and a temporary combatant.
- **Actors, items, packs, and settings:** `HatAlles`, `Testlauf-Held`, Ilaris spell compendium Ignifaxius; test-local snapshot/restore of `Ilaris.damageTypes` and caster item data.
- **Baseline IDs/state to restore:** created token, combat, effects, messages, targets, configured setting, caster source snapshot.
- **Restart action:** `PackAndRestart`, because source compendium data must be packed before the runtime suite.
- **Foundry v14 API / wiki references consulted:** official v14 Actor embedded-document APIs, ActiveEffect duration data, ChatMessage creation, and `combatTurn(combat, updateData, updateOptions)` were verified. The community wiki search for `deepClone` found no page, so the existing project uses the already-documented `foundry.utils.deepClone` and `randomID`; no new utility was introduced.

## UI acceptance contract

- **Affected surface(s):** existing damage-type editor, skill-check dialog, Actor effects/status surface, and chat log.
- **Required order / placement:** no new sheet part or layout; Nachbrennen uses the existing status/effect row and chat card.
- **Must remain visible / unchanged:** the existing editor controls and status/effect list remain usable.
- **Shared vs. concrete ownership:** status creation is reusable condition-source behavior; no global template part is added.
- **Theme scope:** `light`; no custom CSS or theme-sensitive presentation is introduced.
- **Visual reference:** current E2E screenshots of the real status/effects and chat surfaces.

## Cases

### RV-01 — Failed KO check creates pending Nachbrennen

- **Trace:** Nachbrennen failed-check scenario; tasks 2.2–2.3, 4.3.
- **Status:** `passed`
- **Fixture/setup:** set FEUER side effect, restore current Ignifaxius source to caster, create an unlinked target token.
- **Visible player path:** cast Ignifaxius, select rendered `Nicht verteidigen`, make the visible KO check fail.
- **Expected visible result:** the normal check dialog is titled as a resistance check against Nachbrennen, then the existing status/effects surface lists Nachbrennen with four remaining owner phases.
- **Visual assertion:** capture the existing status/effects surface; verify no clipping or duplicate control.
- **State corroboration:** inspect the token Actor source timing.
- **`page.evaluate` use:** fixture setup, deterministic dice, state inspection, and cleanup only; never casts the spell.
- **Console/page errors:** capture errors and require an empty diagnostics list.
- **Evidence:** focused Playwright case and screenshot artifact.
- **Cleanup:** delete only recorded token, combat, effect, and messages; restore setting and caster snapshot.
- **Result:** E2E-043 cast through the visible ballistic defense prompt, opened the target-owned KO-20 dialog, deterministically failed it, and observed the pending source at four phases. The existing effects/status surface was captured in `e2e-043-nachbrennen-pending.png`.

### RV-02 — Fourth target phase completes once

- **Trace:** fourth owner phase scenario; tasks 2.4, 4.3.
- **Status:** `passed`
- **Fixture/setup:** RV-01 pending source and target combatant.
- **Visible player path:** advance the prepared combat through four target turns.
- **Expected visible result:** status disappears and one Nachbrennen completion chat entry is shown.
- **Visual assertion:** capture the completion chat card.
- **State corroboration:** one Wunde delta and no remaining Nachbrennen source after an extra turn.
- **`page.evaluate` use:** combat fixture and state inspection only.
- **Console/page errors:** pending.
- **Evidence:** focused Playwright case and screenshot artifact.
- **Cleanup:** RV-01 cleanup.
- **Result:** E2E-043 advanced the visible Combat Tracker through four target-owned phases, removed the source, added exactly one wound, and rendered the completion chat card (`e2e-043-nachbrennen-complete.png`).

### RV-03 — Explicit removal extinguishes pending source

- **Trace:** extinguishing and independent-source scenarios; tasks 2.5, 4.4.
- **Status:** `passed`
- **Fixture/setup:** pending Nachbrennen plus unrelated condition source.
- **Visible player path:** delete the pending effect through the existing effects surface.
- **Expected visible result:** no completion wound after four target phases.
- **Visual assertion:** existing effects/status surface after removal.
- **State corroboration:** unrelated source remains.
- **`page.evaluate` use:** fixture/inspection/cleanup only.
- **Console/page errors:** pending.
- **Evidence:** focused Playwright case.
- **Cleanup:** RV-01 cleanup.
- **Result:** E2E-043 clicked the existing effect-row delete control, retained its independent manual source, then ran four owner-phase reductions with no wound. The source row was captured in `e2e-043-nachbrennen-extinguish.png`.

### RV-04 — Setting control persists named side effect

- **Trace:** damage setting scenarios; tasks 2.1, 4.5.
- **Status:** `passed`
- **Fixture/setup:** snapshot current damage-type setting.
- **Visible player path:** open the GM settings dialog and edit FEUER’s side-effect input.
- **Expected visible result:** named value persists after reopening; blank value saves as no side effect.
- **Visual assertion:** screenshot the editor field in its existing behavior group.
- **State corroboration:** read saved setting value after each edit.
- **`page.evaluate` use:** opening menu and state inspection only.
- **Console/page errors:** pending.
- **Evidence:** E2E-031 extension.
- **Cleanup:** restore saved setting.
- **Result:** Extended E2E-031 persisted `nachbrennen` for FEUER, reopened the editor with that value, then cleared it back to null without layout or console regressions.

## Teardown record

- **Created IDs removed:** focused cases removed their recorded tokens, combat, messages, and temporary target effect; the UI-removal case deletes its retained manual source in teardown.
- **Settings, targets, documents, chat, map objects, and effects restored:** caster, `damageTypes`, target selection, pause state, active combat, targets, and chat are restored by the case teardown.
- **Termination/failure cleanup verified:** verified by repeated failure/retry runs before the final 2/2 pass.

## Final assessment

- **Passed cases:** RV-01 through RV-04.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** none in the final E2E-043 and E2E-031 runs.
- **Runtime validation conclusion:** passed. Focused E2E-043: 2/2 passed; E2E-031: 2/2 passed; direct-damage E2E-025 and ballistic E2E-042 regressions: 5/5 passed.
