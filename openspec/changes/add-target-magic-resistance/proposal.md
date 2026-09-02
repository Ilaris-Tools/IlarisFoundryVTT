## Why

Spells whose target difficulty is Magieresistenz currently cannot use an
Actor's actual MR: their non-numeric difficulty is merely displayed, so the
player has to decide success manually. This leaves _Blitz dich find_ and the
other target-bound MR spells short of their intended automated casting flow.

## What Changes

- Add an explicit, authored target-Magieresistenz marker to supernatural Item
  data and migrate the canonical source entries that require it; do not infer
  rules from the German display text at roll time.
- When target selection automation is enabled, require one eligible Actor
  target before a marked spell can be rolled. The target's controller rolls
  `1W20`; the system combines that result with the target's current derived MR
  and uses the sum as the casting difficulty.
- Show the resolved `MR + 1W20` difficulty and selected target in the existing
  supernatural casting dialog and chat result. The caster's spell result uses
  that concrete difficulty before energy cost and Pre-Effects are resolved.
- Keep the current manual, non-automated handling when target selection is
  disabled, when a spell has no explicit MR marker, or when the selected target
  is not an Actor. A distinct target controller receives the roll request; for
  GM-owned or unowned targets the active GM performs the same roll.
- Define explicit handling for unsupported multi-target/zone MR source entries
  rather than silently applying one target's MR to all targets. The initial
  automated flow is for a single selected Actor; remaining ambiguous source
  entries stay manual until their per-target rule is specified.

This is an additive feature that modifies existing supernatural casting and
target-selection behavior. It does not remove Magieresistenz data or change
ordinary fixed-difficulty spells.

## Capabilities

### New Capabilities

- `target-magic-resistance`: Resolve a selected Actor target's MR plus a
  target-rolled D20 as the concrete casting difficulty for explicitly marked
  supernatural spells.

### Modified Capabilities

- `supernatural-pre-effects`: Resolve a successful cast only after its
  target-MR difficulty has been determined and passed.
- `structured-spell-modifications`: Preserve an explicit MR requirement when
  a selected spell modification supplies the effective casting profile.

## Impact

- **Item source/model:** `scripts/items/model-data/models.js`, the
  authoritative `comp_packs/**/_source` entries, and source-data tests gain a
  machine-readable MR requirement.
- **Casting UI and flow:**
  `scripts/combat/dialogs/uebernatuerlich.js`, its Handlebars template, and
  target-selection/socket handling resolve and display the target difficulty.
  Relevant Foundry APIs are [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html),
  [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html),
  [Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html), and
  [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html).
  The existing `Ilaris.preTargetSelection` and
  `Ilaris.targetSelectionComplete` Hooks will be reviewed for compatibility;
  no hook contract is assumed to change until the design confirms it.
- **Runtime communication:** an existing system socket route will carry a
  target-side roll request/result when the caster and target are controlled by
  different users; no external dependency is added.

## Testing Impact

- Add pure unit tests for explicit source marker normalization, eligibility,
  MR extraction from Held and Kreatur Actors, `MR + 1W20` construction, and
  preservation through a selected spell-modification profile.
- Update supernatural-dialog tests for pending, resolved, disabled-setting,
  missing-target, and non-Actor-target paths; retain all ordinary numeric and
  manual spell behavior.
- Add an E2E scenario in the local active-GM world with target selection
  enabled for the case, a caster, and a selected target Token. It must visibly
  show the target and resolved difficulty, record the target-side D20 in chat,
  apply the result to _Blitz dich find_, and restore Actors, Tokens, chat, and
  the setting. A second controlled client is required to prove the remote
  target-controller route; target-roll helpers may be promoted to `e2e/shared/`
  if they are reusable.
