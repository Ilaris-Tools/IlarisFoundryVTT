## Context

`CombatItem._parseModifikationen()` presently turns prose into temporary maneuver-like objects. It can derive simple numeric adjustments, but cannot express a changed target profile, replacement outcome, or mandatory exclusive choice. The existing supernatural dialog already gathers dialog-local decisions before calculating a cast and dispatching pre-effects on success. The change therefore adds a real spell-form layer there, instead of disguising forms as maneuvers.

The supplied anti-magic rules are the practical boundary: Gegenzauber, Magie unterdruecken, Zauber aufheben, and Wesenheit bannen have distinct profiles and one must be chosen. Their reaction, zone, dispel, and entity contexts are not yet supported by the dialog or effect context.

## Goals / Non-Goals

**Goals:**

- Persist selectable spell forms on supernatural Items; default missing `effectMode` to `inherit`.
- Resolve a dialog-local effective profile and effective pre-effect list before a cast.
- Support optional, exclusive, and required form groups through generic source data.
- Reuse existing pre-effects, Ilaris modifiers, and summoned Items for form outcomes that can be represented accurately.
- Keep prose modifications as rules text and retain their legacy parser fallback for Items without structured forms.

**Non-Goals:**

- Do not model spell forms as `manoever` Items or let them grant maneuver-only bonuses.
- Do not automate counterspell timing, zone suppression, general dispels, or entity banishment. Anti-magic forms are selectable and reported, but their outcome stays player/GM-managed until those target contexts exist.
- Do not remove the text field, bulk-convert every existing modification, or permit arbitrary executable source-data callbacks.

## Decisions

### Persist an explicit spell-form model

The common supernatural schema gains optional `system.spellModifications` and `system.spellModificationGroups` arrays. A modification has a stable `id`, German name/description, optional group id, profile overrides, `effectMode`, and an optional pre-effect list. A group defines an id, German label, and whether exactly one member is required.

```js
{
  id: 'miasmafaxius',
  name: 'Miasmafaxius',
  group: 'form',
  effectMode: 'inherit',
  profile: {
    difficulty: -4,
    cost: { mode: 'set', value: 8 },
    permanentCost: '', target: 'Einzelperson', range: '', duration: ''
  },
  preEffects: []
}
```

Overloading `system.manoever` was rejected because a spell form would acquire an unrelated maneuver identity and still lack durable profile/effect data.

### Resolve one effective context for each cast

A pure `resolveSpellModificationContext(item, selectedIds)` helper normalizes legacy/malformed data, validates known ids and group cardinality, and deep-clones the base profile. Difficulty adds to the source difficulty; `cost.mode: 'set'` replaces the base before ordinary advantages/resource rules and `add` adjusts it; nonempty target, range, duration, and permanent-cost values override the shown profile. Conflicting independent overrides block casting rather than select an arbitrary winner.

The selected ids and resolved profile live only in `UebernatuerlichDialog`. Normal maneuvers retain their current pipeline. This avoids writing a player's current form selection to the Item.

### Compose effects deliberately; default mode is `inherit`

- `inherit`, including omitted mode, leaves the current effective pre-effect list unchanged.
- `extend` appends that form's `preEffects`.
- `replace` replaces the effective list with that form's `preEffects`.

This makes default inheritance unsurprising: Miasmafaxius retains Pestgestank's outcome. Attributo attribute choices and Schimmernder Schild use explicit `replace` payloads. The alternative where `inherit` silently appended form effects was rejected because it hid an outcome change behind a target/cost form.

The existing pre-effect processor accepts the resolved list and records selected form id alongside the existing source tracking. It still uses the established `changes`, `ilarisModifiers`, `avoidTest`, and `summonItem` data; it does not mutate the source Item.

### Give spell forms a dedicated dialog and authoring surface

The supernatural Handlebars dialog has a **Zaubermodifikationen** section before ordinary maneuvers. Independent entries use checkboxes; members of an exclusive group use radio controls. Required groups have no empty option and prevent casting until selected. The UI shows the selected form's description and effective profile.

The supernatural Item sheet gets add/edit/reorder/delete controls for groups and forms. Its form-specific pre-effect cards reuse extracted existing pre-effect markup and handlers, and persist whole arrays via `Item#update` after `foundry.utils.deepClone`.

### Keep legacy behavior progressively

When a source has no structured forms, `setManoevers()` keeps parsing text as today. Once it has at least one structured form, text no longer creates temporary maneuvers, preventing duplicate controls. The original prose remains visible on sheets and actor summaries.

### First data coverage defines the boundary

- Attributo: required `attribute` group, eight `replace` forms. Each applies roll-only semantic Ilaris modifiers: +2 for its direct attribute target and +1 to `Probe` selected by that attribute. It never changes raw attributes or derived data.
- Miasmafaxius: `inherit`, with its stated cost/difficulty/Einzelperson profile.
- Schimmernder Schild: `replace`, its stated profile, and a normal `summonItem` pre-effect.
- Generic anti-magic: required `antiMagicForm` group with the four supplied `replace` forms. Their profile and full outcome rules are displayed in cast output; no incorrect automatic zone/reaction/dispel/entity resolution is fabricated.

## API Surface

- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): persistent `system` data and `Item#update` for authored form arrays.
- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html) and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html): existing dialog/sheet context and controls.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): existing pre-effect persistence remains the effect abstraction.
- [foundry.utils.deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html) and [foundry.utils.mergeObject](https://foundryvtt.com/api/v14/functions/foundry.utils.mergeObject.html): safe effective-profile and authoring-data assembly.
- No new Foundry Hook is added. Existing Ilaris post-roll callbacks retain their timing. The community API reference was checked for existing helpers; no custom clone/merge helper is necessary.

## Risks / Trade-offs

- **Malformed or conflicting forms** -> normalize defensively, disable invalid UI selections, and refuse the cast with a German message.
- **A replacement silently retains base effects** -> unit-test all three composition modes and display the selected form in chat.
- **Nested pre-effect authoring duplicates fragile markup** -> extract and reuse the existing pre-effect partial/handlers before extending it.
- **Anti-magic appears automated when it is not** -> output the chosen form and its full rules text; create no false ActiveEffect.
- **Legacy support changes too broadly** -> suppress generated text maneuvers only when structured data actually exists and regression-test the fallback.

## Migration Plan

1. Add optional fields with empty defaults, preserving existing Items.
2. Implement/test normalization and effective-context resolution.
3. Add dialog and Item-sheet authoring UI.
4. Migrate reviewed `_source/` JSON, then run `npm run pack-all` with Foundry closed.
5. Run unit, lint, and Foundry E2E validation.

Rollback removes the structured arrays. The retained text field restores legacy generated maneuvers.

## Open Questions

- Reaction interrupts, zone state, effect targeting, and banishable-entity context require a follow-up capability; they must not be supplied by source-data scripts.

## Testing Strategy

- Pure Jest coverage: normalization, unknown ids, group cardinality, profile precedence, three effect modes, and legacy fallback, following existing `Object.create(CombatItem.prototype)` fixture patterns.
- Dialog tests: selection parsing/validation, profile calculation, chat summary, and effective-list dispatch with mocked Items/Actors.
- Sheet tests: group/form array CRUD and nested pre-effect persistence.
- E2E: GM plus player caster/target validates Attributo, Miasmafaxius, Schimmernder Schild, exclusive anti-magic, and text fallback; promote repeated dialog/target/effect-cleanup helpers to `e2e/shared/` only if reused.
