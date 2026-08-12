## Why

Supernatural abilities currently represent `Ziel: Zone` as descriptive text or as a one-time approximation against manually selected targets. They cannot place a shaped area on the scene, retain it for a defined duration, or react consistently when tokens enter or re-enter it. This change establishes opt-in zone placement and lifecycle behavior while reusing the existing pre-effect and resistance pipelines.

## What Changes

- Add structured zone definitions for supernatural items and their spell modifications, including shape, dimensions, pivot, anchor, explicit scene-round duration, and creation/entry triggers.
- Add an opt-in pre-roll zone placement flow to `UebernatuerlichDialog` with a visible, inert draft Region, confirmation, cancellation, and one reusable `Zone platzieren` control above the roll actions.
- Measure free-zone placement range from the caster token center and apply effective range modifiers from selected casting maneuvers.
- Use Foundry v14 Scene Region geometry and containment behavior for affected-token resolution.
- Support an instant zone vertical slice that resolves current occupants into token-aware `selectedActors` only after a successful roll.
- Support persistent zones as GM-owned Scene Regions that survive until their scene-round duration expires or they are removed.
- Support persistent triggered zones that react on creation, entry, and re-entry.
- Route triggered resistance through the existing resist-dialog and pre-effect machinery, preserving token identity for unlinked actors.
- Add acceptance data and tests for Tlalucs Odem Pestgestank, its circular Miasmasphaero form, and Wand aus Dornen.
- Add a structured HTML compendium tutorial for zone authoring, timing, and the opt-in automation setting.
- This is additive for new zone-capable data and APIs, while modifying supernatural casting and pre-effect target resolution for items explicitly marked as zones. No existing non-zone spell behavior is removed.

## Capabilities

### New Capabilities

- `spell-zone-lifecycle`: Structured zone geometry, opt-in Region placement, Region persistence, current-occupant resolution, global scene-round expiry, and creation/entry/re-entry triggers for supernatural items.

### Modified Capabilities

- `combat`: Supernatural dialogs show `Zone platzieren` above their right-column roll actions only for zone spells, retain a visible draft Region after confirmation, enable roll actions only once that draft exists, and expose zone-derived targets only after successful casting when target-selection automation is enabled.
- `supernatural-pre-effects`: Instant zones resolve affected token actors through the existing pre-effect pipeline; persistent triggered zones invoke effects and resistance prompts on lifecycle events.
- `active-effects`: Zone-created effects and trigger bookkeeping retain their originating Region and token context and expire with the zone or effect duration.

## Impact

- Affected code: `scripts/combat/dialogs/uebernatuerlich.js`, combat hooks and templates, supernatural pre-effect processing, resistance routing, active-effect lifecycle hooks, and new zone geometry/manager modules.
- Affected data: supernatural item `_source` JSON entries, structured spell-modification data, and a `comp_packs/kurzuebersichten/_source/` tutorial; compendium packs must be rebuilt with `npm run pack-all` after source changes.
- Foundry APIs to verify and use: [RegionLayer](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html), [Region document](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), [Token document](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), [ActiveEffect document](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), and [Scene document](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).
- APIs and hooks to verify against the v14 API before implementation: `canvas.regions.placeRegion`, Region embedded document create/update/delete, `TokenDocument.testInsideRegion`, `RegionDocument.tokens`, `updateToken`, `deleteToken`, and `combatRound`.
- Foundry utilities to verify and prefer: `foundry.utils.deepClone`, `foundry.utils.mergeObject`, `foundry.utils.randomID`, document `createEmbeddedDocuments`, and Region/token containment helpers.

## Testing Impact

- Add pure unit coverage for zone geometry normalization, pivot semantics, caster-center range validation, maneuver-modified placement range, scene-round timing, lifecycle trigger classification, and token-context conversion.
- Add focused tests for instant-zone target resolution and persistent-zone creation/entry/re-entry deduplication, including unlinked token actors.
- Update supernatural pre-effect tests to verify that effects are deferred until a successful roll and that persistent trigger data retains the originating zone and token identifiers.
- Add E2E coverage for placing and confirming an instant cone, cancelling and redoing placement, placing a persistent rectangle, immediate creation occupancy, entry/re-entry, resistance prompts, global scene-round expiry, and disabled-setting behavior.
- Existing supernatural pre-effect and resist-dialog E2E cases should be regression-verified with non-zone spells to confirm unchanged behavior.
- E2E environment: one GM and one player-controlled caster/target are sufficient for the first slice; the world needs a scene with grid, caster token, target tokens, Tlalucs Odem Pestgestank, Wand aus Dornen, and predictable combat state. Reusable scene/token/login setup belongs in `e2e/shared/` if it is not already provided by the baseline fixture.

## Foundry API References

- [Hooks API](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html)
- [Combat document](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html)
- [Region document](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
- [RegionLayer](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html)
- [Token document](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html)
- [ActiveEffect document](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
