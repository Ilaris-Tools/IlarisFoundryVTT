## 1. Data and API preparation

- [x] 1.1 Verify against Foundry API docs (v14) the existing `Item`, `Scene`, `RegionDocument`, and `ActiveEffect` document behavior used by the already-implemented Zone lifecycle; do not introduce a new Hook or document operation.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and confirm that no helper is needed for the source-data-only implementation.
- [x] 1.3 Trace the current `antiMagic` preset resolution, the `spellModificationPreset` model field, and existing passive-Zone modifier ownership so their removal preserves structured-form selection and _Dämonenbann_ cleanup semantics.

## 2. Remove the in-memory anti-magic preset

- [x] 2.1 Remove the `antiMagic` preset constants and preset-specific branches from `scripts/items/data/spell-modifications.js` so all resolution uses ordinary structured form data.
- [x] 2.2 Remove `spellModificationPreset` from the supernatural Item data model and remove the preset-only structured-form detection branch in `scripts/items/data/combat-item.js`.
- [x] 2.3 Replace the preset unit test in `scripts/items/data/_spec/spell-modifications.spec.js` with an equivalent explicit required-group and `replace`-mode test.

## 3. Anti-magic source data

- [x] 3.1 Replace `spellModificationPreset` in all ten current anti-magic `_source` files with one required `antiMagicForm` group and explicit data for the four existing anti-magic forms.
- [x] 3.2 Preserve every non-_Dämonenbann_ form's existing profile and table-managed/manual description, while making structured data independently editable per source.
- [x] 3.3 Author _Dämonenbann: Magie unterdrücken_ as a free, persistent passive circle with 16-step radius, 8-step placement range, 960 scene rounds, create/entry triggers, and `targeting.includeCaster: true`.
- [x] 3.4 Author its Zone-owned infinite Pre-Effect with a roll-phase `probe` modifier scoped to `selector.fertigkeit: "Dämonisch"`, base value `-8`, and a Mächtige-Magie `-4` increment; retain its other three forms as table-managed/manual.
- [x] 3.5 Run `npm run pack-all`.

## 4. Unit Tests

- [x] 4.1 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for all ten explicit anti-magic form groups, the absence of preset-only source data, and the _Dämonenbann: Magie unterdrücken_ profile/Zone/Pre-Effect, `Dämonisch` selector, base penalty, and Mächtige-Magie increment.
- [x] 4.2 Run the focused supported-spell-data, structured spell-modification, modifier-resolver, and Zone-profile Jest suites; run `npm install` and `npm test`.

## 5. E2E Tests and runtime verification

- [x] 5.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific checklist for source refresh, form selection, placement, contained/non-contained rolls, caster inclusion, Mächtige-Magie scaling, and Region cleanup.
- [x] 5.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000` after the source update.
- [x] 5.3 Add or extend a focused E2E case with an active GM, caster, and owned non-caster target Token that verifies the _Magie unterdrücken_ Region, `-8` contained `Dämonisch` penalty, non-matching-skill exclusion, caster inclusion, `-12` after one Mächtige-Magie stage, and leave/dismissal cleanup.
- [x] 5.4 Regression-check structured anti-magic form selection, Zone placement, and passive-Zone ownership; inspect the existing dialog, map Region, and modifier breakdown in the supported current UI theme.

## 6. Final validation and handoff

- [x] 6.1 Run `npm run lint` and resolve relevant failures.
- [x] 6.2 Run `openspec validate add-daemonban-pre-effect --strict` and resolve validation failures.
- [x] 6.3 Review the diff, ensure only this change's files are staged, and commit the completed implementation after unit tests and runtime verification pass.
