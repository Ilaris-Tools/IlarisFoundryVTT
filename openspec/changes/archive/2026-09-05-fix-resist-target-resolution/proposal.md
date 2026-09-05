## Why

The `effect-extension-2` merge restored the release-fix unit tests for
`resolveResistTargetActor` without restoring the exported resolver. The newer
Pre-Effect-Beta pipeline correctly carries token-aware `target` data, but the
resist handler no longer accepts UUID-only prompts created by the earlier
release path. This leaves the Jest suite red and removes compatibility for
already-rendered resistance prompts.

## What Changes

- Restore one exported, asynchronous resistance-target resolver that prefers
  the current structured `target` payload and its token-first semantics.
- Fall back to `targetActorUuid` through `foundry.utils.fromUuid`, then to the
  legacy world-actor id when structured target data cannot resolve an actor.
- Route all resist-button, result, diminished-result, and Zone resistance
  paths through that resolver without replacing the newer Pre-Effect-Beta
  target format.
- Reinstate and extend unit coverage for structured unlinked-token targets,
  UUID-only compatibility prompts, legacy actor ids, and missing targets.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `combat`: Resistance prompt target resolution SHALL preserve token-first
  behavior for current payloads and support safe compatibility fallbacks.

## Impact

- **Foundry VTT API classes touched**: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) documents are resolved for the resistance dialog and result application.
- **Foundry utilities touched**: [foundry.utils.fromUuid](https://foundryvtt.com/api/functions/foundry.utils.fromUuid.html) resolves a serialized UUID asynchronously when the current token-aware payload is absent or cannot resolve.
- **Hooks**: existing `renderChatMessageHTML` and `Ilaris.postSkillRoll` handling in the resist flow; no new Hook event.
- **Affected code**: `scripts/effects/pre-effects/resist-handler.js`, its unit specification, and potentially the existing resistance-flow E2E coverage.
- **Behavior classification**: modifies existing behavior to restore merge-lost compatibility; the newer structured Pre-Effect-Beta payload remains the primary path.

## Testing Impact

- **Unit tests**: update `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for structured token-first target resolution, UUID-only compatibility, legacy actor-id fallback, missing targets, and result application through the same resolver.
- **Existing unit tests**: the three currently failing resolver tests become passing coverage rather than being removed.
- **E2E tests**: extend or regression-run `e2e/cases/e2e-026-pre-effect-resist-flow/` and the relevant Zone resistance flow in `e2e/cases/e2e-038-spell-zone-lifecycle/` when practical, confirming the visible Widerstandsprobe applies to the intended target.
- **E2E environment**: local `ilaris-e2e-world-v14363-r1` on port 30000; GM and player fixtures as needed; temporary Item/Actor/Token documents must be tracked and cleaned up. Reuse the existing Foundry resistance fixture rather than introducing duplicate login or chat helpers.

## Proposal Self-Review

**Decision:** PASS

- **Scope:** One merge divergence in resistance-target resolution and its tests; no sheet, spell, or Zone behavior redesign.
- **Architecture:** Preserve the newer token-aware Pre-Effect-Beta `target` payload. UUID and actor-id handling are fallbacks for prompts that lack a resolvable structured target.
- **API evidence:** `foundry.utils.fromUuid` is the documented asynchronous v14 utility for resolving document UUIDs; existing `resolveTargetActorForDamage` remains the token-first resolver for current payloads.
- **Testing impact:** Unit coverage is required; regression-run the existing resistance E2Es because the issue affects user-visible dialog routing and result application.
- **Migration/rollback:** No data migration. The fallback only affects prompt payloads at interaction time; rollback is a revert of the resolver routing.
