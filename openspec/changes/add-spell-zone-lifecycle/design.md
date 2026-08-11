## Context

The system already resolves supernatural spell profiles and applies their effects through `applyPreEffects`, which consumes token-aware `selectedActors`. `Ziel: Zone` is currently descriptive data; there is no structured geometry, placement preview, persistent scene object, or movement-triggered resolution.

The design must support two distinct paths without duplicating spell-effect logic:

```text
zone definition -> placement -> successful cast -> lifecycle manager -> existing pre-effects/resist handler
```

The first vertical slice covers an instant cone and a persistent triggered rectangle. The complete design also reserves lifecycle behavior for passive zones and beginning-of-turn effects.

Deferred proposal-sized follow-up work is recorded in [follow-up-roadmap.md](follow-up-roadmap.md).

## Goals / Non-Goals

**Goals:**

- Represent zone shape, dimensions, pivot, anchor, placement range, lifecycle, and trigger timing as structured item data.
- Place a temporary measured-template preview before the supernatural roll.
- Measure free placement from the caster token center and include selected maneuver range modifiers.
- Apply any zone effect only after a successful cast.
- Allow placement cancellation and re-placement from the supernatural dialog.
- Resolve instant zones into the existing token-safe `selectedActors` pipeline.
- Persist longer-lived zones as measured templates with serialized source and trigger metadata.
- Trigger persistent effects on entry/re-entry and optionally at the beginning of an actor's turn.
- Reuse the existing resistance prompt and pre-effect application code.

**Non-Goals:**

- Replacing Foundry's measured-template geometry or token-intersection implementation.
- Implementing a general-purpose scene aura editor.
- Automatically inferring geometry or lifecycle from free-form German spell text.
- Implementing every periodic damage rule in the first vertical slice.
- Applying effects before the cast succeeds.

## Decisions

### Structured zone profile

Add an optional `system.zone` profile and allow spell modifications to replace or extend it. The profile distinguishes `shape`, dimensions, `placement`, `lifecycle`, and `trigger` fields. A normalized pure helper will provide defaults and reject incomplete profiles before placement.

The pivot is explicit: cone `tip`, rectangle `topLeft`, and circle `center`. `placement.range` is measured from the caster token center. Maneuver-derived range bonuses are added to the normalized effective profile after `manoeverAuswaehlen()` and `updateManoeverMods()`.

Alternative considered: parse dimensions from spell descriptions. Rejected because descriptions are not a stable machine-readable contract and modifications such as Miasmasphaero change geometry without necessarily changing the prose format.

### Placement before roll, effects after success

The supernatural dialog enters placement after casting maneuvers are resolved but before the roll. It owns a temporary preview state. Confirming placement stores the selected geometry on the dialog; cancelling aborts the cast. A redo-placement action clears the preview and starts placement again without rolling or paying energy.

The roll remains the authority for effect execution. Instant target resolution and persistent template creation happen only after success and energy handling reaches its existing successful-cast path.

Alternative considered: place after the roll. Rejected because placement range depends on casting maneuvers and a failed roll must not leave a zone behind.

### Foundry measured templates as spatial source of truth

Use Foundry's measured-template document/placeable APIs and standard intersection behavior. The system will not independently calculate token overlap for the first slice. The created document stores normalized Ilaris metadata in flags so the lifecycle manager can reconstruct spell behavior after scene reloads.

The exact v14 document fields, preview placement API, intersection method, and hook signatures must be verified against the official API and community wiki before implementation. This is a blocking validation task because earlier guessed documentation URLs were unavailable.

### Lifecycle manager

Introduce a zone lifecycle service with narrow responsibilities:

- create and remove persistent measured templates;
- resolve current occupants;
- compare token membership before and after token updates;
- dispatch `enter`, `reenter`, and optional `turnStart` events;
- deduplicate an event for a token and trigger window;
- pass token metadata into existing pre-effect and resistance functions.

The service must not directly implement spell damage or resistance outcomes. It passes a source zone context and token identity into the established pre-effect/resist pipeline.

### Trigger semantics

Each zone explicitly declares whether it triggers on entry and/or at the beginning of the affected token's turn. Entry includes re-entry after a token has left. Beginning-of-turn triggers are independently configurable and must not be inferred from the zone duration.

For Wand aus Dornen, the first slice treats entering the rectangle as the trigger and routes the configured `avoidTest` through the existing resistance flow. A later refinement can distinguish entering the wall from crossing its full width if the rules require that precision.

### Data ownership and token safety

Persistent measured templates own the spatial state. Their flags carry source spell UUID, caster UUID, source token ID, application ID, normalized zone profile, effective spell profile, and the serialized pre-effect references required for later triggers.

Every target event carries `tokenId`, `actorId`, and `actorLink`. Token actors are resolved before world actors for unlinked tokens, matching existing damage and effect safety rules.

### Staged delivery

1. **Vertical slice:** pure profile normalization; instant cone placement and current-token resolution; persistent rectangle creation; entry/re-entry resistance dispatch; redo/cancel placement; Tlalucs Odem and Wand aus Dornen data.
2. **Lifecycle expansion:** passive persistent effects with enter/leave cleanup and stronger duplicate bookkeeping.
3. **Turn triggers:** beginning-of-turn processing integrated with the existing GM-scoped combat timing hooks.
4. **Periodic effects:** explicit per-zone cooldown and repeated damage/resistance behavior.

## API Surface

### Foundry classes and documents

- `MeasuredTemplate` document and placeable: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.MeasuredTemplate.html) and [placeable API](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.MeasuredTemplate.html).
- `TokenDocument`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html).
- `Token`: [v14 placeable API](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html).
- `Scene`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).
- `ActiveEffect`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html).
- `Combat`: [v14 API](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html).

### Hooks

The implementation must verify exact v14 argument order and document types before coding for `createMeasuredTemplate`, `updateMeasuredTemplate`, `deleteMeasuredTemplate`, `updateToken`, `deleteToken`, `combatTurn`, and `updateCombat`. The existing system hook registration patterns will be followed after verification.

### Utilities

Prefer verified `foundry.utils.deepClone`, `foundry.utils.mergeObject`, and `foundry.utils.randomID`; use document `createEmbeddedDocuments`/`deleteEmbeddedDocuments` and Foundry's measured-template intersection helpers rather than custom persistence or geometry utilities. Confirm helper names and signatures in the [community API wiki](https://foundryvtt.wiki/en/development/api).

## Risks / Trade-offs

- [Risk] Measured-template preview APIs or intersection helpers differ in v14 → [Mitigation] make API verification an explicit task before implementation and isolate Foundry calls behind a small adapter.
- [Risk] Persistent zone flags become stale when source items change → [Mitigation] serialize the resolved effective profile and application ID at cast time; do not reread mutable item data for existing zones.
- [Risk] Token movement emits multiple updates for one movement → [Mitigation] compare prior/current membership and deduplicate by zone ID, token ID, and trigger window.
- [Risk] Resistance prompts duplicate on re-render or socket retries → [Mitigation] persist a trigger event ID and make prompt routing idempotent.
- [Risk] Large tokens partially overlap a shape unexpectedly → [Mitigation] use standard Foundry intersection semantics and cover the behavior in E2E tests.
- [Risk] Persistent zones outlive their source actor or scene → [Mitigation] validate source references defensively and allow cleanup on template deletion or expiry.

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
- Add E2E scenarios for cone placement, redo/cancel, persistent wall entry, resistance prompt routing, and non-zone regression. Use the existing portable Foundry runtime and promote reusable scene setup to `e2e/shared/` where appropriate.
