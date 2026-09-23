## Context

`resolveIlarisModifiers()` already matches a modifier's optional
`selector.situation` against the roll context, including arrays of context
values. `FertigkeitDialog` currently retains one optional situation string
from its opener, while `UebernatuerlichDialog` does not provide situation data
to the resolver at all. The existing transferred Vorteil ActiveEffect pipeline
therefore has the required data lifecycle but no coherent UI for conditional
Vorteil rules.

The player and GM must decide facts that Foundry cannot reliably derive: the
current social-duel action, whether a research context applies, a target's
state, a spell modification, the current location, or the strength of a
Kraftlinie. This design gives them explicit, per-roll controls instead of
persisting these facts on the Actor or trying to infer them.

## Goals / Non-Goals

**Goals:**

- Define stable, localized roll-condition identifiers shared by authored
  ActiveEffects and both dialog types.
- Let a skill roll select one primary situation through a dropdown.
- Let a supernatural roll select all applicable manual conditions through
  explicit controls, including an exclusive Kraftlinie-strength choice.
- Send the selected tags to the existing ordinary Ilaris modifier resolver and
  visibly recompute the probe before rolling.
- Author the named, fixed-bonus Vorteil rules as transferred ordinary
  `system.ilarisModifiers`.

**Non-Goals:**

- Infer location, target, spell modifications, resources, or social-duel state
  from the world.
- Automate secondary rules that alter information quality, enable maneuvers,
  prevent fumbles, alter regeneration, consume resources, or change duration.
- Persist selected conditions beyond the currently open dialog.
- Rework supernatural strongest-effect suppression; Vorteil modifiers remain
  ordinary and additive under the existing policy.
- Add a universal free-text condition field or expose every possible Vorteil
  as its own checkbox.

## Decisions

### 1. Use a central roll-condition catalogue with parent expansion

Create an effects-domain module that owns stable IDs, German labels, UI
placement, and parent relationships. A small helper converts a selected ID or
IDs into the full tag set passed to the resolver. The first catalogue includes:

| Selected UI value                 | Resolver tags                                 |
| --------------------------------- | --------------------------------------------- |
| Keine besondere Situation         | `[]`                                          |
| Rededuell                         | `['sozialesDuell']`                           |
| Rededuell – abwartend             | `['sozialesDuell', 'sozialesDuellAbwartend']` |
| Ermittlung & Recherche            | `['ermittlungRecherche']`                     |
| Gegenstand zerstören/durchbrechen | `['gegenstandZerstoeren']`                    |
| Kraftlinie +2 / +3 / +4           | exactly one corresponding Kraftlinie tag      |

Parent expansion belongs in the context builder rather than the resolver. The
resolver remains a generic equality matcher and continues to work for macro or
world-provided context arrays. A dropdown is used for a skill roll because the
listed situations are mutually exclusive primary actions; the more-specific
social-duel tag deliberately retains the generic parent tag.

Alternative considered: use an unstructured string entered by the player.
This would make compendium selectors typo-prone and impossible to localize or
test reliably. Alternative considered: teach each ActiveEffect its own parent
matching logic. That duplicates rule vocabulary and risks inconsistent
behavior across roll entry points.

### 2. Keep external callers compatible and make the UI state ephemeral

`FertigkeitDialog` will treat an opener-provided known situation as the
initial dropdown value. The currently selected value is held on the dialog
instance, re-resolved on input/change, and never written to an Actor, Item,
or setting. The dialog's existing live summary update mechanism will show the
effect source and contribution before the user confirms the roll.

Alternative considered: persist the last selected situation on an actor. That
would leak one scene's circumstances into future rolls and would be wrong for
multi-user play.

### 3. Supernatural conditions are independent explicit controls, not one switch

`UebernatuerlichDialog` receives a dedicated **Situative Vorteile und
Traditionen** section. It offers a checkbox for each relevant boolean
condition and an exclusive control for mutually exclusive magnitude tiers such
as Kraftlinienmagie. Relevance is determined from the actor's applicable,
transferred Vorteil effects and their situation selectors for the current
supernatural probe, so the dialog does not become a list of every Vorteil in
the game.

The user selects only conditions that the table has established as true. The
dialog expands the chosen IDs, supplies them with the actor, supernatural
Fertigkeit, Talent, roll phase, and `Probe` target to the existing resolver,
and adds that resolved ordinary contribution to its normal probe value and
summary. There is no single global “condition applies” checkbox: it would
incorrectly activate unrelated effects at once.

Alternative considered: model every rule as a dedicated dialog feature. That
would couple each compendium Vorteil to UI code and does not scale to future
traditions. Alternative considered: require manual entry in the existing
modifier field. That bypasses the owned Vorteil effect and loses traceable
source visibility.

### 4. Encode only fixed, directly roll-affecting Vorteil bonuses in this iteration

The initial compendium migration creates transferred ActiveEffects with
ordinary additive roll-phase `Probe` modifiers for:

- Eindrucksvoll I/II: +2 for Betören/Einschüchtern in `sozialesDuell`.
- Vorausschauend I/II: +2 for Rhetorik/Überreden in `sozialesDuell`.
- Bedächtig: +4 in `sozialesDuellAbwartend`.
- Scharfsinnig I/II: +2 in `ermittlungRecherche`.
- Zerstörerisch I/II: +4 in `gegenstandZerstoeren`.
- Kraftlinienmagie: the selected +2, +3, or +4 tier for the appropriate
  supernatural Fertigkeit, once that skill restriction is represented by the
  existing selector shape.

Where an actor owns both an I and II Vorteil, both ordinary contributions add;
the effect model does not silently collapse character advancement levels.
Textual side effects not expressible as a probe modifier remain manual and
documented as such.

## API Surface

- [`HandlebarsApplicationMixin`](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)
  and [`ApplicationV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html): existing dialog template rendering,
  `PARTS`, `_prepareContext`, and form/action lifecycle.
- [`Actor.allApplicableEffects()`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): existing source of direct and transferred
  Vorteil ActiveEffects when deriving relevant controls and resolving bonuses.
- [`ActiveEffect`](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): existing documents whose semantic
  `system.ilarisModifiers` remain the data source; no native `changes` behavior
  is altered.
- Hooks: none added, listened to, or changed. The existing dialog and resolver
  invocation path is sufficient.
- `foundry.utils.*`: no helper is required for the expected immutable
  condition data and small string-array expansion. The community API guide was
  reviewed; implementation must re-check helpers if it introduces cloning or
  merge behavior beyond direct array construction.

## Risks / Trade-offs

- [A player can select an inapplicable condition] → This is an explicit
  player/GM-managed workflow; labels make the condition visible and the roll
  summary names the applied Vorteil source.
- [Generic parent tags could be omitted] → One shared expansion helper and
  unit tests make `sozialesDuellAbwartend` include `sozialesDuell` everywhere.
- [Kraftlinie tiers could stack] → Use one exclusive selection group and test
  that exactly one strength tag can be supplied.
- [Scanning effects could expose irrelevant controls] → Filter to active,
  applicable Vorteil effects and to condition selectors compatible with the
  current supernatural roll; fall back to no controls when none match.
- [Compendium text contains extra, non-modifier behavior] → Migrate only the
  explicit fixed probe value and preserve all other behavior as manual.

## Migration Plan

1. Add the condition module and dialog integration behind the existing effect
   resolver lifecycle.
2. Add or update unit and E2E tests before modifying compendium data.
3. Update the selected Vorteil `_source/` documents with transferred effects,
   then run `npm run pack-all`.
4. Update the quick-reference and Item-Konfigurationen guidance to distinguish
   the supported contextual modifiers from still-manual Vorteil mechanics.
5. Rollback is safe: remove the new effects and dialog controls; no actor data
   migration or persistent setting must be reversed.

## Open Questions

- For Kraftlinienmagie, the existing Vorteil text says “matching Fertigkeiten”
  but does not encode which supernatural Fertigkeiten match a given line. The
  initial data authoring must either list the available matching Fertigkeiten
  explicitly or defer that specific effect until the relationship is available
  in system data. The UI tier control itself is independent of this decision.
