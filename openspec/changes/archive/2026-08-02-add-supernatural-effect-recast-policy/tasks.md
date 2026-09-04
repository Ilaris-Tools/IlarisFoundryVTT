## 1. Foundation and API verification

- [x] 1.1 Verify `Actor#deleteEmbeddedDocuments`, `Actor#allApplicableEffects`, and ActiveEffect embedded-document behavior against the Foundry VTT v14 API documentation.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before introducing any provenance or collection utility.
- [x] 1.3 Run `npm install` before build or test commands.

## 2. Same-spell Pre-Effect recast policy

- [x] 2.1 Enumerate Pre-Effects in `applyPreEffects()` and propagate `preEffectIndex` plus a shared `applicationId` through direct creation, resist-prompt serialization, and delayed resistance resolution.
- [x] 2.2 Persist `flags.ilaris.preEffectIndex` and `applicationId` on every non-instant ActiveEffect created from a Pre-Effect.
- [x] 2.3 Add a shared, setting-aware replacement branch in `createActiveEffectFromPreEffect()` that, in Foundry mode, awaits `targetActor.deleteEmbeddedDocuments('ActiveEffect', ids)` for all prior supernatural ActiveEffects with the same spell UUID before creation.
- [x] 2.4 Preserve Ilaris-mode additive document creation and retain all components from the same new `applicationId` in Foundry mode.

## 3. Semantic MR lifecycle and source data

- [x] 3.1 Add the canonical semantic `mr` target and German label to the Ilaris modifier constants and authoring option contexts.
- [x] 3.2 Extend the Actor prepare lifecycle to resolve semantic prepare-phase MR and apply it transiently to `system.abgeleitete.mr` alongside GS.
- [x] 3.3 Migrate the Psychostabilis variants and Tanz des Ungehorsams `_source/` Pre-Effects from native MR changes to prepare-phase `mr` modifiers using `strongest-supernatural` stacking.
- [x] 3.4 Run `npm run pack-all`.

## 4. Setting and guide wording

- [x] 4.1 Update the German `supernaturalEffectStacking` setting hint and settings dialog copy to distinguish retained Ilaris recasts from Foundry-mode whole-source replacement.
- [x] 4.2 Update the structured HTML source for `Übersicht: Zauber, Liturgien & Pre-Effects` with the same-spell recast policy and semantic MR representation.

## 5. Unit Tests

- [x] 5.1 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for provenance, direct and resistance flows, default-mode retention, Foundry-mode whole-source delete-then-create ordering, preservation of components from one new application, and legacy-effect replacement.
- [x] 5.2 Extend `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` for MR strongest-positive/negative selection and Foundry-mode addition.
- [x] 5.3 Extend the actor preparation test coverage for transient semantic MR application and update `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for the migrated MR source data.
- [x] 5.4 Run `npm test`.

## 6. E2E Tests

- [x] 6.1 In the `schwarzpulver` world as GM with one target, recast a semantic spell source in Ilaris mode and verify both applications remain visible while only the strongest overlapping modifier applies.
- [x] 6.2 In the same world, select Foundry mode, recast that source, and verify it replaces all earlier components while retaining every component from the new application.
- [x] 6.3 Recast Psychostabilis or Tanz des Ungehorsams in both modes and verify MR follows the selected policy.
- [x] 6.4 Promote reusable cast/recast setup to `e2e/shared/` when the E2E implementation benefits from it; otherwise document why it remains scenario-local.

## 7. Final validation

- [x] 7.1 Run `npm run lint`.
- [x] 7.2 Run `npm test` after packing and record the E2E environment/results or any unavailable live-Foundry validation.
- [x] 7.3 With Foundry closed so LevelDB is unlocked, run `npm run pack-all` to publish the updated Pre-Effects quick-reference journal.
