## Why

`Niederwerfen` and `Umreißen` currently reproduce the native changes for the
existing `Position4` status effect ("Sehr schlechte Position (Liegend)") in
their own ActiveEffects. That leaves the actor with mechanically equivalent but
unconnected conditions, risks duplicate `-4` penalties when a GM also toggles
Liegend manually, and does not give automated effects the standard status
identity and icon.

The system needs one lifecycle for a semantic status condition that can have
multiple independent sources, including manual GM control and timed combat
effects.

## What Changes

- Introduce a status-condition lifecycle that treats an entry in
  `CONFIG.statusEffects` as the canonical template for an Ilaris condition.
- Materialize one status-bearing ActiveEffect per actor and condition, with a
  source ledger for manual and automated contributions.
- Reuse `Position4` for Liegend so Niederwerfen and Umreißen create the visible
  standard status rather than copying its native changes.
- Keep the condition active until its final source is removed or expires;
  removing one source SHALL not remove another source's condition.
- Define how the existing status-effect picker adds and removes a manual source
  without silently deleting an automated source.
- Update actor-effect presentation so status-derived effects remain visible and
  retain their normal German status identity.

This modifies existing ActiveEffect/status-picker behavior and adds a condition
source lifecycle. It removes no existing status effects or maneuver rules.

## Capabilities

### New Capabilities

- `status-condition-lifecycle`: Canonical status templates, source ledgers,
  source-specific expiry/removal, and status-picker integration.

### Modified Capabilities

- `active-effects`: Status-bearing ActiveEffects gain condition-source
  lifecycle behavior alongside existing owner-turn timing.

## Impact

- Affected code: `scripts/core/init.js` status definitions; pre-effect
  materialization; ActiveEffect timing/removal helpers; actor effect/status-row
  presentation; and the Niederwerfen/Umreißen maneuver source data.
- Foundry APIs: [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html),
  [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  (`createEmbeddedDocuments`, `updateEmbeddedDocuments`, and
  `deleteEmbeddedDocuments`), and
  [Hooks](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html)
  for the documented status-picker/effect lifecycle integration points.
- Foundry utilities to verify and reuse: `foundry.utils.deepClone`,
  `foundry.utils.mergeObject`, and `foundry.utils.randomID`.
- No dependency changes. Updating maneuver `_source/` data requires
  `npm run pack-all`.

## Testing Impact

- Add unit tests for status-template materialization, adding/removing independent
  sources, final-source deletion, manual-picker sources, and owner-turn expiry
  of a single contribution. Extend ActiveEffect timing/pre-effect processor
  specs using existing Jest mocks and dynamic imports.
- Add E2E coverage in the dedicated Foundry baseline world with a GM and two
  controllable actors: a successful knockdown shows Liegend; a manual source
  survives expiry of the maneuver source; and removing the manual source leaves
  an automated source intact. Promote shared status-picker helpers to
  `e2e/shared/` only if more than one case uses them.
