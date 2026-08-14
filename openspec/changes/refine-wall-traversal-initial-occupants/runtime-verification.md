# Runtime Verification: refine-wall-traversal-initial-occupants

**Scope:** `runtime-relevant`
**Status:** `in-progress`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `feature/refine-wall-traversal-initial-occupants` before implementation

## Applicability

This change changes the visible map-movement behavior of a persistent Region,
the resistance prompt/result path, a visible Active Effect marker, and a chat
notice. Automated E2E evidence and an exact manual map check are required.

## Traceability

| Case  | Requirement scenario / task                               | Player-visible behavior                                                                                                 |
| ----- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| RV-01 | Wall traversal: normal EXIT; tasks 2.1–2.4, 5.2           | Leaving a wall through normal map movement causes one `2W6 TP` and one GE 16 resistance flow.                           |
| RV-02 | Wall traversal: initially contained Token; tasks 2.3, 5.4 | Placing a wall over a Token produces no damage, prompt, or marker.                                                      |
| RV-03 | Wall traversal: failure lifecycle; tasks 2.4, 5.2, 5.4    | A failed outbound resistance produces the existing visible marker and one GM/owner instruction, without Token movement. |
| RV-04 | Quick-reference documentation; tasks 3.1, 5.4             | The packed German guide explains initial placement and normal outbound crossing.                                        |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`; active GM and one owned target Token on the E2E Scene.
- **Actors, items, packs, and settings:** packed _Wand aus Dornen_; Zone automation target setting enabled; target has enough health for `2W6 TP` inspection.
- **Baseline IDs/state to restore:** record created Region, Token, Active Effect, and ChatMessage IDs; restore target position, health, selection, and any changed setting.
- **Restart action:** `PackAndRestart`, because the quick-reference compendium source changes; then use `Status` before E2E.
- **Foundry v14 API / wiki references consulted:** `TokenDocument#segmentizeRegionMovementPath`; `moveToken(document, movement, operation, user)`; RegionDocument; community API helper guidance.

## UI acceptance contract

Not applicable. No rendered sheet, dialog, or CSS layout changes. Chat and map
results are runtime evidence, not a changed layout contract.

## Cases

### RV-01 — Normal outbound crossing dispatches once

- **Trace:** `A Token leaves a wall through normal movement`; tasks 2.1–2.4 and 5.2.
- **Status:** `pass`
- **Fixture/setup:** cast/place _Wand aus Dornen_, then position the target inside the Region through isolated test setup.
- **Visible player path:** move the owned Token from inside to outside using normal map movement; open and resolve the GE resistance prompt.
- **Expected visible result:** exactly one `2W6 TP` consequence and one GE 16 prompt; no duplicate prompt from mixed movement segments.
- **Visual assertion:** not applicable to layout; capture map/chat screenshot if manual runtime verification is performed.
- **State corroboration:** inspect health delta, ChatMessage delta, Region traversal marker, and Token position.
- **`page.evaluate` use:** setup, state inspection, and cleanup only; it must not perform the normal player movement or resistance action.
- **Console/page errors:** collect and investigate unexpected diagnostics.
- **Evidence:** `npm.cmd run test:e2e -- --grep "keeps initial wall placement inert" e2e/cases/e2e-039-wall-traversal-trigger/e2e-039-wall-traversal-trigger.spec.ts` passed on 2026-08-14; isolated existing inbound E2E-039 regression also passed.
- **Cleanup:** remove exact created IDs and restore the baseline Token position and health.
- **Result / unverified boundary:** passed; manual dark-theme inspection remains outstanding.

### RV-02 — Initial wall placement is inert

- **Trace:** `A Token starts within a newly placed wall`; tasks 2.3 and 5.4.
- **Status:** `pass`
- **Fixture/setup:** place/cast the wall so the target is initially contained.
- **Visible player path:** confirm the placed wall without moving the Token.
- **Expected visible result:** no damage, resistance prompt, marker, or manual movement notice.
- **Visual assertion:** map Region visible; no new relevant chat/effect surface.
- **State corroboration:** inspect exact message/effect deltas and target health.
- **`page.evaluate` use:** baseline inspection and cleanup only.
- **Console/page errors:** collect and investigate unexpected diagnostics.
- **Evidence:** focused outbound E2E-039 case passed: its initial Region containment assertion was true and its initial GE prompt count was zero before the player drag.
- **Cleanup:** delete only the created Region and restore baseline state.
- **Result / unverified boundary:** passed; the human light/dark review remains outstanding.

### RV-03 — Outbound failure remains table-managed

- **Trace:** `A Token leaves a wall through normal movement`; tasks 2.4, 5.2, and 5.4.
- **Status:** `pass`
- **Fixture/setup:** RV-01 with a failed GE 16 resistance.
- **Visible player path:** resolve the resistance as a failure.
- **Expected visible result:** one visible failed-traversal marker and one German GM/owner instruction; the Token remains where the player moved it.
- **Visual assertion:** inspect marker and chat notice in both light and dark themes during manual verification.
- **State corroboration:** marker provenance identifies only the created Region and Token; no Token update is issued by the system.
- **`page.evaluate` use:** inspect marker/Token data and teardown only.
- **Console/page errors:** collect and investigate unexpected diagnostics.
- **Evidence:** focused outbound E2E-039 case passed after a failed resistance; it asserted the target stayed at its player-moved position, the Region-owned marker existed, and one failure notice existed.
- **Cleanup:** remove the created Region and its marker; restore health and Token state.
- **Result / unverified boundary:** passed; the visual light/dark review remains outstanding.

### RV-04 — Guide reflects the boundary rule

- **Trace:** `The Zone guide documents wall traversal boundary behavior`; tasks 3.1 and 5.4.
- **Status:** `not-run`
- **Fixture/setup:** packed quick-reference compendium.
- **Visible player path:** open the Zone automation guide in Foundry.
- **Expected visible result:** German text states placement over a Token is inert and normal movement into or out of the wall is a traversal attempt.
- **Visual assertion:** confirm readable rendering in light and dark themes; capture screenshots during manual review.
- **State corroboration:** none beyond packed Journal source.
- **`page.evaluate` use:** none for the central reading path.
- **Console/page errors:** collect and investigate unexpected diagnostics.
- **Evidence:** runtime screenshots and pack/restart output.
- **Cleanup:** close the journal without modifying persistent data.
- **Result / unverified boundary:** pending implementation.

## Teardown record

- **Created IDs removed:** E2E-039 teardown removed its exact `e2eWallTraversal` Regions and Tokens; its chat cleanup ran after each case.
- **Settings, targets, documents, chat, map objects, and effects restored:** automated E2E teardown passed.
- **Termination/failure cleanup verified:** the initial failed E2E run left an artifact only; its subsequent focused runs passed with normal teardown.

## Final assessment

- **Passed cases:** RV-01, RV-02, RV-03.
- **Failed / blocked / not-run cases:** RV-04 and manual light/dark inspection are not run.
- **Unexpected console diagnostics and disposition:** focused E2E-039 runs passed with no unexpected page or console diagnostics.
- **Runtime validation conclusion:** movement behavior is verified through focused real-canvas E2E; documentation and theme presentation require manual confirmation.
