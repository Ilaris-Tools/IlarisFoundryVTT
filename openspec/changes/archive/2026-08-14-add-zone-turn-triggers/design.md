## Context

The existing Zone lifecycle stores durable Region state, resolves Region containment with token-safe targets, and dispatches creation/entry triggers through the established pre-effect pipeline. Passive Zones now own sustained effects while an occupant remains inside; they must not reapply those effects on each turn. The next roadmap item is an independent start-of-turn trigger for persistent, triggered Zones.

Foundry v14 provides `combatTurn(combat, updateData, updateOptions)` and `combatRound(combat, updateData, updateOptions)` before their database updates. Both expose the destination `updateData.round`/`turn` and signed `updateOptions.direction`. The normal effect timing hooks already use both events to cover the round boundary, so Zone dispatch must share a small, deduplicated path rather than infer an actor turn from the old `combat.combatant` state.

## Goals / Non-Goals

**Goals:**

- Add an explicit `trigger.onTurnStart` profile flag, defaulting to `false`.
- Trigger eligible persistent, non-passive Zones once for the combatant entering a forward turn, including the round-boundary first turn.
- Resolve current Region containment immediately before dispatch and preserve the existing token-first target context.
- Persist the most recent per-Region trigger window and coalesce in-flight local work so refreshes or both combat hooks cannot duplicate prompts, damage, or effects.
- Keep all Zone mutations on the active GM client and reuse existing trigger/pre-effect/resistance behavior.

**Non-Goals:**

- Periodic cadence, per-Initiativephase timing, end-of-turn events, or out-of-combat aging.
- Passive Zone reapplication, resistance immunity memory, suppression after a successful resistance, or a new effect-duration policy.
- Zone behavior before the next natural turn after a Zone is created, caster-dependent cleanup, crossing detection, or new reviewed source data.

## Decisions

### Add an opt-in profile trigger

`normalizeZoneProfile` gains `trigger.onTurnStart`, normalized only when the source explicitly sets it to `true`. It lives alongside `triggerOnCreate` and `onEnter`, allowing a Zone to use any combination. Passive Zones are ignored by the new dispatch path: their Region-membership lifecycle already supplies their lasting behavior.

Alternative: infer a turn trigger from `onEnter` or an instant Pre-Effect. Rejected because it would alter existing authoring and conceal an important timing rule.

### Derive the destination combatant from hook update data

Both `combatTurn` and `combatRound` call one exported Zone-lifecycle dispatcher. It handles only a positive `updateOptions.direction`, obtains the destination entry from `combat.turns[updateData.turn]`, and resolves the corresponding Token in `combat.scene`. The function skips missing/unlinked Scene context or non-Token combatants safely.

Using `combat.combatant` was rejected because these hooks fire before the database update and therefore expose the departing combatant. Handling only `combatTurn` was rejected because a round boundary may need `combatRound` to represent the next turn.

### Persist a bounded deduplication window before dispatch

For each qualifying Region, the dispatcher forms a window identity from the Combat ID, destination round, destination turn, Region ID, and Token ID. It compares that identity with a serialized `lastTurnStartWindow` in `flags.Ilaris.zone`. The active GM writes the new window before calling the pre-effect pipeline. A module-local promise map coalesces two callbacks for the same Region/window while the persistence and dispatch are in flight.

One bounded last-window record is sufficient: only one combatant owns a given turn, and prior turns never need replay. A growing history ledger was rejected because it wastes Region flag space without adding protection.

### Reconcile containment at dispatch time

The dispatcher uses the existing Region target resolver with the stored caster-exclusion policy, then selects only the incoming combatant's token. A Token that left after its prior membership update is therefore skipped even if stale membership flags still list it. It sends the resulting single selected target to `dispatchZoneTrigger` with a trigger label that includes the window identity, preserving application and resistance provenance.

### Do not backfill an already-started turn

Creating a Zone does not invoke the turn dispatcher. If a Zone appears during the current combatant's turn, it begins checking at that Token's next forward turn. This is deterministic and avoids surprising retroactive damage/prompt resolution.

## API Surface

- [`Combat`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html): `turns`, `scene`, `current`, and `previous` combat state; the implementation verifies the exact destination-turn lookup before coding.
- [`Combatant`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combatant.html): destination Token/Actor identity.
- [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), and [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html): scene-local Region containment and Token resolution.
- Hooks: [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html) and [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html), both verified as `(combat, updateData, updateOptions)` and pre-update; no custom Hook is added.
- [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html): preserve safe serializable Zone state. The [community Hook guidance](https://foundryvtt.wiki/en/development/api/hooks) confirms that hook callbacks are client-local, so active-GM ownership and in-flight coalescing remain necessary.

## Risks / Trade-offs

- [A pre-update hook selects the departing combatant] → derive the destination from `updateData.turn`, not `combat.combatant`, and unit-test a turn transition.
- [Round rollover misses or duplicates the first combatant] → route `combatTurn` and `combatRound` through one persisted window check.
- [Two local hook callbacks race] → mark the persisted window before dispatch and coalesce an in-flight Region/window promise.
- [A stale membership flag affects a departed Token] → evaluate Region containment immediately at dispatch time.
- [Passive Zones gain repeated effects] → restrict the path to triggered Zones only.
- [A rewind repeats damage/prompt] → require strictly positive `updateOptions.direction` and test rewind rejection.

## Migration Plan

1. Add the optional normalized flag with a `false` default; existing source data remains unchanged.
2. Add an optional last-window Region flag only after the first turn trigger; no migration of existing Regions is needed.
3. Add lifecycle and E2E coverage using test-local Zone data. No reviewed compendium source changes or pack operation are required.

Rollback removes the optional trigger handling. Existing Regions with a stored last-window flag remain harmless ignored data.

## Open Questions

None. The roadmap decisions are resolved here: start-of-turn is opt-in, Zones created mid-turn do not backfill, and successful resistances remain event-local.

## Testing Strategy

- Extend pure Zone-profile tests for default and enabled `onTurnStart` values.
- Extend lifecycle Jest tests with mocked Combat/Combatant/Scene documents and `jest.fn()` pre-effect dispatch: destination-token targeting, both hooks, deduplication, departure, rewind, scene mismatch, and later-turn retriggering.
- Extend E2E-038 through visible combat-tracker advancement after UI-driven Zone creation. Inspect exact chat/prompt deltas and Region flags, then clean up created Region, effects, targets, and combat state in `finally`.
- Derive a runtime-verification checklist before E2E validation, use the Foundry lifecycle helper, and capture console diagnostics and teardown evidence.
