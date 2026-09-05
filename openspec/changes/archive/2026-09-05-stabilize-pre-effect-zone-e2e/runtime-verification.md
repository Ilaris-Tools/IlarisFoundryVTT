# Runtime Verification: stabilize-pre-effect-zone-e2e

**Scope:** `runtime-relevant`  
**Status:** `complete`  
**World:** `ilaris-e2e-world-v14363-r1`  
**Server:** `http://127.0.0.1:30000`  
**Source revision:** `ceadae3f` plus uncommitted OpenSpec changes

## Applicability

This change verifies real Foundry Region, TokenDocument, Actor, and ActiveEffect
behavior through the zone E2E fixtures. It changes only test ownership,
containment assertions, and cleanup; no zone runtime implementation is changed.

## Traceability

| Case  | Requirement scenario / task                                                                              | Player-visible behavior                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| RV-01 | `spell-zone-lifecycle`: outside actor state does not fail Dämonenbann cleanup; tasks 1.1, 1.4, 3.1, 3.2  | Dämonenbann form is opened from a temporary actor item; only effects created by its Region are asserted and removed.    |
| RV-02 | `spell-zone-lifecycle`: cone containment selects only the inside fixture token; tasks 1.1, 1.4, 3.1, 3.2 | A placed Pestgestank cone resolves the inside TokenDocument and excludes the outside TokenDocument.                     |
| RV-03 | `zone-administration`: selected administration leaves comparison zone unchanged; tasks 1.1, 3.1, 3.2     | The GM zone administration dialog updates and dismisses the selected Region while its comparison Region/effect remains. |

## Preconditions and baseline

- **World / user / scene:** local `ilaris-e2e-world-v14363-r1`, GM `e2e-gm`, active E2E scene.
- **Actors, items, packs, and settings:** `HatAlles`, `Testlauf-Held`, `Ilaris.zauberspruche-und-rituale`; E2E-040 restores `core.uiConfig`.
- **Baseline IDs/state to restore:** every temporary Region, Token, Actor, Item, and ActiveEffect is recorded by its fixture and removed in `finally`/teardown.
- **Restart action:** `PackAndRestart`, because clean compendium state is required for independent E2E reproduction.
- **Foundry v14 API / wiki references consulted:** [RegionDocument](https://foundryvtt.com/api/classes/foundry.documents.RegionDocument.html), [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [foundry.utils](https://foundryvtt.com/api/v14/modules/foundry.utils.html), and [community helper guidance](https://github.com/foundry-vtt-community/wiki.js/blob/main/development/api/helpers.md).

## UI acceptance contract

Not applicable to new UI layout. Existing rendered surfaces are asserted by E2E-037's spell dialog and E2E-040's zone-administration dialog; E2E-040 captures its light and dark screenshots.

## Cases

### RV-01 — Dämonenbann fixture isolation

- **Trace:** `spell-zone-lifecycle` outside-state scenario; tasks 1.1, 1.4, 3.1, 3.2.
- **Status:** `pass`
- **Fixture/setup:** the clean baseline run showed that the cloned outside Actor has nine pre-existing effects; the fixture will compare its recorded effect IDs rather than assert a global zero count.
- **Visible player path:** open `HatAlles` → Übernatürlich → temporary `E2E Dämonenbann` → select `Magie unterdrücken`.
- **Expected visible result:** the form section is visible and the selected profile shows Zone, 8 Schritt, 1 Stunde, and Kosten 8.
- **Visual assertion:** existing spell-dialog screenshot; theme scope is not changed.
- **State corroboration:** Region-owned effects apply to the caster and inside target, not the outside actor, then are removed with the Region.
- **`page.evaluate` use:** setup, state inspection, and cleanup only; the sheet/dialog action is visible Playwright interaction.
- **Console/page errors:** no unexpected diagnostics observed during the passing E2E run.
- **Evidence:** E2E-037 passed 7/7 independently and within the final combined 19-case serial run.
- **Cleanup:** temporary item ID, Region IDs, Token IDs, and Actor ID.
- **Result / unverified boundary:** verified for the fixture's Region-owned effect provenance; separate system behavior is outside this fixture-only change.

### RV-02 — Pestgestank cone containment

- **Trace:** `spell-zone-lifecycle` cone-containment scenario; tasks 1.1, 1.4, 3.1, 3.2.
- **Status:** `pass`
- **Fixture/setup:** deterministic grid-relative inside/outside token coordinates and a temporary cone Region.
- **Visible player path:** E2E lifecycle suite creates and resolves the placed cone against the real scene.
- **Expected visible result:** only the inside token is selected.
- **Visual assertion:** map/document state; no new layout surface.
- **State corroboration:** `resolveZoneTargets(region)` contains the recorded inside token ID and excludes the recorded outside token ID.
- **`page.evaluate` use:** fixture setup, inspection, and cleanup only.
- **Console/page errors:** no unexpected diagnostics in the final E2E-038 run.
- **Evidence:** E2E-038 passed all 11 cases independently and within the final combined run.
- **Cleanup:** post-change fixture records the exact Region ID and Token IDs in `finally`.
- **Result / unverified boundary:** verified.

### RV-03 — Selected zone administration isolation

- **Trace:** `zone-administration` selected-zone scenario; tasks 1.1, 3.1, 3.2.
- **Status:** `pass`
- **Fixture/setup:** target, comparison, and malformed Regions plus recorded target/comparison effect IDs.
- **Visible player path:** GM opens Region Controls → `Ilaris-Zonen verwalten`, selects, extends, reconciles, and dismisses the target Zone.
- **Expected visible result:** target row disappears after dismissal; comparison row remains visible.
- **Visual assertion:** `test-results/e2e-040-zone-administration-light.png` and `test-results/e2e-040-zone-administration-dark.png`.
- **State corroboration:** target Region/effect are absent after dismissal; comparison Region/effect remain.
- **`page.evaluate` use:** setup, inspection, cleanup, and test theme state only.
- **Console/page errors:** no unexpected diagnostics in the final E2E-040 run.
- **Evidence:** E2E-040 passed independently and within the final combined run; light and dark screenshots were captured.
- **Cleanup:** `afterEach` receives the current fixture and deletes only its recorded effect and Region IDs.
- **Result / unverified boundary:** verified.

## Teardown record

- **Created IDs removed:** the passing fixture `finally`/`afterEach` cleanups removed their recorded IDs.
- **Settings, targets, documents, chat, map objects, and effects restored:** E2E-040 restored `core.uiConfig`; E2E-037/038 and E2E-040 passed together without cross-case fixture contamination.
- **Termination/failure cleanup verified:** final combined run passed after the independent runs.

## Final assessment

- **Passed cases:** RV-01, RV-02, RV-03; E2E-037 (7/7), E2E-038 (11/11), E2E-040 (1/1), and final combined run (19/19).
- **Failed / blocked / not-run cases:** none for this change's runtime verification.
- **Unexpected console diagnostics and disposition:** none.
- **Runtime validation conclusion:** complete. Fixture ownership is isolated; the clean-world cone test establishes no zone-targeting runtime defect.
