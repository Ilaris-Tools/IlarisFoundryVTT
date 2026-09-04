## Context

Pre-Effects already serialize a target-specific resistance prompt and resolve it
through `FertigkeitDialog`. A failed check materializes the root Pre-Effect;
an ordinary success applies nothing, while the legacy `diminishedOnly` option
substitutes individual diminished values. The common materialization path
already creates provenance-bearing ActiveEffects and routes configured status
conditions through the condition-source service.

That shape cannot express the reviewed rules for _Fluch des Gewürms_: failure
means a timed, visible **Handlungsunfähig** state, while success means a timed
global `-4` modifier. The current spell therefore has an empty normal payload
and only a diminished value. _Hexengalle_ similarly uses a numeric no-op just
to create a spell-named reminder effect.

The solution must be compatible with existing source data, normal
supernatural stacking/recast policy, Ilaris owner-turn timing, and the shared
spell/maneuver Pre-Effect sheet infrastructure. It must also keep the source
of a displayed marker discoverable without treating it as a globally enforced
Foundry status.

Existing effects store `spellUuid` and the source Item's configured
`fertigkeiten`, but the latter is only a candidate list. It does not state
which skill an automatic multi-skill spell actually used. That distinction is
required for later school-specific anti-magic and removal rules.

## Goals / Non-Goals

**Goals:**

- Select an explicit persistent result payload for a successful or failed
  resistance check while retaining the existing root payload as the default.
- Allow a selected payload to contain native changes, Ilaris modifiers, a
  condition request, or a marker-only effect.
- Make marker-only effects visible with a German state label and traceable in
  both their displayed name and structured source metadata.
- Persist the one exact supernatural skill used to cast every outcome effect;
  never store only an automatic candidate list as the cast origin.
- Preserve source provenance for both ordinary ActiveEffects and condition
  source-ledger entries.
- Keep `diminishedOnly` source data valid and behaviorally unchanged.
- Provide compact, correctly ordered authoring UI in the existing Pre-Effect
  card and migrate only the reviewed source data.

**Non-Goals:**

- Do not make **Handlungsunfähig** a canonical Foundry status condition or
  automatically prohibit actions, movement, or rolls. It remains a visible,
  table-managed marker.
- Do not redesign the normal target-selection, damage, zone, traversal,
  armed-combat, summoned-item, or opposed-escape lifecycles.
- Do not apply a resistance result to an instant damage payload in this first
  iteration.
- Do not migrate every spell mentioning handlungsunfähig; only sources whose
  complete result is represented by this bounded model are in scope.
- Do not remove or bulk-rewrite legacy `diminishedOnly` data.

## Decisions

### A resistance outcome is a replacement persistent payload

Each Pre-Effect retains its current root payload (`changes`,
`ilarisModifiers`, `marker`, and `condition`). New optional
`resistanceOutcomes.success` and `resistanceOutcomes.failure` objects use the
same materializable fields plus `enabled`. An enabled branch replaces those
root result fields for its named resistance result, while inheriting the
parent's target, duration, timing, caster, source type, application identity,
and spell-modification context.

The root payload remains the fallback for failure. A success with no explicit
success payload retains current behavior: no effect, or legacy diminished
values when `diminishedOnly` is enabled. An explicit success payload takes
precedence over `diminishedOnly`; new sheet authoring prevents enabling both
so their competing meanings are not silently authored together.

This is preferred over independent child Pre-Effects because the existing
prompt already serializes a single target, duration calculation, application
identity, and resistance roll. It is preferred over merging a branch into the
root payload because a failure marker and success modifier are alternative
results, not cumulative effects.

### Marker metadata improves display but never hides provenance

`marker` gains `id` and `label` beside `enabled`. New marker authoring
requires a stable Ilaris id and German label; legacy enabled markers without
them retain the spell name as their readable fallback.

A newly authored marker-only ActiveEffect is named
`<marker label> — <spell name>` (for example,
`Handlungsunfähig — Fluch des Gewürms`). The document continues to use the
existing `origin` and `flags.ilaris` spell/caster/component/application fields
and adds `resistanceOutcome` and `markerId`. Thus a player can see both the
state and source in the effect row, while code can query stable flags rather
than parsing the name.

This is preferred over naming the effect only after the marker, which would
hide the spell in everyday UI, and over creating a `CONFIG.statusEffects`
entry, which would imply a universal set of native changes that is not valid
for every Ilaris actor type or table rule.

### Cast-origin snapshots contain a concrete selected skill

Before the roll, the supernatural dialog resolves a `castSkill` string. A
non-`auto` `fertigkeit_ausgewaehlt` is that exact skill. For `auto`, the dialog
uses the unique highest eligible supernatural skill that supplies the current
casting value. If several eligible skills tie for that value, the caster must
select one before a roll action becomes available; the choice is not persisted
back to the Item's configuration.

Every resulting ordinary ActiveEffect and condition source record stores a
generic `sourceItemUuid`, the retained legacy `spellUuid`, and the concrete
`castSkill`. The existing `fertigkeiten` field remains an informational source
Item candidate list only. An outcome therefore remains queryable by spell,
caster, application, spell modification, and actual casting skill without
requiring effect-name parsing or a live lookup of mutable Item data.

This is preferred over recording `fertigkeit_ausgewaehlt` verbatim because
`auto` is not a skill, and over resolving a tied skill after the roll because
the result and applied modifiers must describe the same casting choice.

### Condition results keep equivalent provenance in their source ledger

If an outcome requests an existing configured status condition, the condition
service receives the same spell provenance and resolved-outcome fields in the
new condition source record. It does not create a second ordinary ActiveEffect
with copied native status changes. The canonical condition effect remains
responsible for deduplicated status changes; its source-details presentation
shows the originating spell/application.

This preserves the independent-source guarantee of the status-condition
lifecycle while ensuring outcome effects remain traceable even when their
visible document is shared with another source.

### Result materialization uses the established common creation path

The resistance handler constructs a deep-cloned effective Pre-Effect by
selecting the branch before invoking the existing instant/persistent
materializers. Persistent outcomes therefore use the existing same-spell
recast policy, owner-turn timing, ActiveEffect data model, and effect-row
preparation. Branch replacement must preserve only non-result operational
fields from the root Pre-Effect; it must not inherit root changes, modifiers,
marker, or condition accidentally.

This avoids a parallel ActiveEffect factory and keeps application identity
consistent among all components of one cast.

### The shared editor supplies behavior; each item sheet owns placement

The shared Pre-Effect template renders the outcome controls inside each
Pre-Effect card. Its vertical order is fixed:

1. existing card-specific activation/operation controls and duration;
2. ordinary effect configuration (condition, instant/marker, changes and
   Ilaris modifiers);
3. **Widerstand** checkbox and test configuration;
4. **Bei misslungener Widerstandsprobe** and **Bei gelungener
   Widerstandsprobe** panels, each revealed only when enabled.

The normal item sheet content remains before the sheet's existing Pre-Effects
section. The shared base/mixin may prepare context and register listeners, but
it must not prepend a generic panel ahead of a concrete sheet's normal fields.
Controls use existing Foundry form styling and theme variables; no fixed light
background or text colors are introduced, so light and dark modes are both in
scope for visual verification.

The casting dialog exposes the tie-only **Fertigkeit** selector in its existing
left-side casting controls, directly above modification controls. The right
side retains placement and dice actions. It is omitted for fixed or uniquely
resolved casts, and all roll actions remain disabled until a tied automatic
skill is selected. This adds the minimum authoring-free UI necessary for an
exact cast-origin record.

## API Surface

- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  create the normal embedded marker/modifier effect with `origin`, native
  changes, system data, and Ilaris provenance flags.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  retain the existing embedded-document creation and same-spell replacement
  APIs; condition sources use the existing actor-owned update path.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  retain the serialized resistance prompt; outcome data must remain serializable
  through that existing message interaction.
- [Hooks](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html):
  retain the existing `Ilaris.postSkillRoll` listener as the resistance
  resolution boundary. The implementation must re-check its registered
  callback signature; this change introduces no new hook event.
- [`foundry.utils.deepClone`](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html):
  isolate the selected branch from source Item data before materialization.
  Existing `foundry.utils.randomID` use continues to identify casts and
  prompts. The implementation must consult the Foundry community API wiki for
  helper behavior before adding a custom clone/merge utility.

## Risks / Trade-offs

- **[An explicit branch partly inherits the wrong root fields]** → Construct
  an effective payload by replacing the complete result-field set and unit
  test marker-versus-modifier exclusivity.
- **[A marker label obscures its spell source]** → Require the visible name to
  include both label and spell name, retain all existing provenance flags, and
  add `resistanceOutcome`/`markerId` as structured fields.
- **[Legacy `diminishedOnly` changes behavior]** → Keep its current fallback
  path unchanged and test it alongside explicit branch selection.
- **[A condition result loses source information in a shared condition
  document]** → Extend the condition source ledger, not the condition's
  template changes, and render its source details through the existing actor
  effect-row preparation.
- **[An automatic multi-skill cast is ambiguous]** → Resolve and snapshot the
  unique best skill before rolling; require a compact pre-roll choice for a
  tie and do not infer it after the fact.
- **[Nested authoring fields make the sheet visually noisy]** → Keep result
  panels disabled/collapsed by default and verify their exact top-to-bottom
  order in both Foundry themes.
- **[Old or hand-authored malformed payloads reach the chat card]** → Treat
  missing outcome objects as absent, validate enabled marker ids/labels in the
  authoring path, and warn rather than applying a partial payload.

## Migration Plan

1. Add optional data-model defaults and the normalizer without changing legacy
   source values.
2. Add branch selection/provenance materialization and condition-ledger
   propagation with focused tests.
3. Update the shared editor and its tests; verify the normal spell and
   maneuver sheet layouts remain owned by their concrete templates. Add the
   tie-only cast-skill selector and snapshot flow before resistance prompts
   serialize their context.
4. Migrate _Fluch des Gewürms_, _Krabbelnder Schrecken_, and _Hexengalle_ in
   `_source/`, update the inventory/deferred note, then run `npm run pack-all`.
5. Validate with unit tests, lint, the dedicated Foundry E2E world, and the
   runtime/visual checklist. Rollback is safe: documents retain standard
   ActiveEffect data and legacy sources continue to use the old fallback path.

## Open Questions

- None that block the first implementation slice. The spell-linked effect
  name, generic source Item UUID, and concrete cast-skill flags are the
  source-of-truth provenance contract; a later actor effect-row enhancement
  may expose the full marker id as optional details.

## Testing Strategy

- Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` with
  explicit success/failure selection, legacy diminished fallback, and
  malformed/mutually-exclusive authoring states.
- Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js`
  using the current dynamic-import/Jest mock pattern to verify marker-only
  effect creation, visible name, flags, `origin`, owner-turn duration,
  same-spell replacement, and separate outcome payloads.
- Extend the supernatural-dialog/context tests for fixed, unique-auto, and
  tied-auto cast-skill snapshots; verify the chosen tie skill is available to
  the roll context and reaches the serialized resistance result.
- Extend `scripts/effects/_spec/status-conditions.spec.js` and effect-row
  tests using object fixtures for condition-source provenance propagation and
  display.
- Extend the existing `scripts/items/sheets/_spec/` Pre-Effect sheet tests for
  default panels, add/remove behavior, and panel order; preserve the shared
  base/concrete-sheet separation.
- Add a focused E2E case in `ilaris-e2e-world-v14363-r1`: cast a spell
  configured with _Fluch des Gewürms_' reviewed outcome payload, resolve both
  resistance outcomes, and inspect the normal actor effect row and source
  details. Validate _Fluch des Gewürms_' packed source and ordinary timed
  effect expiry with focused source and unit tests. Reuse existing
  cast/resistance helpers and add no browser shortcut that bypasses the user
  flow.
- Record normal-theme and dark-mode screenshots of the spell editor, tied-skill
  casting dialog, and resulting actor effects in the change-specific
  runtime-verification checklist. Run the E2E only after the normal runtime
  checklist confirms the feature is manually testable.
