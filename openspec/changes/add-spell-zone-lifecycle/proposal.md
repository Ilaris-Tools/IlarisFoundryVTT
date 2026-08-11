## Why

Übernatürliche Fähigkeiten currently represent `Ziel: Zone` as descriptive text or as a one-time approximation against manually selected targets. They cannot place a shaped area on the scene, retain it for the spell's duration, or react consistently when tokens enter, re-enter, or begin a turn inside it. This change establishes zone placement and lifecycle behavior while reusing the existing pre-effect and resistance pipelines.

## What Changes

- Add structured zone definitions for supernatural items and their spell modifications, including shape, dimensions, pivot, anchor, lifecycle, and trigger timing.
- Add a pre-roll zone placement flow to `UebernatuerlichDialog` with temporary preview, confirmation, cancellation, and a button to redo placement.
- Measure free-zone placement range from the caster token center and apply effective range modifiers from selected casting maneuvers.
- Use Foundry's standard measured-template geometry and token-intersection behavior for affected-token resolution.
- Support an instant zone vertical slice that resolves current occupants into token-aware `selectedActors` only after a successful roll.
- Support persistent zones as scene templates that survive until their duration expires or they are removed.
- Support persistent triggered zones that react on entry/re-entry and optionally at the beginning of each affected actor's turn.
- Route triggered resistance through the existing resist-dialog and pre-effect machinery, preserving token identity for unlinked actors.
- Add acceptance data and tests for Tlalucs Odem Pestgestank, its circular Miasmasphaero form, and Wand aus Dornen.
- This is additive for new zone-capable data and APIs, while modifying supernatural casting and pre-effect target resolution for items explicitly marked as zones. No existing non-zone spell behavior is removed.

## Capabilities

### New Capabilities

- `spell-zone-lifecycle`: Structured zone geometry, placement, measured-template persistence, current-occupant resolution, entry/re-entry triggers, and optional beginning-of-turn triggers for supernatural items.

### Modified Capabilities

- `combat`: Supernatural dialogs place and confirm zone templates before rolling, can redo placement, and expose zone-derived targets only after successful casting.
- `supernatural-pre-effects`: Instant zones resolve affected token actors through the existing pre-effect pipeline; persistent triggered zones invoke effects and resistance prompts on lifecycle events.
- `active-effects`: Zone-created effects and trigger bookkeeping retain their originating template and token context and expire with the zone or effect duration.

## Impact

- Affected code: `scripts/combat/dialogs/uebernatuerlich.js`, combat hooks and templates, supernatural pre-effect processing, resistance routing, active-effect lifecycle hooks, and new zone geometry/manager modules.
- Affected data: supernatural item `_source` JSON entries and structured spell-modification data; compendium packs must be rebuilt with `npm run pack-all` after source changes.
- Foundry APIs to verify and use: [MeasuredTemplate document](https://foundryvtt.com/api/v14/classes/foundry.documents.MeasuredTemplate.html), [MeasuredTemplate placeable](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.MeasuredTemplate.html), [Token document](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html), [Token placeable](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html), [ActiveEffect document](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), and [Scene document](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).
- Hook events to verify against the v14 API before implementation: `createMeasuredTemplate`, `updateMeasuredTemplate`, `deleteMeasuredTemplate`, `updateToken`, `deleteToken`, and combat turn hooks used by the existing active-effect timing system.
- Foundry utilities to verify and prefer: `foundry.utils.deepClone`, `foundry.utils.mergeObject`, `foundry.utils.randomID`, document `createEmbeddedDocuments`, and standard measured-template/token intersection helpers.

## Testing Impact

- Add pure unit coverage for zone geometry normalization, pivot semantics, caster-center range validation, maneuver-modified placement range, lifecycle trigger classification, and token-context conversion.
- Add focused tests for instant-zone target resolution and persistent-zone entry/re-entry deduplication, including unlinked token actors.
- Update supernatural pre-effect tests to verify that effects are deferred until a successful roll and that persistent trigger data retains the originating zone and token identifiers.
- Add E2E coverage for placing and confirming an instant cone, cancelling and redoing placement, placing a persistent rectangle, entering it with a second token, receiving a resistance prompt, and triggering an optional beginning-of-turn effect.
- Existing supernatural pre-effect and resist-dialog E2E cases should be regression-verified with non-zone spells to confirm unchanged behavior.
- E2E environment: one GM and one player-controlled caster/target are sufficient for the first slice; the world needs a scene with grid, caster token, target tokens, Tlalucs Odem Pestgestank, Wand aus Dornen, and predictable combat state. Reusable scene/token/login setup belongs in `e2e/shared/` if it is not already provided by the baseline fixture.

## Foundry API References

- [Hooks API](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html)
- [Combat document](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html)
- [MeasuredTemplate document](https://foundryvtt.com/api/v14/classes/foundry.documents.MeasuredTemplate.html)
- [Token document](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html)
- [ActiveEffect document](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
