## 1. API and Existing Lifecycle Verification

- [x] 1.1 Verify against Foundry API docs (v14) the exact `canvasReady`, `updateToken`, `deleteToken`, `deleteRegion`, and Region expiry hook signatures and ordering used by the passive Zone lifecycle
- [x] 1.2 Verify against Foundry API docs (v14) `RegionDocument.tokens`, Scene Region collections, and Actor embedded ActiveEffect create/delete methods
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.deepClone`, `randomID`, flag serialization, and embedded-document lifecycle helpers
- [x] 1.4 Review `zone-lifecycle.js`, the pre-effect processor, and Ilaris ActiveEffect timing so passive Zone ownership does not reuse ordinary spell-recast or owner-turn expiry semantics

## 2. Passive Zone Data and Effect Provenance

- [x] 2.1 Extend Zone profile normalization and item model data with backward-compatible `effectMode`, defaulting to `triggered` and accepting `passive` only for persistent Zones
- [x] 2.2 Add authoring validation and German feedback for passive Zones that contain instant or resistance Pre-Effects
- [x] 2.3 Extend passive ActiveEffect provenance with passive marker, Region ID, Region application identity, Token ID, spell UUID, and Pre-Effect index
- [x] 2.4 Update the pre-effect processor to materialize valid passive Zone effects with infinite Ilaris timing and to bypass ordinary Foundry-mode spell-recast replacement only for passive Zone applications
- [x] 2.5 Add a narrow reusable matcher for passive Zone effect ownership and cleanup; check foundryvtt.wiki for relevant `foundry.utils.*` helpers before introducing custom flag traversal

## 3. Persistent Passive Zone Lifecycle

- [x] 3.1 Reconcile current occupants for a passive persistent Region at creation and create missing passive applications exactly once
- [x] 3.2 Extend membership updates to create passive applications on entry/re-entry and remove only matching Zone applications on leave
- [x] 3.3 Add active-Scene readiness reconciliation for persisted passive Regions, scoped to the active GM and active Scene
- [x] 3.4 Clean up all matching passive Zone applications when a Region expires or is deleted, with idempotent handling for missing Actors or effects
- [x] 3.5 Preserve token-first resolution for unlinked Token Actors in passive application and cleanup paths
- [x] 3.6 Verify against Foundry API docs (v14) every final Region, Scene, Actor, ActiveEffect, and hook call used by the lifecycle implementation

## 4. Reviewed Source Data and Documentation

- [x] 4.1 Add explicit `marker.enabled` authoring and processor support for visible marker-only Pre-Effects without changing the no-op behavior of ordinary empty Pre-Effects
- [x] 4.2 Add _Dunkelheit_ as the reviewed stationary passive Zone source: persistent 4-step circle, caster excluded, marker-only Pre-Effect; document map lighting/vision and _Begleiter_ as boundaries
- [x] 4.3 Add a Zone automation KurzÃ¼bersicht for `effectMode: passive`, actor leave/re-entry behavior, effect provenance, and the explicit exclusion of resistance/periodic effects
- [x] 4.4 Run `npm run pack-all`

## 5. Unit Tests

- [x] 5.1 Update `scripts/combat/zones/_spec/zone-profile.spec.js` for default triggered mode, valid passive persistent mode, and invalid passive combinations
- [x] 5.2 Update `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for initial occupants, leave cleanup, re-entry, no duplicate containment applications, Scene readiness reconciliation, expiry, and Region deletion cleanup
- [x] 5.3 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for infinite passive timing, Zone/token provenance, and coexistence under Foundry stacking mode
- [x] 5.4 Add or update focused ActiveEffect ownership/cleanup tests under `scripts/effects/_spec/` if the provenance matcher is shared outside the Zone lifecycle
- [x] 5.5 Add source-data and Pre-Effect processor coverage for the _Dunkelheit_ marker-only passive Zone

## 6. E2E Tests

- [x] 6.1 Extend `e2e/cases/e2e-038-spell-zone-lifecycle/e2e-038-spell-zone-lifecycle.spec.ts` with a passive Zone initial-occupant application and leave cleanup scenario
- [x] 6.2 Add E2E coverage for re-entry, two independent Zones from the same spell, and Scene-reload reconciliation without duplicate effects
- [x] 6.3 Add E2E coverage for Region expiry/deletion removing only the owning Region's passive effects
- [x] 6.4 Keep E2E setup/teardown cleanup idempotent for passive Zone Regions, temporary Tokens, and Zone-owned effects; promote reusable setup into `e2e/shared/` when it is shared by more than one scenario
- [x] 6.5 Regression-run `e2e-026-pre-effect-resist-flow` and relevant non-Zone pre-effect E2E cases
- [x] 6.6 Before E2E, run `node utils/foundry-lifecycle.mjs Status`; use `PackAndRestart` after source-data changes or `Restart` after code/template-only changes for `ilaris-e2e-world-v14363-r1`

## 7. Validation

- [x] 7.1 Run `npm install`
- [x] 7.2 Run `npm test`
- [x] 7.3 Run `npm run lint`
- [x] 7.4 Run `openspec validate add-persistent-zone-effects --strict`
