## Context

`add-spell-zone-lifecycle` introduced GM-authoritative persistent Scene Regions, serializable `flags.Ilaris.zone` state, membership tracking, and entry/re-entry dispatch. It deliberately treats every persistent Zone as a triggered event: `applyPreEffects` creates ordinary ActiveEffects with the effect's own timing and does not remove them when a token leaves a Region.

That is unsuitable for a sustained aura. Passive Zone effects need a separate ownership boundary so leaving one Region removes only its own effect application, even when the same Actor is inside two Zones from the same spell. The design must also avoid the optional Foundry spell-stacking mode replacing one Zone's application with another's.

## Goals / Non-Goals

**Goals:**

- Introduce an opt-in `effectMode: "passive"` on persistent Zone profiles; existing profiles retain their triggered behavior by default.
- Materialize non-instant, non-resistance Pre-Effects as Zone-owned ActiveEffects for each contained Token.
- Reconcile membership on persistent Zone creation, Scene readiness, and Token updates, idempotently on the active GM client.
- Remove Zone-owned effects on leave, Region expiry, and Region deletion without touching effects from another Region, cast, token, or manual authoring path.
- Retain token-safe resolution for unlinked Token Actors and the source-spell/caster provenance already stored on the Region.

**Non-Goals:**

- Resistance effects that grant lasting immunity, delayed resistance results, periodic ticks, or beginning-of-turn Zone triggers.
- Movement enforcement, crossing detection, caster-dependent Zones, or GM-facing Zone administration controls.
- Changing ordinary ActiveEffect duration behavior or normal supernatural spell-recast replacement behavior.
- Supporting passive instant damage; repeated damage belongs to `add-periodic-zone-effects`.

## Decisions

### Explicit passive application mode

Add `effectMode` to the normalized Zone profile. `"triggered"` remains the default, preserving the first slice; `"passive"` is valid only for `lifecycle: "persistent"`. A passive Zone accepts only non-instant Pre-Effects with `avoidTest.enabled !== true`.

Alternative considered: infer passive behavior from any non-instant Pre-Effect. Rejected because it would change existing triggered Zones and makes a Zone's lifecycle semantics invisible to an author.

### Zone-owned ActiveEffect provenance

The pre-effect processor receives an explicit passive-Zone context rather than teaching ordinary spell application to guess from `zoneRegionId`. Each generated effect retains the existing source fields plus `zoneRegionId`, `targetTokenId`, `zoneApplicationId`, and a passive-Zone marker in `flags.ilaris`. `zoneApplicationId` is stable for a Region/token pair and distinct from its spell UUID.

The processor bypasses `replacePreviousSpellApplication` for this source mode. The normal Foundry stacking option therefore still replaces repeated direct casts, while two independent passive Regions coexist and remain independently removable.

Alternative considered: store effect IDs in the Region flag. Rejected because actor-side flags are already the durable source of effect ownership, an effect can disappear independently, and reconstructed matching is safer than a mutable cross-document ID ledger.

### Infinite until leaving, not owner-turn duration

Passive Zone effects use the Ilaris `infinite` timing mode. The Region is their lifetime authority; entering creates the effect and leaving/deletion explicitly removes it. The source Pre-Effect's `baseDuration` and ordinary owner-turn timing do not shorten a passive application.

Alternative considered: set effect duration to the Region's remaining scene rounds. Rejected because scene rounds and owner turns have different clocks, and it would leave effects active after a Token exits.

### Explicit marker-only Pre-Effects

`marker.enabled: true` explicitly authorizes a Pre-Effect with no `changes`, `ilarisModifiers`, condition, armed-combat, summon, or custom ending. The processor materializes it as a normal visible ActiveEffect, carrying `system.ilarisMarker: true` and, for passive Zones, the usual infinite timing and Zone provenance. An empty Pre-Effect without this flag remains a no-op.

_Dunkelheit_ is the first source entry. Its stationary base form creates a persistent 4-step circle with `effectMode: "passive"`, excludes the caster, and applies its marker to other occupants. The marker records the Ilaris rules-state only; it does not change Foundry Scene illumination, Token vision, or the caster-moving _Begleiter_ modification.

### Reconciliation and cleanup flow

The existing GM lifecycle service gains a small passive-effect reconciliation path:

```text
Region creation / canvasReady / Token update
              |
              v
     Region containment -> current Token targets
              |
              +-- entered -> create missing passive applications
              |
              +-- left    -> delete matching passive applications
              |
              +-- unchanged -> no write

Region expiry or deleteRegion -> delete all matching Zone applications
```

Membership stays serialized under `flags.Ilaris.zone`. The active GM performs every creation/deletion. `canvasReady` reconciles only the active Scene's persistent passive Regions; it must not cause cross-Scene processing.

Alternative considered: rely exclusively on `updateToken`. Rejected because a scene reload or a Region created before the canvas completes would leave occupants without their passive effect.

### Resistance remains event-local

Passive Zones reject/skip Pre-Effects with `avoidTest.enabled`. A later proposal must decide whether a successful resistance suppresses one tick, one entry, or the full stay. Keeping it outside this change avoids inventing an immunity rule.

## API Surface

### Foundry classes and documents

- [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html): Region flags, `tokens`, and `delete`.
- [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html): Scene-owned Region collection and embedded documents.
- [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html): Region containment and unlinked Token Actor context.
- [`Actor`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): embedded ActiveEffect creation/deletion.
- [`ActiveEffect`](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): persisted provenance and timing data.

### Hooks

- [`canvasReady`](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html): reconcile the active Scene after canvas initialization.
- [`updateToken`](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html) and [`deleteToken`](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html): refresh membership and remove Token-specific Zone applications.
- [`deleteRegion`](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html): remove all applications owned by a deleted persistent Zone.
- Existing `combatRound` handling remains responsible for Region expiry; exact v14 hook signatures and Region delete ordering must be verified before implementation.

### Utilities

- [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) for serialized Zone data.
- [`foundry.utils.randomID`](https://foundryvtt.com/api/v14/functions/foundry.utils.randomID.html) where an application identity needs generation.
- The community wiki must be checked for flag and embedded-document lifecycle helpers before adding any custom collection utility.

## Risks / Trade-offs

- [Risk] An event race creates duplicate effects during Region creation or Token updates → persist membership before dispatch, identify applications by Region/token/pre-effect index, and make creation idempotent.
- [Risk] Cleanup deletes a same-spell effect from another Zone → match the passive marker, Region ID, Token ID, and Region application identity together.
- [Risk] An unlinked Token's Actor is confused with a world Actor → use the existing token-first target resolver for both creation and cleanup.
- [Risk] A Region is deleted while an effect operation is pending → cleanup is idempotent; a missing Actor/effect is a no-op.
- [Risk] Large scenes repeatedly scan many effects → reconcile only passive Ilaris Regions in the affected active Scene and only matching effects on changed Tokens.

## Migration Plan

1. Add optional Zone profile fields with `effectMode: "triggered"` as the backward-compatible default.
2. Add passive provenance only to newly created passive Zone effects; existing effects require no migration.
3. Author one reviewed passive Zone compendium entry and run `npm run pack-all`.
4. Rollback disables passive profile data and lifecycle dispatch; ordinary effects and existing triggered Zones remain valid. Any already-created passive effects carry enough origin data for a GM to remove them manually.

## Open Questions

- _Dunkelheit_ is the reviewed passive marker example. _Wand aus Dornen_ and _Tlalucs Odem Pestgestank_ remain triggered because they use resistance and/or instant damage.
- Should `triggerOnCreate` for a passive Zone apply effects to initial occupants by default? This design assumes yes, matching existing Zone defaults.
- Should passive effects remain when the caster token or Actor is deleted? This remains a Zone-administration decision.

## Testing Strategy

- Use pure unit tests for profile validation, provenance matching, membership difference classification, and candidate effect cleanup.
- Extend the existing Jest lifecycle tests with document mocks and `jest.fn()` calls for Region creation, leave, re-entry, expiry, deletion, and `canvasReady` reconciliation.
- Extend pre-effect processor tests through its current dynamic-import/ActiveEffect mock pattern to verify infinite timing and bypassed spell-recast replacement.
- Add E2E-038 scenarios with GM and `e2e-player`: passive application to an initial occupant, leave cleanup, re-entry recreation, two overlapping Zones, Scene reload reconciliation, and Region deletion cleanup. Re-run non-Zone pre-effect/resistance E2Es as regression coverage.
