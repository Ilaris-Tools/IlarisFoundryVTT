## Why

_Wand aus Dornen_ currently uses a generic Region-entry trigger. Region overlap is not a reliable representation of traversing a wall: it can fire for an initial occupant or a Token merely overlapping the wall, and its existing resistance Pre-Effect incorrectly makes the wall's damage avoidable. The rules instead require one GE 16 movement attempt and `2W6 TP` for every actual traversal attempt.

Foundry VTT v14 now exposes the processed path of a Token through a Region. This permits a small, table-friendly traversal feature before attempting a later, much larger movement-blocking feature.

## What Changes

- Add an opt-in, wall-specific traversal trigger for persistent rectangular Zones. It detects an actual non-teleport Token movement path through the Region rather than generic containment/entry.
- Configure _Wand aus Dornen_ to use that trigger with creation and generic-entry triggering disabled. Each crossing attempt deals its `2W6 TP` unconditionally, then offers the GE 16 resistance solely to determine whether the Token may traverse the wall.
- On a failed traversal resistance, create a visible but mechanically neutral, Region-owned reminder Active Effect and a German chat notice instructing the GM to place the Token back before the wall manually. A later successful traversal removes only that wall's corresponding marker from that Token.
- Remove traversal reminder effects when their Region expires or is deleted. A standard `onEnter` Zone, passive Zone, turn trigger, and round trigger keep their existing behavior.
- Explicitly exclude automatic movement blocking, movement reversal/repositioning, the every-four-Initiativephase escape convention, attached/moving walls, and a generic replacement for _Umklammern_.

This is additive for authored Zones. It changes the reviewed automation semantics of _Wand aus Dornen_ from avoidable damage on overlap to unconditional traversal damage plus a movement-result resistance.

## Capabilities

### New Capabilities

- `wall-traversal-triggers`: Detect and resolve table-managed movement attempts through persistent wall Zones, including success/failure markers and cleanup.

### Modified Capabilities

<!-- No published Zone lifecycle capability has yet been synced to the main specs. -->

## Impact

- Affected code: `scripts/combat/zones/zone-lifecycle.js`, `zone-profile.js`, the Zone target/containment helpers as required, the established resistance/pre-effect materialization flow, and a narrow Zone-effect ownership helper for traversal markers.
- Affected compendium source: `comp_packs/zauberspruche-und-rituale/_source/Wand_aus_Dornen_XthRIeEiC9Te02tL.json` and the Zone automation quick-reference journal. Source changes require `npm run pack-all`.
- Foundry v14 API: [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), specifically its processed movement state and `segmentizeRegionMovementPath`; [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html); [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html); [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html); and [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).
- Foundry v14 Hook: [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html), not the post-update `updateToken` membership hook, so the implementation receives Foundry's processed movement waypoints and movement action.
- Foundry utilities: [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) for serializable traversal payloads and [`foundry.utils.randomID`](https://foundryvtt.com/api/v14/functions/foundry.utils.randomID.html) where a unique event/application identity is required. The community [Hook guidance](https://foundryvtt.wiki/en/development/api/hooks) must be reviewed alongside the official v14 API before implementation.

## Testing Impact

- Unit tests: add focused path classification tests for forward traversal, parallel movement, movement wholly inside/outside, teleport exclusion, and multiple wall Regions; extend Zone lifecycle and effect-ownership tests for unconditional damage dispatch, success cleanup, failed-marker ownership, expiry/deletion cleanup, and unaffected unrelated markers/effects.
- E2E: extend E2E-038 or add a focused wall traversal case that places _Wand aus Dornen_, moves an owned target through it using the normal map movement path, verifies the unconditional damage and GE prompt, resolves both success and failure branches, checks the visible reminder/chat notice, and confirms Region cleanup.
- Runtime environment: `ilaris-e2e-world-v14363-r1`, active GM plus `e2e-player`, combat Scene, a caster Token, and an owned target Token. Reuse E2E-038 Region/chat/effect cleanup where possible; promote a movement helper to `e2e/shared/` only if another case needs it.
- Visual acceptance: the failed traversal marker remains visible in the target's Active Effects list and the chat notice gives the manual reset instruction. No new sheet controls or dark-mode styling are planned; review the existing Zone placement/casting flow in the normal theme.
