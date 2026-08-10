## Context

Ilaris configures Foundry VTT v14 status templates in `CONFIG.statusEffects`.
`Position4` already represents the full Liegend condition: status identity,
icon, localized name, and the native `-4` melee/defence changes. Maneuver
pre-effects currently create unrelated effects with duplicated changes, so the
standard picker cannot identify or manage them as the same condition.

The design must preserve independent causes. A GM's manually applied Liegend
condition and a successful Niederwerfen are both valid causes, but neither may
duplicate the penalty or remove the other when it ends.

## Goals / Non-Goals

**Goals:**

- Represent each configured status condition by at most one ActiveEffect per
  actor, retaining the Foundry status identity and icon.
- Track independent manual and automated condition sources on that effect.
- Apply a status template's native changes exactly once while at least one
  source is active.
- Let source-specific timing or removal remove only that source.
- Convert Niederwerfen and Umreißen to request the canonical Liegend condition.

**Non-Goals:**

- Do not make arbitrary ActiveEffects into status conditions automatically.
- Do not redesign unrelated status templates, existing non-status pre-effects,
  or the general Ilaris modifier stacking rules.
- Do not let a status-picker click silently override an automated rule source.
- Do not introduce user-authored scripts or arbitrary source mutation.

## Decisions

### Condition effects are materialized from status templates

The condition service receives a status ID such as `Position4`, resolves
`CONFIG.statusEffects[statusId]`, and deep-clones its status identity, icon,
name, and native changes into a single embedded ActiveEffect. It adds the v14
status identity (`statuses`) and structured system data, then persists it with
the Actor's embedded-document APIs.

Copying a template at materialization rather than referring to it dynamically
keeps the ActiveEffect a normal Foundry document and uses Foundry's established
status presentation. It is preferable to a flag-only visual overlay because
the actor header and status picker can recognize the condition naturally.

### One effect owns a source ledger

Condition effects store a bounded structured ledger, conceptually:

```js
system.ilarisCondition = {
    statusId: 'Position4',
    sources: [{ id, type: 'manual' | 'preEffect', origin, timing }],
}
```

Each source has a stable random ID and optional source-specific owner-turn
timing. The containing effect remains active while `sources` is non-empty and
contains the template changes once. The effect itself MUST NOT use one global
expiry that can delete other sources; condition timing is processed per source.

This is chosen over one ActiveEffect per source because native changes would
add together. It is also chosen over treating a condition as permanent actor
data because the Foundry status UI and normal effect visibility are valuable.

### Picker operations manipulate only manual sources

When the standard status picker enables an inactive status, the integration
adds a `manual` source. When it is used on an active condition, it removes one
existing manual source only. If no manual source exists, the automated condition
remains intact and the UI communicates that it is rule-created.

This protects rules-generated Liegend from a generic toggle while still
letting GMs add or withdraw an independent manual source. The actor effects
tab exposes condition-source details so the remaining cause is discoverable.

### Pre-effects request a condition; they do not copy changes

The pre-effect schema gains an optional bounded condition reference. A
successful Niederwerfen or Umreißen requests `Position4` with its maneuver
provenance. The generic pre-effect processor routes this to the condition
service instead of creating a separate effect with duplicate changes.

The initial maneuver sources are infinite, matching the current authored
data. The generalized source-timing shape supports future temporary conditions
without replacing the existing owner-turn model.

### Existing owner-turn hooks delegate source timing

The existing GM-only `combatTurn`, `combatRound`, and `updateCombat` lifecycle
remains the timing authority. It additionally asks the condition service to
reduce only sources whose owner-turn timing has reached its expiry point,
updates the ledger, and deletes the effect only if no sources remain.

This reuses current ordering and multiplayer safeguards rather than adding a
second combat hook. Exact hook signatures and effect/status-picker integration
points are verified before implementation.

## API Surface

- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html):
  status-bearing embedded document data and updates.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html):
  `createEmbeddedDocuments`, `updateEmbeddedDocuments`, and
  `deleteEmbeddedDocuments` for atomic condition lifecycle operations.
- [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html):
  existing effect configuration compatibility; no custom condition editor is
  introduced in the first iteration.
- [Hooks](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html):
  existing documented combat timing hooks and the verified status-picker/effect
  lifecycle hook used to intercept manual source operations.
- `foundry.utils.deepClone`, `foundry.utils.mergeObject`, and
  `foundry.utils.randomID`: clone immutable config data, build structured
  updates, and assign stable source IDs. The implementation must verify the
  relevant helper behavior in the community wiki before use.

## Risks / Trade-offs

- [Core status-picker interaction may create/delete an effect before the
  integration can add a ledger] → verify the v14 status API/hook sequence and
  intercept at the documented pre-operation point; test both manual paths.
- [A ledger update races with two clients] → retain the GM-only timing owner,
  use stable source IDs, and re-read the current effect before each mutation.
- [An old manually created Position4 effect has no ledger] → normalize it as a
  manual source on first interaction rather than discarding it.
- [Template changes are later edited] → existing condition documents retain
  their materialized changes; a future explicit migration can refresh them.
- [A status remains visible after manual removal] → show the remaining source
  in the effect row and notify when an automated source keeps the condition.

## Migration Plan

1. Add optional condition source data and normalization for legacy
   status-bearing effects.
2. Implement the condition service and status-picker bridge, with unit tests.
3. Route Niederwerfen and Umreißen to `Position4`, remove their copied native
   changes, and run `npm run pack-all`.
4. Run the configured Foundry E2E world tests before release.
5. Rollback preserves normal ActiveEffects: condition ledger data can be
   ignored and effects remain manually deletable.

## Open Questions

- Which documented v14 status-picker operation provides the narrowest reliable
  interception point for replacing a core toggle with a manual source update?
- Should the first source ledger expose a GM-only "remove automated source"
  action in the actor effect row, or leave source removal solely to its owning
  game rule?

## Testing Strategy

- Unit-test pure template materialization and ledger reduction in a new
  condition-service spec. Extend `combat-turn-hooks.spec.js` and
  `pre-effects-processor.spec.js` using current dynamic-import/Jest mock
  patterns; test legacy normalization with object fixtures.
- Unit-test picker routing with a mocked Actor and embedded effect collection:
  manual add, manual remove, automated-only protection, and final-source
  deletion.
- Add a Foundry E2E case in the dedicated baseline world: create Liegend via a
  maneuver, add and remove a manual source through the status picker, verify
  the condition stays while an automated source exists, then verify final
  source removal clears it. Reuse existing actor/effect fixture helpers and
  extract a status-picker helper into `e2e/shared/` only if another case needs
  it.
