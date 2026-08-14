## Why

The existing Region lifecycle can trigger an instantaneous effect or a resistance prompt when a token enters a zone, but it cannot represent a sustained aura. A persistent Zone needs to apply its non-instant effect while a token is inside and remove only that Zone's application when the token leaves, without disturbing another spell, another Zone, or a manually created ActiveEffect.

## What Changes

- Add an explicit passive persistent-Zone mode for non-instant Pre-Effects that is opt-in in structured Zone data.
- Create a Zone-owned ActiveEffect for each qualifying token on Zone creation, entry, re-entry, and scene reconciliation.
- Remove only ActiveEffects whose persisted Region ID, token ID, and passive-Zone application identity match when the token leaves, the Region expires, or the Region is deleted.
- Keep `avoidTest` Zone effects on the existing triggered-resistance path; this change does not introduce lasting immunity or resistance-memory rules.
- Reconcile existing persistent Regions when their Scene becomes ready and when token membership changes, without duplicate applications.
- Preserve the default Ilaris and optional Foundry supernatural-stacking modes for ordinary effects while ensuring separate passive Zones can coexist.
- Add `marker.enabled` for an explicit, visible marker-only Pre-Effect with no numeric changes.
- Make _Dunkelheit_ the first reviewed passive Zone: it applies the marker while a Token is inside, excludes the caster, and does not alter Foundry map lighting or vision.

This change is additive for Zones that explicitly opt into passive effects. Existing instant, triggered-resistance, non-Zone, and manually authored ActiveEffects retain their behavior.

## Capabilities

### New Capabilities

- `persistent-zone-effects`: Passive Region-based Zone applications, scoped effect ownership, membership reconciliation, and cleanup.

### Modified Capabilities

- `active-effects`: Zone-owned ActiveEffects retain durable Region/token provenance and support narrowly scoped cleanup.
- `supernatural-pre-effects`: The Pre-Effect processor can materialize passive Zone effects without applying ordinary spell-recast replacement semantics.

## Impact

- Affected code: `scripts/combat/zones/zone-lifecycle.js`, zone profile normalization and item model data, `scripts/effects/pre-effects/pre-effects-processor.js`, ActiveEffect provenance helpers, effect hooks, and the Zone authoring tutorial/compendium source data.
- Foundry v14 APIs to verify: [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), [`ActiveEffect`](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), and [`Actor`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html). The implementation will use documented Region containment, Scene/Actor embedded-document creation and deletion, and serializable document flags.
- Foundry Hooks to verify: `updateToken`, `deleteToken`, `canvasReady`, `deleteRegion`, and the existing combat expiry path. The active GM remains the sole lifecycle authority.
- Foundry utilities to verify: [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html), [`foundry.utils.randomID`](https://foundryvtt.com/api/v14/functions/foundry.utils.randomID.html), and any documented helper that supersedes custom flag matching.

## Testing Impact

- Unit tests: extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for creation, entry, leave, re-entry, scene reconciliation, Region expiry/deletion, and duplicate suppression; extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for passive-Zone provenance and stacking isolation; add focused cleanup tests under `scripts/effects/_spec/` if a shared effect-origin helper is introduced.
- E2E: extend `e2e/cases/e2e-038-spell-zone-lifecycle/` to prove a passive Zone applies to an occupant, removes its own effect on leave, reapplies on re-entry, coexists with a second Zone, and cleans up on Region removal. Regression-run existing non-Zone pre-effect and resistance E2E cases.
- Environment: the existing `ilaris-e2e-world-v14363-r1` Scene, GM, `e2e-player`, owned target token, and Zone cleanup fixture are sufficient. Reusable passive Zone token/effect setup should be promoted into `e2e/shared/` if more than one scenario uses it.
