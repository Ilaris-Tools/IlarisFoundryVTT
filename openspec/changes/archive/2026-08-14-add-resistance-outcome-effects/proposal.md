## Why

The current resistance flow can either suppress a Pre-Effect entirely or apply
its diminished numeric values. It cannot represent a failed resistance that
creates a timed, visible state marker while a successful resistance instead
creates a different timed modifier. This leaves reviewed spells such as
_Fluch des Gewürms_ and _Krabbelnder Schrecken_ only partially automated and
uses a numeric placeholder for _Hexengalle_.

The effect created for either outcome must remain unambiguously traceable to
the originating spell, caster, Pre-Effect component, and cast application.
A marker's readable label supplements that provenance; it does not replace it.

## What Changes

- Add explicit, optional Pre-Effect payloads for successful and failed
  resistance outcomes. A payload can create native changes, Ilaris modifiers,
  a configured condition, or a marker-only ActiveEffect.
- Add marker metadata with a stable Ilaris marker identifier and a German
  display label. A marker-only payload creates a normal timed ActiveEffect
  even when it has no numeric changes; it does not claim to enforce all
  tabletop rules associated with that marker.
- Preserve the existing `diminishedOnly` data and behavior for legacy source
  data. Explicit outcome payloads are additive authoring, not a breaking
  schema replacement.
- Preserve complete spell provenance on every outcome-created ActiveEffect:
  Foundry `origin` plus `flags.ilaris.spellName`, `spellUuid`, `casterUuid`,
  `preEffectIndex`, and the shared cast `applicationId`. Snapshot the exact
  supernatural `castSkill` used for that cast, and record the resolved outcome
  and marker identity as additional Ilaris flags. The generic
  `sourceItemUuid` SHALL duplicate `spellUuid` for supernatural sources so
  later anti-magic can query a uniform source key.
- Resolve a concrete cast skill before rolling. A configured skill remains
  fixed; an automatic spell uses its unique best eligible skill; and an
  automatic tie presents a compact pre-roll skill selector so the resulting
  effect never claims an inferred or candidate-only casting school.
- Extend the shared Pre-Effect editor with a resistance-outcomes section. It
  keeps ordinary Pre-Effect fields first, then resistance configuration, then
  clearly labelled optional failure/success outcome panels; shared sheet code
  supplies behavior while each concrete item sheet retains layout ownership.
- Migrate the reviewed source data for _Fluch des Gewürms_, _Krabbelnder
  Schrecken_, and _Hexengalle_ to use the supported outcome/marker model and
  update the pre-effect inventory and deferred-mechanics documentation.

This is additive for existing Pre-Effects and ActiveEffects. It changes the
reviewed spell automation from partial/placeholder representations to explicit
resistance outcomes.

## Capabilities

### New Capabilities

- `resistance-outcome-effects`: Materialize distinct, provenance-preserving
  persistent results for successful and failed Pre-Effect resistance checks.

### Modified Capabilities

- `supernatural-pre-effects`: Extend Pre-Effect authoring, resistance
  resolution, and effect-origin tracking with optional outcome payloads and
  marker metadata.
- `spell-pre-effect-data`: Represent the reviewed curse and poison spells
  with explicit outcome-specific Pre-Effect source data.

## Impact

- **Affected code:** `scripts/effects/pre-effects/resist-handler.js`,
  `pre-effects-processor.js`, Pre-Effect data-model fields in
  `scripts/core/model-data/`, shared Pre-Effect sheet context/listeners in
  `scripts/items/sheets/pre-effect-item.js`, the supernatural casting-dialog
  context/roll flow, and
  `scripts/items/templates/pre-effects.hbs`.
- **Affected content:** spell `_source/` JSON in
  `comp_packs/zauberspruche-und-rituale/_source/`, plus
  `docs/develop/spell-liturgy-effect-inventory.md` and
  `docs/develop/pre-effect-deferred-mechanics.md`. Packing requires
  `npm run pack-all`.
- **Foundry VTT v14 API:**
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  for normal timed embedded effects and their `origin`; and
  [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  for embedded-effect creation/replacement. The existing
  [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
  resistance prompt flow and the existing post-roll
  [Hooks](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html)
  listener remain the resolution boundary. The implementation must confirm
  the exact v14 API signatures before use.
- **Foundry utilities:** use documented
  [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html)
  to isolate a selected outcome payload before materialization and retain the
  existing `foundry.utils.randomID` cast/event identity behavior. Verify the
  relevant helpers against the Foundry community wiki before implementation.

## Testing Impact

- **New/updated unit tests:** cover legacy `diminishedOnly` compatibility;
  full failure and success payload selection; marker-only materialization;
  marker-plus-modifier materialization; exact origin/flag/cast-skill
  provenance; automatic-skill resolution and tie selection; and
  same-spell recast behavior for each outcome. Extend the existing
  `resist-handler` and `pre-effects-processor` specs and add focused sheet
  context/listener tests for the optional outcome panels.
- **New E2E case:** cast a spell configured with _Fluch des Gewürms_' reviewed
  outcome payload against a target, resolve both resistance branches, and
  verify that the target's effect row visibly names the resolved marker or
  modifier while retaining the spell/source trace. Source-data tests validate
  _Fluch des Gewürms_ itself; focused unit coverage verifies normal timed
  effect expiry. Add a focused _Hexengalle_ marker assertion if it can share
  the fixture without obscuring the two outcome branches.
- **E2E environment:** use `ilaris-e2e-world-v14363-r1`, one active GM,
  `e2e-player` owning the target, a combat Scene with caster and target
  Tokens, and the normal spell-casting/resistance chat route. Reuse existing
  resistance and effect-row helpers; promote a helper into `e2e/shared/` only
  if the two outcome branches need reusable chat/effect inspection.
- **Visual/runtime acceptance:** inspect the supernatural item editor in the
  normal Foundry theme and dark mode. Verify that the Pre-Effect's ordinary
  fields remain first, its resistance controls follow, and hidden optional
  outcome panels do not displace unrelated sheet content. Capture screenshot
  evidence through the runtime-verification checklist.
