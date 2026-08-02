## Why

The world setting already chooses whether supernatural Ilaris modifiers follow
the Ilaris strongest-effect rule or Foundry's additive rule, but recasting the
same spell always creates another ActiveEffect. Foundry mode therefore cannot
provide a true replacement/recast experience, and the reviewed MR effects use
native changes that bypass the Ilaris resolver entirely.

## What Changes

- Modify persistent supernatural Pre-Effect creation to record both its source
  Pre-Effect index and a shared application identity for each cast.
- In default `ilaris` mode, retain each recast as a separate ActiveEffect so
  the strongest-effect resolver can suppress it temporarily and restore it
  when stronger effects expire.
- In `foundry` mode, replace the target actor's complete prior ActiveEffect
  set from the same supernatural spell or liturgy source before creating the
  new cast's effects. A new cast therefore refreshes duration and uses the
  new materialized values, while all components produced by that new cast
  remain together.
- Add an MR semantic prepare modifier and migrate the reviewed MR spell
  effects from native `changes` so they obey the same Ilaris/Foundry stacking
  policy as other supernatural effects.
- Clarify the German world-setting hint and quick-reference documentation so
  the two recast policies are discoverable.

This modifies existing behavior; it is neither purely additive nor a removal
of a user-facing feature.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `supernatural-pre-effects`: Persistent spell effects gain stable source and
  application provenance and mode-dependent same-spell recast behavior.
- `rule-aware-active-effect-modifiers`: MR participates in semantic,
  context-aware strongest-effect resolution during preparation.
- `settings`: Foundry stack mode explicitly replaces all prior ActiveEffects
  from the same supernatural source when a new application is applied.
- `spell-pre-effect-data`: Reviewed MR spell source data uses semantic Ilaris
  modifiers rather than native additive changes.
- `spell-pre-effect-quick-reference`: The GM guide explains same-spell recast
  behavior in both stacking modes.

## Impact

- **Code:** `scripts/effects/pre-effects/pre-effects-processor.js`,
  `scripts/effects/pre-effects/resist-handler.js`,
  `scripts/effects/utils/ilaris-modifier-constants.js`,
  `scripts/actors/data/actor.js`, the modifier/pre-effect tests, the setting
  registration/template, guide source data, and the three reviewed MR source
  Items.
- **Foundry VTT API:**
  [Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects)
  supplies the effects evaluated by the resolver;
  [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments)
  removes a matching embedded ActiveEffect before replacement; and
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  remains the persisted effect document. No new Hook event is introduced;
  existing combat timing hooks remain unchanged. No new `foundry.utils.*`
  helper is expected, but the implementation will verify the community wiki
  before adding any utility.
- **Data:** `_source/` spell data changes require `npm run pack-all`.
- **Compatibility:** Existing effect documents without the new application
  flag stay valid and continue to resolve. A Foundry-mode recast removes prior
  supernatural effects from the same `spellUuid`, including older documents,
  so the target does not retain stale components from an earlier cast.

## Testing Impact

- Add unit tests in
  `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for
  component and application provenance, default-mode additive document
  creation, and Foundry-mode replacement of a complete earlier spell source.
- Extend `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` and
  `scripts/effects/_spec/active-effect-timing.test.js` for semantic MR
  preparation, positive/negative strongest selection, and Foundry-mode
  addition.
- Update
  `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` to assert
  semantic MR source data for Psychostabilis variants and Tanz des
  Ungehorsams.
- Add Foundry E2E cases in the `schwarzpulver` world with a GM and one
  target: recast a semantic spell in Ilaris mode and verify both documents
  remain with only the strongest applied; recast it in Foundry mode and verify
  the complete earlier source effect set is replaced while all components of
  the new cast remain; cast an MR effect twice in each
  mode. No player client is required. Shared recast setup may be promoted to
  `e2e/shared/` if it is reusable.
