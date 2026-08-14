## 1. API and Core Data

- [x] 1.1 Verify `RegionDocument`, `RegionLayer`, Region ShapeData, `TokenDocument`, `Scene`, `ActiveEffect`, and `Combat` classes and all required methods against the official Foundry API docs (v14)
- [x] 1.2 Verify exact `canvas.regions.placeRegion` options, Region embedded-document create/update/delete APIs, `TokenDocument.testInsideRegion`, `RegionDocument.tokens`, and `combatRound` hook signatures against Foundry API docs (v14)
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and Region/token containment patterns
- [x] 1.4 Record the verified Region API references and the explicit ban on `MeasuredTemplate`, `Scene#templates`, `CONST.MEASURED_TEMPLATE_TYPES`, and other deprecated template compatibility APIs in the design and implementation comments
- [x] 1.5 Add pure zone profile normalization and merge helpers for shapes, dimensions, pivots, placement anchors, lifecycles, explicit scene-round durations, and creation/entry triggers
- [x] 1.6 Add structured `system.zone` fields to the supernatural item data model without changing non-zone defaults
- [x] 1.7 Extend spell modification normalization and resolution so a selected form can replace or extend the effective zone profile

## 2. Vertical Slice: Placement and Instant Zones

- [x] 2.1 Replace the measured-template adapter with a Region adapter using documented `canvas.regions.placeRegion(..., { create: false })` preview placement for cone, circle, and rectangle profiles; keep `restriction.enabled` false because this slice does not supply the exactly-one-Scene-Level requirement for movement-restricted Regions
- [x] 2.1a Start caster-anchored directional zones at the outward boundary of the caster's public `Token#getShape()` in the selected direction, and add a normalized `targeting.includeCaster` policy that defaults to `false` for automatic target resolution
- [x] 2.2 Implement caster-center placement range validation for free placement using the effective maneuver-modified range and explicit Region-shape pivot semantics; caster-anchored zones bypass that validation
- [x] 2.3 Reintegrate opt-in pre-roll Region placement, cancellation, confirmation, and redo placement into `UebernatuerlichDialog`, gated by `useTargetSelection`
- [x] 2.3a Add the zone-only right-column `Zone platzieren` control, inert GM-owned draft Region creation/deletion, disabled-until-draft roll actions, same-button replacement placement, and cleanup on modification changes, dialog close, cancellation, and failed casts
- [x] 2.4 Ensure failed or cancelled casts discard only the inert draft Region and do not pay energy or apply effects
- [x] 2.5 Resolve current occupants using `RegionDocument.tokens` and/or documented `TokenDocument.testInsideRegion` behavior, then convert them to token-safe `selectedActors`
- [x] 2.6 Execute instant-zone pre-effects only after a successful roll while preserving the existing non-zone spell path
- [x] 2.7 Add the Tlalucs Odem Pestgestank cone data and the Miasmasphaero caster-centered circle modification
- [x] 2.8 Run `npm run pack-all` after compendium source data changes

## 3. Vertical Slice: Persistent Triggered Zones

- [x] 3.1 Replace persistent measured-template creation with GM-authoritative Scene Region creation and serialize the resolved spell, caster, application, profile, pre-effect, trigger, scene-round duration, and membership metadata under the canonical `Ilaris` flag scope
- [x] 3.2 Verify against Foundry API docs (v14) the Scene `Region` embedded-document lifecycle and documented Region flag updates
- [x] 3.3 Check foundryvtt.wiki for relevant `foundry.utils.deepClone`, `mergeObject`, and document flag serialization helpers
- [x] 3.4 Implement zone lifecycle membership tracking from Region containment for creation, entry, and re-entry, with `triggerOnCreate` defaulting to true and deduplication across repeated token updates
- [x] 3.5 Preserve `tokenId`, `actorId`, and `actorLink` in trigger payloads and resolve unlinked token actors before world actors
- [x] 3.6 Route persistent zone avoid tests through the existing resistance prompt and pre-effect processor with Region context
- [x] 3.7 Add Wand aus Dornen rectangle data with top-left pivot, caster-center placement range, entry resistance, and attempt-damage behavior without movement enforcement
- [x] 3.8 Implement GM-owned `sceneRounds` decrement on forward `combatRound`, Region cleanup, and Region deletion cleanup
- [x] 3.9 Run `npm run pack-all` after compendium source data changes

## 4. Unit Tests

- [x] 4.1 Create or update `scripts/combat/zones/_spec/zone-profile.spec.js` for normalization, shape defaults, pivot semantics, modification merging, caster-center range, and scene-round duration
- [x] 4.2 Create or update `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for inert draft Region creation/deletion, Region creation/entry/re-entry membership transitions, deduplication, global-round expiry, canonical flag persistence, and Region deletion
- [x] 4.3 Create or update `scripts/combat/zones/_spec/zone-targets.spec.js` for `RegionDocument.tokens`/`TokenDocument.testInsideRegion` target conversion, source-token exclusion, and unlinked actor resolution
- [x] 4.4 Update `scripts/combat/_spec/uebernatuerlich_roll.spec.js` or the focused supernatural dialog spec for Region placement-before-roll, cancellation, redo, success deferral, missing-token failure, and disabled-setting fallback
- [x] 4.5 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for instant zone multi-target processing and persistent trigger context
- [x] 4.6 Update `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for zone-origin resistance prompts and token-specific resolution
- [x] 4.7 Update `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for Tlalucs Odem, Miasmasphaero, and Wand aus Dornen structured zone data
- [x] 4.8 Run `npm install`, `npm test`, and `npm run lint`

## 5. E2E Tests

- [x] 5.1 Add an E2E scenario for placing and confirming Tlalucs Odem's cone as a Region and affecting only its contained tokens
- [x] 5.2 Add an E2E scenario for cancelling and redoing zone placement before the spell roll
- [x] 5.3 Add an E2E scenario for placing Wand aus Dornen within caster-center range and creating a persistent rectangle Region
- [x] 5.4 Add an E2E scenario with a player-controlled token already intersecting the newly created thorn wall and receiving one resistance prompt
- [x] 5.5 Add an E2E scenario for leaving and re-entering the thorn wall and verifying a new trigger
- [x] 5.6 Add an E2E scenario for global scene-round decrement and Region expiry
- [x] 5.7 Add an E2E scenario proving that disabled target selection leaves zone spells on the manual path
- [x] 5.8 Regression-verify existing supernatural pre-effect and resist-dialog cases with non-zone spells
- [x] 5.9 Document E2E environment requirements: one GM, one caster player, target token ownership, prepared scene/grid, spell items, reusable setup in `e2e/shared/`, an assertion that zone placement emits no MeasuredTemplate deprecation warnings, and setup/teardown cleanup of test Ilaris Regions after failures or terminated prior runs

## 6. Validation and Documentation

- [x] 6.1 Verify against Foundry API docs (v14) all final Region document, Region placement, containment, hook, embedded-document, and GM-authority calls used by the implementation
- [x] 6.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and remove custom helpers where a verified Foundry helper is appropriate
- [x] 6.3 Add a structured HTML tutorial in `comp_packs/kurzuebersichten/_source/` covering zone data, opt-in target automation, scene-round duration, creation/entry/re-entry triggers, and GM authority
- [x] 6.4 Run `npm run pack-all` after compendium source and tutorial changes
- [x] 6.5 Run the complete validation sequence: `npm install`, `npm test`, and `npm run lint`
