## 1. API and implementation preparation

- [x] 1.1 Verify `RegionDocument`, `Scene#createEmbeddedDocuments`, `Combat`, `combatRound`, `Actor`, `ActiveEffect`, and `ChatMessage` behavior against Foundry API docs (v14).
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` and document/whisper helpers before adding any utility.
- [x] 1.3 Trace the existing Zone profile, structured-form, Pre-Effect, condition-source, marker, and wall traversal flows; preserve their ownership and cleanup boundaries.

## 2. Caster-attribute Zone duration

- [x] 2.1 Extend Zone-profile normalization and form merging with optional `duration.source` and `duration.attribute`, preserving legacy fixed `sceneRounds` data.
- [x] 2.2 Resolve a valid caster-attribute duration once on successful persistent Zone creation and persist only numeric `remaining` and `originalValue` in the Region flag.
- [x] 2.3 Reject a missing, invalid, zero, or non-finite sourced duration with a localized error before Region creation.
- [x] 2.4 Verify the new Region creation/update flow against Foundry API docs (v14).
- [x] 2.5 Check foundryvtt.wiki for relevant `foundry.utils.*` cloning or property helpers used by the duration resolver.

## 3. Table-managed displacement outcome

- [x] 3.1 Add the normalized `tableManagedDisplacement` failure-outcome field, requiring an enabled stable marker while retaining the canonical-condition result path.
- [x] 3.2 Materialize the normal condition and marker first, then whisper one German GM/owner instruction that the Token is repositioned manually according to `Zurückstoßen`.
- [x] 3.3 Preserve source Item, selected form, caster, application, cast-skill, resistance outcome, and target-Token provenance on the marker and condition source.
- [x] 3.4 Ensure the outcome never updates, teleports, pathfinds, blocks, or reverts a Token and remains independent of wall-traversal marker ownership.
- [x] 3.5 Verify Actor/ActiveEffect/ChatMessage persistence and whisper use against Foundry API docs (v14).
- [x] 3.6 Check foundryvtt.wiki for relevant `foundry.utils.*` serialization helpers before cloning outcome data.

## 4. Authoring UI and Aeolitus compendium data

- [x] 4.1 Extend `uebernatuerlich_talent.hbs` Zone authoring in the designed order: geometry, placement, lifecycle, duration source/value, triggers, then removal; mirror this order in each structured form before Form-Pre-Effects.
- [x] 4.2 Add the failure-result `Zurückstoßen (Spielleitung)` control and hint after marker controls, visible only for enabled failure results; preserve the shared Pre-Effect base versus concrete-sheet ownership split and theme compatibility.
- [x] 4.3 Author base _Aeolitus Windgebraus_ as an instant 16-Schritt 45-degree caster cone with fixed KK 16 resistance and canonical `Position4` failure condition.
- [x] 4.4 Author _Langer Atem_ as inherited persistent KO-duration Zone data with creation, entry, and round-start triggers; author _Sturm_ as a replacement combined condition/marker/displacement outcome; author _Winde der anderen Art_ as inherited `-4` narrative data.
- [x] 4.5 Update the spell/liturgy effect inventory and Zone/Pre-Effect authoring quick reference with Aeolitus behavior, KO snapshot semantics, manual concentration dismissal, and table-managed `Zurückstoßen` convention.
- [x] 4.6 Run `npm run pack-all`.

## 5. Unit Tests

- [x] 5.1 Update `scripts/combat/zones/_spec/zone-profile.spec.js` for source normalization, form merging, invalid values, and fixed-duration compatibility.
- [x] 5.2 Update `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for KO snapshot persistence, creation/entry/round-start order, final-round behavior, and no Region for invalid KO.
- [x] 5.3 Update `scripts/effects/pre-effects/_spec/resist-handler.spec.js` and `pre-effects-processor.spec.js` for combined condition/marker failure results, provenance, recipient whispering, and no Token mutation.
- [x] 5.4 Update `scripts/items/data/_spec/spell-modifications.spec.js` and `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` for full Zone override resolution and authoring UI context/order.
- [x] 5.5 Update `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for base Aeolitus and all three structured forms.
- [x] 5.6 Run `npm install`, targeted Jest suites, then `npm test`.

## 6. Runtime and E2E verification

- [x] 6.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific runtime checklist from these specs and the UI acceptance contract.
- [x] 6.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart` for `ilaris-e2e-world-v14363-r1` before runtime/E2E verification.
- [ ] 6.3 Manually verify the authoring sheet’s base and form Zone controls, form selection, draft cone placement, base failure condition, and source metadata; capture light/dark-theme screenshots where relevant.
- [ ] 6.4 Manually verify _Langer Atem_: KO snapshot in Zone administration, initial occupant, entry, round-start dispatch, final-round expiry, and manual Zone dismissal for broken concentration.
- [ ] 6.5 Manually verify _Sturm_: failed resistance creates canonical `Position4`, the visible `Zurückgestoßen` marker, and one GM/owner instruction without moving the Token.
- [x] 6.6 Add or update focused Playwright E2E cases for the reviewed user flows and regression-check Zone placement, Zone turn/round triggers, wall traversal, and Zone administration.
- [x] 6.7 Use lifecycle cleanup in success and failure paths to remove every temporary Region, Token, and draft created by the E2E tests.

## 7. Final validation and handoff

- [x] 7.1 Run `npm run lint` and resolve relevant lint failures.
- [x] 7.2 Run `openspec.cmd validate add-aeolitus-zone-effect --strict` and resolve validation failures.
- [x] 7.3 Review the implementation diff, ensure no unrelated work is staged, and commit the completed change after required tests pass.
