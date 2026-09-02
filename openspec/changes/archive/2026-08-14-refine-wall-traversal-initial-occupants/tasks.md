## 1. API and behavior preparation

- [x] 1.1 Verify `TokenDocument#segmentizeRegionMovementPath`, `RegionDocument`, `CONST.REGION_MOVEMENT_SEGMENTS`, and the existing `moveToken` hook route against Foundry API docs (v14), including normal movement and teleport segment semantics.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` movement-data, cloning, or property helpers before introducing any utility.
- [x] 1.3 Trace the existing `onTraverse` classifier, event-window deduplication, resistance routing, marker ownership, and cleanup boundaries; retain their ownership split.

## 2. Bidirectional wall traversal lifecycle

- [x] 2.1 Extend the wall traversal movement classifier so a non-teleport processed `ENTER` or `EXIT` segment is eligible while MOVE-only paths remain ineligible.
- [x] 2.2 Preserve the existing `regionId:tokenId:movementId` event window so a mixed or multi-segment movement creates exactly one traversal attempt.
- [x] 2.3 Ensure Region creation/placement over an already-contained Token, direct repositioning, and teleport movement remain inert and do not route traversal consequences or resistance.
- [x] 2.4 Reuse the existing unconditional damage, resistance, marker, chat instruction, provenance, and cleanup path for outbound traversal; do not update or constrain Tokens automatically.

## 3. Documentation and compendium sources

- [x] 3.1 Update the German Zone automation quick reference to explain inert initial placement and normal inbound/outbound traversal, including the GM-managed failed-movement convention.
- [x] 3.2 Run `npm run pack-all`.

## 4. Unit Tests

- [x] 4.1 Extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for normal EXIT classification, mixed ENTER/EXIT deduplication, MOVE-only paths, teleports, and initial containment.
- [x] 4.2 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` or the focused Zone lifecycle tests to verify an outbound failure reuses the existing marker/notice flow without Token mutation.
- [x] 4.3 Run `npm install`, targeted Jest suites, and `npm test`.

## 5. E2E and runtime verification

- [x] 5.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific checklist covering inert placement, outbound traversal, resistance result, marker/notice visibility, and cleanup.
- [x] 5.2 Extend `e2e/cases/e2e-039-wall-traversal-trigger/e2e-039-wall-traversal-trigger.spec.ts` with a normal map movement from inside _Wand aus Dornen_ to outside, including resistance result and teardown.
- [x] 5.3 Run `node utils/foundry-lifecycle.mjs PackAndRestart` for `ilaris-e2e-world-v14363-r1`, then execute the focused E2E case and its Zone regressions.
- [x] 5.4 Manually verify placement over a Token is inert and a later normal outbound movement creates one traversal; inspect the visible marker and chat notice in light and dark themes.

## 6. Final validation and handoff

- [x] 6.1 Run `npm run lint` and resolve relevant lint failures.
- [x] 6.2 Run `openspec.cmd validate refine-wall-traversal-initial-occupants --strict` and resolve validation failures.
- [x] 6.3 Review the implementation diff, ensure no unrelated work is staged, and commit the completed change after required tests pass.
