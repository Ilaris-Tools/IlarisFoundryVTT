## Why

Zone E2Es currently depend on contaminated shared actors and unstable spatial
assumptions: Dämonenbann counts nine unrelated outside effects, while the
Pestgestank cone selects the wrong fixture token. Zone administration also
fails in the same run.

## What Changes

- Make zone E2E fixtures own and filter only their temporary documents/effects.
- Diagnose and correct cone containment against deterministic token geometry.
- Revalidate zone-administration cleanup after fixture isolation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `spell-zone-lifecycle`: Zone targeting and ownership cleanup remain scoped to
  documents created by the relevant zone.
- `zone-administration`: Administration operations remain isolated to the
  selected zone.

## Impact

- Region/Token/ActiveEffect runtime behavior, zone-target helpers, and
  E2E-037/E2E-038/E2E-040.
- Foundry API surface to verify in apply: `Region`, `TokenDocument`, `Actor`,
  and embedded document collections; no undocumented API is permitted.

## Testing Impact

- Run PackAndRestart, then execute each affected E2E case independently and
  together from a clean E2E world; assert owned IDs rather than global counts.

## Proposal Self-Review

**Decision:** PASS_WITH_NOTES

Scope distinguishes fixture contamination from the cone-targeting defect.
Exact API signatures and whether E2E-040 shares the root cause require apply.
No migration; UI order is not changed.
