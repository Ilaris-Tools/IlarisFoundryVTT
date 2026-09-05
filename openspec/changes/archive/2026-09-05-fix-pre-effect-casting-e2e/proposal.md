## Why

E2E-025 cannot produce a supernatural roll chat message, so its instant
Pre-Effects never run. The ballistic defense case also relies on a defense
option not guaranteed by its fixture. Restore observable casting and make the
two flows deterministic.

## What Changes

- Diagnose and restore the enabled roll action for targeted instant spells.
- Make the ballistic defense fixture guarantee its Akrobatik defense path.
- Preserve deferred Pre-Effect application after an undefended ballistic result.

## Deviation

The original fixture relied on `Ignifaxius Flammenstrahl`, which is now
ballistic and carried stale non-instant Pre-Effects in the baseline world.
Rather than temporarily disabling `ballistic` on that spell, E2E-025 imports
the naturally non-ballistic instant-damage spell `Fulminictus Donnerkeil` from
the compendium per test. This requires no baseline-world edits.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `supernatural-pre-effects`: Targeted casts and ballistic defense outcomes
  reliably reach their documented result paths.

## Impact

- `UebernatuerlichDialog`, targeted-cast E2E fixtures, and E2E-025/E2E-042.
- Foundry APIs/Hooks/utilities: to be verified against v14 before implementation;
  likely `Actor` embedded data and existing `foundry.utils` cloning only.

## Testing Impact

- Reproduce E2E-025's no-chat failure, then verify damage and no-wound paths.
- Verify both visible ballistic defense outcomes in E2E-042 with a clean world.

## Proposal Self-Review

**Decision:** PASS_WITH_NOTES

Scope is limited to the two runtime failure clusters; requirement and testing
impact are identified. API evidence and exact root cause require the apply
investigation. No migration; rollback restores the prior dialog path. UI order
is unchanged.
