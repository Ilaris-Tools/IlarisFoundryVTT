# Runtime Verification: fix-pre-effect-casting-e2e

**Scope:** `runtime-relevant` (E2E fixture corrections)
**Status:** `passed`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** `370b3da4` plus this change's working tree

## Applicability

This change fixes two E2E fixture regressions:

1. E2E-025 relies on an instant-damage spell, but the baseline world's
   `Ignifaxius Flammenstrahl` now carries stale non-instant Pre-Effects and a
   `ballistic` marker. Its roll action creates the chat result, but the
   instant Pre-Effects never run because the ballistic path defers them to a
   defense outcome the test never performs. The test now imports
   `Fulminictus Donnerkeil` from the compendium instead — a naturally
   non-ballistic instant-damage spell.
2. E2E-042's defended scenario derives its attack modifier from
   `spell.system.pw` without accounting for the caster's `globalermod`, so the
   attack fails and no defense prompt (hence no Akrobatik option) is rendered.
   Its Akrobatik eligibility also relied on the shared `Testlauf-Held` actor's
   mutable skills.

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, active GM (`e2e-gm`),
  active grid Scene.
- **Actors, items, packs, and settings:** `HatAlles` casts
  `Fulminictus Donnerkeil` (E2E-025) and `Ignifaxius Flammenstrahl` (E2E-042);
  `Testlauf-Held` supplies the ballistic target. `useTargetSelection` is
  enabled per case and restored afterward.
- **Restart action:** `PackAndRestart` (run once before verification).

## Changes verified

- E2E-025 imports `Fulminictus Donnerkeil` from the packed compendium source
  (if not already present) before each test; the actor snapshot restores the
  actor in `afterEach`.
- E2E-042 `createTarget` now explicitly guarantees the unlinked target token
  actor has an `Athletik` skill and an `Akrobatik` talent, and the defended
  scenario computes the attack modifier so the attack lands just above the
  spell difficulty (deterministic d20 of 10 with `randomUniform` 0.5).

## Cases

### RV-01 — E2E-025 instant-damage paths

- **Trace:** E2E-025 tests 1–3.
- **Status:** `passed`
- **Evidence:** `npx playwright test e2e/cases/e2e-025-pre-effect-instant-damage --workers=1` → 3 passed.
    - Test 1: successful targeted cast creates its roll chat result and applies
      the instant 2W6 damage exactly once.
    - Test 2: damage at or below WS produces the `Schaden (1) … nicht hoch genug`
      feedback without adding wounds.
    - Test 3: Pandämonium-style 2W6 damage applies exactly once.
- **Cleanup:** actor snapshot, target-selection setting, Dice override, and chat
  log restored by `afterEach`.

### RV-02 — E2E-042 ballistic defense outcomes

- **Trace:** E2E-042 tests 1–2.
- **Status:** `passed`
- **Evidence:** `npx playwright test e2e/cases/e2e-042-ballistic-spell-resolution --workers=1` → 2 passed.
    - Test 1: the undefended (`Nicht verteidigen`) outcome applies the deferred
      target Pre-Effect exactly once.
    - Test 2: a successful rendered Akrobatik defense prevents the deferred target
      Pre-Effect (target wounds unchanged).
- **Cleanup:** temporary token removed; actor snapshot, setting, targets, chat,
  and Dice override restored.

### RV-03 — Combined run

- **Trace:** both files run together with one worker.
- **Status:** `passed`
- **Evidence:** 5 passed (E2E-025 3 + E2E-042 2).

## Teardown record

- **Created IDs removed:** E2E-042 removes its `e2eBallistic`-flagged tokens.
- **Settings, documents, chat, and effects restored:** each case restores its
  actor snapshot, `useTargetSelection` setting, chat log, and Dice override.

## Final assessment

- **Passed cases:** RV-01, RV-02, RV-03.
- **Failed / blocked:** none for this change.
- **Unrelated pre-existing failure:** `npm test` reports 3 failures in
  `scripts/effects/pre-effects/_spec/resist-handler.spec.js`
  (`resolveResistTargetActor` is not exported). This predates and is outside
  this change; no production code was modified here.
