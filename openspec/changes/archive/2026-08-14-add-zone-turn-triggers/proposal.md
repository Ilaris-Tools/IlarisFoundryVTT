## Why

Persistent Zones currently act when created or entered, but cannot affect an occupant again at the beginning of that occupant's turn. This follow-up adds an explicit, opt-in turn-start trigger while preserving the existing GM-authoritative Region lifecycle and preventing repeat dispatch during rewinds or duplicate client events.

## What Changes

- Add `trigger.onTurnStart` to normalized persistent, triggered Zone profiles; it defaults to `false` and is independent of creation and entry triggers.
- On a forward Foundry combat turn, have the active GM resolve the new combatant's current Region membership and dispatch each eligible Zone exactly once for that combat, round, turn, Region, and Token window.
- Persist narrow Zone trigger-window state so a refresh or repeated hook cannot duplicate the event, while allowing the next valid turn to trigger again.
- Reuse the existing Zone pre-effect and resistance pipelines, preserving token-first actor context for linked and unlinked Tokens.
- Treat a Zone created during a combatant's current turn as effective beginning with that combatant's next turn; no retroactive event is dispatched.
- Keep passive Zones, periodic scheduling, caster-dependent lifecycle, wall-crossing precision, and new spell source data out of scope.

This is additive: existing Zones retain their current creation and entry behavior unless an author explicitly enables `onTurnStart`.

## Capabilities

### New Capabilities

- `zone-turn-triggers`: Optional, deduplicated persistent-Zone dispatch at the beginning of an eligible combatant's turn.

### Modified Capabilities

<!-- None. The new capability extends the existing Zone-profile and pre-effect infrastructure without changing already-published requirement contracts. -->

## Impact

- Affected code: `scripts/combat/zones/zone-profile.js`, `scripts/combat/zones/zone-lifecycle.js`, Zone unit tests, and `e2e/cases/e2e-038-spell-zone-lifecycle/`.
- Foundry v14 API classes: [`Combat`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html) for `turns`, current/previous state, and Scene association; [`Combatant`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combatant.html) for the active Token/Actor context; [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), and [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html) for scene-local containment.
- Foundry v14 Hooks: [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html) and [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html), whose documented parameters include `(combat, updateData, updateOptions)` and `updateOptions.direction`.
- Foundry utilities: [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) for safe serialized Zone-state updates. The hook and document lifecycle guidance at the [community wiki](https://foundryvtt.wiki/en/development/api/hooks) informs GM-only, local-hook processing.

## Testing Impact

- Unit tests: extend `scripts/combat/zones/_spec/zone-profile.spec.js` and `zone-lifecycle.spec.js` for default/opt-in authoring, next-combatant selection, containment-before-dispatch, per-window deduplication, rewind rejection, scene isolation, and Zone creation during a turn.
- E2E: extend E2E-038 to prove an occupant receives one visible/resistance outcome at turn start, a departed Token is skipped, the next eligible turn fires again, and rewind/repeated transitions do not duplicate a chat message or prompt.
- Environment: the existing `ilaris-e2e-world-v14363-r1` World, GM, `e2e-player`, combat Scene, target Token, and Zone cleanup fixture are sufficient. Promote a reusable combat-turn advance and Zone cleanup helper to `e2e/shared/` only if more than one case needs it.
