## Why

_Pandämonium_ is currently a deliberately limited one-time `2W6` damage
approximation. Its actual rule is a persistent Zone: affected creatures take
`2W6 TP` each Initiativephase while inside and require a GE 16 counter-test
for every normal movement attempt through or within the Zone.

The existing passive Zone ownership lifecycle and DOT ActiveEffect type can
provide this without a competing Region scheduler, once DOTs can tick while
their Region-owned effect has infinite timing.

## What Changes

- Extend `dot` ActiveEffect processing so an infinite, passive-Zone-owned DOT
  ticks once at the end of its owning combatant's turn without decrementing or
  expiring the effect; resolve its formula and configured damage type through
  the shared damage path and record the tick in chat.
- Add an opt-in Zone movement-resistance profile for normal map movements that
  contain `MOVE`, `ENTER`, or `EXIT` segments. A failed resistance creates a
  visible, Zone-owned, source-traceable marker and a German GM/owner notice to
  restore the Token to its recorded movement origin; it never repositions or
  blocks the Token automatically.
- Author _Pandämonium_ as a persistent, freely placed two-step passive circle.
  Its non-instant `2W6 PROFAN` DOT is infinite while the target is contained;
  it is created on initial containment and entry, and removed on leave, Region
  expiry, dismissal, or deletion. Mächtige Magie adds `+1W6` to each DOT tick.
- Make the movement-resistance controls visible in the existing Zone editor
  while retaining existing Zone profiles unchanged by default.
- Update the German Zone/pre-effect quick references and spell-effect inventory
  to describe the supported lifecycle and the remaining manual exception.

The change is additive for existing Zones, except that the current
damage-only approximation of _Pandämonium_ is replaced by its reviewed Zone
lifecycle. It intentionally does **not** automate the _Unheilig_ exception or
introduce generic Vorteil/terrain applicability conditions.

## Capabilities

### New Capabilities

- `zone-movement-resistance`: An opt-in, table-managed GE/attribute resistance
  flow for normal movement attempts that intersect a persistent Zone.
- `pandemonium-zone-spell`: Reviewed _Pandämonium_ compendium behavior using
  passive Zone ownership, an infinite DOT, and movement resistance.

### Modified Capabilities

- `active-effects`: Infinite passive-Zone DOTs tick safely at owner-turn end
  and support formula/typed damage resolution.
- `persistent-zone-effects`: Passive Zone applications may own DOT effects
  whose lifecycle remains controlled exclusively by Region membership.
- `spell-zone-lifecycle`: The Zone profile and authoring surface gain the
  opt-in movement-resistance configuration.
- `supported-spell-pre-effects`: _Pandämonium_ moves from one-time damage-only
  coverage to its supported Zone behavior; its _Unheilig_ exception remains
  documented as manual.

## Impact

- Affected code includes `scripts/effects/active-effect.js`,
  `scripts/effects/combat-turn-hooks.js`, `scripts/effects/pre-effects/`,
  `scripts/combat/zones/zone-profile.js`, `scripts/combat/zones/zone-lifecycle.js`,
  resistance/marker helpers, the supernatural item sheet/template, and the
  _Pandämonium_ `_source` JSON.
- The implementation must verify the documented Foundry v14
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html),
  [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html),
  [Combat](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html),
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html),
  and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
  APIs, the [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html),
  [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html),
  and [`updateCombat`](https://foundryvtt.com/api/v14/functions/hookEvents.updateCombat.html)
  hooks, plus relevant `foundry.utils.*` helpers on the community wiki.
- No dependency or world setting is added. Movement remains opt-in through the
  existing Zone target-selection setting and is resolved by the active GM.

## Testing Impact

- Unit: extend ActiveEffect timing tests for one infinite DOT tick without
  duration mutation, dice/formula and damage-type materialization, and legacy
  owner-turn DOT regression behavior. Extend Zone profile/lifecycle and
  resistance-handler tests for `MOVE`/`ENTER`/`EXIT` eligibility, teleport and
  direct-update exclusion, one prompt per movement window, origin provenance,
  marker cleanup, and passive-DOT ownership on entry/leave.
- Data: add source-data coverage for the reviewed circle, passive DOT,
  `GE 16` movement resistance, and `+1W6` Mächtige Magie configuration.
- E2E/runtime: add a _Pandämonium_ case in
  `ilaris-e2e-world-v14363-r1` with an active GM and an owned target Token on a
  combat Scene. Verify placement, initial containment, the visible effect,
  one end-of-owner-turn tick, entry/leave cleanup, successful and failed
  movement attempts, marker/chat visibility, and Region dismissal. Regression
  check passive Zone, DOT, wall traversal, and Zone placement cases. Capture
  the authoring sheet and visible map/chat outcome in the supported current UI
  theme; theme-specific visual support is outside this change;
  promote a helper to `e2e/shared/` only when a second case needs it.
