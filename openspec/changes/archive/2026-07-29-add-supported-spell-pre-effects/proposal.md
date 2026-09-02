## Why

The pre-effect processor is now capable of applying immediate damage, timed numeric modifiers, and one-off profane resistance checks, but only a small set of compatible spells currently carries structured data. Adding the reviewed, representable effects makes that capability useful in ordinary play while keeping mechanics that require richer state or trigger handling explicitly deferred.

## What Changes

- Add reviewed `system.preEffects` data to the supported spell entries: **Axxeleratus Blitzgeschwind (Tiergeist)**, **Fulminictus Donnerkeil**, **Plumbumbarum schwerer Arm**, **Tlalucs Odem Pestgestank**, **Hexengalle**, and **Fluch des Gewürms**.
- Add intentionally damage-only pre-effects for **Pandämonium**, **Seelenfeuer**, and **Wand aus Flammen**. Their recurring, contact/crossing, and zone-trigger behavior remains manual.
- Use the existing spell-named ActiveEffect as a table-visible marker for `handlungsunfähig`; do not introduce a new marker schema or automatic rule enforcement.
- Update the spell/liturgy inventory by removing the deferred candidates from its active candidate lists and linking their reasons to the deferred-mechanics note. This does not delete or modify any deferred compendium `_source` Item.
- Keep moving zones, delayed triggers, per-Initiativephase repetition, distance calculations, target filters, resource drains, next-roll-only behavior, and target Magieresistenz checks out of scope.

## Capabilities

### New Capabilities

- `supported-spell-pre-effects`: Defines the reviewed compendium pre-effects, their intentionally partial approximations, and their deferred boundaries.

### Modified Capabilities

- `supernatural-pre-effects`: Documents the permitted spell-named marker convention and the supported resistance-outcome encoding without adding a new runtime marker API.
- `pre-effect-e2e-tests`: Adds regression evidence for the newly represented immediate-damage, timed-modifier, and resistance-outcome data.

## Impact

- Compendium source JSON under `comp_packs/zauberspruche-und-rituale/_source/`; the packed LevelDB output is regenerated with `npm run pack-all`.
- Developer documentation: `docs/develop/spell-liturgy-effect-inventory.md` and `docs/develop/pre-effect-deferred-mechanics.md`; deferred source Items remain untouched.
- Runtime behavior is exercised through Foundry's [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) documents and embedded [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) documents. No Foundry API class, Hook event, or `foundry.utils.*` helper is modified by this data-focused change; the existing `Ilaris.postAngriff` and `Ilaris.postSkillRoll` flows are regression-verified.

## Testing Impact

- Unit: add data-focused coverage for each new source configuration and its expected damage/modifier/resistance branch; extend the existing pre-effect processor and resist-handler specs only if a helper needs adjustment.
- E2E: extend the existing pre-effect E2E coverage to exercise a reviewed direct-damage entry, a timed modifier/marker entry, and the resistance success/failure outcome convention. Use the existing baseline world, GM client, and current single-worker Playwright setup; no additional players or shared helper extraction are expected.
- Regression: run the existing E2E-026 resist flow and E2E-027 pre-effect sheet configuration cases, plus the full unit suite and pack build.
