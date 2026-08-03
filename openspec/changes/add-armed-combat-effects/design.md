## Context

Supernatural pre-effects currently materialize immediate damage, native changes,
or semantic Ilaris modifiers. They cannot collect user input at cast time or
bind a future attack to state stored on the generated ActiveEffect. Combat also
has several success paths: a direct attack result, a ranged or melee defense,
and a later damage roll. Deleting an armed effect as soon as a hit is confirmed
would otherwise remove a damage modifier before the existing dialog performs
the damage roll.

The change adds a small declarative extension to `preEffects`, persists a
materialized armed payload on the target Actor's effect, and introduces shared
attack-context handling rather than hard-coding spell names in combat dialogs.

## Goals / Non-Goals

**Goals:**

- Let a pre-effect declare a reusable next-successful-attack effect with an
  optional numeric value entered while casting.
- Persist each submitted value with the generated ActiveEffect so concurrent
  casts do not share state.
- Apply an armed attack or damage contribution to the appropriate attack,
  decrement the source effect only after a confirmed hit, expire at zero
  charges, and retain it unchanged after a miss or an ineligible attack.
- Support optional, explicitly configured Mächtige-Magie/Liturgie charge
  amplification without changing effects that have no charges.
- Configure Falkenauge Meisterschuss and Neun Streiche in einem using this
  generic mechanism.
- Preserve existing timed effects, ordinary semantic modifiers, and the
  pure/read-only contextual-modifier resolver.

**Non-Goals:**

- Automatic tracking of historical hits per attacker and target. Neun Streiche
  receives its count from the player at casting time.
- Generic charged-trigger handling for arbitrary skill probes, defenses, repeated zones,
  contacts, or delayed triggers.
- Automation of multi-target attacks beyond the combat system's existing target
  and damage behavior.
- Replacing the existing active-effect duration or supernatural stacking rules.

## Decisions

### Declarative source definition, materialized runtime payload

`preEffects` gains an optional `armedCombat` object. It declares a stable
trigger (`nextSuccessfulAttack`), an eligible attack scope (`melee`, `ranged`,
or `any`), optional numeric input descriptors, and an optional attack or damage
contribution. Input descriptors provide a key, German label, default, and
numeric bounds. Damage based on an input uses a fixed per-unit formula and an
optional maximum unit count, rather than arbitrary executable expressions.

The definition may also declare `charges`. Its `base` is the number of
successful confirmed hits the effect may affect.
`charges.amplifiedByMaechtigeMagie` defaults to `false`; when explicitly
enabled, `charges.maechtigBonus` adds a non-negative, integral number of
charges per Mächtige-Magie/Liturgie QS. An effect with no `charges` declaration
keeps the existing one-charge behavior. The source item controls whether its
charges amplify; a general spell-level amplification flag is deliberately not
inferred.

On a successful cast, the pre-effect processor reads the dialog values and
stores a normalized, materialized payload in
`system.ilarisArmedCombat` on the created ActiveEffect. The effect document
therefore owns the pending state, while the source Item remains reusable.

This is preferable to hard-coded item names or Actor flags: source data stays
declarative, multiple casts remain independent, and the custom ActiveEffect
TypeDataModel validates the runtime shape.

### Snapshot before attack; decrement after confirmed hit

Combat dialogs resolve eligible armed effects when they assemble an attack,
producing an immutable attack-context snapshot containing the source effect ID,
attack contribution, and any materialized damage contribution. The attack bonus
is included in the attack formula and summary before the roll. The damage
contribution remains attached to the same dialog/serialized attack context so
it is still available to the resulting damage roll after the source effect is
decremented or expired.

A shared confirmed-hit helper receives the attacker, target, attack type, and
attack-context snapshot. It decrements exactly the snapshot's active source
effects through the owning Actor after an attack succeeds without an applicable
defense or after the defense fails. It updates a source effect whose remaining
charges stay above zero and removes only an effect that reaches zero. The helper
does not inspect arbitrary active effects at consumption time, avoiding a later
re-resolution or a race with stacking changes.

This avoids both rejected alternatives:

- Deleting at attack-roll time incorrectly spends effects on misses.
- Deleting after a generic damage roll can spend an effect on unrelated manual
  damage and loses the guarantee that the source attack was a hit.

### Preserve the pure semantic modifier resolver

Armed effects are not added to `system.ilarisModifiers` and are not processed
by `resolveIlarisModifiers`. That resolver remains side-effect free for dialog
previews and normal roll modifiers. Armed effects use their own, explicit
attack-context resolver because they have a lifecycle and persisted
consumption semantics.

### Display duration and charges as separate effect state

The Held Effekte tab receives view data derived from each applied effect rather
than embedding lifecycle choices in the Handlebars template. Each row exposes
one duration label and an optional charge label. For effects using
`system.ilarisTiming.durationType: "ownerTurns"`, the displayed duration comes
from `system.ilarisTiming.remaining`, because that is the counter that actually
controls expiry. All other timed effects display the prepared native duration
from [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html),
which is maintained by `ActiveEffect#updateDuration`. Armed effects additionally
display `Ladungen: <remaining>` from `system.ilarisArmedCombat`.

This deliberately does not merge duration and charges: a charged effect can
expire due to its normal duration with charges left, or exhaust its charges
while duration remains. Effects without a finite duration or armed charge data
show neither label.

### Initial source configurations

- Falkenauge Meisterschuss arms the caster for one successful ranged attack and
  contributes its configured AT bonus. It uses an explicit one-charge
  configuration; its existing Mächtige-Magie behavior remains independent from
  charge amplification unless the source data opts in.
- Neun Streiche in einem presents `Bisherige Treffer auf Ziel` during casting,
  clamps the stored count to `0..8`, contributes that many `W6` to the next
  successful attack's damage, and decrements on each confirmed hit. Its optional
  Mächtige Liturgie attack bonus and any extra-charge policy are configured
  separately from the count-based damage.

## API Surface

- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  the existing processor creates embedded effects with `ActiveEffect.createDocuments`;
  the custom TypeDataModel adds the validated runtime payload under `system`.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  `Actor#allApplicableEffects` remains appropriate for read-only semantic
  modifiers, while `Actor#updateEmbeddedDocuments` decrements and
  `Actor#deleteEmbeddedDocuments` removes only exhausted armed source effects
  owned by the attacking Actor.
- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html):
  the existing `UebernatuerlichDialog` AppV2 context and Handlebars part render
  the declared numeric controls; no new application class is introduced.
- System hooks: the existing `Ilaris.postAngriff`, `Ilaris.postVerteidigung`,
  and `Ilaris.postSchaden` are system-defined events, not Foundry core hooks.
  The implementation will use a shared helper at their established local
  resolution points rather than assume a Foundry hook signature. A public
  `Ilaris.confirmedHit` hook is out of scope unless a consumer is identified.
- Utilities: `foundry.utils.deepClone` remains the existing safe way to isolate
  item-sheet pre-effect arrays before mutation. The Foundry community-wiki URLs
  referenced by repository configuration returned 404 during design research;
  no undocumented wiki helper is assumed.

## Risks / Trade-offs

- [A source effect is decremented or deleted before its damage is rolled] -> Keep the
  materialized contribution in the attack-context snapshot, not in a fresh
  ActiveEffect lookup.
- [A miss consumes a charge] -> Invoke charge decrement only through the common
  confirmed-hit helper after direct success or failed defense resolution.
- [Mächtige Magie silently changes charges unexpectedly] -> Require an explicit
  `charges.amplifiedByMaechtigeMagie` opt-in and a non-negative integral
  `charges.maechtigBonus`.
- [An arbitrary formula input becomes unsafe or hard to validate] -> Limit the
  first reusable input type to bounded integers and use configured per-unit
  formulas.
- [Several targets can resolve from one attack] -> Decrement once for the first
  confirmed target; preserve the existing combat system's target/damage behavior
  rather than inventing a new multi-target rules engine.
- [Legacy data lacks armed fields] -> Treat omitted `armedCombat` as disabled;
  no migration is required.
- [The sheet displays the wrong duration counter] -> Derive one explicit
  duration display value per effect, preferring owner-turn timing only when it
  is the active expiry mechanism and otherwise using Foundry's prepared native
  duration.

## Migration Plan

1. Add defaults to the pre-effect and ActiveEffect data models so existing
   source data validates unchanged.
2. Deploy the helper and dialog support before adding the two compendium
   configurations.
3. Run `npm run pack-all` after editing `_source` JSON.
4. Roll back by removing the two source configurations; effects already created
   with `system.ilarisArmedCombat` remain harmless inert data if the resolver is
   absent, and can be deleted normally from the Actor.

## Open Questions

- None for the first implementation. More trigger families, target-bound input
  values, automatic hit counting, and a public confirmed-hit hook remain
  follow-up candidates.

## Testing Strategy

- Unit-test pure normalization/materialization and the armed attack-context
  resolver with direct object fixtures. Follow the existing dynamic-import and
  Jest mock pattern in `scripts/effects/pre-effects/_spec/` and
  `scripts/combat/_spec/` for Foundry globals and embedded-document methods.
- Cover source effect retention on misses/ineligible attacks, exact once-only
  decrement on a confirmed hit, removal at zero, persisted bounded numeric
  values, opt-in charge amplification, and preserved snapshot damage after an
  update or deletion.
- Extend `supported-spell-data.spec.js` for source JSON and existing
  pre-effect processor tests for effect payload creation.
- Add an actor-sheet context/template test covering owner-turn duration, native
  duration, armed charges, and effects with neither display value.
- Add one E2E flow using the baseline `HatAlles` actor and existing spell-dialog
  helpers: cast Neun Streiche with an entered count and multiple charges,
  resolve successive successful attacks, observe the damage contribution, and
  verify removal only after the final charge. Re-run E2E-009, E2E-027, and
  E2E-028 as regressions.
