## 1. API and lifecycle preparation

- [x] 1.1 Verify against Foundry API docs (v14) the exact `combatTurn`, `updateCombat`, and `moveToken` hook signatures; `Combat`, `ActiveEffect`, `Actor`, `RegionDocument`, and `TokenDocument#segmentizeRegionMovementPath` behavior used by this change.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.deepClone`, `getProperty`, and documented movement/embedded-document helpers before adding DOT, origin, or marker utilities.
- [x] 1.3 Trace the existing finite DOT two-phase timing, passive Zone effect ownership/cleanup, movement socket route, wall traversal window, resist prompt, and marker lifecycle; preserve their ownership boundaries.

## 2. Infinite DOT lifecycle

- [x] 2.1 Extend the owner-turn end lifecycle so an active infinite passive-Zone DOT receives exactly one end-of-owner-turn tick during forward combat progression without pending expiry/decrement flags or timing mutation.
- [x] 2.2 Preserve the current finite `ownerTurns` DOT tick, decrement, expiry, non-GM, duplicate-hook, and rewind behavior.
- [x] 2.3 Route DOT formula resolution and configured damage type through the shared damage operation; emit a source-identifying German chat result and reject invalid formula/type data without partial actor-health mutation.

## 3. Zone movement resistance

- [x] 3.1 Normalize `profile.movementResistance` as disabled by default, with attribute, fixed difficulty, and failure-marker fields when enabled; retain every existing Zone profile unchanged.
- [x] 3.2 Classify one normal movement-resistance event for a configured Zone when Foundry reports `MOVE`, `ENTER`, or `EXIT`; exclude teleport, direct document updates, Region edits, and no-segment paths, and deduplicate by Region, Token, and movement ID.
- [x] 3.3 Reuse the GM-authoritative resist request path to prompt the configured attribute/difficulty without applying extra instant damage.
- [x] 3.4 On failed movement resistance, upsert a neutral, provenance-complete Zone-owned marker that records the movement origin and send the German GM/owner origin-restoration instruction; never move, revert, or block the Token.
- [x] 3.5 Remove only the matching movement-resistance marker on later success, Token departure, Region expiry/dismissal/deletion, and retain markers owned by other Regions, casts, Tokens, and manual authoring.

## 4. Zone editor and reviewed Pandämonium data

- [x] 4.1 Add the base Zone-editor `Bewegungswiderstand`, `Attribut`, and `Schwierigkeit` controls immediately after the creation, entry, and round-start trigger controls and before Zone removal; preserve the existing section order.
- [x] 4.2 Mirror the same compact control group and order in structured form Zone editors without moving Form-Pre-Effects or other form controls.
- [x] 4.3 Author _Pandämonium_ in `comp_packs/zauberspruche-und-rituale/_source/Pand_monium_veNTD1rnQURhqGjs.json` as the reviewed freely placed, persistent two-step passive Zone with one-hour scene-round duration, a non-instant `2W6 PROFAN` DOT, `+1W6` Mächtige Magie, and GE 16 movement resistance.
- [x] 4.4 Retain _Unheilig_ as an explicit manual exception; do not add Vorteil, actor-item, terrain, or applicability-condition data/schema.
- [x] 4.5 Update the German Zone/pre-effect quick-reference sources and `docs/develop/spell-liturgy-effect-inventory.md` with the supported owner-turn DOT cadence, manual origin-restoration convention, and _Unheilig_ boundary.
- [x] 4.6 Run `npm run pack-all`.

## 5. Unit Tests

- [x] 5.1 Extend `scripts/effects/_spec/active-effect-timing.test.js` and/or `scripts/effects/_spec/active-effect.spec.js` for one infinite passive-Zone DOT tick without timing mutation, finite DOT regression behavior, formula resolution, typed damage, invalid data, duplicate hook windows, and rewind/non-GM exclusion.
- [x] 5.2 Extend `scripts/combat/zones/_spec/zone-profile.spec.js` and `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for movement-resistance normalization, MOVE/ENTER/EXIT, teleports/direct updates, one-window deduplication, origin provenance, marker cleanup, and passive DOT entry/leave ownership.
- [x] 5.3 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for success/failure prompt routing and the marker-only, no-token-mutation movement-resistance result.
- [x] 5.4 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for the reviewed _Pandämonium_ Zone/DOT/movement profile and the removal of its one-time-only assertion.
- [x] 5.5 Extend `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` for the required base/form control order and existing section-order regression.
- [x] 5.6 Run `npm install`, focused Jest suites, and `npm test`.

## 6. E2E and runtime verification

- [x] 6.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific checklist for casting, passive DOT visibility/tick, membership cleanup, movement success/failure, marker/chat/origin visibility, Region dismissal, and supported-theme visual review.
- [x] 6.2 Add `e2e/cases/e2e-041-pandemonium-zone/e2e-041-pandemonium-zone.spec.ts` using `ilaris-e2e-world-v14363-r1`, an active GM, an owned non-caster player Token, an active combat Scene, and snapshot/teardown of affected Region/actor state.
- [x] 6.3 Cover initial containment, one end-of-owner-turn `2W6 PROFAN` tick, later entry, leave cleanup, GE 16 success, GE 16 failure with one source-linked marker and origin-restoration notice, and manual Zone dismissal in the new E2E case.
- [x] 6.4 Regression-check E2E-038 Zone placement, E2E-039 wall traversal, E2E-040 Zone administration, existing passive Zone/DOT flows, and the one-time approximation E2E coverage revised for _Pandämonium_. Promote an E2E helper to `e2e/shared/` only when a second case uses it.
- [x] 6.5 Run `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000`, then run focused and affected E2E tests. Inspect screenshots/videos on a failure and clean test-created Regions/effects on normal completion or termination.
- [x] 6.6 Manually review the Zone editor, cast flow, passive effect, DOT chat, failed movement marker, and origin instruction in the supported current UI theme; record confirmation or outstanding boundaries in the runtime checklist. Light/dark theme support is out of scope.

## 7. Final validation and handoff

- [x] 7.1 Run `npm run lint` and resolve relevant lint failures.
- [x] 7.2 Run `openspec.cmd validate add-pandemonium-zone-lifecycle --strict` and resolve validation failures.
- [x] 7.3 Review the implementation diff, confirm only this change's work is staged, and commit it after required tests and runtime verification pass.
