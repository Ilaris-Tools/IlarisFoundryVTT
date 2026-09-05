## Context

The newer Pre-Effect-Beta pipeline serializes resistance targets as
`target: { actorId, tokenId, actorLink }` and resolves them through
`resolveTargetActorForDamage`, which correctly prefers an unlinked Token
Actor. A later merge restored the older UUID-only resolver tests without its
export. The current handler therefore has no explicit compatibility path for
an already-rendered prompt containing only `targetActorUuid` or
`targetActorId`.

## Goals / Non-Goals

**Goals:**

- Keep the structured Pre-Effect-Beta target payload as the primary contract.
- Resolve current unlinked Token Actors token-first.
- Safely resolve UUID-only and actor-id-only compatibility payloads.
- Make all resistance interaction and result paths use one tested resolver.

**Non-Goals:**

- Do not replace `resolveTargetActorForDamage` or change combat damage routing.
- Do not change resistance-roll rules, dialog content, Zone trigger behavior,
  socket routing, or persisted item data.
- Do not migrate or rewrite existing chat messages.

## Decisions

### 1. Use an async resistance adapter around the current target resolver

Create an exported `resolveResistTargetActor(preEffectData)` in
`resist-handler.js`. It first passes `preEffectData.target` to the existing
`resolveTargetActorForDamage`; that preserves current token-first behavior.
Only if no actor is resolved does it await `foundry.utils.fromUuid` for
`targetActorUuid`, then look up `targetActorId` in `game.actors`.

_Alternative considered:_ restore the old UUID-only resolver unchanged.
Rejected because it would discard the newer token-aware Beta payload and can
select a world Actor instead of an unlinked Token Actor.

### 2. Route every resistance stage through the adapter

Use the adapter when a player clicks the chat prompt and when a result is
applied, diminished, or routed through Zone traversal/movement handling. This
prevents one stage resolving a different actor than another.

_Alternative considered:_ use the adapter only for the chat button. Rejected
because a dialog result can arrive from an older prompt and must retain the
same compatibility guarantee.

### 3. Include a UUID in newly serialized prompts without replacing `target`

Keep the structured `target` object intact and add `targetActorUuid` from the
resolved Actor when available. New prompts therefore retain the preferred
token context and can still resolve if only their compatibility data survives.

_Alternative considered:_ omit UUIDs from all new prompts and update tests to
the structured format only. Rejected because active chat prompts can outlive a
deployment and the documented UUID utility provides a safe fallback.

## Risks / Trade-offs

- [A malformed or stale UUID resolves no document] → return `null` and retain
  the existing missing-target warning/early-return behavior.
- [A fallback runs before token resolution] → enforce and unit-test the strict
  ordering: structured target, UUID, actor id.
- [An unrelated Document is returned by a UUID] → accept only an Actor-like
  document suitable for the existing resistance flow before using it.
- [A Zone result loses token provenance] → preserve the existing `target`
  object unchanged and regression-test the Zone resistance path.

## Migration Plan

No database migration is required. Deploying the code restores resolution for
new structured prompts and compatible legacy chat payloads. Rollback is a
revert of the adapter and prompt serialization changes; no stored documents
are transformed.

## Open Questions

- Confirm during implementation whether the existing E2E world has a reusable
  unlinked, player-owned Token fixture. If not, create and clean up a minimal
  test-local Token through the existing fixture conventions.

## API Surface

- **Foundry classes used:** [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) as the resolved resistance target; [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html) through the current token-first shared resolver.
- **Hook events:** no new events. Existing `renderChatMessageHTML` and custom
  `Ilaris.postSkillRoll` listeners retain their current signatures.
- **`foundry.utils.*` helper:** [fromUuid](https://foundryvtt.com/api/functions/foundry.utils.fromUuid.html), the documented asynchronous UUID-to-Document resolver. The [community API guide](https://foundryvtt.wiki/en/development/api) was checked; no separate utility replaces the system's token-aware shared resolver.

## Testing Strategy

- **Unit:** update `scripts/effects/pre-effects/_spec/resist-handler.spec.js`
  using the existing `jest.fn` and `foundry.utils.fromUuid` mocks. Cover
  structured unlinked-token priority, UUID-only fallback, actor-id fallback,
  missing targets, prompt serialization, and result application.
- **E2E:** regression-run E2E-026 resistance flow and the relevant E2E-038
  Zone resistance path in `ilaris-e2e-world-v14363-r1`. Add a test-local
  unlinked-token scenario only if existing coverage cannot exercise the
  resolver through visible interaction.
