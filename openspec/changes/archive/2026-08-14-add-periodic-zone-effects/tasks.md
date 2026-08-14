## 1. Foundry v14 lifecycle verification

- [x] 1.1 Verify against Foundry API docs (v14) the exact `combatRound(combat, updateData, updateOptions)` signature, pre-update timing, destination round/turn data, and positive/negative `updateOptions.direction` semantics.
- [x] 1.2 Verify against Foundry API docs (v14) the final `Combat`, `Scene`, `RegionDocument`, `TokenDocument`, and `Item` properties/methods used by the periodic scheduler and Zone editor.
- [x] 1.3 Check foundryvtt.wiki for relevant Hook locality and `foundry.utils.deepClone`/document-flag helpers before adding periodic-window persistence.
- [x] 1.4 Review the existing Zone duration, turn-start, passive-effect cleanup, and pre-effect/DOT timing code to preserve current turn-start ordering and avoid reusing Actor-owned timing for a Zone-wide tick.

## 2. Zone profile and authoring UI

- [x] 2.1 Extend `scripts/combat/zones/zone-profile.js` with backward-compatible `trigger.onRoundStart`, defaulting to `false` and preserving Zone modification inheritance.
- [x] 2.2 Update `scripts/items/templates/uebernatuerlich_talent.hbs` with the `Zu Rundenbeginn ausloesen` checkbox bound to `system.zone.trigger.onRoundStart`, immediately after `Beim Betreten ausloesen`, without changing other concrete-sheet or shared Pre-Effect placement.
- [x] 2.3 Verify against Foundry API docs (v14) the final Item sheet/data binding surface used for authored `system.zone` updates.

## 3. Periodic Zone lifecycle

- [x] 3.1 Add an exported active-GM-only periodic round-start dispatcher in `scripts/combat/zones/zone-lifecycle.js` that processes only forward combat rounds, skips passive/non-opted-in Zones, resolves only `combat.scene` Regions, and uses current Region target resolution.
- [x] 3.2 Persist a bounded `Combat ID + destination round + Region ID` periodic window before target dispatch, and coalesce same-window local work so duplicate callbacks and empty ticks cannot replay outcomes in the same round.
- [x] 3.3 Route all current periodic targets through the existing Zone pre-effect/resistance pipeline with one Zone event identity; preserve token-aware target context and event-local resistance behaviour.
- [x] 3.4 Refactor `combatRound` Zone hook registration into an explicit lifecycle sequence: periodic dispatch first, persistent Zone duration reduction second, with existing round-boundary turn-start behaviour otherwise unchanged.
- [x] 3.5 Verify against Foundry API docs (v14) every final hook registration, Region flag update, Scene-local collection access, and containment operation used by the implementation.

## 4. Documentation and pack data

- [x] 4.1 Update `comp_packs/kurzuebersichten/_source/Zonen_Automatisierung_Quick_Reference_zone001.json` with `trigger.onRoundStart`, current-membership semantics, event-local resistance, final-round timing, and the excluded cadence types.
- [x] 4.2 Run `npm run pack-all` after the structured journal source change.

## 5. Unit Tests

- [x] 5.1 Extend `scripts/combat/zones/_spec/zone-profile.spec.js` for omitted, explicitly enabled, combined, and passive-excluded `onRoundStart` profile behaviour.
- [x] 5.2 Extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for all-current-target dispatch, no-target window claiming, late entry, departure, duplicate callback coalescing, rewind rejection, later-round retriggering, scene isolation, passive exclusion, and periodic-before-final-duration-expiry ordering.
- [x] 5.3 Extend `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` with the bound checkbox and its concrete Zone-editor order, confirming that shared Pre-Effect composition and unrelated parts are unchanged.

## 6. Runtime and E2E Tests

- [x] 6.1 Use `$foundry-runtime-verification` to create `runtime-verification.md` from the accepted behaviour before runtime validation, including state snapshots for Zone flags, Region membership, chat/resistance outcomes, final expiry, and teardown.
- [x] 6.2 Extend `e2e/cases/e2e-038-spell-zone-lifecycle/e2e-038-spell-zone-lifecycle.spec.ts` with test-local periodic Zone source data and the `periodic-zone-effects` scenarios: authoring control, UI-driven placement/cast, two current occupants, late entrant, departed Token, later round, and final Region cleanup.
- [x] 6.3 Exercise the visible Foundry Combat Tracker flow rather than only document evaluation; assert exact chat/prompt/effect deltas, no duplicate result after repeated/rewind transition, and idempotent cleanup of temporary Regions, Tokens, Combat, effects, and chat messages.
- [x] 6.4 Capture and inspect a runtime screenshot of the **Zonenautomatisierung** section: existing creation/entry controls visible, `Zu Rundenbeginn ausloesen` immediately after entry, and no relocated structured-modification or shared Pre-Effect content.
- [x] 6.5 Before E2E, run `node utils/foundry-lifecycle.mjs Status`, then use `PackAndRestart` in `ilaris-e2e-world-v14363-r1`; record console diagnostics and teardown evidence in the runtime checklist.

## 7. Validation and handoff

- [x] 7.1 Run `npm install`.
- [x] 7.2 Run the focused Zone/item-sheet Jest tests, then `npm test`.
- [x] 7.3 Run `npm run lint`.
- [x] 7.4 Run `openspec validate add-periodic-zone-effects --strict`.
- [x] 7.5 Review the scoped diff, confirm the runtime checklist and E2E cleanup are complete, and commit only this change's files with a concise imperative message.
