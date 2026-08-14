## Why

The completed Zone, resistance-outcome, and condition lifecycles can now cover
the standard form of _Aeolitus Windgebraus_ and its reviewed spell
modifications. This makes a useful real spell consumer of the Zone engine
without pretending to automate forced Token movement or concentration.

## What Changes

- Add structured Zone and Pre-Effect data for the base _Aeolitus Windgebraus_:
  an instant caster-anchored 45-degree cone that requires each affected target
  to resist with KK 16 or receive canonical `Position4` (_Liegend_).
- Add the _Langer Atem_ structured modification. It turns the resolved cone
  into a persistent, triggered Zone that resolves for initial occupants, later
  entrants, and current occupants at the start of each combat round. Its
  duration snapshots the caster's KO on a successful cast and uses the
  established Scene-round Zone lifecycle.
- Add _Sturm_ as a structured replacement form. On failed resistance it
  applies both `Position4` and a visible, source-traceable, table-managed
  `Zurückgestoßen` outcome. The system instructs the affected owner and GM
  to reposition the Token according to the rules; it does not move or block a
  Token automatically.
- Add _Winde der anderen Art_ as a structured, inherited `-4` difficulty form
  whose scent result remains table-managed.
- Extend Zone duration resolution with an opt-in caster-attribute source that
  is converted to an ordinary numeric Scene-round duration before the
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
  is created.
- Extend resistance outcomes with an optional reusable table-managed
  displacement notice and marker. It uses the existing
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  and [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  embedded-document lifecycle, plus a whispered
  [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).

This change is additive. Existing spell forms, Zone durations, resistance
outcomes, and manual concentration handling retain their current behavior.

## Capabilities

### New Capabilities

- `aeolitus-zone-spell`: Reviewed compendium support for _Aeolitus
  Windgebraus_ and its structured forms.
- `table-managed-displacement-outcomes`: A reusable, visible, source-linked
  resistance-failure outcome that tells the table to resolve movement manually.
- `caster-attribute-zone-duration`: Snapshot a configured caster attribute
  into an ordinary persistent Zone Scene-round duration at cast time.

### Modified Capabilities

- `spell-zone-lifecycle`: Resolve an opt-in caster-attribute duration source
  and retain the existing persistent Zone lifecycle after creation.
- `resistance-outcome-effects`: Permit a selected failure outcome to combine a
  canonical condition with a table-managed displacement marker and notice.
- `supernatural-pre-effects`: Materialize the new outcome without losing
  standard spell, selected-form, caster, target-Token, and cast-skill
  provenance.
- `structured-spell-modifications`: Configure and resolve the reviewed
  _Aeolitus_ forms through the existing effective-form flow.

## Impact

- Affected code: `scripts/combat/zones/zone-profile.js`,
  `scripts/combat/zones/zone-lifecycle.js`,
  `scripts/effects/pre-effects/`, and the Aeolitus `_source` JSON and supported
  spell-data tests.
- Foundry VTT interfaces: [Combat](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html)
  and the documented [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html)
  hook drive ongoing Zone effects; Region, Actor, ActiveEffect, and ChatMessage
  documents persist the outcome. `foundry.utils.deepClone` SHALL be reused for
  serialized profile and outcome data instead of mutating compendium sources.
- No new dependency or world setting is required. Concentration remains a
  player/GM convention: the GM dismisses the existing Zone from Zone
  administration when concentration ends.

## Testing Impact

- New unit coverage: caster-KO duration snapshots and invalid-source fallback;
  `onRoundStart` and `onEnter` effective _Langer Atem_ profile; base Aeolitus
  KK 16/`Position4` data; _Sturm_'s combined condition, marker, provenance, and
  recipient instruction; form composition and legacy-form-parser suppression.
- Existing unit coverage to update: Zone profile/lifecycle, resistance handler,
  Pre-Effect processor, and supported spell data specs.
- New E2E/runtime coverage: in `ilaris-e2e-world-v14363-r1`, one caster and at
  least one non-caster target on an active combat Scene. Verify the base cone,
  _Langer Atem_ creation/entry/round-start behavior and KO snapshot, and the
  _Sturm_ marker plus chat instruction. The existing Zone runtime helpers are
  candidates for `e2e/shared/`; no additional player account is required.
- Existing Zone placement, turn/round trigger, wall traversal, and Zone
  administration E2E cases require regression verification.
