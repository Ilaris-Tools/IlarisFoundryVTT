# Runtime Verification: add-creature-summoning

**Scope:** `runtime-relevant`
**Status:** `verified with one explicit Settings-UI boundary`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `fee8ce4f` plus scoped working-tree changes

## Applicability

This change adds a world setting, sheet controls, a dependent casting-dialog
selection flow, Scene Token creation, an optional post-cast probe, and token
deletion resource cleanup. All central outcomes are observable in Foundry, so
unit tests alone are insufficient.

## Traceability

| Case  | Requirement scenario / task                                    | Player-visible behavior                                                                          |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| RV-01 | Creature compendium setting; tasks 1.2–1.3                     | GM can configure an eligible creature pack and retain the selection.                             |
| RV-02 | Creature summon configuration; selector stages; tasks 3.1–3.6  | A caster sees dependent creature-type and creature selectors with the matching profile.          |
| RV-03 | Successful cast creates an adjacent token; tasks 2.1–2.4, 3.10 | A successful summon creates an unlinked Token at the nearest valid position and opens its sheet. |
| RV-04 | Optional domination check; tasks 3.7–3.9                       | A configured post-creation check reports its result but does not remove the token.               |
| RV-05 | Bound-resource lifecycle; tasks 2.5–2.6                        | Binding is reserved on creation and released exactly once when that Token is deleted.            |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`; one GM, one player-owned summoner, active Scene with a controlled summoner Token, and active browser clients.
- **Actors, items, packs, and settings:** `Ilaris.kreaturen` selected; a reviewed summon spell with enabled `summonCreature`; a creature source for each tested `kreaturentyp`; a token occupying the first adjacent candidate for placement coverage.
- **Baseline IDs/state to restore:** selected creature packs, summoned Tokens, ChatMessages, resource values, targets, opened sheets, and any test Item/Actor documents.
- **Restart action:** `PackAndRestart` after compendium data changes; otherwise `Restart` after code/template/settings changes.
- **Foundry v14 API / wiki references consulted:** Actor `getTokenDocument`; Scene embedded Token document creation/deletion; TokenDocument source data; `combatTurn` is not used by this base change; `foundry.utils.deepClone` and `mergeObject` usage reviewed in the API/wiki.

## UI acceptance contract

- **Affected surface(s):** Ilaris compendium settings, shared/structured pre-effect item sheets, and the supernatural casting dialog.
- **Required order / placement:** the creature-summon toggle precedes its creature fields; domination controls appear only below enabled creature-summon controls; the casting dialog shows creature type before the matching creature selector.
- **Must remain visible / unchanged:** existing Item-summon, resistance, and standard spell controls remain usable; disabled configuration branches are not active inputs.
- **Shared vs. concrete ownership:** shared pre-effect template owns reusable creature controls; the normal and structured supernatural forms preserve their own part order and merge behavior.
- **Theme scope:** `both`, because new controls are rendered in existing themed AppV2 sheets and dialog surfaces.
- **Visual reference:** the requirements above plus screenshots captured by the E2E case after each affected surface renders.

## Cases

### RV-01 — GM configures a creature compendium pack

- **Trace:** Creature compendium setting scenarios; tasks 1.2–1.3 and 6.1.
- **Status:** `state covered; UI path pending`
- **Fixture/setup:** Snapshot the existing setting and provide one eligible Actor pack.
- **Visible player path:** 1. Open Ilaris settings as GM. 2. Open `Benutzte Kompendien`. 3. Select a creature pack. 4. Save and reopen.
- **Expected visible result:** `Kreaturen Kompendien` lists only eligible packs and preserves the selected state.
- **Visual assertion:** screenshot of the settings group in light and dark mode; verify label, checkbox visibility, and no clipping.
- **State corroboration:** inspect `game.settings.get('Ilaris', 'kreaturenPacks')` only after the visible save.
- **`page.evaluate` use:** setup, post-save inspection, and cleanup only.
- **Console/page errors:** capture and classify every new diagnostic.
- **Evidence:** E2E result, screenshots, prior/restored setting values.
- **Cleanup:** restore the previous setting in `finally`.
- **Result / unverified boundary:**

### RV-02 — Caster selects a matching creature

- **Trace:** Creature selector stages and profile replacement scenarios; tasks 3.1–3.6 and 6.1–6.2.
- **Status:** `passed by E2E-035 visible dialog coverage`
- **Fixture/setup:** A spell with an enabled allowed type and one matching creature Actor in the configured pack.
- **Visible player path:** 1. Open the spell dialog. 2. Choose a creature type. 3. Inspect and choose the resulting creature. 4. Observe preview difficulty/cost before rolling.
- **Expected visible result:** the second selector contains only matching creature Actors, and profile difficulty/cost replace ordinary spell values.
- **Visual assertion:** screenshots in light and dark mode confirm type-before-creature order, readable labels, and disabled/no-match state.
- **State corroboration:** inspect the transient effective context after selection; it must not persist to the Item.
- **`page.evaluate` use:** fixture setup and context inspection only.
- **Console/page errors:** capture and classify every new diagnostic.
- **Evidence:** E2E test output and screenshots.
- **Cleanup:** close dialog and restore targets/items.
- **Result / unverified boundary:** E2E-035 uses the real Skelettarius cast dialog, changes the
  visible creature-type selector from `tier` to `untot`, verifies that `Skelett mit Rüstung` is
  available only for the matching type, and selects it before casting. The case records a picker
  screenshot and observes no page errors. It does not separately exercise the no-match rendering
  state or both color themes.

### RV-03 — Successful cast places and opens the creature

- **Trace:** Successful token creation and placement scenarios; tasks 2.1–2.4, 3.10, and 6.1–6.3.
- **Status:** `passed by E2E-035 visible cast coverage`
- **Fixture/setup:** Controlled summoner Token, one blocked adjacent square, and a selected valid creature.
- **Visible player path:** 1. Use the real spell dialog. 2. Select type and creature. 3. Submit a successful roll through the normal dialog. 4. Inspect the canvas and opened creature sheet.
- **Expected visible result:** one unlinked creature Token appears at the first valid candidate and its represented creature sheet opens.
- **Visual assertion:** canvas and creature-sheet screenshots in light and dark mode; inspect location, no overlap, sheet hierarchy, and clipping.
- **State corroboration:** inspect created Token id, actor link mode, and source compendium document unchanged.
- **`page.evaluate` use:** fixture setup, document inspection, and exact-id teardown only.
- **Console/page errors:** capture and classify every new diagnostic.
- **Evidence:** E2E test output, screenshots, and created Token id.
- **Cleanup:** delete only the created Token id and restore canvas state.
- **Result / unverified boundary:** E2E-035 submits the real dialog, creates exactly one
  unlinked `Skelett mit Rüstung` Token from `Ilaris.kreaturen` at the first legal ring-two
  position after a blocked adjacent square, and visibly opens then closes the synthetic creature
  sheet. The case records a picker screenshot; canvas/theme visual comparison remains outside
  this automated check.

### RV-04 — Optional domination remains informational

- **Trace:** Optional domination and post-creation scenarios; tasks 3.7–3.9 and 6.4.
- **Status:** `passed by E2E-035 visible domination coverage`
- **Fixture/setup:** One spell with an enabled matching domination entry and one without it.
- **Visible player path:** 1. Complete a creature summon. 2. Resolve the displayed domination probe. 3. Repeat with missing or globally disabled configuration.
- **Expected visible result:** configured probe reports success/failure after creation; disabled/missing configuration asks no extra probe; neither result removes the token.
- **Visual assertion:** dialog/chat screenshot confirming order and outcome visibility.
- **State corroboration:** inspect the Token before and after the probe.
- **`page.evaluate` use:** deterministic fixture and inspection only.
- **Console/page errors:** capture and classify every new diagnostic.
- **Evidence:** E2E output, Token ids, chat message ids.
- **Cleanup:** remove only created Tokens and test messages.
- **Result / unverified boundary:** With a matching enabled `untot` entry, E2E-035 visibly opens
  the post-creation `FertigkeitDialog`, resolves its real preview action into chat, and confirms
  that the summoned Token remains. Two further real casts with globally disabled and with missing
  type-specific entries create their Tokens without opening another roll dialog. Failure-result
  presentation is not separately covered.

### RV-05 — Bound resources release exactly once

- **Trace:** Bound-resource reserve/release scenarios; tasks 2.5–2.6 and 6.5.
- **Status:** `passed by E2E-035 lifecycle coverage`
- **Fixture/setup:** Summoner with a recorded baseline resource and a spell defining one gAsP or gKaP binding cost.
- **Visible player path:** 1. Successfully create the creature through the spell dialog. 2. Verify the reservation on the summoner sheet. 3. Delete the created Token through normal Scene interaction. 4. Verify release.
- **Expected visible result:** the resource changes on creation and returns once after Token deletion.
- **Visual assertion:** summoner-sheet screenshots before reserve, after reserve, and after release.
- **State corroboration:** inspect only the created Token's recorded provenance and resource fields.
- **`page.evaluate` use:** baseline snapshot, exact-id cleanup, and final state inspection only.
- **Console/page errors:** capture and classify every new diagnostic.
- **Evidence:** E2E output, Token id, and resource snapshots.
- **Cleanup:** restore baseline resource only if exact test cleanup cannot complete normally.
- **Result / unverified boundary:** E2E-035 visibly casts the fixture spell, confirms its 2 gAsP
  reservation, advances the real timed lifecycle through token deletion, and observes the exact
  baseline resource value again. The console error from a mismatched lowercase document-flag scope
  is absent after cleanup now reads the recorded provenance directly.

## Teardown record

- **Created IDs removed:** E2E-035 removes its caster Token, summoned Token, and timed marker.
  Its explicitly flagged `E2E Krähenruf (Fixture)` spell is reused between runs so retries do not
  add duplicate actor Items.
- **Settings, targets, documents, chat, map objects, and effects restored:** E2E-035 restores
  `kreaturenPacks` and clears its created scene data.
- **Termination/failure cleanup verified:** E2E cleanup is registered in `afterEach`; dedicated
  failure-path coverage remains pending.

## Manual confirmation

| Tester            | Verified behavior                                                                                                                          | Result         | Remaining automated or unverified boundary                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------- |
| Automated E2E-035 | Visible selector filtering, cast, unlinked placement, creature-sheet opening, enabled domination, and disabled/missing domination branches | passed         | Separate Settings-screen and no-match/theme rendering remain unverified |
| User              | Dependent type/creature selection, direct compendium summon, and post-creation Beherrschungsprobe                                          | user-confirmed | Corroborates the automated runtime flow in the actual world             |

## Latest automated run

- **Date:** 2026-09-05
- **Command:** `npm run test:e2e -- e2e/cases/e2e-035-creature-summoning/e2e-035-creature-summoning.spec.ts`
- **Result:** passed — 4 tests.
- **Covered flow:** configured-pack Skelettarius source selection and unlinked-token creation; a real
  Krähenruf dialog cast with Mächtige Magie +2, amplified creature values, 2 gAsP reservation, timed
  marker expiry, and exact resource release; a visible Skelettarius type/creature selection followed
  by cast, sheet opening, and a resolved Beherrschungsprobe; and two real casts proving disabled and
  missing-type domination configurations do not prompt for another roll.
- **Fixture maintenance:** the persistent Krähenruf fixture now refreshes its entire pre-effect from the
  current compendium source on every run. This prevents an older fixture missing `baseDuration` from
  being mistaken for a creature-summoning runtime regression.

## Final assessment

- **Passed cases:** RV-02 visible dependent selectors; RV-03 visible token creation and creature-sheet
  opening; RV-04 enabled, disabled, and missing-type domination behavior; RV-05 bound-resource
  lifecycle; and the E2E-034 item-summoning regression.
- **Failed / blocked / not-run cases:** no failures. RV-01's distinct Settings-screen interaction
  remains unverified; E2E-035 configures and restores the GM setting as fixture state so the player
  casting path can run through the real dialog.
- **Unexpected console diagnostics and disposition:** no new failing E2E diagnostics.
- **Runtime validation conclusion:** all requested creature-summoning runtime flows are verified.
  A separate Settings-screen visual check and optional no-match/theme presentation coverage remain
  useful follow-up validation, but do not block this implementation change.
