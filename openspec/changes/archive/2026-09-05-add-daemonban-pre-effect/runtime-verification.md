# Runtime Verification: add-daemonban-pre-effect

**Scope:** `runtime-relevant`<br>
**Status:** `completed`<br>
**World:** `ilaris-e2e-world-v14363-r1`<br>
**Server:** `http://127.0.0.1:30000`<br>
**Source revision:** `codex/add-daemonban-pre-effect` worktree

## Applicability

Runtime verification is required because this change replaces compendium Item
source data, removes a form-resolution path, and adds a persistent passive
Region that creates and cleans up ActiveEffect modifiers.

## Traceability

| Case  | Requirement scenario / task                | Player-visible behavior                                                                |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| RV-01 | Anti-magic source loaded; tasks 2.1–3.2    | Every migrated Item exposes the four required forms without a preset.                  |
| RV-02 | Dämonenbann contained actor; tasks 3.3–5.3 | A placed _Magie unterdrücken_ Region applies `-8` only to contained `Dämonisch` rolls. |
| RV-03 | Mächtige Magie; task 5.3                   | One stage increases the visible penalty to `-12`.                                      |
| RV-04 | Token leaves or Region ends; tasks 5.3–5.4 | The exact Zone-owned modifier is removed on leave and dismissal.                       |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, active GM, active combat Scene.
- **Actors, items, packs, and settings:** A caster with _Dämonenbann_, one owned non-caster target Token, and the `zauberspruche-und-rituale` pack refreshed from `_source`.
- **Baseline IDs/state to restore:** Targeted Tokens, user targets, temporary Region, passive ActiveEffects, chat messages, and any test-only Actor Item.
- **Restart action:** `PackAndRestart` after compendium source changes; `Restart` after resolver/model code changes.
- **Foundry v14 API / wiki references consulted:** Item, Scene, RegionDocument, and ActiveEffect v14 API pages; community API helper reference.
- **E2E baseline policy:** Optional world defaults are not hard prerequisites. Individual
  E2E cases set or inspect a setting when it matters to their scenario.

## UI acceptance contract

No rendered layout changes. The existing supernatural casting dialog must retain
its structured **Zaubermodifikationen** section and form selection controls;
the real dialog, map Region, and modifier breakdown are inspected in the
currently supported theme. Theme-specific review is not applicable because no
template or CSS changes are made.

## Cases

### RV-01 — Migrated forms render and select

- **Trace:** `Anti-magic spells author their forms in source data`; tasks 2.1–3.2.
- **Status:** `passed`
- **Fixture/setup:** Refreshed compendium Item for _Dämonenbann_ and a caster-owned copy.
- **Visible player path:** Open the Item/casting dialog; verify the four choices; select each form and inspect its effective profile.
- **Expected visible result:** Exactly one required anti-magic form is selectable; no duplicate parser maneuvers appear.
- **Visual assertion:** Existing form section remains visible and unclipped; capture dialog screenshot.
- **State corroboration:** Inspect structured form IDs and selected effective profile.
- **`page.evaluate` use:** Setup, inspection, and cleanup only.
- **Console/page errors:** Capture and investigate during the case.
- **Evidence:** `E2E-037 · Structured spell modifications` completed after the baseline guard
  was limited to actual world dependencies. Its visible `renders Dämonenbann forms and updates
the selected suppression profile` case asserted the section heading, four radio controls, and
  the rendered `Kosten 8, Ziel Zone, Reichweite 8 Schritt, Dauer 1 Stunde` profile.
- **Cleanup:** Close dialog and remove only created Item copies.
- **Result / unverified boundary:**

### RV-02 — Contained Dämonisch roll is suppressed

- **Trace:** `A contained actor casts Dämonisch`; tasks 3.3–5.3.
- **Status:** `passed`
- **Fixture/setup:** Caster, owned contained target, and one non-contained target on the combat Scene.
- **Visible player path:** Cast _Dämonenbann_ with _Magie unterdrücken_, place the Zone, then make a `Dämonisch` roll from each target through the normal dialog.
- **Expected visible result:** The Region is visible; contained targets (including caster if contained) show `-8`; a non-contained target and a non-`Dämonisch` roll do not.
- **Visual assertion:** Capture the placed Region and modifier breakdown.
- **State corroboration:** Inspect the precise Region-owned passive ActiveEffect.
- **`page.evaluate` use:** Fixture setup, target/effect inspection, and cleanup only.
- **Console/page errors:** Capture and investigate during the case.
- **Evidence:** The focused `Dämonenbann suppression applies to contained Dämonisch rolls and
cleans up exactly` case asserted the 16-step Region, `-8` contained `Dämonisch` modifier,
  non-matching-skill exclusion, caster inclusion, and an unaffected external Actor.
- **Cleanup:** Delete only the created Region and verify exact effect removal.
- **Result / unverified boundary:**

### RV-03 — Mächtige Magie raises the penalty

- **Trace:** `Mächtige Magie increases the suppression penalty`; task 5.3.
- **Status:** `passed`
- **Fixture/setup:** RV-02 placement with one selected Mächtige-Magie stage.
- **Visible player path:** Cast and place through the normal dialog, then make a contained `Dämonisch` roll.
- **Expected visible result:** The modifier breakdown shows `-12`.
- **Visual assertion:** Capture the roll dialog breakdown.
- **State corroboration:** Inspect materialized modifier data only after the UI assertion.
- **`page.evaluate` use:** Setup, inspection, and cleanup only.
- **Console/page errors:** Capture and investigate during the case.
- **Evidence:** The focused E2E case asserted `-12` after one Mächtige-Magie stage and the
  materialized modifier value `-8-4`.
- **Cleanup:** Delete only the created Region and effects.
- **Result / unverified boundary:**

### RV-04 — Membership cleanup is exact

- **Trace:** `A token leaves or the Region ends`; tasks 5.3–5.4.
- **Status:** `passed`
- **Fixture/setup:** A successful RV-02 placement and recorded Region/effect IDs.
- **Visible player path:** Move the target out through normal map interaction, then separately dismiss/delete a newly placed Region.
- **Expected visible result:** The matching penalty disappears after leave and after Region removal; unrelated effects remain unchanged.
- **Visual assertion:** Capture the map and post-cleanup modifier/effect state.
- **State corroboration:** Assert only the tracked Region-owned effect IDs were removed.
- **`page.evaluate` use:** Inspection and cleanup only; it does not move, cast, place, or dismiss the central test action.
- **Console/page errors:** Capture and investigate during the case.
- **Evidence:** The focused E2E case deleted each created Region and waited until the exact
  caster and target Zone-owned effects were absent; its `finally` cleanup also removes all
  temporary Tokens, Region IDs, and the external-Actor fixture.
- **Cleanup:** Confirm all created IDs are absent and restore targets/tokens.
- **Result / unverified boundary:**

## Teardown record

- **Created IDs removed:** The E2E case removes its temporary Actor, Tokens, Regions, and
  Region-owned ActiveEffects in `finally`.
- **Settings, targets, documents, chat, map objects, and effects restored:** No setting is
  modified by the focused case; chat is cleared by its existing suite fixture.
- **Termination/failure cleanup verified:** The case's exact Region/effect removal checks pass.

## Manual confirmation

| Tester | Verified behavior | Result | Remaining automated or unverified boundary |
| ------ | ----------------- | ------ | ------------------------------------------ |
| —      | —                 | —      | —                                          |

## Final assessment

- **Passed cases:** RV-01 through RV-04.
- **Failed / blocked / not-run cases:** None.
- **Unexpected console diagnostics and disposition:** The global baseline guard was corrected
  to stop treating optional defaults as dependencies; the E2E case completed without failure artifacts.
- **Runtime validation conclusion:** Passed.
