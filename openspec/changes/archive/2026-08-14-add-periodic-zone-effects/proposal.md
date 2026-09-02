## Why

Persistent triggered Zones can currently act on creation, entry, and the start of an occupant's own turn, but they cannot apply one simultaneous, repeating effect to everyone currently inside. A round-based periodic trigger is the smallest useful foundation for effects such as a poison cloud without embedding individual spell timers in combat hooks.

## What Changes

- Add an opt-in `trigger.onRoundStart` flag to persistent, triggered Zone profiles. It defaults to `false` and means one Zone-wide trigger for every current eligible occupant at the beginning of each forward combat round.
- Make the active GM the sole periodic-Zone scheduler. It will resolve current Region containment at the tick, persist a bounded per-Region/Combat/round window before dispatch, and reuse the existing Zone pre-effect and resistance pipeline.
- Establish a single combat-round lifecycle order: dispatch eligible periodic Zone triggers first, then reduce persistent Zone duration. A Zone on its final scene round therefore receives its final periodic trigger before it is removed.
- Extend the existing **Zonenautomatisierung** item-sheet section with the German opt-in control `Zu Rundenbeginn ausloesen`, positioned with the existing creation and entry trigger controls; this change does not relocate any other sheet section.
- Update the Zone automation quick reference with round-based periodic authoring, event-local resistance, final-round timing, and the limits of the first iteration.
- Keep every-N-round schedules, per-token cooldowns, Initiativephase clocks, end-of-turn ticks, and source-spell migration out of scope.

This is additive. Existing Zone profiles retain their current behaviour unless their author explicitly enables `onRoundStart`.

## Capabilities

### New Capabilities

- `periodic-zone-effects`: GM-authoritative, round-start periodic trigger dispatch for persistent triggered Regions.

### Modified Capabilities

<!-- None. This is a new opt-in Zone capability and does not alter the published contracts of existing Zone triggers. -->

## Impact

- Affected code: `scripts/combat/zones/zone-profile.js`, `scripts/combat/zones/zone-lifecycle.js`, `scripts/items/templates/uebernatuerlich_talent.hbs`, their Zone/item-sheet unit tests, and `e2e/cases/e2e-038-spell-zone-lifecycle/`.
- Affected compendium source: `comp_packs/kurzuebersichten/_source/Zonen_Automatisierung_Quick_Reference_zone001.json`; it must be packed after the documentation update.
- Foundry v14 API classes: [`Combat`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html) for a combat's Scene and round state; [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html), and [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html) for scene-local Region containment and Region flag updates; and [`Item`](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) for the authored Zone data rendered in the item sheet.
- Foundry v14 Hook: [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html), using its documented `(combat, updateData, updateOptions)` arguments and forward `updateOptions.direction` transition.
- Foundry utilities: [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) for safely serializing the normalized profile into Region flags. The [community Hook guidance](https://foundryvtt.wiki/en/development/api/hooks) informs active-GM-only client-local dispatch.

## Testing Impact

- Unit tests: extend `scripts/combat/zones/_spec/zone-profile.spec.js` and `zone-lifecycle.spec.js` for default/opt-in normalization, Zone-wide current-membership dispatch, duplicate and rewind rejection, scene isolation, final-round ordering, passive-Zone exclusion, and the next-round retrigger. Extend the relevant item-sheet rendering test or create a focused template-context test for the authoring control.
- E2E: extend E2E-038 to create a periodic Zone through the real item sheet and casting/placement dialog, visibly advance the Combat Tracker, verify one outcome per eligible occupant, verify that an entrant and leaver are evaluated correctly at the next round, and verify the final round before Region cleanup.
- Runtime environment: use `ilaris-e2e-world-v14363-r1`, one active GM, the existing `e2e-player`, the combat Scene and target Tokens. E2E-038's temporary Region, combat, chat, and effect cleanup can be extended; only promote a combat-round advance helper to `e2e/shared/` if another case uses it.
- Visual acceptance: inspect the **Zonenautomatisierung** sheet section at runtime. Its existing shape/placement/lifecycle controls and both creation/entry trigger controls remain visible; `Zu Rundenbeginn ausloesen` appears immediately after `Beim Betreten ausloesen`; structured spell modifications and all shared Pre-Effect content remain in their current concrete-sheet locations. Capture a screenshot in the normal authoring theme; no dark-mode CSS change is part of this change.
