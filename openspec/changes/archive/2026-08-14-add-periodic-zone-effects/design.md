## Context

Persistent Zones already have three independent behaviours: an initial creation trigger, an entry/re-entry trigger, and an occupant-owned turn-start trigger. They persist normalized profile data and lifecycle state in `flags.Ilaris.zone`, use a Region as the scene-local spatial authority, and route triggered results through `applyPreEffects`.

The next useful cadence is neither entry nor one actor's turn: a single event at the beginning of a combat round that evaluates every Token currently inside a Zone. This must not reuse ActiveEffect `ownerTurns` or DOT timing: those are Actor-owned durations and would retain an effect after leaving a Zone rather than resolving current Region membership at a shared Zone tick.

Foundry v14 documents `combatRound(combat, updateData, updateOptions)` as a hook which runs on the initiating client before the Combat database update; `updateData.round` and `updateData.turn` represent the destination state and `updateOptions.direction` is signed. The current Zone lifecycle already has an active-GM guard and a `combatRound` duration reducer, so periodic scheduling belongs in the same Zone lifecycle service.

## Goals / Non-Goals

**Goals:**

- Add an explicit `trigger.onRoundStart` flag that defaults to `false`.
- At each forward combat-round transition, let the active GM resolve all current eligible targets for every matching persistent triggered Zone exactly once.
- Dispatch periodic outcomes through the existing Zone/pre-effect/resistance pipeline with token-aware target data.
- Guarantee that a Zone's periodic dispatch occurs before its scene-round duration is decremented, including its final round.
- Add one base Zone authoring control and update the existing Zone quick reference without moving unrelated sheet content.

**Non-Goals:**

- Every-N-round intervals, per-token cooldowns, Initiativephase scheduling, end-of-turn ticks, or automatic out-of-combat time.
- Passive Zone repetition, persistent resistance immunity, or use of actor-owned DOT timing for Zone scheduling.
- New spell/liturgy source data, wall-crossing rules, caster-dependent Zones, Zone administration, or changes to the current `onTurnStart` semantics.
- New dark-mode CSS work or a general rearrangement of shared Pre-Effect and item-sheet layout.

## Decisions

### One explicit Zone-wide `onRoundStart` trigger

Normalize `trigger.onRoundStart` only when the source explicitly sets it to `true`; omission normalizes to `false`. It is independent of `triggerOnCreate`, `onEnter`, and `onTurnStart`, so a Zone may deliberately use more than one timing. Only persistent, triggered Zones are eligible. Passive Zones remain membership-owned sustained effects and are skipped.

The first iteration has no interval field. A simple all-occupants round trigger covers the intended repeated-damage/resistance use case while avoiding an arbitrary alignment rule for a Zone created mid-combat. Every-N-round and per-token schedules require their own persisted anchors and are deferred.

### A GM-owned round scheduler resolves the Region at the event

Register one periodic dispatcher on the documented `combatRound` hook. It handles only `updateOptions.direction > 0`, operates only when this client is the active GM, and iterates only `combat.scene.regions`. For every eligible Region it resolves current targets through the existing Region target resolver immediately before dispatch. That resolver applies the stored caster exclusion and retains Token-first data for unlinked Token Actors.

The dispatcher represents one Zone event, not one actor event:

```text
forward combatRound
  -> periodic Zone window is claimed
  -> current Region targets are resolved
  -> one existing pre-effect pipeline dispatch for all current targets
  -> persistent Zone duration is reduced
```

A token that enters after the round's window has been claimed waits for the next round; a token that leaves before target resolution is skipped. Resistance remains event-local because each dispatch is an independent existing pre-effect/resistance event.

Alternative: apply a timed ActiveEffect or DOT change to every occupant. Rejected because Actor-owned effect timing does not ask the Region who is inside at the next global tick and can survive after a Token leaves.

### Bounded per-Zone round-window persistence

The scheduler defines a window from Combat ID, destination round, and Region ID. It stores that value as a single `lastRoundStartWindow` under the existing Zone flag before resolving targets or dispatching outcomes. A module-local pending-promise map coalesces simultaneous callbacks for the same Region/window while the flag update and dispatch are in flight.

Writing even when the Region currently has no targets deliberately consumes that round's Zone event. It prevents a token that arrives after the tick from receiving a retroactive effect in the same round. One last-window value is sufficient because prior periodic events must never be replayed; a history ledger would only grow Region flags.

### Preserve existing round-boundary behaviour while defining final-round order

The Zone lifecycle will sequence periodic dispatch before `reducePersistentZoneDurations` on `combatRound`. It will otherwise retain the current turn-start dispatch ordering, so this change does not redefine actor turn-start effects at a round boundary. Thus a triggered Zone with `remaining: 1` performs its configured periodic event, then its Region expires and passive cleanup (if applicable) remains unchanged.

Alternative: decrement first. Rejected because a Zone whose listed duration includes the current scene round would disappear before receiving its final promised periodic event.

### Concrete-sheet authoring owns the new control

`uebernatuerlich_talent.hbs` owns the concrete placement of the new input. In the existing **Zonenautomatisierung** section, it is rendered directly after `Beim Betreten ausloesen`; all shape, placement, lifecycle, existing trigger controls, structured spell modification controls, and shared Pre-Effect rendering remain where they currently are. No shared sheet base or mixin will inject or relocate this control.

The persisted field is `system.zone.trigger.onRoundStart` and its visible German label is `Zu Rundenbeginn ausloesen`. Structured spell-modification Zone profiles can continue to carry a manually authored `trigger` override through the existing profile merge; exposing every Zone trigger in that separate editor is not part of this change.

### Document the cadence rather than migrate a spell prematurely

Update the Zone automation quick-reference journal with the flag, the exact round-start/final-round order, current-membership behaviour, and explicit exclusions. No reviewed compendium spell currently has a fully agreed repeating-zone interpretation, so the capability receives runtime test-local source data rather than a partial spell migration.

## API Surface

### Foundry classes and documents

- [`Combat`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html): `scene` and the destination combat state delivered through the round hook.
- [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html): the scene-local Region collection.
- [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html): stored Ilaris Zone flags and the Region used for containment.
- [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html): target/Actor context used by Region containment resolution.
- [`Item`](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): `system.zone` data rendered and updated by the supernatural item sheet.

### Hooks

- [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html): verified v14 signature `(combat, updateData, updateOptions)`, where `updateData` contains destination `{ round, turn }`, the hook runs before the database update on the initiating client, and `updateOptions.direction` is a signed advance/rewind indicator.
- Existing [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html) registration remains unchanged except for preserving its current ordering relative to the refactored Zone round lifecycle.

### Utilities

- [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html): serialize a normalized profile safely before it is stored in Region flags.
- Existing `foundry.utils.fromUuid` hydration remains in the common Zone pre-effect dispatch path; the periodic scheduler does not add an alternative resolver.
- The [Foundry community Hook guide](https://foundryvtt.wiki/en/development/api/hooks) will be consulted during implementation for client-local Hook behaviour and any available document/flag helper relevant to the final code.

## Risks / Trade-offs

- [A round hook is delivered twice or replays after a refresh] -> Persist the Zone/Combat/round window before dispatch and coalesce same-window local promises.
- [A token is affected after leaving or misses an entry] -> Resolve Region containment at the tick; current containment rather than cached membership is authoritative.
- [A final-duration Zone disappears before its effect] -> Dispatch periodic Zones before duration reduction in one intentional lifecycle sequence.
- [An existing turn-start trigger changes at the round boundary] -> Preserve its existing registration/ordering after duration reduction; test that periodic refactoring does not alter it.
- [A passive Zone creates duplicate lasting effects] -> Exclude passive Zones from the periodic scheduler.
- [A UI checkbox appears in a shared, unintended location] -> Render it only in the concrete Zone editor and take a runtime screenshot of its exact neighbouring controls.
- [Large scenes process unnecessary objects] -> Restrict work to Regions on `combat.scene`, skip non-opted-in Zones before target resolution, and use one target resolution/dispatch per eligible Region per round.

## Migration Plan

1. Add the backward-compatible flag with a false default. Existing Items and persisted Regions do not require migration.
2. Persist `lastRoundStartWindow` only after the first periodic event; historical Regions without it remain valid.
3. Update the structured HTML quick-reference source and run `npm run pack-all`.
4. Rollback removes the opt-in scheduler and checkbox. Existing profile and Region data with the unknown optional field remains harmless.

## Open Questions

None for this vertical slice. Additional cadence types, spell migration, and resistance persistence are intentionally deferred rather than implied by the round trigger.

## Testing Strategy

- Pure Jest tests extend `scripts/combat/zones/_spec/zone-profile.spec.js` for normalized trigger combinations and use existing mocked-document style in `zone-lifecycle.spec.js` for round-window claiming, current containment, no-target windows, current targets, rewinds, duplicate callbacks, passive exclusion, scene isolation, and final-round deletion order.
- Use the existing item-sheet/template test pattern if available; otherwise add a focused render-context assertion that the checkbox is bound to `system.zone.trigger.onRoundStart`. The test must assert the surrounding Zone controls remain in their established order rather than test a shared mixin's arbitrary output.
- Extend E2E-038 with test-local source data but UI-driven sheet authoring, Zone placement, cast resolution, and visible Combat Tracker round advancement. Assert one visible result per expected target, no result for a departed target, a later-round result for an entrant, and final Region/effect cleanup. Take an authoring-sheet screenshot showing control order.
- Before runtime validation, derive the change-specific checklist with `$foundry-runtime-verification`; run `node utils/foundry-lifecycle.mjs Status` and `Restart` after code-only changes or `PackAndRestart` after the quick-reference pack update. Record console output and explicit Region/chat/effect cleanup in the checklist.
