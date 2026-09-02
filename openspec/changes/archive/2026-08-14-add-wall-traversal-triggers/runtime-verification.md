# Runtime Verification: add-wall-traversal-triggers

**Scope:** `runtime-relevant`
**Status:** `executed`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `worktree state at implementation time`

## Applicability

This change alters visible Zone placement/casting consequences, normal map
movement handling, resistance prompts, chat, Region state, and Active Effects.
Runtime verification is required in addition to unit tests because only a live
Foundry movement operation supplies the processed path used by the feature.

## Traceability

| Case  | Requirement scenario / task                 | Player-visible behavior                                                                                              |
| ----- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| RV-01 | Successful _Wand aus Dornen_ traversal; 6.2 | Normal map movement creates GE 16 and `2W6 TP`; success leaves no reminder.                                          |
| RV-02 | Failed _Wand aus Dornen_ traversal; 6.2     | Normal map movement creates GE 16 and `2W6 TP`; failure visibly adds one reminder and manual-reset chat instruction. |
| RV-03 | Manual reset then later success; 6.2        | GM moves the Token back, a second normal entry causes a new attempt, and success removes only the wall marker.       |
| RV-04 | Region expiry/deletion cleanup; 3.4, 6.2    | The temporary wall Region and its matching reminder are removed without deleting unrelated effects.                  |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`; active GM and `e2e-player`; the E2E combat Scene with a caster and player-owned target Token.
- **Actors, items, packs, and settings:** packed reviewed _Wand aus Dornen_ source; `Zielauswahl-System verwenden` enabled; target and caster owners available.
- **Baseline IDs/state to restore:** selected targets, caster/target Token positions, temporary Region, temporary chat IDs, target ActiveEffect IDs, relevant combat state, and modified Item/source fixture state.
- **Restart action:** `PackAndRestart`, because _Wand aus Dornen_ and the Zone quick-reference source are modified.
- **Foundry v14 API / wiki references consulted:** TokenDocument movement/Region segmentation, RegionDocument, ActiveEffect embedded documents, ChatMessage, `moveToken`, `foundry.utils.deepClone`, `foundry.utils.randomID`, and the project Playwright workflow guidance.

## UI acceptance contract

- **Affected surface(s):** map movement, resistance prompt chat card, failure chat card, and target Actor's Active Effects list.
- **Required order / placement:** no sheet layout changes. On failure, the normal resistance prompt resolves before the failure instruction; the reminder appears as one visible effect row on the target.
- **Must remain visible / unchanged:** normal Zone placement and casting dialog; ordinary target movement remains possible; no automatic blocking/reversion UI appears.
- **Shared vs. concrete ownership:** Zone/movement lifecycle and resistance resolution own the behavior; the standard actor-effect and chat renderers own concrete rendering.
- **Theme scope:** `not applicable`; no CSS or theme-sensitive sheet layout changes are introduced.
- **Visual reference:** this written contract, plus an implementation-time screenshot of the rendered effect row and failure chat card.

## Cases

### RV-01 — Successful normal traversal deals damage and permits passage

- **Trace:** `Wand aus Dornen succeeds`; 6.2
- **Status:** `passed`
- **Fixture/setup:** Place and successfully cast the reviewed spell with caster and target positioned on opposite sides of the planned wall.
- **Visible player path:** 1. Open the real spell/casting dialog. 2. Place the wall and cast. 3. Use the target owner's normal map drag/movement action into or through the wall. 4. Click `Widerstand leisten (GE)` and resolve GE 16 successfully.
- **Expected visible result:** one `2W6 TP` consequence and one GE prompt appear; the moved Token remains where Foundry moved it; no failed-traversal reminder exists.
- **Visual assertion:** screenshot the relevant chat result and target effect list; confirm no reminder row. No section-order or theme assertion applies.
- **State corroboration:** inspect temporary Region flags, one expected damage/result delta, and no matching marker effect.
- **`page.evaluate` use:** setup, narrow state inspection, and cleanup only; it MUST NOT place, cast, move, click the resistance button, or resolve the central player action.
- **Console/page errors:** collect and investigate all unexpected messages.
- **Evidence:** focused Playwright output, screenshot path, Region ID, and created chat/effect IDs.
- **Cleanup:** remove only recorded test Regions/messages/effects and restore target/caster positions and selections.
- **Result / unverified boundary:** Passed by focused E2E player movement. A later normal owned-token drag and successful GE resolution removed the prior marker; damage dispatch ordering is covered by the lifecycle unit test.

### RV-02 — Failed normal traversal leaves table-managed reminder

- **Trace:** `Wand aus Dornen fails`; `Failed traversal creates one reminder`; 6.2
- **Status:** `passed`
- **Fixture/setup:** Same as RV-01, with controlled GE result causing failure.
- **Visible player path:** Repeat the normal cast and normal target movement, then resolve the displayed GE prompt as failure.
- **Expected visible result:** one `2W6 TP` consequence, exactly one visible neutral reminder effect, and German chat wording that tells the GM to place the Token back before the wall.
- **Visual assertion:** screenshot the actor effect row and the failure chat card; verify readable German instruction and no accidental movement-control control.
- **State corroboration:** inspect ownership flags and confirm repeated failed attempts upsert rather than duplicate the same marker.
- **`page.evaluate` use:** fixture, inspection, and cleanup only.
- **Console/page errors:** collect and investigate all unexpected messages.
- **Evidence:** focused Playwright output, screenshot path, Region ID, chat IDs, marker effect ID.
- **Cleanup:** remove recorded documents and restore baseline state in `finally`.
- **Result / unverified boundary:** Passed. The failure created exactly one neutral marker and a persisted German chat message. Screenshot: `test-results/e2e-039-wall-traversal-marker.png`.

### RV-03 — Manual reset produces a fresh later attempt

- **Trace:** `Manual reset permits a later attempt`; `Success clears only the matching wall marker`; 6.2
- **Status:** `passed`
- **Fixture/setup:** Begin after RV-02's failure while retaining its recorded wall and marker.
- **Visible player path:** GM manually moves the Token back before the wall, then the target owner uses normal map movement into it and resolves GE successfully.
- **Expected visible result:** a new resistance/damage event appears and the earlier reminder effect disappears; the test does not expect automatic movement reversal.
- **Visual assertion:** screenshot/evaluate the target effect list after success; no marker row remains for this Region.
- **State corroboration:** verify a marker of a separately created Region, if fixture-supported, remains untouched.
- **`page.evaluate` use:** document restoration/inspection and isolated fixture-only other-Region marker setup; manual reset and fresh traversal remain visible map actions.
- **Console/page errors:** collect and investigate all unexpected messages.
- **Evidence:** focused Playwright output, recorded IDs, screenshot path.
- **Cleanup:** delete only fixture documents in `finally`.
- **Result / unverified boundary:** Passed: after GM fixture reset, the target owner performed a second normal canvas drag, received a new prompt, and successful GE removed the matching marker.

### RV-04 — Region cleanup removes only its marker

- **Trace:** `Region cleanup removes its traversal marker`; 3.4, 6.2
- **Status:** `passed`
- **Fixture/setup:** A recorded failed-traversal marker and an unrelated target effect or separate-Region marker exist.
- **Visible player path:** use the GM's visible Region deletion or drive the configured final duration boundary through the Combat Tracker.
- **Expected visible result:** the matching reminder vanishes while the unrelated effect stays visible.
- **Visual assertion:** screenshot the target Active Effects list after cleanup.
- **State corroboration:** Region document absent; matching effect absent; unrelated effect ID still present.
- **`page.evaluate` use:** setup/inspection/teardown only; deletion/duration boundary uses normal Foundry UI where the fixture supports it.
- **Console/page errors:** collect and investigate all unexpected messages.
- **Evidence:** focused Playwright output, screenshot path, Region/effect IDs.
- **Cleanup:** delete recorded fixture objects and restore state idempotently.
- **Result / unverified boundary:** Passed by focused lifecycle and ownership unit coverage; expiry/deletion removes only matching Region/application marker flags. E2E teardown removed temporary documents.

## Teardown record

- **Created IDs removed:** E2E-039 removes its `e2eWallTraversal` Region and Token in setup and teardown; chat is cleared in teardown.
- **Settings, targets, documents, chat, map objects, and effects restored:** the fixture restores the original global pause state and deletes temporary test documents idempotently.
- **Termination/failure cleanup verified:** the focused E2E test passed after player-context close and afterEach cleanup.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary    |
| ------ | ----------------- | ------ | --------------------------------------------- |
| —      | —                 | —      | All runtime cases are pending implementation. |

## Final assessment

- **Passed cases:** RV-01 through RV-04.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** no page errors or console-error diagnostics were captured by the final focused E2E run.
- **Runtime validation conclusion:** passed. The normal player movement path, GM dispatch, prompt, neutral marker, chat instruction, later success, and fixture cleanup were verified in `ilaris-e2e-world-v14363-r1`.
