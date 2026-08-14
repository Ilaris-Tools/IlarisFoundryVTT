## Context

Ilaris Zones are persistent Foundry v14 Regions with system-owned state under
`flags.Ilaris.zone`. Existing `onEnter` handling runs from `updateToken` and
asks whether the Token's resulting footprint is in the Region. That is the
right abstraction for ordinary area Zones, but it cannot distinguish a wall
crossing from initial occupancy, a resize, or an overlap.

Foundry v14's `moveToken` hook provides the processed `TokenMovementOperation`.
Its movement origin and passed waypoints can be passed to
`TokenDocument#segmentizeRegionMovementPath(region, waypoints)`, which returns
ENTER/MOVE/EXIT path segments based on the Region. This feature uses that
documented movement-specific path and deliberately leaves generic membership
tracking intact.

The current _Wand aus Dornen_ source uses an avoidable instant damage
Pre-Effect. That encodes the rule incorrectly: the GE 16 check decides whether
the traveler gets through, while `2W6 TP` are incurred on both outcomes.

## Goals / Non-Goals

**Goals:**

- Detect a real, non-teleport movement attempt into a persistent rectangular
  wall Zone once, using Foundry's processed Region movement segments.
- Dispatch unconditional configured instant consequences and exactly one
  configured traversal resistance for that attempt.
- On failed resistance, create a visible but mechanically neutral marker and
  a clear German chat instruction for the GM to restore the Token before the
  wall manually; on success, remove only that Region's marker for that Token.
- Keep markers recoverable and safely clean them up when their Region is
  removed or expires.
- Author _Wand aus Dornen_ as the reviewed first consumer and document the
  explicit table convention.

**Non-Goals:**

- Pausing, rejecting, reverting, snapping, or otherwise automatically
  controlling Token movement.
- Automatic escape attempts after four Initiativephasen, including a generic
  fixed-difficulty ending analogous to but distinct from _Umklammern_.
- Triggering from direct `TokenDocument.update` repositioning, teleportation,
  forced movement, Region boundary edits, initial occupants, moving/attached
  walls, or a Token moving out of a wall.
- Changing passive Zones, ordinary entry/turn/round triggers, or adding an
  Item-sheet authoring control in this iteration.

## Decisions

### 1. A dedicated `onTraverse` Zone trigger uses processed movement segments

The normalized Zone profile gains `trigger.onTraverse`, defaulting to `false`.
It is valid only for a persistent, triggered rectangle and requires both
`trigger.triggerOnCreate: false` and `trigger.onEnter: false` for a reviewed
wall profile. A matching
`moveToken` event supplies the Token document and its processed movement. The
lifecycle will call:

```js
token.segmentizeRegionMovementPath(region, [movement.origin, ...movement.passed.waypoints])
```

and consider the event a traversal attempt when the result contains an ENTER
segment. It ignores a final waypoint whose Foundry movement action is marked as
teleport. A path that goes all the way from one side to the other contains an
ENTER followed by later segment(s); a path ending within the wall still has an
ENTER and is also an attempted entry. MOVE-only and EXIT-only paths do nothing.

This recognizes the rule's attempt to enter/pass through a wall without
pretending that a final containment state tells us how the Token got there.
The client where `moveToken` fires forwards the compact processed movement
payload to the active GM when it sees an eligible traversal Region. The active
GM then performs the Region segmentation and dispatches, using a
Region/Token/movement-ID window to coalesce delivery. A GM's own movement is
handled locally. This is a movement window, not the long-lived membership
list.

Alternative rejected: derive crossing from `updateToken`'s old and new `x/y`.
That loses Foundry's multi-waypoint processing, action metadata, token-shape
aware Region segmentation, and cannot reliably distinguish teleportation.

### 2. Damage and movement resistance are two branches of one traversal event

`zone.traversal` is a small separate profile rather than an overloaded
`avoidTest` on the damage Pre-Effect:

```json
{
    "trigger": { "triggerOnCreate": false, "onEnter": false, "onTraverse": true },
    "traversal": {
        "avoidTest": { "attribut": "GE", "resistDifficulty": 16 },
        "failureMarker": { "name": "Durchquerung fehlgeschlagen" }
    }
}
```

The existing Zone `preEffects` remain the unconditional consequences and are
applied before a traversal-only resistance prompt is sent. For _Wand aus
Dornen_, this means one instant `2W6` PROFAN damage Pre-Effect with no
`avoidTest`; the traversal profile owns GE 16. The prompt result does not
apply, diminish, or suppress damage.

The resistance handler gains a narrow, serialized traversal resolution context
instead of a new generic Pre-Effect outcome language. On success it removes
the matching marker. On failure it upserts the marker and writes the chat
instruction. This keeps the widely used `avoidTest` contract as an
effect-avoidance contract and makes the different meaning of this roll
explicit.

Alternative rejected: configure `diminishedOnly` with identical full and
diminished values. That could make damage occur on both results, but it would
hide the movement outcome, cannot create/remove a narrow marker, and would
misrepresent a traversal roll as damage mitigation.

### 3. The failure marker is a narrow, Zone-owned Active Effect

The marker is an embedded `ActiveEffect` with no changes and an infinite
system duration. It stores a dedicated traversal flag with the Region ID,
Zone application ID, Token ID, and source spell UUID. Its display name follows
the source spell, for example `Wand aus Dornen – Durchquerung fehlgeschlagen`.
The effect is a player-visible reminder only: it changes neither GS nor any
roll value.

Creation is idempotent for `(regionId, tokenId)`. Resolution on a later
successful attempt deletes only an effect with those matching flags. Existing
Zone cleanup is extended to remove this same narrow ownership set during
Region deletion/expiry, while it continues to preserve unrelated manual,
other-Region, other-cast, and ordinary passive Zone effects.

Alternative rejected: create an _Umklammern_ effect. Its opposed GE/KK ending
and combat relationship are not the fixed GE 16 traversal convention, and it
would impose effects that the requested table-managed fallback explicitly does
not automate.

### 4. Failure remains a visible table handoff

The failure result sends a German chat message to the affected player and
active GM(s): `Die Durchquerung ist misslungen. Bitte den Token vor der Wand
platzieren; ein weiterer Durchquerungsversuch löst erneut GE 16 und 2W6 TP
aus.` The marker supplies durable context after the message scrolls away.

The system neither reverts the movement nor prevents a second move. The GM
must place the token back before the wall. That manual reset is deliberately
also what makes the next normal movement a fresh ENTER segment and therefore a
fresh attempt.

### API Surface

- [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html):
  `segmentizeRegionMovementPath`, processed movement state, and documented
  Region containment semantics.
- [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html):
  persistent Zone flags and owning Scene Region collection.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  creation and narrow deletion of embedded reminder effects.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  the visible, appropriately routed failure instruction.
- [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html):
  verified v14 signature `(token, movement, operation, user)`. It fires after
  Foundry processes a real movement operation, supplying the movement data
  used by the classifier.
- [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html)
  serializes the authored traversal profile for persistent Region state;
  [`foundry.utils.randomID`](https://foundryvtt.com/api/v14/functions/foundry.utils.randomID.html)
  creates event identities where needed. Before implementation, verify the
  final v14 reference and community [Hook guidance](https://foundryvtt.wiki/en/development/api/hooks)
  again rather than relying on compatibility APIs.

## Risks / Trade-offs

- [A direct document reposition bypasses `moveToken`] → This is intentionally
  not a traversal attempt; the chat instruction tells the GM to use it only
  for the manual reset. Normal player map movement is the supported path.
- [Movement path/Region segmentation is more complex for large or irregular
  Tokens] → Delegate classification to `segmentizeRegionMovementPath` rather
  than custom line-vs-rectangle geometry; test a large-token case if the
  baseline world provides one.
- [A player closes or ignores a resistance prompt] → No marker is created and
  no movement is blocked; this matches the non-authoritative table fallback.
- [Repeated failure creates marker duplicates] → Upsert by Region and Token
  ownership, and test repeated attempts.
- [Chat authorisation differs between player and GM clients] → Route the
  message through the same target-owner/active-GM pathway as resistance
  prompts, with the active GM as a fallback.

## Migration Plan

1. Existing Zone profiles normalize `onTraverse` as `false` and do not change.
2. Update only _Wand aus Dornen_ source data: remove its damage `avoidTest`,
   set creation and generic entry triggering off, enable traversal, and add GE 16 traversal
   configuration.
3. Pack source data, restart the E2E world, and verify the normal casting and
   movement path.
4. Rollback is safe: disabling/removing the new profile fields returns the
   source Item to ordinary Zone behavior. Any extant marker is isolated by its
   flags and can be removed normally or by Region cleanup.

## Testing Strategy

- Pure unit tests: a classifier in `scripts/combat/zones/_spec/` consumes a
  normalized profile and mocked processed movement segments. Cover ENTER,
  MOVE-only, EXIT-only, multi-segment cross, teleport, nonmatching Region, and
  duplicate movement window cases.
- Lifecycle/resolution tests: use the existing Jest dynamic-import and
  `Object.create`/mocked Foundry-document patterns in `zone-lifecycle.spec.js`,
  `resist-handler.spec.js`, and `zone-effect-ownership` tests. Assert that
  unconditional instant damage dispatch precedes one prompt, failure upserts
  the marker and chat instruction, success removes only the matching marker,
  and expiry/deletion remove it.
- Source-data tests: add assertions for the reviewed _Wand aus Dornen_ split
  between unconditional damage and GE 16 traversal configuration.
- E2E/runtime: use the normal Zone casting flow, then actual owned-token map
  movement in `ilaris-e2e-world-v14363-r1`. Capture both outcomes, inspect the
  actor effect list and chat, and clean the temporary Region, marker, messages,
  and moved Token after the test. Visual acceptance is the visible marker and
  readable German failure instruction; no new sheet layout is introduced.

## Open Questions

None for this iteration. Teleports, forced movement, and the four
Initiativephase leaving convention remain intentionally deferred.
