## 1. Condition model and resolver integration

- [x] 1.1 Verify the AppV2 dialog lifecycle and transferred-effect behavior against Foundry API docs (v14), including `HandlebarsApplicationMixin`, `ApplicationV2`, and `Actor.allApplicableEffects()`.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding the roll-condition catalogue and expansion utility.
- [x] 1.3 Add the central localized roll-condition catalogue, including parent expansion for `sozialesDuellAbwartend` and exclusive Kraftlinie +2/+3/+4 tiers.
- [x] 1.4 Add a focused helper that derives relevant supernatural condition controls from active transferred Vorteil effects without modifying resolver matching semantics.

## 2. Skill-dialog contextual selection

- [x] 2.1 Extend `scripts/skills/dialogs/fertigkeit.js` to initialize, update, and expand the selected primary situation, preserving an opener-supplied initial situation.
- [x] 2.2 Add the localized situation dropdown to `scripts/skills/templates/dialogs/fertigkeit.hbs` and connect it to the live modifier summary.
- [x] 2.3 Ensure FertigkeitDialog passes the expanded condition tags to every roll-phase Probe, Talent, and tested-attribute modifier resolution.

## 3. Supernatural contextual selection

- [x] 3.1 Verify the existing UebernatuerlichDialog and CombatDialog summary/form lifecycle against Foundry API docs (v14) before changing the probe calculation.
- [x] 3.2 Add the session-local **Situative Vorteile und Traditionen** controls to `scripts/combat/templates/dialogs/uebernatuerlich.hbs`, with checkboxes for boolean conditions and an exclusive strength control where applicable.
- [x] 3.3 Extend `scripts/combat/dialogs/uebernatuerlich.js` and the shared CombatDialog modifier context to resolve selected condition tags for the supernatural `Probe` and show the applied contributions in the normal summary and final roll.
- [x] 3.4 Confirm that selected conditions are held only in dialog state and are not persisted to an Actor, Item, world setting, or ActiveEffect.

## 4. Vorteil effect authoring and documentation

- [x] 4.1 Add transferred, ordinary additive `Probe` Ilaris modifiers to Eindrucksvoll I/II, Vorausschauend I/II, Bedächtig, Scharfsinnig I/II, and Zerstörerisch I/II in `comp_packs/vorteile/_source/`.
- [x] 4.2 Review Kraftlinienmagie and related tradition advantages against their source text; encode only fixed probe bonuses whose matching supernatural Fertigkeiten can be represented by available selectors, and leave unresolved relationships documented as manual.
- [x] 4.3 Update the structured `_source/` quick-reference journal and `Übersicht: Item-Konfigurationen` to explain supported contextual Vorteil modifiers, player/GM condition choice, Kraftlinie strength, and remaining manual mechanics.
- [x] 4.4 Run `npm run pack-all`.

## 5. Unit Tests

- [x] 5.1 Update or add `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` coverage for parent-inclusive social-duel tags, no-context leakage, and mutually exclusive Kraftlinie strengths.
- [x] 5.2 Update `scripts/skills/_spec/skills-api.spec.js` for dropdown initialization, situation changes, live summary contributions, and `Bedächtig` plus general social-duel stacking.
- [x] 5.3 Update `scripts/combat/_spec/uebernatuerlich_summary.spec.js` and `scripts/combat/_spec/uebernatuerlich_roll.spec.js` for selected contextual Vorteil contributions and non-persistence.
- [x] 5.4 Add compendium-source assertions for the migrated Vorteil effects and their ordinary additive source classification.

## 6. E2E Tests

- [x] 6.1 Add an E2E case based on `e2e-006-fertigkeit-wuerfeldialog-profan` that opens a skill dialog, selects a situation, and verifies the visible applied effect modifier and final deterministic roll.
- [x] 6.2 Add an E2E case based on `e2e-009-uebernatuerlich-dialog` that equips a contextual Vorteil, selects the relevant supernatural condition, and verifies the preview and final deterministic roll.
- [x] 6.3 Assess reusable dialog-opening and modifier-summary assertions for promotion to `e2e/shared/`; require only one GM client and the standard E2E world baseline.

## 7. Validation

- [x] 7.1 Run `npm install`.
- [x] 7.2 Run the targeted Jest suites for effects, skills, combat, and compendium source data.
- [x] 7.3 Run `npm test`.
- [x] 7.4 Run `npm run lint`.
- [x] 7.5 Run the new E2E cases in the standard Foundry E2E world and record results.

## 8. Follow-up refinement

- [x] 8.1 Consolidate the separate Ermittlung and Recherche situations into one `ermittlungRecherche` condition, then update Scharfsinnig authoring, documentation, and coverage.
- [x] 8.2 Rebuild compendium packs and rerun the affected E2E case after Foundry releases the LevelDB pack files.
