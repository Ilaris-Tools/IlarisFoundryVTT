## Context

The Zone engine already supports instant and persistent Region-backed Zones,
initial/entry/turn/round triggers, structured spell forms, standard
resistance prompts, canonical conditions, and marker-only outcomes. It stores
all persistent-zone durations as numeric `sceneRounds`. _Aeolitus
Windgebraus_ is the first reviewed spell that combines an instant Zone with a
form that turns it into an ongoing Zone and another form that adds a
table-managed movement consequence.

The rule outcome is deliberately bounded: Foundry remains the source of truth
for Region containment and the persisted Zone; the GM remains responsible for
concentration ending and physical Token repositioning.

## Goals / Non-Goals

**Goals:**

- Make the base spell and all three reviewed forms usable through the existing
  structured-form dialog.
- Snapshot the caster's KO into the normal numeric Zone duration at the time
  of a successful cast, without introducing a second Zone timer lifecycle.
- Reuse `onEnter` and `onRoundStart` for _Langer Atem_ rather than adding a
  spell-specific trigger.
- Make _Sturm_'s failed resistance both visibly traceable and actionable for
  the table without automated Token movement.

**Non-Goals:**

- Detecting, enforcing, or automatically ending concentration.
- Moving, blocking, reverting, or pathfinding Tokens for _Zurückstoßen_.
- Converting every spell that causes a forced-movement effect.
- Adding Initiativephase, every-N-round, or out-of-combat Zone timers.
- Changing ordinary fixed-duration Zones, existing marker outcomes, or wall
  traversal ownership and cleanup.

## Decisions

### 1. Resolve a duration source once, then persist the existing duration

`duration.source` is optional and defaults to `fixed`. The only new source in
this slice is `casterAttribute`, with `duration.attribute: "KO"`. A successful
persistent cast resolves the caster's current attribute value and replaces the
source configuration with numeric `remaining` and `originalValue` values in
the Region flag state. The Region is subsequently an ordinary `sceneRounds`
Zone, including Zone administration and expiry.

This preserves the project decision that Zones tick once per scene round. It
also prevents later changes to KO from silently changing an already-cast
spell.

Alternative: create a `combatTurns`/Initiativephase Zone duration. Rejected:
it would introduce a second timing lifecycle and contradict the established
Zone round cadence for this first consumer.

### 2. _Langer Atem_ is a persistent inherited form

The base form is an instant, caster-anchored 45-degree cone with a 16-Schritt
distance and tip pivot. _Langer Atem_ has `effectMode: "inherit"`, a profile
difficulty of `-8`, costs set to 8 AsP, and overrides only the Zone lifecycle:
`persistent`, KO-sourced duration, `triggerOnCreate`, `onEnter`, and
`onRoundStart`. It inherits the base KK-16/`Position4` Pre-Effect exactly once
per dispatched event.

Alternative: duplicate the base Pre-Effect into the form. Rejected: inherited
data keeps a single authoritative resistance and canonical-condition definition
and avoids data drift.

### 3. _Sturm_ uses a generic table-managed displacement outcome

_Sturm_ is an `effectMode: "replace"` form because its failed-resistance result
must add a consequence while preserving the normal condition. Its replacement
Pre-Effect retains the base fixed KK 16 resistance and failure outcome with:

- canonical `condition: { enabled: true, statusId: "Position4" }`;
- a marker `{ enabled: true, id: "zurueckgestossen", label:
"Zurückgestoßen" }`; and
- `tableManagedDisplacement.enabled: true`.

The processor uses the existing marker ActiveEffect creation path and complete
spell/form/caster/cast-skill/target-Token provenance. After a failed result has
been materialized, it sends one whispered German instruction to the affected
owner and active GM(s): the GM places the Token according to _Zurückstoßen_;
the system does not move it.

Alternative: reuse the existing wall traversal marker directly. Rejected: it
is owned by a persistent rectangular Region and a movement-path event, whereas
_Sturm_ is a resistance outcome from an instant Zone. The generic outcome
shares the wall's table convention, not its Region-specific ownership model.

### 4. _Winde der anderen Art_ remains a pure cast-profile form

_Winde der anderen Art_ is an ungrouped `inherit` form with difficulty `-4`
and a German description that its fragrance or stench is managed at the table.
It has no Zone or Pre-Effect override.

### 5. Concrete authoring UI owns placement

The shared Pre-Effect base continues to supply only data/context/listeners.
`uebernatuerlich_talent.hbs` owns concrete layout.

The existing **Zonenautomatisierung** section remains before **Strukturierte
Zaubermodifikationen** and **Pre-Effects**. Its order becomes:

1. Form and dimensions;
2. Verankerung and Reichweite;
3. Lebenszyklus;
4. `Dauerquelle` (`Fester Wert` / `Attribut der zaubernden Person`), then
   either `Szenenrunden` or the attribute selector;
5. creation, entry, and round-start trigger controls;
6. remove-profile action.

Each form's existing **Zonenform** subsection mirrors the same compact order:
geometry, anchor/range, lifecycle/duration source, then triggers, before its
**Form-Pre-Effects**. A form with no Zone override retains the existing
inheritance behavior. No dialog controls are added: the casting dialog already
renders selected structured forms before its Zone placement/roll controls.

The failure-outcome panel in the existing Pre-Effect card gains a clearly
labelled `Zurückstoßen (Spielleitung)` checkbox and German instruction hint
after the result's marker controls. It is visible only when that failure result
is enabled. The same panel order applies to base and form Pre-Effects. The
controls use existing sheet styling and therefore inherit light/dark themes.

## API Surface

- [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html):
  read Region containment and update its persisted Ilaris Zone flag through
  `RegionDocument#update`; create the final Region through the documented
  [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html)
  embedded-document flow.
- [Combat](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html)
  and the verified [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html)
  hook `(combat, updateData, updateOptions)`: reuse the current positive-
  direction round-start dispatch, before duration reduction.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  retain canonical condition-source and marker ActiveEffect persistence through
  the current embedded-document service.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  create the whisper containing a table-managed displacement instruction.
- `foundry.utils.deepClone`: clone source Zone and outcome data before
  normalization/materialization; source Item and form data remain immutable.

## Risks / Trade-offs

- [KO source is missing or non-numeric] → reject the persistent cast with a
  localized error before creating a Region; never create a zero-duration Zone.
- [A later KO change alters the caster] → snapshot KO only once at successful
  casting, then retain numeric Region state.
- [Repeated periodic failed resistances create noisy displacement markers] →
  use normal same-spell stacking behavior and source provenance; each prompt is
  event-local, while UI wording makes manual reposition a GM decision.
- [GM treats the chat instruction as enforced movement] → explicitly state in
  the whisper and tutorial that no Token movement is automated.
- [New authoring fields clutter forms] → hide the attribute selector unless
  its duration source is chosen and preserve the existing top-to-bottom order.

## Migration Plan

1. Existing Zone data without `duration.source` normalizes as fixed numeric
   Scene rounds without migration.
2. Pack the updated Aeolitus source with `npm run pack-all`.
3. Existing worlds need no migration; new Regions store their resolved numeric
   data, while old Region flags keep working unchanged.
4. Rollback consists of removing the compendium form data. Persisted Regions
   remain valid ordinary numeric Zones and can be dismissed through existing
   Zone administration.

## Open Questions

None. The committed scope uses Scene-round aging, triggers on creation,
entry, and round start, and handles concentration and repositioning manually.

## Testing Strategy

- Pure tests: extend `zone-profile.spec.js` for source normalization and
  `resolveZoneProfile` inheritance; test a resolver that snapshots KO from the
  caster without mutating source data.
- Lifecycle tests: extend `zone-lifecycle.spec.js` with a numeric resolved KO
  Region, creation/entry/round-start event ordering, and expiry after the
  captured count. Use existing jest mocks and small document doubles.
- Pre-Effect tests: extend `resist-handler.spec.js` and
  `pre-effects-processor.spec.js` with a failed outcome that creates both a
  canonical condition source and marker, preserves provenance, and whispers
  only target owner/active GM recipients.
- Sheet and form tests: extend `uebernatuerlich-talent.spec.js` and
  `spell-modifications.spec.js`; verify source-specific controls and the
  Aeolitus effective forms without depending on browser rendering.
- Compendium test: extend `supported-spell-data.spec.js` with base and all
  three reviewed forms.
- Runtime/visual E2E: use the Foundry runtime-verification checklist and
  `ilaris-e2e-world-v14363-r1`. Capture screenshots of the authoring sheet,
  form selection/casting dialog, placed cone, resulting Zone administration
  entry, and _Sturm_ chat/ActiveEffect. Run after `PackAndRestart`; clean up
  all temporary Regions and Tokens even if the run aborts.
