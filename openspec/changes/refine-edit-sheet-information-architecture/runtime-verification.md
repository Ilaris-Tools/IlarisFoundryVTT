# Runtime Verification: refine-edit-sheet-information-architecture

**Scope:** `runtime-relevant`
**Status:** `complete`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `845aeeff` plus uncommitted change files

## Applicability

This change restructures rendered Foundry item edit sheets and changes visible add/remove flows. Runtime verification is therefore required in addition to unit tests.

## Traceability

| Case  | Requirement scenario / task                     | Player-visible behavior                                                            |
| ----- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| RV-01 | Active feature renders its block; task 13.1     | An imported spell displays its configured Widerstandsprobe and outcome payloads.   |
| RV-02 | Zone card is created and removed; task 13.3     | A GM adds and removes the one base-zone card from Automatisierung.                 |
| RV-03 | Base and form editors share partials; task 13.3 | A configured form shows its zone and pre-effect editors with form-scoped controls. |
| RV-04 | Maneuver-only trigger; task 13.2                | A Manöver exposes the trigger add action while a Zauber does not.                  |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, GM session on port 30000.
- **Actors, items, packs, and settings:** Item compendia `Zauberspruch` and `Manöver`; imported temporary world Items only.
- **Baseline IDs/state to restore:** Each test records and deletes only its created world Item ID; actor snapshot cleanup is retained by the existing e2e fixtures.
- **Restart action:** `Status` then `Restart`, because JavaScript, templates, and CSS changed without compendium `_source/` changes.
- **Foundry v14 API / wiki references consulted:** `Item#update`, `ItemSheetV2`, `HandlebarsApplicationMixin`, `ApplicationV2`, `foundry.utils.deepClone`, `expandObject`, `randomID`, and `loadTemplates`, recorded in `design.md` tasks 1.1–1.4.

## UI acceptance contract

- **Affected surface(s):** Item edit sheets for Zauber and Manöver.
- **Required order / placement:** `Regeltext` → `Automatisierung` → `Strukturierte Zaubermodifikationen` → `Erweitert`; zone is inside Automatisierung; form profiles remain inside structured modifications.
- **Must remain visible / unchanged:** Existing configured automation remains visible; inactive optional automation is absent until deliberately added.
- **Shared vs. concrete ownership:** Shared partials provide the pre-effect and zone controls; each sheet retains its own rule-text form.
- **Theme scope:** `both`, because the change adds card and accordion CSS; e2e-027 captures the resistance editor in light and dark themes.
- **Visual reference:** Delta spec scenarios and Playwright screenshots under `test-results/`.

## Cases

### RV-01 — Configured resistance remains visible

- **Trace:** `Active feature renders its block`; task 13.1.
- **Status:** `pass`
- **Fixture/setup:** Import `Fluch des Gewürms` into the world.
- **Visible player path:** Open the item edit sheet and scroll to Automatisierung.
- **Expected visible result:** Widerstandsprobe, both outcome payload panels, and its configured failure marker field are visible.
- **Visual assertion:** Card is inside Automatisierung; screenshot supplied by focused E2E output.
- **State corroboration:** Imported Item is read only for setup and deleted during teardown.
- **`page.evaluate` use:** Setup/import, document inspection, and cleanup only; controls are opened/clicked through Playwright.
- **Console/page errors:** Captured by the shared Playwright session; unexpected diagnostics fail triage.
- **Evidence:** Focused E2E-027 (9/9) and full Playwright (124/124) on 2026-09-23.
- **Cleanup:** Delete only `importedItemId` in `afterEach`.
- **Result / unverified boundary:** Passed; the test verifies the configured editor surface, not table-side gameplay resolution.

### RV-02 — Zone card add and remove

- **Trace:** `Zone card is created and removed`; task 13.3.
- **Status:** `pass`
- **Fixture/setup:** Import `Ignifaxius Flammenstrahl` without a zone.
- **Visible player path:** Click `+ Zone hinzufügen`, inspect the card, then click `Zonenprofil entfernen`.
- **Expected visible result:** One card appears with default values and disappears after removal.
- **Visual assertion:** Zone card stays inside Automatisierung; screenshot supplied by focused E2E output.
- **State corroboration:** `system.zone` becomes `null` after removal.
- **`page.evaluate` use:** Setup/import, state check, and cleanup only.
- **Console/page errors:** Captured by the shared Playwright session.
- **Evidence:** Focused E2E-044 (4/4) and full Playwright (124/124) on 2026-09-23.
- **Cleanup:** Delete only `importedItemId` in `afterEach`.
- **Result / unverified boundary:** Passed; the test verifies the visible authoring flow and persisted `system.zone` cleanup.

### RV-03 — Form editor uses shared controls

- **Trace:** `Form pre-effect uses the same partial as the base`; `Form zone uses the same partial as the base`; task 13.3.
- **Status:** `pass`
- **Fixture/setup:** Import `Aeolitus Windgebraus` with structured forms.
- **Visible player path:** Open Strukturierte Zaubermodifikationen on the item edit sheet.
- **Expected visible result:** Form-scoped zone lifecycle and pre-effect resistance controls are visible.
- **Visual assertion:** Form remains within the structured-modification accordion; screenshot supplied by focused E2E output.
- **State corroboration:** Input name suffixes resolve to form-scoped data paths.
- **`page.evaluate` use:** Setup/import and cleanup only.
- **Console/page errors:** Captured by the shared Playwright session.
- **Evidence:** Focused E2E-044 (4/4), E2E-038 (11/11), and full Playwright (124/124) on 2026-09-23.
- **Cleanup:** Delete only `importedItemId` in `afterEach`.
- **Result / unverified boundary:** Passed; shared-partial implementation is also asserted structurally by the unit tests.

### RV-04 — Capability-gated Manöver trigger

- **Trace:** `Maneuver-only trigger is offered only for maneuvers`; task 13.2.
- **Status:** `pass`
- **Fixture/setup:** Import `Klingentanz`; E2E-027 imports `Ignifaxius Flammenstrahl` for the spell comparison.
- **Visible player path:** Open Automatisierung, choose `Manöver-Auslöser`, and inspect the created card.
- **Expected visible result:** Manöver shows all four areas, does not offer zone automation, and creates a card whose activation defaults to `onConfirmedHit`; Zauber does not offer the trigger.
- **Visual assertion:** Four area headers are ordered as specified; focused E2E captures the edited sheet surface.
- **State corroboration:** The created pre-effect persists `activation: onConfirmedHit`.
- **`page.evaluate` use:** Setup/import, persistence inspection, and cleanup only.
- **Console/page errors:** Captured by the shared Playwright session.
- **Evidence:** Focused E2E-044 (4/4) and full Playwright (124/124) on 2026-09-23.
- **Cleanup:** Delete only `importedItemId` in `afterEach`.
- **Result / unverified boundary:** Passed; runtime validates authoring visibility and persistence, not combat action execution.

## Teardown record

- **Created IDs removed:** Verified by focused E2E-027/E2E-044 and the full suite; each test deletes only its created temporary world Item.
- **Settings, targets, documents, chat, map objects, and effects restored:** Verified; temporary items and temporary theme-setting changes are restored in test teardown.
- **Termination/failure cleanup verified:** Verified by completed focused and full test runs.

## Final assessment

- **Passed cases:** RV-01 through RV-04.
- **Failed / blocked / not-run cases:** None.
- **Unexpected console diagnostics and disposition:** No unexpected diagnostics; only the known Node `NO_COLOR`/`FORCE_COLOR` warning appeared.
- **Runtime validation conclusion:** Pass. The item-edit-sheet information architecture works in the configured Foundry v14 test world across the specified authoring flows.
