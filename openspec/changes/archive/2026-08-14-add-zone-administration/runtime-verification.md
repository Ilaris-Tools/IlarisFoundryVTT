# Runtime Verification: add-zone-administration

**Scope:** runtime-relevant
**Status:** pass
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** uncommitted worktree for `add-zone-administration`

## Applicability

This change adds a GM-only AppV2 manager, Scene Controls integration, embedded
Region updates/deletion, and a Zone lifecycle reconciliation boundary. Runtime
verification is required for the visible UI hierarchy, native Region selection
handoff, document mutation, lifecycle cleanup, and dark/light presentation.

## Traceability

| Case  | Requirement scenario / task                  | Player-visible behavior                                                                                                             |
| ----- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| RV-01 | Discover and select a Zone; 3.1–3.4, 5.3     | A GM opens the Region Scene Control, sees current-Scene rows, selects a Zone on the map, and can continue with native Region tools. |
| RV-02 | Extend a scene-round Zone; 2.2, 5.3          | Saving `6` visibly retains the Zone and reports six scene rounds.                                                                   |
| RV-03 | Non-triggering reconciliation; 2.4, 5.3      | `Abgleich durchführen` repairs membership without creating gameplay output.                                                         |
| RV-04 | Dismiss one Zone; 2.3, 4.3, 5.3              | Confirming dismissal removes only the selected Region and its owned effect.                                                         |
| RV-05 | Malformed metadata and both themes; 3.5, 5.4 | Warnings are visible/inert, and the agreed hierarchy stays readable in light and dark themes.                                       |
| RV-06 | Regression zones; 5.5                        | Existing spell-zone lifecycle and wall traversal player paths still pass.                                                           |

## Preconditions and baseline

- **World / user / scene:** active GM `e2e-gm`, active Scene in the isolated `ilaris-e2e-world-v14363-r1` world.
- **Actors, items, packs, and settings:** `Testlauf-Held` supplies isolated Active Effects; no compendium data changes. The case records only `e2eZoneAdministration`-flagged Regions and its two exact effect IDs.
- **Baseline IDs/state to restore:** existing Scene Region IDs, message IDs, active layer/controlled Regions, and `core.uiConfig` are captured before the case; teardown removes only its flagged Regions/effects and restores the prior UI config/selection.
- **Restart action:** `Restart`, because the change modifies JavaScript, Handlebars, and CSS but no `_source/` compendium data.
- **Foundry v14 API / wiki references consulted:** `RegionDocument`, `Scene`, `RegionLayer`, Region placeable, `ApplicationV2`, `HandlebarsApplicationMixin`, and `getSceneControlButtons` official v14 API; Foundry VTT wiki AppV2 and document flags guidance.

## UI acceptance contract

- **Affected surface(s):** Region Scene Controls and standalone **Ilaris-Zonen verwalten** AppV2 window.
- **Required order / placement:** Scene context, reconciliation toolbar/empty state, malformed warning block, stable Zone rows; each row orders selection, native edit, scene-round duration editor, then dismissal.
- **Must remain visible / unchanged:** Foundry retains ownership of generic Region geometry, movement, resizing, configuration, and bulk deletion.
- **Shared vs. concrete ownership:** lifecycle and registry services own Zone data; the manager Handlebars template owns layout; the native Region sheet owns Region editing.
- **Theme scope:** both. The manager must remain readable without clipping in light and dark UI configurations.
- **Visual reference:** `test-results/e2e-040-zone-administration-light.png` and `test-results/e2e-040-zone-administration-dark.png` against the explicit design contract.

## Cases

### RV-01 — GM opens and selects a current-Scene Zone

- **Trace:** discover/select scenarios; tasks 3.1–3.4, 5.3
- **Status:** pass
- **Fixture/setup:** Create two independent persistent Region documents with `e2eZoneAdministration` flags.
- **Visible player path:** 1. Activate Foundry's Region controls. 2. Press **Zonen verwalten**. 3. Press **Auf Karte auswählen** for the named target Zone.
- **Expected visible result:** The titled manager shows sorted rows and the target Region becomes selected on Foundry's active Region layer.
- **Visual assertion:** Capture the manager in light mode and inspect the required top-to-bottom hierarchy and action order.
- **State corroboration:** Inspect the active Region layer and controlled target placeable after the visible action.
- **`page.evaluate` use:** fixture setup, state inspection, and cleanup only; the manager opening and selection are browser clicks.
- **Console/page errors:** none from E2E-040.
- **Evidence:** E2E-040 passed on 2026-08-13; `test-results/e2e-040-zone-administration-light.png`.
- **Cleanup:** exact fixture Region/effect IDs were removed; stale recovery is restricted to the same `e2eZoneAdministration` namespace.
- **Result / unverified boundary:** pass.

### RV-02 — GM extends a Zone duration

- **Trace:** duration scenario; tasks 2.2, 5.3
- **Status:** pass
- **Fixture/setup:** Target Zone starts at three scene rounds.
- **Visible player path:** Enter `6` in **Verbleibende Szenenrunden** and press **Dauer speichern**.
- **Expected visible result:** The manager rerenders with `6 Szenenrunden` while the Zone row remains present.
- **Visual assertion:** The editor appears before **Zone aufheben** and remains unclipped.
- **State corroboration:** Inspect only `flags.Ilaris.zone.remaining`; retain the original application ID, membership, shape, and comparison Zone/effect.
- **`page.evaluate` use:** inspection and cleanup only.
- **Console/page errors:** none from E2E-040.
- **Evidence:** E2E-040 passed on 2026-08-13; visible row updated from three to six scene rounds.
- **Cleanup:** exact fixture Region/effect IDs.
- **Result / unverified boundary:** pass.

### RV-03 — Reconciliation is maintenance only

- **Trace:** non-triggering reconciliation scenario; tasks 2.4, 5.3
- **Status:** pass
- **Fixture/setup:** Target triggered Zone begins with stale membership; baseline message/effect IDs are captured.
- **Visible player path:** Press **Abgleich durchführen** in the manager.
- **Expected visible result:** The manager remains open and reports successful reconciliation.
- **Visual assertion:** Toolbar remains above Zone rows.
- **State corroboration:** Membership matches containment; no new message, trigger-based ActiveEffect, resistance prompt, damage, or traversal marker exists.
- **`page.evaluate` use:** setup and post-action inspection only.
- **Console/page errors:** none from E2E-040.
- **Evidence:** E2E-040 passed on 2026-08-13; membership repaired and message IDs remained unchanged.
- **Cleanup:** exact fixture Region/effect IDs.
- **Result / unverified boundary:** pass.

### RV-04 — Dismissal invokes Region-owned cleanup precisely

- **Trace:** dismissal scenario; tasks 2.3, 4.3, 5.3
- **Status:** pass
- **Fixture/setup:** Target and comparison passive Zones own separate effects on the same isolated actor.
- **Visible player path:** Press target **Zone aufheben**, then confirm the Foundry dialog.
- **Expected visible result:** Only target row disappears; comparison row remains.
- **Visual assertion:** Dismissal is the last destructive action in the target row.
- **State corroboration:** Target Region and exactly its owned effect are gone; comparison Region/effect remain.
- **`page.evaluate` use:** fixture setup, document inspection, and cleanup only; confirmation uses visible buttons.
- **Console/page errors:** none from E2E-040.
- **Evidence:** E2E-040 passed on 2026-08-13; target Region/effect removed while comparison Region/effect remained.
- **Cleanup:** exact fixture Region/effect IDs.
- **Result / unverified boundary:** pass.

### RV-05 — Manager remains readable in both themes

- **Trace:** theme and malformed metadata scenarios; tasks 3.5, 5.4
- **Status:** pass
- **Fixture/setup:** Add one malformed `Ilaris.zone` Region and capture the pre-test `core.uiConfig` value.
- **Visible player path:** Open the manager in light and dark UI configuration.
- **Expected visible result:** Malformed warning identifies the Region but receives no actions; context, toolbar, warning, and rows are visible and readable in both screenshots.
- **Visual assertion:** inspect the two recorded screenshots for hierarchy, contrast, overflow, and clipping.
- **State corroboration:** malformed Region is not reconciled or mutated.
- **`page.evaluate` use:** setup, setting restoration, and inspection only.
- **Console/page errors:** none from E2E-040.
- **Evidence:** E2E-040 passed on 2026-08-13; `test-results/e2e-040-zone-administration-light.png` and `test-results/e2e-040-zone-administration-dark.png` inspected. The Foundry startup progress overlay remains above the application in these captures and is outside the manager surface.
- **Cleanup:** exact fixture Region IDs and `core.uiConfig` restore.
- **Result / unverified boundary:** pass; Foundry's unrelated startup overlay prevents a perfectly clean frame.

### RV-06 — Existing Zone workflows regressions

- **Trace:** task 5.5
- **Status:** pass
- **Fixture/setup:** existing E2E fixtures clean their own `e2eZone` and `e2eWallTraversal` documents.
- **Visible player path:** run E2E-038 spell-zone lifecycle and E2E-039 wall traversal.
- **Expected visible result:** Existing placement/cast and traversal/resistance outcomes pass unchanged.
- **Visual assertion:** existing E2E screenshots and visible controls.
- **State corroboration:** existing cases' assertions.
- **`page.evaluate` use:** as documented in their established fixture setup/inspection paths.
- **Console/page errors:** none.
- **Evidence:** combined E2E-038/E2E-039 run: 9 passed (3.7m) on 2026-08-14. The creation/re-entry fixture explicitly enables those generic triggers instead of inheriting the intentionally traversal-only Wand aus Dornen profile.
- **Cleanup:** owned by existing idempotent case teardown.
- **Result / unverified boundary:** pass.

## Teardown record

- **Created IDs removed:** E2E-040 exact Region and Active Effect IDs removed after its passing run.
- **Settings, targets, documents, chat, map objects, and effects restored:** `core.uiConfig` restored; no E2E-040 messages, targets, or tokens were created.
- **Termination/failure cleanup verified:** stale recovery only matches the `e2eZoneAdministration` namespace; regular teardown removes the exact IDs recorded by the fixture.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary |
| ------ | ----------------- | ------ | ------------------------------------------ |
| —      | —                 | —      | all cases pending                          |

## Final assessment

- **Passed cases:** RV-01, RV-02, RV-03, RV-04, RV-05, RV-06.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** no diagnostics from E2E-040. The Foundry startup progress overlay appears in screenshots but is not part of the manager.
- **Runtime validation conclusion:** the Zone administration feature passes its dedicated runtime verification and required regressions.
