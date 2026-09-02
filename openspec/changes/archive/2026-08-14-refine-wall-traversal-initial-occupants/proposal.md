## Why

The existing _Wand aus Dornen_ automation correctly treats a normal inbound
`ENTER` segment as a traversal attempt, but intentionally leaves Tokens that
start inside a wall and move outward without an outcome. This follow-up makes
those boundary cases explicit without turning ordinary placement or internal
movement into an automatic attack.

## What Changes

- Treat a normal, processed outbound `EXIT` movement through an opted-in wall
  Region as one traversal attempt, using the same unconditional consequence,
  resistance, marker, provenance, and GM-managed repositioning flow as an
  inbound attempt.
- Define wall placement over an already-contained Token as inert: it creates
  neither traversal damage nor a resistance prompt.
- Retain the existing no-op behavior for internal/parallel movement,
  teleports, direct document repositioning, and generic non-wall Zone
  containment.
- Document the initial-occupant and outbound-crossing conventions in the Zone
  automation quick reference.

This modifies existing wall-traversal behavior; it does not introduce a new
general Zone trigger type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wall-traversal-triggers`: extend processed movement traversal detection to
  cover normal `EXIT` segments and define the inert initial-occupant rule.
- `spell-pre-effect-quick-reference`: document the reviewed wall traversal
  boundary behavior for GMs and players.

## Impact

- `scripts/combat/zones/zone-lifecycle.js` and its focused unit tests will
  classify documented `ENTER` and `EXIT` movement segments from
  [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
  `segmentizeRegionMovementPath`; the active-GM
  [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html)
  path and [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
  ownership remain unchanged.
- The implementation will confirm v14 movement-segment constants and relevant
  [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html)
  embedded-document behavior in the official API, and check the community wiki
  before using any `foundry.utils.*` helper.
- Compendium tutorial source requires `npm run pack-all`.

## Testing Impact

- Unit: extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for one
  normal `EXIT` attempt, ENTER/EXIT deduplication, internal-only movement,
  teleport exclusion, and inert initial containment.
- Unit: preserve the existing `scripts/effects/pre-effects/_spec/resist-handler.spec.js`
  coverage proving an outbound failure uses the same marker and no-Token-
  mutation flow.
- E2E: extend the existing wall traversal flow in
  `e2e/cases/e2e-039-wall-traversal-trigger/` with normal map movement from
  inside to outside, a GM-visible resistance prompt/result, and cleanup. Use
  `ilaris-e2e-world-v14363-r1`, an active GM, an owned target Token, and the
  existing Zone test helpers; no new shared harness is expected.
- Runtime: inspect the wall on the map after placing it over a Token, then
  verify outbound movement in light and dark themes where the chat marker and
  notice are visible.
