## 1. API and Core Data

- [ ] 1.1 Verify `MeasuredTemplate`, `TokenDocument`, `Token`, `Scene`, `ActiveEffect`, and `Combat` classes and all required methods against Foundry API docs (v14)
- [ ] 1.2 Verify exact `createMeasuredTemplate`, `updateMeasuredTemplate`, `deleteMeasuredTemplate`, `updateToken`, `deleteToken`, `combatTurn`, and `updateCombat` hook signatures against Foundry API docs (v14)
- [ ] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and measured-template/token intersection patterns
- [ ] 1.4 Add pure zone profile normalization and merge helpers for shapes, dimensions, pivots, placement anchors, lifecycles, and triggers
- [ ] 1.5 Add structured `system.zone` fields to the supernatural item data model without changing non-zone defaults
- [ ] 1.6 Extend spell modification normalization and resolution so a selected form can replace or extend the effective zone profile

## 2. Vertical Slice: Placement and Instant Zones

- [ ] 2.1 Add a measured-template adapter that creates the verified Foundry preview for cone, circle, and rectangle profiles
- [ ] 2.2 Implement caster-center placement range validation using the effective maneuver-modified range and explicit pivot semantics
- [ ] 2.3 Integrate pre-roll placement, cancellation, confirmation, and redo placement into `UebernatuerlichDialog`
- [ ] 2.4 Ensure failed or cancelled casts delete temporary placement and do not pay energy or apply effects
- [ ] 2.5 Resolve current occupants using Foundry standard measured-template intersection behavior and convert them to token-safe `selectedActors`
- [ ] 2.6 Execute instant-zone pre-effects only after a successful roll while preserving the existing non-zone spell path
- [ ] 2.7 Add the Tlalucs Odem Pestgestank cone data and the Miasmasphaero caster-centered circle modification
- [ ] 2.8 Run `npm run pack-all` after compendium source data changes

## 3. Vertical Slice: Persistent Triggered Zones

- [ ] 3.1 Add persistent measured-template creation with serialized resolved spell, caster, application, profile, pre-effect, and trigger metadata
- [ ] 3.2 Verify against Foundry API docs (v14) the Scene embedded-document creation/deletion APIs and measured-template document lifecycle
- [ ] 3.3 Check foundryvtt.wiki for relevant `foundry.utils.deepClone`, `mergeObject`, and document flag serialization helpers
- [ ] 3.4 Implement zone lifecycle membership tracking for entry and re-entry, deduplicated across repeated token updates
- [ ] 3.5 Preserve `tokenId`, `actorId`, and `actorLink` in trigger payloads and resolve unlinked token actors before world actors
- [ ] 3.6 Route persistent zone avoid tests through the existing resistance prompt and pre-effect processor with zone context
- [ ] 3.7 Add Wand aus Dornen rectangle data with top-left pivot, caster-center placement range, and entry resistance behavior
- [ ] 3.8 Implement persistent zone duration cleanup and template deletion cleanup
- [ ] 3.9 Run `npm run pack-all` after compendium source data changes

## 4. Lifecycle Expansion: Turn Triggers and Passive Effects

- [ ] 4.1 Verify against Foundry API docs (v14) the exact combat turn hook payload and forward-turn semantics used by the existing active-effect timing system
- [ ] 4.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers for trigger-state cloning and flag updates
- [ ] 4.3 Add optional beginning-of-turn trigger dispatch for occupants inside persistent zones, GM-only and rewind-safe
- [ ] 4.4 Add passive persistent enter/leave effect application and cleanup with zone-origin metadata
- [ ] 4.5 Add per-token trigger-window bookkeeping for re-entry, turn-start, and future periodic events
- [ ] 4.6 Add explicit periodic-zone extension points without enabling repeated damage for existing spells by default

## 5. Unit Tests

- [ ] 5.1 Create or update `scripts/combat/zones/_spec/zone-profile.spec.js` for normalization, shape defaults, pivot semantics, modification merging, and caster-center range
- [ ] 5.2 Create or update `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for membership transitions, re-entry, deduplication, expiry, and turn-start classification
- [ ] 5.3 Create or update `scripts/combat/zones/_spec/zone-targets.spec.js` for token-context conversion and unlinked actor resolution
- [ ] 5.4 Update `scripts/combat/_spec/uebernatuerlich_roll.spec.js` or the focused supernatural dialog spec for placement-before-roll, cancellation, redo, success deferral, and failure cleanup
- [ ] 5.5 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for instant zone multi-target processing and persistent trigger context
- [ ] 5.6 Update `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for zone-origin resistance prompts and token-specific resolution
- [ ] 5.7 Update `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for Tlalucs Odem, Miasmasphaero, and Wand aus Dornen structured zone data
- [ ] 5.8 Run `npm install`, `npm test`, and `npm run lint`

## 6. E2E Tests

- [ ] 6.1 Add an E2E scenario for placing and confirming Tlalucs Odem's cone and affecting only tokens intersecting the confirmed template
- [ ] 6.2 Add an E2E scenario for cancelling and redoing zone placement before the spell roll
- [ ] 6.3 Add an E2E scenario for placing Wand aus Dornen within caster-center range and creating a persistent rectangle
- [ ] 6.4 Add an E2E scenario with a second player-controlled token entering the thorn wall and receiving one resistance prompt
- [ ] 6.5 Add an E2E scenario for leaving and re-entering the thorn wall and verifying a new trigger
- [ ] 6.6 Add an E2E scenario for an optional beginning-of-turn trigger and rewind protection
- [ ] 6.7 Regression-verify existing supernatural pre-effect and resist-dialog cases with non-zone spells
- [ ] 6.8 Document E2E environment requirements: one GM, one caster player, target token ownership, prepared scene/grid, spell items, and reusable setup in `e2e/shared/`

## 7. Validation and Documentation

- [ ] 7.1 Verify against Foundry API docs (v14) all final document, hook, intersection, and embedded-document calls used by the implementation
- [ ] 7.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and remove custom helpers where a verified Foundry helper is appropriate
- [ ] 7.3 Update developer documentation with zone data shape, lifecycle semantics, trigger timing, and token-context rules
- [ ] 7.4 Run the complete validation sequence: `npm install`, `npm test`, `npm run lint`, and `npm run pack-all`
