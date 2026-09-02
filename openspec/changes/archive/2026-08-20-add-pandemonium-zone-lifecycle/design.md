## Context

Passive Zones already create one Region-owned ActiveEffect for each contained
Token, assign it `system.ilarisTiming.durationType: "infinite"`, and remove it
by Region/token ownership when containment ends. DOT changes, however, are
currently processed only for `ownerTurns` effects with pending expiry flags;
they neither tick an infinite passive application nor safely resolve `2W6`
through the configured damage pipeline.

_Pandämonium_ needs both continuous harm and a separate movement gate. The
gate is not wall traversal: normal movement wholly within a circle is
meaningful, and failure must tell the GM to restore the Token to the actual
movement origin rather than to a fixed side of a wall.

## Goals / Non-Goals

**Goals:**

- Reuse passive Zone application ownership and cleanup for a persistent,
  contained-target DOT effect.
- Process an infinite DOT once at the end of its owning combatant's turn,
  without duration flags, decrement, or expiry.
- Resolve a DOT formula and configured damage type through the same damage
  semantics as a direct-damage Pre-Effect.
- Add a profile-level, opt-in movement resistance that recognizes documented
  normal Region `MOVE`, `ENTER`, and `EXIT` movement segments, records the
  originating movement coordinates, and stays GM/table managed.
- Author _Pandämonium_ as the reviewed consumer and document the supported
  behavior and the manual _Unheilig_ exception.

**Non-Goals:**

- No automatic _Unheilig_, Vorteil, terrain, actor-item, or other generic
  applicability conditions.
- No physical movement prevention, rollback, or automatic Token repositioning.
- No literal global Initiativephase scheduler, out-of-combat DOT tick, generic
  contact trigger, or change to wall traversal semantics.
- No conversion of existing finite owner-turn DOTs or non-DOT passive effects.

## Decisions

### Passive application owns the DOT lifetime

_Pandämonium_ uses `effectMode: "passive"` and a non-instant Pre-Effect whose
only damage change uses `type: "dot"`. Passive application already assigns
infinite Ilaris timing and records Region, application, Token, spell, and
component provenance. Membership leave, Region expiry, dismissal, and deletion
therefore remove only the precise DOT application.

The alternative—dispatching instant damage from a Region round/turn trigger—
would duplicate membership and cleanup logic, give no durable actor-visible
effect, and cannot express “active until the Token leaves” as cleanly.

### Infinite DOTs tick in the existing owner-turn end phase

The current two-phase `combatTurn`/`updateCombat` lifecycle remains
authoritative. Its owner-turn reduction step will additionally identify active
infinite effects with DOT changes and flag a per-combatant turn window; the
`updateCombat` end phase resolves each matching DOT once but performs no
duration mutation. Finite `ownerTurns` DOTs retain their existing
flag/decrement/expiry behavior.

This maps the supported automation to one tick at the affected actor's turn
end. It deliberately does not claim a separate clock for every abstract
Initiativephase; the Zone guide records that bounded interpretation.

### DOT uses the shared typed damage operation

The DOT operation must use the established damage resolver rather than adding
the string value to `system.gesundheit.wunden`. It rolls supported formulas,
applies the authored damage type, records the resolved amount in a German chat
message, and retains the effect/Zone provenance. A malformed formula or
unsupported damage type produces the existing GM-facing warning and performs
no partial actor update.

### Movement resistance is profile-level and table managed

`profile.movementResistance` defaults disabled and contains an attribute,
difficulty, and failure-marker label. For a normal, non-teleport movement
whose `TokenDocument#segmentizeRegionMovementPath` result contains `MOVE`,
`ENTER`, or `EXIT`, the active GM resolves one resistance window per
`regionId:tokenId:movementId`.

On failure, the system creates/retains one neutral marker owned by the Zone,
Token, and movement-resistance profile. Its flags serialize the origin
coordinates and complete spell/cast provenance. A private German notice tells
the GM to restore the Token to that origin. On success, or Region cleanup, only
the matching marker is removed. The system never changes the Token document.

This stays separate from `onTraverse`, whose rectangle-only rules and
unconditional traversal damage are specific to walls.

### Editor placement is local and mirrored for forms

The affected surface is the existing **Zonenautomatisierung** section in the
concrete supernatural Item sheet. It retains this top-to-bottom order:

1. existing geometry, placement, lifecycle, and duration controls;
2. existing `Beim Erzeugen`, `Beim Betreten`, and `Zu Rundenbeginn` checkboxes;
3. new `Bewegungswiderstand` opt-in checkbox, followed by its `Attribut` and
   `Schwierigkeit` controls when enabled;
4. existing Zone removal controls; then the unchanged structured-form and
   Pre-Effect sections.

The same compact control group appears in each structured form directly after
that form's existing trigger checkboxes and before its Zone buttons. Shared
normalization/listeners provide behavior, while this template remains the
concrete layout owner. Theme-specific light/dark support is not currently
provided by the system and is outside this change; the controls must preserve
their structural order in the currently supported UI theme.

## API Surface

- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  and [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  persist and remove the target-owned passive DOT and failure marker through
  embedded document APIs.
- [Combat](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html),
  [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html),
  and [`updateCombat`](https://foundryvtt.com/api/v14/functions/hookEvents.updateCombat.html):
  preserve GM-only forward owner-turn tick windows; exact v14 hook signatures
  must be confirmed before implementation.
- [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html),
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html),
  and [`moveToken`](https://foundryvtt.com/api/v14/functions/hookEvents.moveToken.html):
  classify normal Region movement and maintain passive containment.
- Verify the community-wiki guidance for `foundry.utils.deepClone`,
  `foundry.utils.getProperty`, and any documented safe helper before adding
  serialization or property access code.

## Risks / Trade-offs

- **Infinite DOT duplicates on repeated combat hooks** → persist a bounded
  owner-turn window per effect/combat and test duplicate `updateCombat` calls.
- **A player-owned Token movement is received on multiple clients** → route the
  existing movement request to the active GM and mutate marker/chat state only
  there.
- **Formula or damage type cannot be resolved** → do not mutate actor health;
  report an actionable GM warning and keep the DOT effect for correction or
  cleanup.
- **A failed movement leaves the Token visibly inside/outside the Zone** → make
  the marker and origin-restoration instruction conspicuous; manual placement
  remains the intentional table convention.
- **One tick per owner turn differs from literal phase-by-phase interpretation**
  → document it as the supported Foundry combat cadence rather than claiming a
  nonexistent Initiativephase scheduler.

## Migration Plan

1. Existing Items without `zone.movementResistance` normalize to disabled.
2. Existing finite DOTs remain finite and retain their current owner-turn
   expiry flow.
3. Replace only _Pandämonium_'s source-data approximation, then run
   `npm run pack-all`.
4. Rollback restores the one-time source Pre-Effect; no actor migration is
   needed because passive and marker effects are ownership-scoped and clean up
   with their Region.

## Testing Strategy

- Pure/unit: cover DOT window classification and damage materialization with
  existing Jest mocks; extend `active-effect-timing.test.js`, Zone lifecycle
  specs, profile normalization specs, resistance handler tests, and
  `supported-spell-data.spec.js`.
- Sheet/unit: extend the existing template-order test for the new controls and
  preserved trigger/form ordering.
- E2E: extend or add a focused _Pandämonium_ case using the standard E2E GM,
  owned player target, active combat Scene, and a clean Region/actor snapshot.
  Verify passive-effect visibility, one owner-turn DOT, entry/leave cleanup,
  successful/failed normal map movement, manual marker/chat, and dismissal.
  Regress existing passive Zone, DOT, wall traversal, and Zone placement flows.
- Runtime/visual: inspect the Item sheet and map/chat results in the supported current UI theme;
  capture screenshots and record the manual marker/origin workflow in the
  change-specific runtime checklist.

## Open Questions

None. The reviewed scope intentionally leaves _Unheilig_ manual until the
Vorteil applicability lifecycle is designed.
