# Runtime Verification: add-pandemonium-zone-lifecycle

**Scope:** `runtime-relevant`
**Status:** `partial`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** worktree before implementation

## Applicability

This change modifies ActiveEffect timing and typed damage, persistent Region
membership, combat movement resistance, a rendered supernatural Item sheet,
compendium data, chat notices, and visible map effects. Runtime verification is
therefore required in addition to unit tests.

## Traceability

| Case  | Requirement scenario / task                    | Player-visible behavior                                                                                           |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| RV-01 | Pandämonium contained Token; 6.2–6.3           | A successful cast creates one visible passive DOT effect and one owner-turn damage tick.                          |
| RV-02 | Pandämonium leaves; passive DOT ownership; 6.3 | Leaving removes only this Region's effect and later turns do not tick it.                                         |
| RV-03 | Zone movement success/failure; 6.3             | Normal internal/enter/exit movement prompts GE 16; failure shows marker and origin notice without token rollback. |
| RV-04 | Zone editor contract; 4.1–4.2, 6.6             | The movement controls appear after existing trigger controls in base and structured-form Zones.                   |
| RV-05 | Region dismissal; 6.3                          | Dismissing the Region removes its DOT and movement marker without affecting unrelated effects.                    |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`; active GM plus owned player Token on a combat Scene.
- **Actors, items, packs, and settings:** a temporary embedded Pandämonium copy or the packed source; target-selection system enabled; active combat; baseline target health/effects, scene Regions, chat IDs, targets, and user settings recorded.
- **Baseline IDs/state to restore:** every created Region, ActiveEffect, ChatMessage, temporary Item, token position, target health, combat state, user target, and theme setting.
- **Restart action:** `PackAndRestart`, because `_source` compendium data changes; run `Status` first.
- **Foundry v14 API / wiki references consulted:** TokenDocument Region movement segmentation, RegionDocument containment, Actor embedded effects, ActiveEffect timing, Combat hooks, and `foundry.utils` helpers recorded during implementation.

## UI acceptance contract

- **Affected surface(s):** supernatural Item sheet, base Zone editor, and each structured-form Zone editor.
- **Required order / placement:** existing geometry/placement/lifecycle/duration controls; existing creation/entry/round-start checkboxes; `Bewegungswiderstand`; its `Attribut` and `Schwierigkeit` controls when enabled; existing Zone action buttons; unchanged forms and Pre-Effects.
- **Must remain visible / unchanged:** existing three trigger controls, Zone removal buttons, structured-form headers, and Pre-Effects.
- **Shared vs. concrete ownership:** normalization and listeners can be shared; `uebernatuerlich_talent.hbs` owns concrete base/form placement.
- **Theme scope:** the current supported UI theme only. The system does not currently provide light/dark theme support, so theme-specific visual verification is outside this change.
- **Visual reference:** the written acceptance contract in `design.md`; screenshots captured by the focused runtime/E2E review.

## Cases

### RV-01 — Cast creates and ticks one passive DOT

- **Trace:** `pandemonium-zone-spell` contained-token scenario; tasks 4.3, 6.2–6.3.
- **Status:** `partial`
- **Fixture/setup:** active combat Scene; target positioned in a confirmed two-step circle; no pre-existing Pandämonium Region/effect.
- **Visible player path:** open Pandämonium, place the circle, cast successfully, advance the target's combat turn.
- **Expected visible result:** target gains one named Region-owned ActiveEffect; one German damage chat card/result appears after its turn end.
- **Visual assertion:** inspect the map, effect row, and chat in the supported current UI theme; save screenshot artifacts.
- **State corroboration:** effect flags, health delta, and no timing decrement on the infinite effect.
- **`page.evaluate` use:** setup/inspection/cleanup only; never cast, place, roll, or advance the primary path.
- **Console/page errors:** collect and investigate.
- **Evidence:** E2E output and test artifacts.
- **Cleanup:** remove exact Region/effect/chat IDs and restore target/combat snapshot.
- **Result / unverified boundary:** E2E-041 verifies visible Region-owned DOT creation and preserved `PROFAN` metadata. A real combat owner-turn tick remains unverified.

### RV-02 — Leaving removes only the owned DOT

- **Trace:** `persistent-zone-effects` leaving scenario; task 6.3.
- **Status:** `not-run`
- **Fixture/setup:** target has one Pandämonium DOT and an unrelated effect.
- **Visible player path:** move the Token out of the visible circle, then advance its next turn.
- **Expected visible result:** the Pandämonium effect disappears; unrelated effect remains; no later Pandämonium tick appears.
- **Visual assertion:** map/effect/chat screenshot in the selected theme.
- **State corroboration:** exact owned effect ID is deleted and unrelated ID remains.
- **`page.evaluate` use:** setup/inspection/cleanup only.
- **Console/page errors:** collect and investigate.
- **Evidence:** E2E output and document IDs.
- **Cleanup:** restore baseline.
- **Result / unverified boundary:** pending.

### RV-03 — Movement resistance stays table managed

- **Trace:** `zone-movement-resistance` scenarios; tasks 3.2–3.5, 6.3.
- **Status:** `partial`
- **Fixture/setup:** target and Pandämonium Region; capture movement origin.
- **Visible player path:** drag the owned Token within/into/out of the circle, complete GE 16 once successfully and once unsuccessfully.
- **Expected visible result:** each normal movement produces one prompt; failure produces a single visible marker and German origin-restoration notice, while the Token position remains unchanged by the system.
- **Visual assertion:** prompt, marker, chat, and map screenshots in the supported current UI theme.
- **State corroboration:** marker flags contain Region/cast/Token/origin provenance; success/cleanup removes only the matching marker.
- **`page.evaluate` use:** fixture/inspection/cleanup only.
- **Console/page errors:** collect and investigate.
- **Evidence:** E2E output and document IDs.
- **Cleanup:** delete exact marker/Region/chat records and restore position.
- **Result / unverified boundary:** E2E-041 verifies failure marker provenance/origin notice, unchanged token position, later success cleanup, and Region deletion cleanup. A real player token drag and resist dialog remain unverified for Pandämonium.

### RV-04 — Zone editor order is visible

- **Trace:** `spell-zone-lifecycle` authoring scenarios; tasks 4.1–4.2, 6.6.
- **Status:** `not-run`
- **Fixture/setup:** open a real supernatural Item with base and structured-form Zone data.
- **Visible player path:** open sheet, enable `Bewegungswiderstand`, inspect base then structured-form controls.
- **Expected visible result:** attribute/difficulty controls are visible beneath the opt-in after existing trigger controls; nothing is clipped or moved.
- **Visual assertion:** screenshot of the complete relevant section in the supported current UI theme.
- **State corroboration:** saved source fields match displayed controls.
- **`page.evaluate` use:** inspection/cleanup only.
- **Console/page errors:** collect and investigate.
- **Evidence:** E2E/runtime screenshots.
- **Cleanup:** restore temporary Item snapshot.
- **Result / unverified boundary:** pending.

### RV-05 — Dismissal performs narrow cleanup

- **Trace:** `pandemonium-zone-spell` leave/dismiss lifecycle; task 6.3.
- **Status:** `partial`
- **Fixture/setup:** active Pandämonium Region with DOT and failed movement marker; unrelated effect/Region remains.
- **Visible player path:** use existing Zone administration to dismiss Pandämonium.
- **Expected visible result:** its DOT and marker disappear; unrelated effects remain.
- **Visual assertion:** Zone administration/map/effect screenshot.
- **State corroboration:** exact Region-owned document IDs are absent; unrelated IDs remain.
- **`page.evaluate` use:** setup/inspection/cleanup only.
- **Console/page errors:** collect and investigate.
- **Evidence:** E2E output and document IDs.
- **Cleanup:** restore baseline.
- **Result / unverified boundary:** E2E-041 verifies exact Region deletion cleanup for its owned DOT and marker. Zone-administration dismissal remains unverified for Pandämonium.

## Teardown record

- **Created IDs removed:** E2E-041 cleans exact flag-owned Regions, Tokens, effects, and test chat on success/failure.
- **Settings, targets, documents, chat, map objects, and effects restored:** verified for E2E-041; Zone-specific regression cases also clean their fixtures.
- **Termination/failure cleanup verified:** verified through E2E-041 `afterEach` cleanup.
- **Interrupted batch follow-up:** the later combined E2E-038â€“041 command exceeded the external 124-second command limit. A subsequent Foundry API inspection found no documents carrying any of its four fixture flags; unflagged documents and user state were preserved.

## Manual confirmation

| Tester            | Verified behavior                                                                                      | Result    | Remaining automated or unverified boundary                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------- |
| Automated E2E-041 | DOT effect creation, typed metadata, marker/origin lifecycle, success cleanup, Region deletion cleanup | partial   | Real cast/dialog, combat tick, normal player drag, and administration dismissal remain.                               |
| User              | Requested manual runtime check                                                                         | confirmed | Detailed observations for the individual RV cases were not recorded; the automated boundaries above remain as stated. |

## Final assessment

- **Passed cases:** no complete case yet; E2E-041 passes its focused ownership/marker lifecycle assertions.
- **Failed / blocked / not-run cases:** RV-01, RV-03, and RV-05 are partial; RV-02 and RV-04 are not run.
- **Unexpected console diagnostics and disposition:** none in E2E-039, E2E-040, or E2E-041. E2E-038 initially exposed an asynchronous cleanup wait; it now uses a predicate-based wait and the focused regression passes.
- **Runtime validation conclusion:** user manual check confirmed. The automated per-case boundaries above remain recorded for future targeted coverage.
