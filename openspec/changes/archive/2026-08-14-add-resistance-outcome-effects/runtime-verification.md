# Runtime Verification: add-resistance-outcome-effects

**Scope:** `runtime-relevant`
**Status:** `complete`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** uncommitted `add-resistance-outcome-effects` worktree

## Applicability

This change modifies the visible supernatural casting dialog and item editor,
whispered resistance prompts, timed embedded ActiveEffects, condition-source
provenance, and packed spell Item source data. Runtime verification is
therefore required before E2E completion.

## Traceability

| Case  | Requirement scenario / task                                                    | Player-visible behavior                                                                                                   |
| ----- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| RV-01 | `resistance-outcome-effects`: explicit success/failure payloads; tasks 2.1–2.6 | A failed resistance shows only the failure marker; a successful resistance shows only the success modifier.               |
| RV-02 | marker source linkage and cast-skill scenarios; tasks 2.7, 3.5                 | The effect row visibly includes marker and spell, while source data names the exact cast skill.                           |
| RV-03 | `supernatural-pre-effects`: outcome panel order; tasks 3.1–3.4                 | Normal Pre-Effect controls remain first; resistance and optional result panels render in the agreed order in both themes. |
| RV-04 | `spell-pre-effect-data`: reviewed source data; tasks 4.1–4.5                   | Fluch des Gewürms, Krabbelnder Schrecken, and Hexengalle expose the reviewed data and apply no fake `0` modifier.         |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, one active GM and `e2e-player`, an active combat Scene, caster Token, and player-owned target Token.
- **Actors, items, packs, and settings:** snapshot target effects, combat position, `supernaturalEffectStacking`, user targets, messages created by the case, and the three migrated source Items.
- **Baseline IDs/state to restore:** record only IDs created by the test; restore every changed setting/target and remove exact created ActiveEffects, messages, temporary Items, and Tokens in `finally`.
- **Restart action:** `PackAndRestart` completed before browser testing; `Restart` completed after the final casting-dialog template change.
- **Foundry v14 API / wiki references consulted:** ActiveEffect, Actor embedded documents, ChatMessage, Hooks, and `foundry.utils.deepClone`/`randomID`; Foundry v14 `core.uiConfig.colorScheme.applications` was also verified from the installed client source before the reversible light/dark check.

## UI acceptance contract

- **Affected surface(s):** supernatural item Pre-Effect editor; supernatural casting dialog; target actor Effects row/source details.
- **Required order / placement:** each Pre-Effect card renders normal effect controls, then Widerstand configuration, then optional `Bei misslungener Widerstandsprobe` and `Bei gelungener Widerstandsprobe` panels. A tie-only **Fertigkeit** selector appears in the casting dialog's left column directly above modifications; the right column keeps placement and dice actions.
- **Must remain visible / unchanged:** normal item fields remain before the Pre-Effects section; fixed/unique casts show no unnecessary skill selector; all roll actions remain inaccessible until a tied cast skill is selected.
- **Shared vs. concrete ownership:** shared Pre-Effect code supplies data/listeners; spell and maneuver sheets retain template placement. Casting dialog owns its own tie selector.
- **Theme scope:** `both`, because outcome panels are a new rendered form surface and the design requires dark-mode inspection.
- **Visual reference:** this written contract; attach Playwright screenshots of normal/dark editor and the tied casting dialog/effect row.

## Cases

### RV-01 — Resistance results select exactly one persistent payload

- **Trace:** explicit success/failure payload scenarios; tasks 2.1–2.6 and 6.3.
- **Status:** `pass`
- **Fixture/setup:** create/locate a caster and target with a spell configured with _Fluch des Gewürms_' reviewed outcome payload; record baseline effects/messages and select the target through normal Foundry targeting. The focused E2E uses _Ignifaxius Flammenstrahl_ as that fixture; RV-04 validates _Fluch des Gewürms_' packed source directly.
- **Visible player path:** 1. Open the spell's casting dialog. 2. Cast through the visible roll action. 3. On the player client, click the whispered resistance button and resolve a failed branch. 4. Repeat from a clean baseline for a successful branch.
- **Expected visible result:** failure shows `Handlungsunfähig — <spell name>`; success shows only the spell-linked `-4` modifier effect.
- **Visual assertion:** actor Effect row is readable without clipping and visibly includes marker plus spell; screenshot path recorded after execution.
- **State corroboration:** inspect created effect `origin`, spell/caster/component/application fields, `resistanceOutcome`, marker id, duration, and modifier array. Focused source and unit tests cover the ordinary timed-effect duration/expiry path.
- **`page.evaluate` use:** setup, source/effect inspection, deterministic resistance-result dispatch only when the visible FertigkeitDialog cannot safely roll deterministically, and cleanup; it SHALL NOT replace opening/casting/clicking the normal player flow.
- **Console/page errors:** collect and investigate before passing.
- **Evidence:** focused E2E-026 failure branch passed (65.2 s) and successful branch passed (53.1 s). The failure row screenshot is `test-results/resistance-outcome-effect-row.png`.
- **Cleanup:** E2E-026 restored the `HatAlles` actor snapshot, exact created effects, target-selection setting, random-die override, and chat log in `afterEach`.
- **Result / unverified boundary:** passed. Deterministic `Ilaris.postSkillRoll` dispatch was used only after the real casting and player-visible resistance dialogs had opened, to select each outcome without flaky dice randomness.

### RV-02 — Exact cast skill remains queryable

- **Trace:** concrete cast-skill scenarios; tasks 1.5, 2.7, 3.5, and 5.5.
- **Status:** `pass`
- **Fixture/setup:** configure an automatic multi-skill spell with tied eligible skills on the caster; record the Item and actor state.
- **Visible player path:** open the normal supernatural casting dialog, select one available **Fertigkeit**, then cast and resolve its resistance branch.
- **Expected visible result:** selector is required only for the tie, roll is unavailable beforehand, and the resulting effect remains visibly spell-linked.
- **Visual assertion:** selector precedes modifications in the left column; right-side dice/placement controls remain present; screenshot path recorded after execution.
- **State corroboration:** inspect `flags.ilaris.sourceItemUuid`, `spellUuid`, and concrete `castSkill` on the effect/condition source.
- **`page.evaluate` use:** fixture setup, inspection, and cleanup only.
- **Console/page errors:** collect and investigate before passing.
- **Evidence:** focused E2E-026 tied-skill case passed (42.6 s); screenshot `test-results/tied-cast-skill-selector.png` confirms the selector and enabled result after selection.
- **Cleanup:** the actor snapshot restores the temporary automatic-skill Item configuration; chat and setting cleanup use the same idempotent `afterEach` path.
- **Result / unverified boundary:** passed for the tied selector and the effect's source flags. Fixed and unique-auto resolution are unit-covered; the tied player path is browser-covered.

### RV-03 — Outcome editor obeys the shared UI contract

- **Trace:** panel order scenario; tasks 3.1–3.4.
- **Status:** `pass`
- **Fixture/setup:** open one spell and one maneuver with Pre-Effects; record no persistent world mutation beyond normal form edits, then cancel/restore.
- **Visible player path:** open each real Item sheet, enable resistance and each optional outcome panel, add/remove a nested modifier or change, and reopen the sheet.
- **Expected visible result:** ordinary controls are above Widerstand and outcome panels; both panels keep their values and controls.
- **Visual assertion:** compare structural element order and screenshots in normal and dark themes; verify no panel is clipped or appears before ordinary item content.
- **State corroboration:** inspect only the explicitly changed `system.preEffects` paths, then restore them.
- **`page.evaluate` use:** optional exact data snapshot/restore only.
- **Console/page errors:** collect and investigate before passing.
- **Evidence:** focused E2E-027 order/expansion case passed (27.1 s). Its light/dark case passed (35.9 s); screenshots `test-results/resistance-outcomes-editor-light.png` and `test-results/resistance-outcomes-editor-dark.png` show the Widerstand section followed by both collapsed outcome panels without clipping.
- **Cleanup:** E2E-027 deletes its imported world Item in `afterEach`; the light/dark case restores the exact client `core.uiConfig` setting in `finally`.
- **Result / unverified boundary:** passed for the shared spell editor. The maneuver sheet retains the same shared part and is unit-covered for composition; it was not separately screen-captured because the reused part has no distinct visual branch.

### RV-04 — Reviewed source Items use the supported model

- **Trace:** spell source-data scenarios; tasks 4.1–4.5.
- **Status:** `pass`
- **Fixture/setup:** restart after packing and resolve the three compendium Items normally.
- **Visible player path:** open their normal sheets and inspect the relevant Pre-Effect configuration.
- **Expected visible result:** _Fluch des Gewürms_ and _Krabbelnder Schrecken_ show distinct outcomes; _Hexengalle_ has no zero-valued placeholder.
- **Visual assertion:** normal-theme sheet screenshot; dark mode is covered by RV-03.
- **State corroboration:** inspect packed Item source fields and assert no `value: "0"` fake modifier is used for Hexengalle's marker.
- **`page.evaluate` use:** source inspection only.
- **Console/page errors:** collect and investigate before passing.
- **Evidence:** `PackAndRestart` completed successfully. `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` passed with the reviewed source assertions.
- **Cleanup:** no persistent mutation.
- **Result / unverified boundary:** passed. Compendium Item source fields are additionally covered by the packed source-data test; no live Item mutation was required.

## Teardown record

- **Created IDs removed:** E2E-026 removes effects not in its initial exact ID list; E2E-027 deletes its imported Item by ID.
- **Settings, targets, documents, chat, map objects, and effects restored:** target-selection, `core.uiConfig`, actor snapshot, chat log, and random dice override are restored by test teardown/finally blocks.
- **Termination/failure cleanup verified:** the failure branch was intentionally rerun after a screenshot assertion correction; subsequent fresh runs passed without stale outcome effects blocking the test.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary |
| ------ | ----------------- | ------ | ------------------------------------------ |
| —      | —                 | —      | —                                          |

## Final assessment

- **Passed cases:** RV-01, RV-02, RV-03, and RV-04.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** no unexpected browser console or page errors were emitted by the passing focused cases. A first assertion assumed the shortened spell name `Ignifaxius`; it was corrected to accept the actual Item name `Ignifaxius Flammenstrahl` and the fresh rerun passed.
- **Runtime validation conclusion:** completed. The change is verified through the ordinary spell-dialog and resistance-prompt route, with state inspection corroborating structured provenance and focused light/dark visual evidence.
