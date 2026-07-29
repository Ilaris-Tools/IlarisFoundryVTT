## 1. Verify integration boundaries

- [x] 1.1 Verify the existing Item and embedded ActiveEffect flow against the Foundry API docs (v14), including the documented Item and ActiveEffect APIs used by the processor.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before manipulating or validating structured pre-effect data.
- [x] 1.3 Confirm that the current non-numeric Magieresistenz confirmation flow remains manual and that no new Hook event or runtime marker API is required.

## 2. Add reviewed compendium pre-effects

- [x] 2.1 Add exact source-data pre-effects for Axxeleratus Blitzgeschwind (Tiergeist), Fulminictus Donnerkeil, and Plumbumbarum schwerer Arm, including duration, modifiers, damage type, and Mächtige Magie values.
- [x] 2.2 Add Tlalucs Odem Pestgestank as separate unconditional direct-damage and Zähigkeit-guarded modifier pre-effects.
- [x] 2.3 Add Hexengalle's immediate damage and timed spell-named zero-modifier marker after failed Zähigkeit resistance.
- [x] 2.4 Add Fluch des Gewürms' Willenskraft branches using the existing diminished-only convention: failed resistance creates the spell-named zero-modifier marker; successful resistance applies the timed global -4 modifier.
- [x] 2.5 Add intentionally one-time direct-damage-only pre-effects for Pandämonium, Seelenfeuer, and Wand aus Flammen, without encoding their deferred triggers or repetition.
- [x] 2.6 Run `npm run pack-all` after modifying compendium `_source` data.

## 3. Document supported and deferred boundaries

- [x] 3.1 Remove the deferred candidates from `docs/develop/spell-liturgy-effect-inventory.md` and link their rationale to `docs/develop/pre-effect-deferred-mechanics.md`, without deleting or changing any deferred `_source` JSON.
- [x] 3.2 Record the intentional damage-only limitation for Pandämonium, Seelenfeuer, and Wand aus Flammen in the inventory.
- [x] 3.3 Confirm the deferred-mechanics note still describes marker and outcome-payload architecture as future work, not a requirement of this change.

## 4. Unit Tests

- [x] 4.1 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` to assert a zero-value marker change creates a timed spell-named ActiveEffect without changing the global modifier.
- [x] 4.2 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` or its public-flow coverage to assert the reviewed failure-marker and success-diminished branches resolve correctly.
- [x] 4.3 Add focused source-data coverage for each supported spell's `preEffects` shape, including TRUE_DAMAGE, duration, Mächtige Magie, and resistance configuration.
- [x] 4.4 Run the targeted Jest suites.

## 5. E2E Tests

- [x] 5.1 Extend `e2e/cases/e2e-026-pre-effect-resist-flow/e2e-026-pre-effect-resist-flow.spec.ts` for a reviewed marker failure and its alternate successful-resistance modifier branch.
- [x] 5.2 Extend or add a pre-effect E2E case for one reviewed direct-damage spell and one documented damage-only approximation, asserting exactly one application.
- [x] 5.3 Run the affected Playwright cases with the existing baseline world, GM client, and single-worker setup; document the world data required by the new entries.

## 6. Validation

- [x] 6.1 Run `npm install`.
- [x] 6.2 Run `npm test`.
- [x] 6.3 Run `npm run lint` after confirming automatic fixes are scoped; otherwise run scoped non-mutating ESLint on changed JavaScript files and report why repository-wide `--fix` was not safe.
- [x] 6.4 Verify generated compendium output, documentation, and source JSON with `git diff --check`.
