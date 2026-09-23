## Context

The wall traversal lifecycle currently classifies a normal Foundry v14
movement path as an attempt only when
`TokenDocument#segmentizeRegionMovementPath` returns an `ENTER` segment for an
eligible rectangular Region. This deliberately excludes both initial
containment and `EXIT` segments. The existing traversal dispatcher already
owns event-window deduplication, unconditional damage, resistance routing,
visible markers, notification, and cleanup; this refinement must reuse that
path rather than introduce a competing Region trigger.

## Goals / Non-Goals

**Goals:**

- Treat one normal `ENTER` or `EXIT` segment as a traversal attempt for an
  opted-in wall.
- Make initial wall occupancy and placement over a Token explicitly inert.
- Preserve one event per Region, Token, and processed movement ID.
- Preserve the existing unconditional-effect-before-resistance order and
  table-managed movement result.

**Non-Goals:**

- No automatic Token movement, movement blocking, or movement reversal.
- No traversal for teleports, direct document repositioning, Region edits, or
  movement exclusively within/parallel to a wall.
- No change to generic Zone entry, creation, or passive-effect behavior.
- No new Item-sheet control: existing `onTraverse` remains the opt-in switch.

## Decisions

### Extend the existing movement classifier

`classifyZoneTraversalMovement` will recognize non-teleport `ENTER` and `EXIT`
segment types and continue returning the existing Region/Token/movement window.
The existing dispatcher will therefore run unchanged for either direction.

This is preferred over adding `onExit` because leaving a wall is not a generic
Zone lifecycle event: it is the second direction of the same wall-specific
traversal contract. It also preserves existing source data and authoring UI.

### Placement is not a traversal event

The classifier requires a processed normal movement with an origin and at
least one waypoint. Creating or placing a Region does not satisfy that input,
so a Token initially within the wall receives no damage, prompt, or marker.

This is preferred over reusing `triggerOnCreate`: that trigger runs ordinary
Zone pre-effects and cannot represent the wall's independent unconditional
damage plus resistance sequence.

### Deduplicate a bidirectional movement as one attempt

The existing `regionId:tokenId:movementId` window remains the authority. A
path containing more than one eligible `ENTER`/`EXIT` segment still creates one
attempt. This avoids duplicate damage or prompts from a complex movement path.

## API Surface

- [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html):
  `segmentizeRegionMovementPath`, processed movement data, and token-aware
  Actor resolution.
- [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html):
  existing Region identity and Ilaris Zone flag ownership.
- [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html):
  the existing traversal hook route. Its v14 signature is `(document,
movement, operation, user)` after a Token movement update completes.
- `CONST.REGION_MOVEMENT_SEGMENTS.ENTER` and `.EXIT`: use Foundry's documented
  constants, not locally invented numeric values.
- `foundry.utils.*`: no new helper is planned. The implementation task will
  check the community wiki before adding cloning or property helpers.

## Risks / Trade-offs

- [A route yields multiple Region segments] → use the existing movement-ID
  event window so it produces exactly one traversal.
- [Foundry identifies a non-walk action as an EXIT] → retain the current
  teleport-action rejection for every segment and cover it in unit tests.
- [A table reads leaving a wall as a special four-Initiativephase action] →
  this proposal establishes the automated boundary: normal map movement out of
  the wall is a traversal; action economy beyond the map movement remains
  table-managed.
- [Visible behavior regresses while pure tests pass] → verify the normal map
  movement flow, marker/chat notice, and cleanup in the running E2E world.

## Migration Plan

No data migration is required. Existing wall profiles with `onTraverse: true`
gain outbound handling; profiles without it remain unaffected. Rollback is a
single classifier change and does not require modifying persisted Regions or
ActiveEffects.

## Open Questions

None for this slice. The settled rule is that normal outbound crossing is a
traversal attempt, whereas placement over an initial occupant is inert.

## Testing Strategy

- Pure unit tests: extend the existing `jest.fn()` movement-segment mocks in
  `scripts/combat/zones/_spec/zone-lifecycle.spec.js`; test ENTER, EXIT,
  mixed segments, internal MOVE, teleport, and missing movement data.
- Lifecycle unit tests: use the established mocked Region/Actor/ChatMessage
  flow to prove an outbound failure creates only the matching marker and never
  updates the Token.
- E2E/runtime: extend E2E-039 using its existing wall-traversal setup helpers, one GM,
  one owned target Token, and `ilaris-e2e-world-v14363-r1`. Cast/place _Wand
  aus Dornen_, move a Token from inside to outside using the normal map route,
  resolve resistance, verify damage/marker/notice, then remove the Region and
  confirm cleanup. Manually inspect initial placement and the chat result in
  both light and dark themes.
