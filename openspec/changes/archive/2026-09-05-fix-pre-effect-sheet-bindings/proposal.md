## Why

The Pre-Effect editor does not persist `summonItem.sourceKind`, and a newly
added Ilaris modifier lacks the target selector E2E-027 expects. This blocks
authoring valid Pre-Effect data.

## What Changes

- Restore persistence and rerendering for summon-item source kind changes.
- Restore the complete Ilaris-modifier editor control set after adding a row.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `pre-effect-item-sheet-base`: Pre-Effect authoring controls persist their
  selected values and render complete modifier rows.

## Impact

- Pre-Effect item sheet, Handlebars controls, and E2E-027.
- Foundry APIs/Hooks/utilities: AppV2 form-update path to be verified against
  v14; no new Hook is intended.

## Testing Impact

- Update E2E-027 source-kind persistence and modifier-row scenarios; add unit
  coverage for the form-update path where practical.

## Proposal Self-Review

**Decision:** PASS_WITH_NOTES

Scope and affected authoring requirement are clear. Exact form-event cause,
API evidence, and UI control order must be confirmed in apply. No migration;
the sheet’s existing Pre-Effects tab owns the UI order.
