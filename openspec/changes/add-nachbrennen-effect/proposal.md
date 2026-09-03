## Why

The rules-defined fire side effect _Nachbrennen_ is currently only prose in
spell descriptions. It needs a reusable, rule-effective lifecycle—KO 20,
four initiative phases, then one wound unless extinguished—so that
_Ignifaxius_, later _Wand aus Flammen_, and later _Ignisphaero_ share one
behavior instead of carrying independent timers.

## What Changes

- Add `elementalSideEffect` as an optional behavior of a configured damage
  type and author the standard fire type to trigger `nachbrennen`.
- Add one reusable `nachbrennen` resolver: fire damage asks the affected actor
  for a KO-20 countercheck; a failure creates a visible, target-owned pending
  application lasting four owner initiative phases; expiry applies exactly one
  wound and removes the pending application.
- Make removal of the pending Ilaris condition through the existing effect
  UI the explicit representation of extinguishing. Removal prevents the final
  wound and must not remove unrelated sources of the same condition.
- Author _Ignifaxius Flammenstrahl_ to use the fire side-effect binding after
  the preceding ballistic change is available. This proposal neither creates
  ballistic handling nor adds _Wand aus Flammen_ or _Ignisphaero_.

This modifies configured damage-type behavior and direct fire-damage
resolution. It is additive for worlds without the new behavior field and
removes no released capability.

## Capabilities

### New Capabilities

- `nachbrennen-effect`: Resolves, displays, times, extinguishes, and completes
  the reusable fire _Nachbrennen_ side effect.

### Modified Capabilities

- `configurable-damage-types`: Damage-type behavior may declare a named
  elemental side effect, including the fire-to-`nachbrennen` binding.
- `spell-pre-effect-data`: _Ignifaxius Flammenstrahl_ authors fire damage that
  uses the configured elemental side effect.
- `status-condition-lifecycle`: A condition source can carry the pending
  _Nachbrennen_ completion data without interfering with manual or unrelated
  condition sources.

## Impact

- Modify configured damage-type parsing and direct damage application in
  `scripts/combat/dialogs/shared-dialog-helpers.js`, effect creation/timing in
  `scripts/effects/`, and authoritative _Ignifaxius_ source JSON; rebuild the
  compendium with `npm run pack-all`.
- The runtime creates, updates, and removes target-owned
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  documents through documented [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  embedded-document APIs. It uses the documented
  [combatTurn](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html)
  Hook already used by the Ilaris owner-turn lifecycle, and records one
  completion message with [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).
- The implementation must verify the v14
  [ActiveEffect duration model](https://foundryvtt.com/api/interfaces/foundry.documents.types.ActiveEffectDuration.html)
  and expiry-event support before choosing whether the existing owner-turn
  reducer or the core expiry registry owns the final wound. No undocumented
  ActiveEffect internals may be used.
- Existing `foundry.utils.deepClone` and `foundry.utils.randomID` source and
  condition helpers remain the data-copy/identity utilities; no new utility
  is proposed. The implementation must check the Foundry community wiki before
  adding a helper.
- UI ownership remains the existing Actor Effects/status surface and existing
  chat cards. No new sheet part, CSS layout, setting, or migration is proposed.

## Testing Impact

- Unit: extend `scripts/combat/_spec/shared_dialog_helpers.test.js` for the
  optional `elementalSideEffect` behavior and dispatch only after resolved
  fire damage; extend `scripts/effects/_spec/combat-turn-hooks.spec.js` and
  `scripts/effects/_spec/status-conditions.spec.js` for KO success/failure,
  exactly four owner turns, one final wound, explicit extinguishing, and
  independent condition sources. Extend source-data coverage for Ignifaxius
  and the fire binding.
- E2E/runtime: in `ilaris-e2e-world-v14363-r1`, use an active GM, a caster
  with the post-ballistic _Ignifaxius_ source, an owned target Token, and a
  combat with the target as a combatant. Via the visible cast/countercheck
  path, verify the pending _Nachbrennen_ effect in the Actor status/effects
  UI, its four owner-phase countdown, final one-wound chat result, and a
  separate run where deleting that pending effect prevents the wound. Reuse
  the existing combat progression and effect-inspection fixtures; promote any
  new helper to `e2e/shared/` only when it has a second consumer.
- Regression-check direct damage, configured damage types, condition-source
  stacking, and the ballistic _Ignifaxius_ path. Capture screenshots of the
  pending effect and completion chat card in the current supported UI theme.
