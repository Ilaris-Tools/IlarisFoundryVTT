# Runtime Verification: add-aeolitus-zone-effect

**Scope:** `runtime-relevant`
**Status:** `partial` — automated runtime and visual checks passed; the three
table-play manual casting paths remain available for a GM to confirm.
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `feature/pre-effect-zones-v2` (worktree change in progress)

## Applicability

This change adds a compendium spell, visible supernatural Item-sheet controls,
structured-form casting behavior, Scene Region lifecycle state, Active Effects,
and whispered chat outcomes. Runtime verification is required for the
player-visible Zone placement and casting path as well as the persisted Region
and effect state.

## Traceability

| Case  | Requirement scenario / task                  | Player-visible behavior                                                                                         |
| ----- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| RV-01 | aeolitus base cone; tasks 4.3, 6.3           | Casting the base spell affects the selected cone targets only after failed KK resistance.                       |
| RV-02 | Langer Atem persistence; tasks 2.2, 4.4, 6.4 | Persistent cone triggers at creation, entry, and round start for the captured KO duration.                      |
| RV-03 | Sturm failure outcome; tasks 3.1–3.4, 6.5    | Failed resistance shows Liegend, a Zurückgestoßen marker, and a manual GM instruction without moving the Token. |
| RV-04 | Authoring UI; tasks 4.1–4.2, 6.3             | Zone duration and failure-result controls appear in the approved order without clipping.                        |

## Preconditions and baseline

- **World / user / scene:** active GM in `ilaris-e2e-world-v14363-r1`, an
  active combat on the test Scene, one caster and at least one non-caster
  target Token.
- **Actors, items, packs, and settings:** a test Actor with Luft and KO values,
  the packed Zauber/Liturgien compendium, normal Zone stacking settings.
- **Baseline IDs/state to restore:** original selected targets, temporary
  combatants, Region IDs, ActiveEffect IDs, chat-message IDs, Item copies, and
  settings changed by a case.
- **Restart action:** `PackAndRestart`, because the change updates compendium
  `_source` data as well as code and templates.
- **Foundry v14 API / wiki references consulted:** RegionDocument, Scene,
  Combat, combatRound, Actor, ActiveEffect, ChatMessage; community wiki API,
  helpers/deepClone, Document embedding, and Active Effect guidance.

## UI acceptance contract

- **Affected surface(s):** supernatural Item authoring sheet; structured form
  editor; existing casting dialog; map Region; chat and Actor effects list.
- **Required order / placement:** Zonenautomatisierung remains before
  Strukturierte Zaubermodifikationen and Pre-Effects. In both base Zone and
  form Zone editors: geometry, placement, lifecycle, Dauerquelle and its
  active value/attribute control, triggers, removal; Form-Pre-Effects follow
  the form Zone controls. The failure outcome shows `Zurückstoßen
(Spielleitung)` after marker controls.
- **Must remain visible / unchanged:** existing Zone geometry, placement,
  creation/entry/round controls, structured forms, and ordinary Pre-Effect
  controls remain visible and usable.
- **Shared vs. concrete ownership:** shared Pre-Effect code provides data and
  listeners; `uebernatuerlich_talent.hbs` owns section order and concrete
  controls.
- **Theme scope:** `both`; Item-sheet controls use existing styling and must
  remain readable in light and dark mode.
- **Visual reference:** written acceptance contract above; screenshots stored
  with the E2E artifact output or recorded in this checklist.

## Automated execution record

- `PackAndRestart` completed for `ilaris-e2e-world-v14363-r1` on port 30000.
- `npm test`: 60 suites / 753 tests passed. `npm run lint` and strict OpenSpec
  validation passed.
- E2E-038 Aeolitus duration case passed: the packed base cone and all forms
  resolved, and the Langer Atem Region persisted the caster's KO as numeric
  `sceneRounds` without retaining `duration.source`.
- E2E-038 authoring case passed: the concrete sheet rendered Zone controls,
  structured forms, then Pre-Effects in that order; it exposed all three form
  duration-source selectors and rendered the enabled failure-result
  `Zurückstoßen (Spielleitung)` control. Light and dark screenshots were
  captured under `test-results/`.
- The full E2E-038 regression initially observed a non-reproducible extra
  resistance prompt in its pre-existing multiplayer turn/round case (4 rather
  than 3); its other nine cases passed, and the exact failed case passed on
  immediate rerun (85 seconds). No Aeolitus case failed.

## Cases

### RV-01 — Base Aeolitus cone and canonical condition

- **Trace:** aeolitus-zone-spell “Base cone applies Niederschmettern after
  failed KK resistance”; tasks 4.3, 6.3.
- **Status:** `not-run`
- **Fixture/setup:** create one caster and one target positioned in the
  16-Schritt 45-degree cone; capture existing target effects and chat IDs.
- **Visible player path:** open Aeolitus from the caster; verify `Zone
platzieren`; place the cone; roll successfully; click the target resistance
  action and fail KK 16.
- **Expected visible result:** the target displays the canonical Liegend
  condition; an outside Token remains unaffected.
- **Visual assertion:** capture the placed cone and target effects; no
  clipping in the casting dialog; theme assertion is covered by RV-04.
- **State corroboration:** inspect the target condition source for spell,
  caster, cast skill, and target Token provenance.
- **`page.evaluate` use:** fixture placement/state inspection/cleanup only;
  never casts, rolls, places the cone, or handles resistance.
- **Console/page errors:** collect and investigate.
- **Evidence:** pending.
- **Cleanup:** delete only case-created Regions, effects, chat, tokens, and
  temporary Items in `finally`.
- **Result / unverified boundary:** pending.

### RV-02 — Langer Atem captured Zone lifecycle

- **Trace:** aeolitus-zone-spell “Langer Atem persists and repeats”; caster-
  attribute-duration scenarios; tasks 2.2–2.3, 4.4, 6.4.
- **Status:** `not-run`
- **Fixture/setup:** caster KO is set to a known positive value; target begins
  inside the cone and a second target can later enter.
- **Visible player path:** select Langer Atem; place and successfully cast the
  cone; observe the Zone administration entry; move a target into the cone;
  advance combat through forward round starts; dismiss the Zone manually.
- **Expected visible result:** Zone administration displays the numeric KO
  snapshot; initial occupant, entrant, and current occupant each receive the
  appropriate resistance flow; no later KO change changes the Region timer.
- **Visual assertion:** capture selected form, map Region, and Zone
  administration entry.
- **State corroboration:** inspect Region flags for numeric `sceneRounds`,
  membership, and expiry after final triggered round.
- **`page.evaluate` use:** limited to fixture setup, KO snapshot inspection,
  controlled combat advancement if no user control exists, and cleanup.
- **Console/page errors:** collect and investigate.
- **Evidence:** pending.
- **Cleanup:** exact Region/effect/chat/token IDs removed or restored in
  `finally`.
- **Result / unverified boundary:** manual concentration break is verified by
  GM dismissal only; automatic concentration detection is intentionally out of
  scope.

### RV-03 — Sturm table-managed displacement

- **Trace:** table-managed displacement scenarios; tasks 3.1–3.4, 4.4, 6.5.
- **Status:** `not-run`
- **Fixture/setup:** one target inside a successfully cast Sturm cone, with
  its original coordinates captured.
- **Visible player path:** select Sturm; place and successfully cast; open the
  target’s resistance flow and fail it; read the resulting chat message.
- **Expected visible result:** the target shows Liegend and visible
  `Zurückgestoßen — Aeolitus Windgebraus`; owner and GM receive one German
  instruction to reposition manually.
- **Visual assertion:** capture chat and effects list.
- **State corroboration:** compare Token coordinates before and after;
  inspect marker and condition provenance, including selected form.
- **`page.evaluate` use:** setup, coordinate/effect/message inspection, and
  cleanup only.
- **Console/page errors:** collect and investigate.
- **Evidence:** pending.
- **Cleanup:** remove exact marker/condition sources, messages, and temporary
  map documents in `finally`.
- **Result / unverified boundary:** pending.

### RV-04 — Zone and failure-result authoring layout

- **Trace:** spell-zone-lifecycle authoring scenario; tasks 4.1–4.2, 6.3.
- **Status:** `not-run`
- **Fixture/setup:** open an editable Aeolitus Item copy from the packed
  compendium.
- **Visible player path:** open the item sheet; change Dauerquelle between
  fixed and caster attribute; inspect a structured form; enable its failure
  outcome; inspect the displacement control.
- **Expected visible result:** the contract order and conditional controls are
  visible; normal existing fields remain present.
- **Visual assertion:** screenshot the full relevant sheet in both light and
  dark mode; inspect hierarchy, overflow, and contrast.
- **State corroboration:** save/reopen a temporary copy and inspect persisted
  values.
- **`page.evaluate` use:** fixture Item copy/cleanup and structural inspection
  only; no form-save action replacement.
- **Console/page errors:** collect and investigate.
- **Evidence:** pending.
- **Cleanup:** delete only the temporary Item copy and restore theme/setting.
- **Result / unverified boundary:** pending.

## Teardown record

- **Created IDs removed:** pending.
- **Settings, targets, documents, chat, map objects, and effects restored:** pending.
- **Termination/failure cleanup verified:** pending.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary |
| ------ | ----------------- | ------ | ------------------------------------------ |
| —      | —                 | —      | —                                          |

## Final assessment

- **Passed cases:** none yet.
- **Failed / blocked / not-run cases:** RV-01 through RV-04 are not run.
- **Unexpected console diagnostics and disposition:** pending.
- **Runtime validation conclusion:** implementation pending.
