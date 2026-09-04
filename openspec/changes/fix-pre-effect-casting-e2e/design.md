## Context

E2E-025 does not create a roll chat message, while E2E-042's undefended path
passes but its defense fixture lacks an Akrobatik option. The first condition
must be distinguished from failed Pre-Effect processing because it occurs
before `applyPreEffects` can run.

## Goals / Non-Goals

**Goals:** restore the visible targeted-cast action and make both ballistic
defense paths deterministic.

**Non-Goals:** change spell rules, damage formulas, or add new player controls.

## Decisions

- Diagnose roll-action eligibility and event dispatch before altering the
  processor; preserve the existing dialog/template ownership.
- Make the E2E defense fixture explicitly provide Akrobatik rather than relying
  on a shared actor's mutable skills.
- E2E-025's subject spell deviates from `Ignifaxius Flammenstrahl` to the
  compendium-imported `Fulminictus Donnerkeil` (non-ballistic instant damage),
  removing the need to temporarily disable `ballistic`.

## API Surface

- Foundry classes: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  for fixture data only.
- Hooks: no new Hook is introduced; existing dialog action dispatch remains in
  use.
- Utilities: use existing `foundry.utils.deepClone` only if fixture source data
  must be copied.

## Risks / Trade-offs

- [A fixture masks a runtime defect] → first reproduce the visible action and
  chat transition on a clean world; only then narrow fixture setup.

## Migration Plan

No stored-data migration. Rollback restores the previous dialog/fixture code.

## Testing Strategy

Use focused dialog unit tests plus E2E-025 and E2E-042 after lifecycle
PackAndRestart; capture both rendered controls and resulting chat/effect state.
