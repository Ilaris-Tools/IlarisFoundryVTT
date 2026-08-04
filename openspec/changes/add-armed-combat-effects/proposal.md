## Why

Several Zauber and Liturgien affect only a later combat action, but the current
pre-effect system can only create immediate damage or duration-based modifiers.
As a result, effects such as Falkenauge Meisterschuss and Neun Streiche in
einem cannot retain cast-time state, apply on a confirmed hit, consume a charge
for the attempted matching attack, and expire when no charges remain.

## What Changes

- Add a reusable armed combat-effect definition to supernatural `preEffects`.
  An armed effect is persisted on its target after a successful cast and may
  declare a cast-time numeric input, an attack scope, a successful-hit trigger,
  attack or damage contributions, and an optional charge configuration.
- Render declared numeric inputs in `UebernatuerlichDialog` before a cast is
  committed and persist the submitted values in each resulting ActiveEffect.
- Show each effect's authoritative remaining duration in the Held actor sheet's
  Effekte tab and show remaining charges beside armed effects, so time-based
  expiry and charge exhaustion remain separately visible.
- Add a common, system-level armed-attack handoff for melee and ranged combat
  so every matching attack consumes a charge, while a hit alone applies an
  armed damage contribution, expiring the effect only when its charges reach
  zero.
- Let configured charges optionally gain a declared number of additional
  charges per Mächtige-Magie/Liturgie QS, without amplifying effects that omit
  a charge configuration.
- Configure `Falkenauge Meisterschuss` as an armed next-eligible-ranged-
  attack bonus and `Neun Streiche in einem` as an armed next-eligible-attack
  damage bonus based on the entered number of prior hits, capped at `8W6`.
- Preserve all existing instant, timed, resist, stacking, and contextual
  modifier behavior when an item does not opt into an armed effect.

This is additive for new pre-effect configuration and compendium entries. It
modifies the documented pre-effect and combat behavior by adding an explicit
confirmed-hit resolution stage; it removes no supported functionality.

## Capabilities

### New Capabilities

- `armed-combat-effects`: Reusable charged supernatural effects with cast-time
  numeric inputs, a matching-attack charge trigger, and hit-only damage.

### Modified Capabilities

- `supernatural-pre-effects`: Extend the pre-effect schema, item-sheet editor,
  and effect-creation flow to support armed effect definitions and submitted
  input values.
- `combat`: Add an attack-resolution path that decrements armed effect charges
  for every matching attack, resolves armed damage only on hits, and leaves
  manual damage rolls unchanged.
- `supported-spell-pre-effects`: Move Falkenauge Meisterschuss and Neun
  Streiche in einem from deferred next-roll mechanics to structured supported
  source data.
- `actor-sheets`: Display active-effect duration and armed-effect charge state
  in the Held Effekte tab.

## Impact

- Affected code: `scripts/effects/pre-effects/`,
  `scripts/effects/model-data/`, `scripts/items/sheets/`,
  `scripts/items/templates/`, `scripts/combat/dialogs/`, and
  `scripts/combat/hooks/`, `scripts/actors/sheets/`, and
  `scripts/actors/templates/`.
- Affected compendium source data: `comp_packs/zauberspruche-und-rituale/_source/`
  and `comp_packs/liturgien-und-mirakel/_source/`; packed LevelDB artifacts are
  regenerated with `npm run pack-all`.
- Foundry API surface: [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  remains the persisted effect document and is created through
  `ActiveEffect.createDocuments`; [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  owns the embedded effects, updates remaining charges through
  `Actor#updateEmbeddedDocuments`, and removes exhausted effects through
  `Actor#deleteEmbeddedDocuments`. The existing AppV2 dialog uses
  [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
  rendering rather than a new Foundry application type.
- Hook surface: no Foundry core hook is introduced. The system will define or
  extend an Ilaris combat-result handoff near the existing `Ilaris.postAngriff`,
  `Ilaris.postVerteidigung`, and `Ilaris.postSchaden` system hooks; its exact
  public signature is part of the design and must not be inferred from Foundry
  core hooks.
- Utilities: use existing `foundry.utils.deepClone` only where an item-sheet
  form operation already needs an isolated pre-effect value; avoid custom deep
  copying utilities.

## Testing Impact

- New unit tests: normalize and validate armed-effect configuration; materialize
  cast-time input and charges into an ActiveEffect; resolve attack and hit-only
  damage contributions; decrement once per matching attack; expire at zero;
  retain the effect after an ineligible attack or a preview; and verify opt-in
  Mächtige-Magie charge amplification.
- New actor-sheet tests: effect rows display the active owner-turn duration or
  native prepared duration as applicable, and display charges only when an
  armed effect has a remaining charge counter.
- Existing unit tests to update: pre-effect processor coverage in
  `scripts/effects/pre-effects/_spec/`, combat dialog and hook coverage in
  `scripts/combat/_spec/`, and supported source-data coverage in
  `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js`.
- New E2E coverage: a single-player `HatAlles` world flow that casts each
  configured talent, supplies the numeric Neun-Streiche value, makes repeated
  successful attacks, observes the charged contribution each time, and verifies
  that the embedded effect is removed only after the final charge. A matching
  failed attack consumes a charge without applying damage; a nonmatching attack
  leaves charges unchanged.
- Existing E2E regression: `e2e-009-uebernatuerlich-dialog`,
  `e2e-027-pre-effect-sheet-config`, and `e2e-028-pre-effect-buff-creation`.
  The baseline world needs the current `HatAlles` actor, standard Zauber and
  Liturgie packs, and no second player. Shared spell-dialog and actor snapshot
  helpers in `e2e/shared/fixtures/foundry.ts` are likely reusable; promote only
  a confirmed-hit helper if more than one case needs it.
