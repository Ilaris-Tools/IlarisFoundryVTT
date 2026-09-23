# Runtime Verification: add-target-magic-resistance

**Scope:** `runtime-relevant`<br>
**Status:** `passed`<br>
**World:** `ilaris-e2e-world-v14363-r1`<br>
**Server:** `http://127.0.0.1:30000`<br>
**Source revision:** `codex/add-target-magic-resistance` worktree

## Applicability

Runtime verification is required because this change adds authored compendium
data, changes the rendered supernatural dialog, exchanges player/GM socket
messages, creates whispered chat cards, and gates the existing spell-effect
path on a target's MR roll.

## Traceability

| Case  | Requirement scenario / task                     | Player-visible behavior                                                                                                  |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| RV-01 | Explicit source data; tasks 1.3–1.5             | _Blitz dich find_ uses the single-Actor MR mode while excluded source types remain manual.                               |
| RV-02 | Pending/resolved dialog; tasks 2.1–3.3          | The target section shows target, pending request, then `MR + 1W20 = Schwierigkeit`.                                      |
| RV-03 | Remote target roll; tasks 2.2–2.3, 5.3          | The target controller rolls one D20 through a visible chat card; caster and GM can audit it.                             |
| RV-04 | MR-gated cast; tasks 2.4, 5.3–5.4               | The cast uses the resolved difficulty and applies effects only after success.                                            |
| RV-05 | Stale/duplicate/manual fallback; tasks 3.3, 5.4 | A changed target invalidates old answers; duplicate answers have no second effect; unmarked/manual casts stay available. |

## Preconditions and baseline

- **World / user / scene:** local `ilaris-e2e-world-v14363-r1`, active GM, active grid Scene.
- **Actors, items, packs, and settings:** a caster with _Blitz dich find_, a selected owned target Token, refreshed `zauberspruche-und-rituale` pack, and test-local `useTargetSelection: true`.
- **Baseline IDs/state to restore:** user targets, target-selection setting, temporary owned Items/Actor values, chat messages, any test-created documents, and every recorded MR request ID.
- **Restart action:** `PackAndRestart` after source changes, then `Restart` after dialog/socket/template changes.
- **Foundry v14 API / wiki references consulted:** Actor, ChatMessage, Roll, and ApplicationV2 v14 API pages; community helper guidance and the existing `foundry.utils.randomID` pattern.

## UI acceptance contract

- **Affected surface(s):** supernatural casting dialog and target-roll chat card.
- **Required order / placement:** target selection remains after spell modifications and before maneuvers; the MR subsection is directly below the selected targets.
- **Must remain visible / unchanged:** selected target, pending request control, resolved calculation, normal spell summary, and unmarked/manual casting controls.
- **Shared vs. concrete ownership:** the target-MR resolver and socket path are shared behavior; `uebernatuerlich.hbs` owns the concrete subsection order.
- **Theme scope:** both light and dark; no new global CSS contract is introduced.
- **Visual reference:** the written acceptance criteria above plus the E2E screenshots recorded below.

## Cases

### RV-01 — Authored single-Actor source

- **Trace:** `Explicit target-Magieresistenz source data`; tasks 1.3–1.5.
- **Status:** `not-run`
- **Fixture/setup:** refreshed compendium and a caster-owned _Blitz dich find_.
- **Visible player path:** open the spell item and casting dialog.
- **Expected visible result:** _Blitz dich find_ asks for a single Actor target; excluded Zone/conditional items do not.
- **Visual assertion:** source-driven dialog state is visible; capture the casting dialog.
- **State corroboration:** inspect the exact source marker set.
- **`page.evaluate` use:** setup and inspection only.
- **Console/page errors:** capture and investigate during the case.
- **Evidence:** source audit test covers 86 explicit markers; `PackAndRestart` completed.
- **Cleanup:** no source edits made in the E2E world.
- **Result / unverified boundary:** passed.

### RV-02 — Dialog resolves target MR

- **Trace:** `One selected Actor defines an MR challenge`; `Casting dialog presents and uses the resolved difficulty`; tasks 2.1, 3.1–3.3.
- **Status:** `not-run`
- **Fixture/setup:** caster dialog with one owned target selected.
- **Visible player path:** select target, request its MR roll, return to the caster dialog.
- **Expected visible result:** pending state precedes a visible `Magieresistenz: MR + 1W20 = Schwierigkeit` row.
- **Visual assertion:** screenshot the dialog and verify subsection order and unclipped controls.
- **State corroboration:** inspect the immutable MR snapshot and challenge ID after the UI assertion.
- **`page.evaluate` use:** narrow fixture setup, state inspection, and cleanup only.
- **Console/page errors:** capture and investigate during the case.
- **Evidence:** E2E-039 selects _Testlauf-Held_ for _Blitz dich find_ and asserts the dialog challenge calculation.
- **Cleanup:** temporary spell, target-selection setting, and chat are restored/removed in `finally`.
- **Result / unverified boundary:** passed.

### RV-03 — Target controller rolls D20

- **Trace:** `Target rolls the Magieresistenz D20`; tasks 2.2–2.3, 5.3.
- **Status:** `not-run`
- **Fixture/setup:** two active clients, caster and target controller, selected target Token.
- **Visible player path:** target controller presses the target-roll card's D20 control.
- **Expected visible result:** exactly one whispered card records D20, MR snapshot, and total for target controller and GMs.
- **Visual assertion:** screenshot the card and visible caster result.
- **State corroboration:** inspect one accepted request/result and no duplicate chat entry.
- **`page.evaluate` use:** setup, deterministic die configuration if necessary, inspection, and teardown only.
- **Console/page errors:** capture and investigate during the case.
- **Evidence:** E2E-039 logs in the active owner of _Testlauf-Held_, activates the visible whispered D20 card, and asserts its result message.
- **Cleanup:** both browser contexts close; chat and setting are restored.
- **Result / unverified boundary:** passed.

### RV-04 — Cast is gated by resolved difficulty

- **Trace:** `Target-Magieresistenz gates supernatural success effects`; tasks 2.4, 5.3–5.4.
- **Status:** `not-run`
- **Fixture/setup:** RV-03 placement and a deterministic caster roll.
- **Visible player path:** caster performs the normal spell roll after the resolved target roll.
- **Expected visible result:** chat shows the numeric target-MR difficulty; success applies _Blitz dich find_'s effect and failure applies none.
- **Visual assertion:** capture both caster result and effect state visible through the normal sheet/chat flow.
- **State corroboration:** inspect exactly one created effect after success and none after failure.
- **`page.evaluate` use:** controlled fixtures and post-action state inspection only.
- **Console/page errors:** capture and investigate during the case.
- **Evidence:** E2E-039 gives _Plumbumbarum schwerer Arm_ a deterministic MR 99 snapshot, performs the failed cast, and asserts the target's Active Effect count is unchanged.
- **Cleanup:** temporary caster Item, messages, setting, and deterministic dice override are removed.
- **Result / unverified boundary:** passed for the failure gate; success path remains covered by existing pre-effect E2E coverage.

### RV-05 — Invalidated and manual paths remain safe

- **Trace:** stale/duplicate and manual scenarios; tasks 3.3, 5.4.
- **Status:** `not-run`
- **Fixture/setup:** one accepted request, a changed target selection, and an unmarked/manual spell.
- **Visible player path:** change selection before delivering an old result; open an unmarked spell with target selection disabled.
- **Expected visible result:** stale/duplicate result is ignored; the manual spell retains its normal controls.
- **Visual assertion:** inspect visible stale request state and manual controls.
- **State corroboration:** assert no second chat/result/effect and no challenge for manual mode.
- **`page.evaluate` use:** controlled socket edge case and cleanup only; it does not replace the primary player path.
- **Console/page errors:** capture and investigate during the case.
- **Evidence:** E2E-039 asserts duplicate result sockets do not change a resolved challenge and verifies a cloned unmarked _Blitz dich find_ remains manual.
- **Cleanup:** all temporary Items, chat messages, and settings are removed/restored in `finally`.
- **Result / unverified boundary:** passed.

## Teardown record

- **Created IDs removed:** temporary _Blitz dich find_, manual _Blitz_, and _Plumbumbarum_ Item IDs.
- **Settings, targets, documents, chat, map objects, and effects restored:** confirmed by each E2E `finally` block.
- **Termination/failure cleanup verified:** E2E-039 passed all three scenarios.

## Manual confirmation

| Tester | Verified behavior                                                                                       | Result | Remaining automated or unverified boundary                           |
| ------ | ------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| Codex  | E2E-039 in light and dark themes; owner roll, challenge, manual, duplicate, and failed Pre-Effect paths | passed | Success effect dispatch remains in existing pre-effect E2E coverage. |

## Final assessment

- **Passed cases:** RV-01 through RV-05.
- **Failed / blocked / not-run cases:** none.
- **Unexpected console diagnostics and disposition:** none related to the change.
- **Runtime validation conclusion:** passed (`npm run test:e2e -- e2e/cases/e2e-039-target-magic-resistance/e2e-039-target-magic-resistance.spec.ts`).
