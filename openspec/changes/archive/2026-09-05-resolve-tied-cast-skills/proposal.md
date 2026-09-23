## Why

Automatic supernatural casts already use the eligible skill with the highest
Probenwert (PW). When several skills share that highest PW, the current dialog
instead requires the player to select one, even though the roll value is the
same. The tie needs a deterministic default so the cast can continue without
an unnecessary control.

## What Changes

- Modify automatic casting-skill resolution: if multiple eligible skills share
  the highest PW, use the alphabetically later skill name as the deterministic
  cast skill.
- Remove the tied-skill selection requirement and its `Fertigkeit` selector
  from the supernatural casting dialog.
- Preserve the existing behavior for explicitly configured skills, a unique
  highest automatic skill, and casts with no eligible skill.
- Continue recording the resolved concrete skill in result provenance.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `resistance-outcome-effects`: Automatic tied casting skills no longer
  require pre-roll user selection; the deterministic resolved skill is
  recorded as `castSkill`.

## Impact

- Affects `scripts/combat/dialogs/cast-skill-context.js`, its unit tests, and
  the supernatural casting dialog context/template.
- No Foundry VTT API classes, Hooks, or `foundry.utils.*` utilities are
  touched; this is local dialog data resolution and conditional template
  rendering.
- This modifies existing behavior and removes the tied-skill selector.

## Testing Impact

- Update `scripts/combat/dialogs/_spec/cast-skill-context.spec.js` to cover
  tied highest-PW skills and German names, proving that the alphabetically
  later name is selected without requiring input.
- Update the existing E2E-026 tied-skill dialog coverage: its existing
  prepared world actor remains sufficient, no player client is required, and
  the dialog should expose its roll action immediately without a `Fertigkeit`
  selector. No shared E2E helper is required.
