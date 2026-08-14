## Context

The system already resolves supernatural spell profiles and applies their effects through `applyPreEffects`, which consumes token-aware `selectedActors`. `Ziel: Zone` is currently descriptive data; there is no structured geometry, placement preview, persistent scene object, or movement-triggered resolution.

The design must support two distinct paths without duplicating spell-effect logic:

```text
zone definition -> placement -> successful cast -> lifecycle manager -> existing pre-effects/resist handler
```

This change covers an instant cone and a persistent triggered rectangle. Passive zones, beginning-of-turn triggers, periodic effects, and precise wall crossing remain separate follow-up changes.

Deferred proposal-sized follow-up work is recorded in the
[Zone follow-up roadmap](../../../../docs/develop/zone-follow-up-roadmap.md).

## Goals / Non-Goals

**Goals:**

- Represent zone shape, dimensions, pivot, anchor, placement range, lifecycle, and trigger timing as structured item data.
- Place a temporary Region preview before the supernatural roll.
- Measure free placement from the caster token center and include selected maneuver range modifiers.
- Apply any zone effect only after a successful cast.
- Allow placement cancellation and re-placement from the supernatural dialog.
- Resolve instant zones into the existing token-safe `selectedActors` pipeline.
- Persist longer-lived zones as Scene Regions with serialized source and trigger metadata.
- Trigger persistent effects for creation occupants, entry, and re-entry.
- Reuse the existing resistance prompt and pre-effect application code.

**Non-Goals:**

- Replacing Foundry's Region geometry or containment implementation.
- Implementing a general-purpose scene aura editor.
- Automatically inferring geometry or lifecycle from free-form German spell text.
- Passive enter/leave effects, beginning-of-turn triggers, periodic effects, and precise wall-crossing enforcement.
- Applying effects before the cast succeeds.

## Decisions

### Structured zone profile

Add an optional `system.zone` profile and allow spell modifications to replace or extend it. The profile distinguishes `shape`, dimensions, `placement`, `lifecycle`, `duration`, and `trigger` fields. A normalized pure helper will provide defaults and reject incomplete profiles before placement.

The pivot is explicit: cone `tip`, rectangle `topLeft`, and circle `center`. For free placement, `placement.range` is measured from the caster token center. Maneuver-derived range bonuses are added to the normalized effective profile after `manoeverAuswaehlen()` and `updateManoeverMods()`. Caster-anchored zones bypass free-placement range validation: caster-anchored circles, such as Miasmasphaero, use the caster token center without free placement, while caster-anchored directional shapes begin at the outward boundary of the caster's public [`Token#getShape()`](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html#getShape), projected in their selected direction and moved outward by a one-pixel epsilon so border contact is unambiguous.

Zone profiles also normalize `targeting.includeCaster`, defaulting to `false`. This is independent of geometry: it filters only the source Token from automatic Region containment results, while allowing an author to opt in for a deliberately self-affecting zone. Other tokens of the same Actor remain valid targets.

Persistent profiles author an explicit `sceneRounds` duration. The lifecycle service decrements `remaining` exactly once for each forward Foundry `combatRound`, regardless of which combatant owns the current turn. The resolved Region flags retain `remaining` and `originalValue`; a 16-minute zone uses the established 16 initiative-phase-per-minute conversion and therefore starts at 256 scene rounds. Zones do not age automatically outside combat.

Regions in this slice resolve containment only; they do not restrict token movement. Their `restriction.enabled` field remains `false`. Foundry v14 requires a restricted Region to be assigned to exactly one Scene Level, which would be an unrelated movement-enforcement concern and contradicts the explicit non-goal for Wand aus Dornen.

Alternative considered: parse dimensions from spell descriptions. Rejected because descriptions are not a stable machine-readable contract and modifications such as Miasmasphaero change geometry without necessarily changing the prose format.

### Draft placement before roll, effects after success

The supernatural dialog places zones deliberately rather than making a roll action open placement. When target selection is enabled and the selected spell form has a zone, its right-column roll area shows a single `Zone platzieren` button above `Würfelaktionen`. Roll actions are disabled until a draft exists. The button opens the native `canvas.regions.placeRegion(..., {create: false})` preview; after the user confirms on the map, the active GM creates an inert Scene Region draft marked under `flags.Ilaris.zoneDraft`. This keeps the chosen shape visible while the user reviews it and then casts.

Pressing the same `Zone platzieren` button when a draft exists deletes that draft and begins a replacement placement. Changing the selected spell modification, cancelling placement, closing the dialog, or failing the cast deletes the draft. A successful instant zone resolves against the selected geometry and then deletes its draft; a successful persistent zone replaces the draft with the actual zone Region. Draft Regions have no behaviors, movement restriction, zone lifecycle state, or pre-effect dispatch, so they are never active spell effects.

Placement requires an active Scene and a resolvable caster token. If either is unavailable, the dialog notifies the user and keeps roll actions unavailable. Player-initiated draft creation and deletion are GM-authoritative through the existing system socket, matching persistent zone creation.

The roll remains the authority for effect execution. Instant target resolution and persistent Region creation happen only after success and energy handling reaches its existing successful-cast path.

Alternative considered: make a cast action start placement and automatically continue after map confirmation. Rejected because a misplaced shape would already be committed to a roll. A retained inert draft lets the user verify or replace placement before any resource cost or roll.

### Foundry Regions as spatial source of truth

Foundry v14 has absorbed the former MeasuredTemplate document into Scene Regions. The implementation SHALL use the public [`RegionLayer#placeRegion`](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html#placeRegion) API with `create: false` for the pre-roll preview, then create a persistent [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html) after a successful cast. Current occupants come from `RegionDocument.tokens` and the documented [`TokenDocument#testInsideRegion`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html#testInsideRegion) containment API; the system will not reimplement geometry.

`MeasuredTemplate`, `Scene#templates`, `CONST.MEASURED_TEMPLATE_TYPES`, and private compatibility methods such as `_refreshShape` are prohibited in this change. The v14 release notes state that templates were removed in favour of Region-based templates, and their compatibility layer is scheduled for removal in v16. The exact Region fields, placement options, containment behavior, and hook signatures must be verified against the official API before coding.

### Lifecycle manager

Introduce a zone lifecycle service with narrow responsibilities:

- create and remove persistent Regions;
- resolve current occupants;
- compare token membership before and after token updates;
- dispatch `create`, `enter`, and `reenter` events;
- deduplicate an event for a token and trigger window;
- pass token metadata into existing pre-effect and resistance functions.

The active GM is the single authority for persistent Region creation, membership tracking, expiry, and trigger dispatch. The caster's client owns only the ephemeral Region preview and sends the confirmed geometry to the GM. The service must not directly implement spell damage or resistance outcomes; it passes source zone context and token identity into the established pre-effect/resist pipeline.

### Trigger semantics

The first slice supports creation, entry, and re-entry. `triggerOnCreate` defaults to `true`, so tokens intersecting a newly created persistent zone are processed once. Entry includes re-entry after a token has left. Beginning-of-turn and periodic triggers remain deferred and must not be inferred from the zone duration.

For Wand aus Dornen, the first slice treats entering the rectangle as the trigger and routes the configured `avoidTest` and attempt damage through the existing resistance flow. It does not revert token movement or enforce crossing; a later refinement can distinguish entering the wall from crossing its full width.

### Data ownership and token safety

Persistent Regions own the spatial state. Their canonical `flags.Ilaris.zone` data carries source spell UUID, caster UUID, source token ID, application ID, normalized zone profile, effective spell profile, resolved `sceneRounds` timing, membership/deduplication state, and the serialized pre-effect references required for later triggers.

Every target event carries `tokenId`, `actorId`, and `actorLink`. Token actors are resolved before world actors for unlinked tokens, matching existing damage and effect safety rules.

### Staged delivery

1. **This change:** pure profile normalization; instant cone placement and current-token resolution; persistent rectangle creation; creation/entry/re-entry resistance dispatch; GM-authoritative `sceneRounds` expiry; redo/cancel placement; Tlalucs Odem and Wand aus Dornen data.
2. **Follow-ups:** passive persistent effects with enter/leave cleanup, beginning-of-turn processing, periodic effects, and precise wall crossing as recorded in the roadmap.

## API Surface

### Foundry classes and documents

- `RegionDocument`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), including its `tokens` collection, flags, and embedded-document lifecycle.
- `RegionLayer`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html), including public `placeRegion` placement with `create: false`.
- `TokenDocument`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html).
- `Token`: [v14 placeable API](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html).
- `Scene`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).
- `ActiveEffect`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html).
- `Combat`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html).

### Hooks

The implementation must verify exact v14 argument order and document types before coding for Region embedded-document creation, update, deletion, `updateToken`, `deleteToken`, and `combatRound`. Region containment and native token-region events take precedence over guessed template hooks.

### Utilities

Prefer verified `foundry.utils.deepClone`, `foundry.utils.mergeObject`, and `foundry.utils.randomID`; use Region document APIs and `TokenDocument#testInsideRegion` rather than custom persistence or geometry utilities. Confirm helper names and signatures in the [community API wiki](https://foundryvtt.wiki/en/development/api).

### Final v14 API verification

The final implementation was rechecked against the official Foundry v14 documentation for [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), [`RegionLayer`](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html), and the [document creation guidance](https://foundryvtt.com/api/v14/modules/foundry.documents.html). The design uses only documented Scene embedded-document operations (`createEmbeddedDocuments`, Region `update`, and Region `delete`), serializable flag data, and public Region containment/placement APIs. `foundry.utils.deepClone` and `randomID` remain the appropriate small helpers; there is no Foundry helper that supersedes the narrow membership comparison, so it remains a pure local function.

No `MeasuredTemplate` compatibility class, Scene template collection, template constants, or private rendering helper is used by this change.

## Risks / Trade-offs

- [Risk] Region placement or containment APIs differ within v14 → [Mitigation] make official API verification an explicit task, isolate those calls behind a Region adapter, and verify no deprecated-template warnings are emitted in E2E.
- [Risk] Persistent zone flags become stale when source items change → [Mitigation] serialize the resolved effective profile and application ID at cast time; do not reread mutable item data for existing zones.
- [Risk] Token movement emits multiple updates for one movement → [Mitigation] compare prior/current membership and deduplicate by zone ID, token ID, and trigger window.
- [Risk] Resistance prompts duplicate on re-render or socket retries → [Mitigation] persist a trigger event ID and make prompt routing idempotent.
- [Risk] Large tokens partially overlap a shape unexpectedly → [Mitigation] use standard Foundry intersection semantics and cover the behavior in E2E tests.
- [Risk] Persistent zones outlive their source actor or scene → [Mitigation] validate source references defensively and allow cleanup on Region deletion or expiry.

## Migration Plan

1. Add optional zone fields and normalization with no behavior change for existing items.
2. Add structured data only to the accepted vertical-slice spells and run `npm run pack-all`.
3. Enable instant and persistent lifecycle behavior only when `system.zone` is present.
4. Keep non-zone supernatural casting and pre-effects on their existing path.
5. Rollback consists of removing zone data and disabling the zone hook registration; existing non-zone data remains valid.

## Testing Strategy

- Pure unit tests use the existing colocated `_spec/` pattern for normalization, profile merging, pivot/range calculations, and event deduplication.
- Dynamic-import/Jest mocks should isolate Foundry document calls and `canvas` access; `Object.create` mocks are appropriate for dialog state tests.
- Extend supernatural pre-effect tests for deferred success, token-aware instant targets, persistent entry/re-entry, and resistance context.
- Add E2E scenarios for cone placement, redo/cancel, persistent wall creation occupancy and entry, resistance prompt routing, zone expiry by global round, opt-out behavior when target selection is disabled, and non-zone regression. E2E setup and teardown SHALL remove Ilaris zone and draft Regions; setup repeats that cleanup to recover safely after an externally terminated previous run. Use the existing portable Foundry runtime and promote reusable scene setup to `e2e/shared/` where appropriate.
