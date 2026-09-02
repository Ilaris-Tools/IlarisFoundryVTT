## Context

`ManoeverItem` currently provides dialog-time `modifications` only. By
contrast, supernatural `preEffects` already materialize native ActiveEffects,
semantic Ilaris modifiers, resist prompts, and owner-turn duration. The two
combat dialogs already express the affected actor consistently through
`selectedActors`: attacks select defenders, and a defense dialog assigns its
attacker as the selected target.

The existing weapon-property `targetEffect` schema is only a separate data
channel in this scope; it is deliberately not integrated or migrated.
Runtime-generated maneuver objects from a spell or liturgy's
`system.modifikationen` string are also excluded: they are synthesized by
`CombatItem._parseModifikationen()` rather than persisted `manoever` Items and
require separate authoring and lifecycle decisions.

## Goals / Non-Goals

**Goals:**

- Give selected maneuvers the same declarative `preEffects` payload and
  materialized ActiveEffect lifecycle as supernatural Items.
- Trigger maneuver effects only after a final combat outcome, using the dialog
  target relationship already present in `selectedActors`.
- Reuse the generic resistance flow for Niederwerfen and implement a
  source-linked, player-triggered opposed escape ending for Umklammern.
- Preserve all existing spell, liturgy, Anrufung, immediate maneuver
  modification, and owner-turn timing semantics.

**Non-Goals:**

- Do not integrate, migrate, or remove weapon-property `targetEffect` data.
- Do not add pre-effects, selector inputs, or effect-ending behavior to
  runtime-generated spell/liturgy maneuvers from `system.modifikationen`.
- Do not automate a per-turn Umklammern escape prompt; the affected actor
  explicitly chooses when to spend the Konflikt action and click
  `Befreiungsprobe`.
- Do not replace generic maneuver `modifications`, damage resolution, or the
  existing combat defense protocol.
- Do not provide arbitrary user scripts for effect activation or ending.

## Decisions

### Reuse `preEffects` with a source-specific activation field

`system.preEffects` is added to maneuver Items with the established payload:
native `changes`, `ilarisModifiers`, optional `avoidTest`, duration, and other
supported pre-effect operations. A maneuver entry adds `activation`, limited
to `onConfirmedHit` and `onSuccessfulDefense`. Supernatural Items retain their
implicit successful-cast activation and existing data requires no migration.

This preserves one authoring vocabulary and one effect-materialization
service. A separately named `outcomeEffects` array was rejected because it
would duplicate the same schema, UI, tests, and lifecycle solely to describe a
different trigger.

### Resolve only final combat outcomes

Combat dispatches selected maneuver pre-effects after the relevant attack has
been resolved against its defender. `onConfirmedHit` runs only when the
attacker wins the attack-versus-defense resolution; `onSuccessfulDefense` runs
only when the defender wins. The dispatcher passes the same selected target
list that the dialog already owns.

This prevents effects from being created merely because an attack roll was
successful before a defense negates it. It also makes Binden naturally target
the attacker, because that actor is the defense dialog's selected target.

### Extract a source-neutral effect and resistance service

The current pre-effect processor and resistance handler are refactored behind
an application context carrying source Item, source actor, target actor,
application ID, pre-effect index, duration, and optional maneuver input
values. Source-specific stacking replacement remains only in the
supernatural-cast entry point; maneuver applications do not inherit spell
replacement semantics.

The materialized ActiveEffect flags record `sourceType: "maneuver"`, the
maneuver UUID, the source Actor UUID, and the application ID. This gives
visible effects durable provenance and lets an ending resolve the current
maneuver user.

### Model Umklammern escape as a bounded effect ending

An ActiveEffect may contain a structured `system.ilarisEnding` object with the
fixed `opposedEscape` kind. The actor effect row renders `Befreiungsprobe` only
for the affected actor when the ending is present. The first dialog lets that
actor choose GE or KK and displays the current PW. It then creates a whispered
chat prompt for the maneuver user, who performs the counter-check using the
existing attacker-versus-defender result convention. A successful escape calls
`Actor#deleteEmbeddedDocuments("ActiveEffect", [effect.id])` only for the
linked effect.

Persisting `sourceActorUuid`, `effectUuid`/effect ID, and an interaction nonce
in the prompt context prevents a stale, duplicate, or unrelated chat action
from deleting another grapple. If the source actor or eligible controlling user
cannot be resolved, the GM receives the counter-check prompt.

The existing charge-specific `onExhaust` behavior remains independent. It is
not generalized into arbitrary custom JavaScript endings.

### Complete the general maneuver selector input for Entwaffnen

The maneuver model already anticipates a `SELECTOR` input, but the choice
schema, authoring controls, and combat-dialog rendering are incomplete. This
change completes that generic input type: an Item author supplies an ordered
choice list, the combat dialog renders a dropdown with an empty default, and a
non-empty selection activates the maneuver while its ordinary modifications
still use one application unit.

Entwaffnen uses that selector with `Hauptwaffe` and `Nebenwaffe`. After the
normal KK resistance gate, its fixed `deselectEquippedWeapon` operation clears
the corresponding selection flag from the target's weapon in that slot. It
does not move, delete, or otherwise model the dropped weapon in this iteration.
If the selected slot has no weapon on a target, the operation reports this and
does nothing for that target.

A generic Item-path editor or arbitrary script was rejected: neither is needed
for the reviewed rule and either would permit unrelated Actor/Item mutations.

### First compendium coverage

- Binden: successful defense; targets the attacker; creates a one-owner-turn,
  `turnEnd` VT penalty. Because the attacker holds the effect and it lasts
  through that actor's next initiative phase, existing owner-turn timing is
  sufficient.
- Niederwerfen: confirmed hit; targets the defender; uses a KK resistance gate;
  a failed test creates `Liegend`.
- Umreißen: confirmed hit; targets the defender; uses the same Liegend and
  resistance lifecycle as Niederwerfen, with its reviewed GE/KO rule data.
- Umklammern: confirmed hit; targets the defender; creates the persistent
  penalty/GS effect and its `opposedEscape` ending.
- Entwaffnen: confirmed hit; targets the defender; uses its Hauptwaffe/
  Nebenwaffe selector, a KK resistance gate, and clears the selected slot on
  failure.

## API Surface

- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  embedded effect data, `delete`, and custom type-data fields.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  `allApplicableEffects`, `createEmbeddedDocuments`, and
  `deleteEmbeddedDocuments` for effect lifecycle operations.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html):
  `create` for the whispered counter-check prompt.
- [Hooks](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html):
  the existing system `Ilaris.postSkillRoll` callback; no new Foundry core hook
  is required for combat outcome dispatch because the dialogs own that result.
- [Combat `combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html):
  existing owner-turn timing remains unchanged and its documented
  `(combat, updateData, updateOptions)` signature must be retained.
- `foundry.utils.deepClone`, `foundry.utils.expandObject`, and
  `foundry.utils.randomID` are reused for form data, effect payloads, and
  interaction/application identities. The implementation must use
  `fromUuid` for persisted Actor UUID resolution.

The official API confirms that embedded effects belong to their parent Actor
and that `Actor#deleteEmbeddedDocuments` deletes the supplied IDs. The
community wiki further confirms ActiveEffect embedding semantics, advises
`deepClone` for plain data snapshots, and notes that Hook callbacks are local
and not awaited; therefore the chat/socket routing must remain explicit.

## Risks / Trade-offs

- **Outcome dispatch may run twice during multiplayer defense handling** →
  Persist and check an application/interaction ID before creating or resolving
  an effect, and add multi-client E2E coverage.
- **A stale chat button could remove the wrong grapple** → validate the effect
  exists on the acting target, its ending kind, source UUID, and nonce before
  resolving or deleting it.
- **The source actor has no active owner** → route the counter-check prompt to
  an active GM; do not silently resolve or delete the effect.
- **An attribute choice becomes stale after an actor update** → display current
  PW when the dialog opens and use the submitted roll result, rather than
  persisting a calculated PW on the effect.
- **The generic pre-effect refactor regresses spell behavior** → keep existing
  supernatural entry points and run their unit/E2E regressions unchanged.
- **Entwaffnen's chosen slot has no equipped weapon on a target** → show a
  clear user-facing notice and perform no Item update for that target.

## Migration Plan

1. Add optional maneuver pre-effect fields and optional effect-ending fields;
   absent fields preserve current Items and ActiveEffects.
2. Implement and test the shared application context before connecting combat
   dispatch.
3. Author the three maneuver compendium entries in `_source/`, run
   `npm run pack-all`, and validate in the configured Foundry world.
4. Rollback is data-safe: remove maneuver pre-effect entries and ending data;
   already-created effects remain ordinary deletable ActiveEffects.

## Open Questions

- The exact comparison presentation for the maneuver user's counter-check
  should follow the existing combat attacker-versus-defender result convention;
  implementation discovery must confirm whether it can reuse a dialog directly
  or needs a small dedicated attribute-counter dialog.

## Testing Strategy

- Unit-test pure activation filtering, generic effect-payload construction,
  UUID/nonce validation, source fallback to GM, success/failure deletion, and
  generic selector behavior and the bounded Entwaffnen slot update.
  Extend `pre-effects-processor.spec.js`, `resist-handler.spec.js`, maneuver
  item/sheet specs, effect-row specs, and melee-combat specs using their
  existing Jest mock and dynamic-import patterns.
- Add focused dialog tests for selected-target propagation: attack-to-defender
  and defense-to-attacker.
- Add E2E cases in the running Foundry world with a GM and two controllable
  actors for Binden, Niederwerfen, Umreißen, Entwaffnen, and Umklammern.
  Verify chat routing, GE/KK/PW selection, persistent Liegend/hold effects,
  the selected-slot update, persistence after failed escape, and deletion
  after a successful escape. Extract repeated chat interaction helpers into
  `e2e/shared/` only if multiple cases use them.
