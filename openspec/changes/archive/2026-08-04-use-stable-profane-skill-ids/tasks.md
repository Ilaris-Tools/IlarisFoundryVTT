## 1. Stable profane skill references

- [x] 1.1 Verify the Actor embedded Item collection lookup against the Foundry API docs (v14).
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding any utility code.
- [x] 1.3 Change the hero-sheet profane skill roll control in `scripts/actors/templates/held/tabs/fertigkeiten.hbs` to pass `profert.id`.
- [x] 1.4 Update `scripts/dice/wuerfel.js` to resolve a normal profane skill from the passed embedded Item ID and forward that ID to `openSkillDialog`.
- [x] 1.5 Update `scripts/skills/dialogs/fertigkeit.js` so profane PW/PWT lookup uses the actor's embedded Item collection ID lookup, retaining fallback behavior for a missing skill.

## 2. Resistance-dialog compatibility

- [x] 2.1 Update `scripts/effects/pre-effects/resist-handler.js` to pass the matched target profane skill's ID to `FertigkeitDialog` while preserving name-based configuration lookup and optional talent validation.
- [x] 2.2 Verify the `Ilaris.preSkillDialog`, `Ilaris.preSkillRoll`, and `Ilaris.postSkillRoll` paths retain their existing payload and resolution behavior.

## 3. Unit Tests

- [x] 3.1 Update `scripts/skills/_spec_/skills-api.spec.js` for profane skill Item ID lookup, including PW and PWT cases.
- [x] 3.2 Update `scripts/effects/pre-effects/_spec_/resist-handler.spec.js` to assert the matched skill ID is forwarded and optional talent fallback remains intact.

## 4. E2E Tests

- [x] 4.1 Update `e2e/cases/e2e-006-fertigkeit-wuerfeldialog-profan/e2e-006-fertigkeit-wuerfeldialog-profan.spec.ts` to exercise the hero-sheet Item-ID reference.
- [x] 4.2 Update `e2e/cases/e2e-026-pre-effect-resist-flow/e2e-026-pre-effect-resist-flow.spec.ts` to verify skill-based resistance still uses correct PW/PWT and talent selection.

## 5. Validation

- [x] 5.1 Run `npm install`.
- [x] 5.2 Run the affected Jest tests and E2E cases.
- [x] 5.3 Run `npm test`.
- [x] 5.4 Run `npm run lint`.

## 6. E2E baseline recovery

- [x] 6.1 Restore only declared `E2E_BASELINE.settingDefaults` in shared startup before validating the baseline.
- [x] 6.2 Add focused coverage for baseline-setting recovery and retain failure coverage for non-setting baseline dependencies.
- [x] 6.3 Rerun E2E-006 and E2E-026 against the recovered baseline.
