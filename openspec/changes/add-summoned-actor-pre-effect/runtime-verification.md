# Runtime Verification: add-summoned-actor-pre-effect

**Scope:** `runtime-relevant`
**Status:** `passed`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** working tree on `codex/add-summoned-actor-after-creature-summoning` (based on `codex/add-target-magic-resistance`)

## Applicability

This change creates unlinked Scene Tokens, opens a synthetic Actor sheet,
persists a caster-owned owner-turn marker, and removes the recorded Token at
expiry. Runtime verification is required.

## Traceability

| Case  | Requirement scenario / task                  | Player-visible behavior                                                                                               |
| ----- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| RV-01 | Krähenruf timed creature summon; task 4.3    | A sheet-dialog cast creates an unlinked, amplified Krähenschwarm and removes exactly that Token at owner-turn expiry. |
| RV-02 | Generic creature summon regression; task 4.3 | The existing Skelettarius selection path still creates an unlinked Token.                                             |

## Preconditions and baseline

- Dedicated world `ilaris-e2e-world-v14363-r1`, local GM, and active E2E Scene.
- `HatAlles`, `Testlauf-Npc`, `Ilaris.zauberspruche-und-rituale`, and
  `Ilaris.kreaturen` are available; the test temporarily sets
  `Ilaris.kreaturenPacks` to `["Ilaris.kreaturen"]`.
- The test restores HatAlles's `system.abgeleitete.asp_stern` to `38` and
  removes only its recorded Token, Item, ActiveEffect, and Combat IDs.
- `PackAndRestart` rebuilt the changed packs; `Restart` loaded later runtime
  code; `Status` reported the world ready before the final E2E run.
- Official Foundry v14 documentation was checked for
  [`Actor#getTokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#getTokenDocument),
  [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html),
  [`diffObject`](https://foundryvtt.com/api/v14/functions/foundry.utils.diffObject.html),
  [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html), and
  [`EffectDurationData`](https://foundryvtt.com/api/v14/interfaces/foundry.documents.types.EffectDurationData.html).
  The community-wiki search found no alternate v14 ActorDelta helper.

## Cases

### RV-01 — Krähenruf visible cast and owner-turn cleanup

- **Status:** `passed`
- **Player path:** open HatAlles's sheet, open the owned E2E Krähenruf dialog,
  set Mächtige Magie to 2, and activate the visible casting control.
- **Observed result:** the configured compendium creature is imported once as a
  managed reusable world Actor base. Foundry creates an unlinked Token with a
  synthetic ActorDelta: WS 5, AT 12, TP `2W6-2+2`, source UUID provenance, and
  a 16-turn marker. The free-position resolver prefers adjacency and selects a
  nearby non-overlapping grid position when adjacent cells are occupied.
- **Lifecycle evidence:** an explicitly started and ordered Combat advances the
  real owner-turn hook. After its turn-end pending state and the following
  transition, the marker and exactly its recorded Token no longer exist.
- **Visual evidence:** the scenario takes `kraehenruf-summon.png` after the
  synthetic Actor values are verified.
- **Use of `page.evaluate`:** fixture creation, deterministic dice, state
  inspection, combat setup, and exact-ID teardown only; casting remains a
  normal visible dialog interaction.

### RV-02 — Generic Skelettarius regression

- **Status:** `passed`
- **Observed result:** the existing generic creature path creates one unlinked
  Scene Token from the configured creature pack.

## Evidence and teardown

- Command: `npm run test:e2e -- e2e/cases/e2e-035-creature-summoning/e2e-035-creature-summoning.spec.ts`
- Result: `2 passed`; `test-results/.last-run.json` reports `passed`.
- The suite restores the pack setting and AsP\* baseline and deletes only the
  exact fixture Token, Item, ActiveEffect, and Combat IDs. The managed base
  Actor remains intentionally for reuse and preserves the source compendium.

## Final assessment

- RV-01 and RV-02 passed in the running Foundry v14 world.
- The change uses a managed reusable world Actor base because v14 Token deltas
  require a world Actor; the compendium source is neither modified nor linked.
- Task 4.3 can be marked complete.
