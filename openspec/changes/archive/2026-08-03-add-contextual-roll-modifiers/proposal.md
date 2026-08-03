## Why

Several Vorteile grant bonuses only in a clearly defined roll situation, such
as a social duel, investigation/research, or breaking an object. The effect resolver
already supports a `situation` selector, but skill and supernatural roll
dialogs do not provide a consistent, user-selectable context for it. As a
result, those bonuses cannot yet be represented as ordinary, additive Ilaris
modifiers on Vorteil ActiveEffects.

## What Changes

- Add a centrally defined catalogue of localized, stable roll-situation tags
  and their parent relationships.
- Add a situation dropdown to `FertigkeitDialog`. Its selected situation is
  included in roll-phase Ilaris modifier resolution and immediately reflected
  in the dialog's visible modifier summary.
- Model a specific social-duel action such as waiting as both its specific tag
  and the general social-duel tag, so a general social-duel effect still
  applies.
- Add a player/GM-managed, session-local condition control group to
  `UebernatuerlichDialog`. It selects explicit condition tags for the current
  supernatural roll and feeds them into the same Ilaris modifier lifecycle;
  it does not persist an inferred world state or attempt to validate targets,
  locations, spell modifications, or resources.
- Give variable condition magnitudes such as Kraftlinienmagie an explicit
  choice of supported strength instead of treating a single checkbox as an
  ambiguous numeric bonus.
- Add ordinary, additive semantic Ilaris modifiers to the relevant Vorteil
  compendium sources: Eindrucksvoll I/II, Vorausschauend I/II, Bedächtig,
  Scharfsinnig I/II, and Zerstörerisch I/II. Their bonus effects are limited to
  their stated skills and contextual tags; unrelated text remains manual.
- Keep existing external callers that supply a known situation compatible by
  using it as the dialog's initial context.

This change modifies existing dialog and modifier-resolution behavior; it is
additive for existing actors and does not remove or reinterpret permanent
Vorteil modifiers.

## Capabilities

### New Capabilities

- `contextual-roll-modifiers`: Central roll-condition definitions and dialog
  controls that make situation-selected ordinary Ilaris modifiers applicable.

### Modified Capabilities

- `dice`: FertigkeitDialog gains a selectable contextual roll state and
  resolves its parent-inclusive situation set.
- `combat`: UebernatuerlichDialog resolves player/GM-selected contextual
  Vorteil modifiers as part of its probe calculation and summary.
- `rule-aware-active-effect-modifiers`: Situation selectors gain defined,
  parent-inclusive matching semantics for dialog-provided roll conditions.
- `spell-pre-effect-quick-reference`: The authoring guide documents the new
  contextual Vorteil workflow and its deliberately manual condition choice.

## Impact

- Affected code: `scripts/skills/dialogs/fertigkeit.js`, its Handlebars
  template and tests; `scripts/combat/dialogs/uebernatuerlich.js`,
  `scripts/combat/dialogs/combat-dialog.js`, and its template/tests; the Ilaris
  modifier constants/resolver; and relevant Vorteil `_source/` JSON documents.
- Foundry VTT APIs: the existing AppV2 Handlebars applications use
  [`HandlebarsApplicationMixin`](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)
  and [`ApplicationV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
  render/context lifecycle. The resolver continues to consume transferred
  Vorteil effects through [`Actor.allApplicableEffects()`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).
  No Foundry Hook event is added or changed. The implementation will assess
  documented `foundry.utils.*` helpers before adding any new data-normalization
  utility.
- Compendium data: modified Vorteil `_source/` JSON requires `npm run pack-all`.

## Testing Impact

- New unit coverage: parent-inclusive social-duel context; no-context leakage;
  investigation/research and object-destruction matching; the selected
  supernatural condition reaching the probe resolver; and Kraftlinie strength
  exclusivity.
- Existing unit coverage to update: FertigkeitDialog modifier-summary tests and
  CombatDialog/UebernatuerlichDialog effect-result tests.
- New E2E flows: select a FertigkeitDialog situation and verify the live
  modifier breakdown and final roll; select an owned contextual supernatural
  Vorteil condition and verify the supernatural probe preview and roll.
- E2E environment: one GM client in the existing Ilaris E2E world, with a
  controlled actor that owns the relevant Vorteil and a deterministic roll.
  No player client is required. Reusable dialog-opening and summary assertion
  helpers should be assessed for promotion to `e2e/shared/`.
