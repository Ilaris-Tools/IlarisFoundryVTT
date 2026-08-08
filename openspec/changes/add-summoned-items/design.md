## Context

The existing pre-effect processor applies immediate damage or creates a timed
Actor ActiveEffect. It has no operation that creates an Item for a selected
target. Owner-turn timing already expires effects through combat hooks, and
the actor's configured `waffenPacks` setting already provides a catalog of
weapon compendium packs.

Physical summons must exist as owned Items so that their normal weapon data,
transferred effects, and inventory presentation apply to the target. They must
also retain independent lifecycle identity: a second cast must neither replace
nor delete the first copy in any supernatural stacking mode.

## Goals / Non-Goals

**Goals:**

- Add a generic `summonItem` pre-effect operation that creates a configured
  compendium Item on every selected target.
- Select a summon source from the Item compendia selected by `waffenPacks` and
  store its UUID.
- Mark summoned weapons as the target's main weapon, give every copy
  owner-turn expiry, and remove only the matching clone when that timer ends.
- Materialize spell-specific Item overrides, including Mächtige Magie, before
  cloning the Item.
- Expand linear semantic modifier parsing to W3 and W20 alongside W6.

**Non-Goals:**

- Automate disappearance after a non-combat Item use. Attack-based one-use
  removal is covered by the charged armed-effect lifecycle.
- Automate transformations, enchantments of existing Items, zones, or
  creatures.
- Automate maneuver-selected subspells, including Fortifex' Schimmernder
  Schild. Its creation is currently only reachable through maneuver selection
  and requires a separate change to expose that context to pre-effects.
- Represent flavor-only materializations, including Speisung der Bedürftigen's
  Heiliger Kessel, as summoned Items. They remain player- and GM-described.
- Infer missing weapon or object statistics from rule text. The audited source
  Items are manual content work and block implementation.
- Restore a previously selected main weapon when a summoned weapon expires.
- Add real-time duration expiration; summons use owner turns only.

## Decisions

### Use a distinct `summonItem` pre-effect operation

`summonItem` is structurally separate from native ActiveEffect changes and
instant damage. It references a source UUID, optional Item-data overrides, and
an owner-turn duration. This avoids treating document creation as a synthetic
numeric effect and keeps existing pre-effects backward compatible.

Alternative: encode summoning as a special `changes.key`. Rejected because
native effect changes target prepared data, cannot own an embedded Item, and
cannot model per-copy cleanup safely.

### Clone the compendium source as an Actor-owned Item

The processor resolves the configured source from an allowed pack, uses
`Item#toObject(true)` and `foundry.utils.deepClone` to prepare data, removes
the source `_id`, applies configured overrides, and uses
`Actor#createEmbeddedDocuments('Item', [data])`. The clone records its source
UUID, caster and spell metadata, pre-effect index, and a fresh application ID
in `flags.ilaris`.

The Item source stays authoritative for its base statistics and any
transferred ActiveEffects. The created clone is not a link to the compendium.

Alternative: create an Actor ActiveEffect containing a virtual weapon.
Rejected because combat and inventory flows consume actual owned Items, while
[Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects)
already includes an owned Item's transferred effects.

### Use the configured weapon-pack catalog, but keep the operation type-generic

The pre-effect sheet presents source Items from the existing `waffenPacks`
setting. The operation is named `summonItem`, not `summonWeapon`, and accepts
any selected Item source; the initial audited content happens to focus on
weapons and other physical objects. The stored UUID is validated against the
currently configured catalog at execution time.

Alternative: create a separate world setting for summon sources. Rejected:
the user selected the existing catalog as the authority, and duplicating pack
configuration creates divergent availability.

### Every summoned copy gets a linked owner-turn marker

After creating a clone, the processor creates one ordinary marker ActiveEffect
on the same target. Its `system.ilarisTiming` uses `ownerTurns`, retains the
existing duration rules, and records the created Item ID and application ID.
When the existing timer processor reaches expiry, it first calls
`Actor#deleteEmbeddedDocuments('Item', [summonedItemId])`, then deletes the
marker. A missing or manually deleted clone is a safe no-op.

The timer must not use the supernatural stacking replacement behavior. Each
cast produces a new application ID and a separately expiring Item, even in
Foundry stack mode.

Alternative: put timing data solely on the Item. Rejected because the project
already displays and processes owner-turn timers as Actor ActiveEffects.

### Reuse charged armed effects for attack-based one-use summons

A manually reviewed source weapon that disappears after an eligible attack
defines a transferable `ilarisArmedCombat` effect with one or more charges and
an explicit `onExhaust: "deleteOwningItem"` terminal action. Its cloned Item
retains that effect. The existing armed-attack resolver snapshots the attacking
owned Item ID together with eligible effects. A source-Item-only effect is
eligible only when its transferred effect belongs to that exact Item; ordinary
actor-level armed effects retain their existing broader scope.

The resolver consumes one charge on every matching attack, including a miss or
a successful defense. On the final charge of an opted-in transferred effect it
deletes the owning summoned Item through `Actor#deleteEmbeddedDocuments`, then
deletes the owner-turn marker with the same Ilaris application ID. It does not
infer any non-combat Item use. This extends the implemented custom ending
mechanism rather than introducing a generic post-roll hook.

Alternative: wait for a generic Item-use event. Rejected for attack-based
sources because the existing charged attack lifecycle already supplies the
necessary resolution point and charge semantics, while a generic event would
broaden scope without improving this case.

### Make a summoned weapon the current main weapon

When the clone is `nahkampfwaffe` or `fernkampfwaffe`, it receives
`system.hauptwaffe: true`. Existing main weapons of the same type are cleared
in the same Actor embedded-document update so the current summon is selected
unambiguously. Expiry only removes the summoned clone; it does not restore an
older selection.

Alternative: leave selection to the player. Rejected because the requested
meaning of “in hand” explicitly includes Hauptwaffe selection.

### Materialize summon overrides on the clone

The summon configuration exposes Item-data overrides with the same
Mächtige-Magie materialization convention as pre-effect values. They are
applied to the clone before creation, so a bonus belongs to that particular
summon and disappears with it. Authoring the canonical source Item's
transferred effects remains the preferred representation for persistent
Item-owned effects; overrides cover spell-specific values such as weapon
modifier and TP formula adjustments.

Alternative: add Actor-level modifiers for all summon bonuses. Rejected
because they can affect unrelated weapons that share a skill or talent.

### Generalize only the safe linear dice parser

`parseIlarisModifierValue` accepts linear additive W3, W6, and W20 terms,
with expected values of 2, 3.5, and 10.5 per die respectively. It continues
to reject arbitrary expressions and non-linear multiplication/division. This
supports configured rules such as `+1W20` without widening the parser into an
arbitrary formula evaluator.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  `createEmbeddedDocuments`, `deleteEmbeddedDocuments`,
  `updateEmbeddedDocuments`, and `allApplicableEffects`.
- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html):
  `toObject(true)` and `transferredEffects`.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  the existing marker document and its `delete` lifecycle.
- [combatTurn](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html):
  `(combat, updateData, updateOptions)`; existing listener remains the
  owner-turn timing entry point.
- [combatRound](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html):
  `(combat, updateData, updateOptions)`; existing listener covers the final
  combatant when a round wraps.
- [updateDocument](https://foundryvtt.com/api/v14/functions/hookEvents.updateDocument.html):
  `(document, changed, options, userId)`; the existing `updateCombat` listener
  follows this generic signature and completes turn-end expiry.
- `foundry.utils.deepClone` is used when preparing source Item data. The
  [community helper documentation](https://foundryvtt.wiki/en/development/api/helpers)
  was checked; implementation must recheck it for a built-in helper before
  adding any data-copy utility.

No generic post-roll hook is introduced. The existing armed-attack resolution
path is extended with an attacking Item snapshot and an opt-in terminal action
for transferred effects belonging to a summoned Item.

## Risks / Trade-offs

- [Manual source Item work is incomplete] → Do not begin `/opsx:apply` until
  every audited Item has been created and reviewed manually.
- [Source pack is disabled or an Item is deleted] → Validate the UUID against
  the configured catalog at cast time, notify the user, and create nothing.
- [Item creation succeeds but marker creation fails] → Compensate by deleting
  the just-created clone and report the failure.
- [A clone is manually removed before expiry] → Treat the cleanup reference as
  idempotent and still remove its marker.
- [Selecting a summoned weapon replaces the current primary weapon] → This is
  deliberate “in hand” behavior; expiry does not attempt to restore state.
- [Source-Item effect applies to another weapon] → Snapshot the attacking Item
  ID and require the transferred effect's parent Item to match it.
- [Final charge deletes an Item but leaves timing state] → Delete the linked
  owner-turn marker by its shared application ID in the same resolution.
- [Source text specifies a non-combat disappearance rule] → Do not configure
  the terminal action; retain manual GM/player handling.

## Migration Plan

The feature is opt-in: existing pre-effects contain no `summonItem` operation
and retain their behavior. Add manual source Items and source UUIDs only after
review, then run `npm run pack-all`. Rolling back removes new summon
configurations; existing actor clones and marker effects can be removed using
their `flags.ilaris` provenance.

## Testing Strategy

- Unit-test pure source validation, clone-data preparation, Item override
  materialization, and W3/W20 parser values with the existing Jest/mock style.
- Extend the pre-effect processor tests with mocked
  `createEmbeddedDocuments`, `updateEmbeddedDocuments`, and
  `deleteEmbeddedDocuments` calls for target fan-out and independent copies.
- Extend owner-turn timing tests with linked-item cleanup cases.
- Extend armed-effect tests with transferred source-item matching, miss and
  defense consumption, final-charge Item and marker deletion, and preservation
  of ordinary actor-level armed effects.
- Add a Playwright scenario using the existing GM and `HatAlles` fixture to
  cast onto a selected target, inspect the target inventory and main-weapon
  state, consume an attack-based one-use clone, advance owner turns, and verify
  only the matching clone or marker expires.
- Regression-test E2E-027 and E2E-028 because both exercise the pre-effect
  authoring surface and persistent application pipeline.

## Open Questions

None. Attack-based one-use disappearance is covered by the existing charged
effect lifecycle; non-combat use conditions remain explicitly out of scope.
