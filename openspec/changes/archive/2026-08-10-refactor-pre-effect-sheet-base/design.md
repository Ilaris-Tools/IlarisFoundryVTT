## Context

The Pre-Effect editor was originally added to `UebernatuerlichTalentSheet`.
`ManoeverSheet` later extended that sheet in order to reuse the editor, its
context, and its delegated handlers. As a consequence it inherits unrelated
supernatural fields and the spell-oriented LLM generation path, although both
concrete sheets already share the same `IlarisItemSheet` / ItemSheetV2
foundation and the same `system.preEffects` authoring structure.

The intended long-term model is that another compatible Item sheet should need
only its own form plus the shared base. It should not need to copy the
Pre-Effect lifecycle or inherit spell semantics.

## Goals / Non-Goals

**Goals:**

- Establish a reusable `PreEffectItemSheet` subclass of `IlarisItemSheet`.
- Preserve the current standard Pre-Effect data shape, editor controls, and
  behavior for both existing consumers.
- Keep source-specific form context and LLM generation out of the shared
  base.
- Make the inheritance relation accurately describe the domain.

**Non-Goals:**

- Redesign the Pre-Effect schema, processor, ActiveEffect lifecycle, or
  compendium data.
- Introduce a generic mixin for non-Item sheets.
- Create per-feature capability flags for every common Pre-Effect control; a
  compatible future Item sheet is expected to reuse the standard structure.
- Remove currently standard shared fields such as changes, Ilaris modifiers,
  conditions, summon items, armed combat, or resistance authoring.

## Decisions

### Use an intermediate Item-sheet class, not a mixin

Add `PreEffectItemSheet extends IlarisItemSheet`. Both
`UebernatuerlichTalentSheet` and `ManoeverSheet` will extend it directly:

```text
IlarisItemSheet
  └─ PreEffectItemSheet
       ├─ UebernatuerlichTalentSheet
       └─ ManoeverSheet
```

The new base owns the `preEffects` Handlebars part, standard context (damage
types, resistance selects, status effects, Ilaris modifier labels, summon
source options), default factories, delegated add/remove handlers, and the
change-key datalist. Each concrete sheet owns its `form` part. The maneuver
sheet additionally supplies its activation marker; the supernatural sheet
supplies its owned-item selection and LLM availability.

Alternative considered: `PreEffectSheetMixin`. Rejected because all known
consumers are Item sheets with the same `IlarisItemSheet` base. A class makes
static `PARTS`, lifecycle ordering, and test construction explicit without a
class-factory composition layer. A mixin can be considered only if a future
non-Item application needs this lifecycle.

### Keep one standard Pre-Effect editor surface

The common template remains the standard authoring structure. It will receive
simple context markers only where existing behavior genuinely differs, such as
`isManeuverPreEffect` for activation/operation fields and
`hasLLMPreEffectGeneration` for the spell-specific generation button. The
base does not impose a growing matrix of feature flags on each compatible
future sheet.

Alternative considered: extensive per-sheet capability flags. Rejected because
the user expectation is that items adopting the same structure require no
substantial Pre-Effect customization; flags would reintroduce that burden.

### Keep LLM generation attached to supernatural authoring

The LLM prompt reads supernatural spell metadata and describes spell effects.
Its button, API-config context, and request handler remain in
`UebernatuerlichTalentSheet`; the base has no generation handler. The shared
template renders the button only when that child explicitly exposes the
availability context.

Alternative considered: leave the handler in the base and hide its button for
maneuvers. Rejected because hidden spell-specific behavior would still be
inherited by every future Pre-Effect Item sheet.

### Preserve Foundry AppV2 lifecycle contracts

The shared base calls `super._prepareContext(options)` before enriching its
context and calls `super._onRender(context, options)` before attaching
listeners. Children do the same around the shared implementation. Concrete
static `PARTS` explicitly spread `PreEffectItemSheet.PARTS` and replace only
their `form` template, preserving Foundry's named-part render model.

## API Surface

- [ItemSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html):
  the existing Item-sheet inheritance continues to use its documented
  `_prepareContext` and `_onRender` application lifecycle methods.
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html):
  remains supplied by `IlarisItemSheet` to render the base's named
  Handlebars part; it is not applied again by the new class.
- Hooks: none are registered, listened to, or changed by this refactor.
- Utilities: `foundry.utils.deepClone` remains the shared copy operation for
  mutable form arrays before removal/update. The implementation will check the
  community API guide for a documented equivalent only if v14 guidance shows a
  need to change it.

## Risks / Trade-offs

- [Static `PARTS` or `DEFAULT_OPTIONS` composition drops a child part or
  action] → explicitly compose the shared static values and add unit tests for
  both concrete sheets' form and Pre-Effect part.
- [Moving a private method changes access or lifecycle order] → move generic
  behavior as ordinary protected-by-convention methods in the base and retain
  the LLM private handler in the supernatural subclass.
- [The generic context triggers unnecessary configured-pack reads] → retain
  existing behavior initially; this is a correctness refactor, not a
  performance rewrite.
- [A future non-Item consumer appears] → extract a mixin only then, based on
  a real differing application base rather than speculative abstraction.

## Migration Plan

1. Add the shared base and move unchanged generic editor logic into it.
2. Make the two current sheets siblings and restore their source-specific
   context/form behavior.
3. Verify the shared editor, maneuver authoring, and supernatural-only LLM
   visibility through tests.
4. Rollback consists of restoring the direct maneuver-to-supernatural
   inheritance; no persisted documents, compendia, or migrations are involved.

## Open Questions

None. Future sheets using the standard `system.preEffects` shape will extend
the new base; a non-Item consumer would be evaluated separately.

## Testing Strategy

- Use the existing Jest approach (`Object.create(Sheet.prototype)` and mocked
  AppV2 base) for the new shared base's defaults, context, and event handlers.
- Keep separate tests for `ManoeverSheet` and `UebernatuerlichTalentSheet`
  static parts/context so inheritance errors are caught without a Foundry
  instance.
- Extend the LLM template/context tests to prove a configured GM sees the
  button on a supernatural sheet only.
- Regression-run the existing Pre-Effect sheet and maneuver Pre-Effect E2E
  cases in `ilaris-e2e-world-v14363-r1` as `e2e-gm`; these validate the same
  authoring flow without a new player or helper requirement.
