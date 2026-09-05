## Context

`UebernatuerlichDialog` posts a successful cast and directly calls
`applyPreEffects`. The ordinary ranged dialog already sets `attackType:
"ranged"`, publishes the existing system `Ilaris.postAngriff` event, and lets
the defense handlers route a target-owned defense prompt. Ballistic spells
need that outcome gate without pretending to be a weapon or duplicating the
prompt protocol.

## Goals / Non-Goals

**Goals:**

- Give an explicitly authored ballistic spell the rule order: successful cast,
  ranged defense, then target effects only when not defended.
- Keep its source declaration independent of any concrete spell and author the
  declaration for current ballistic sources.
- Reuse the current selected-target and defense-routing behavior.

**Non-Goals:**

- No elemental effect, _Nachbrennen_, zone, magic-resistance, cover, or new
  targeting UI implementation.
- No line-of-sight, cover, or collision check.

## Decisions

### Add a normalized source marker and branch before Pre-Effects

Add a `ballistic` profile to the supernatural source/model normalization and
resolve it inside `_resolveSuccessfulSpellEffects`. This puts the gate at the
single point immediately before the existing Pre-Effect path. A spell-name
allowlist was rejected because new ballistic sources would require code edits;
putting the branch after `applyPreEffects` was rejected because it cannot undo
damage or effect creation.

### Adapt the existing ranged-defense transaction

Build a small ballistic-outcome adapter rather than instantiate
`FernkampfAngriffDialog`: the cast roll remains a supernatural roll, while the
adapter reuses the established selected-target, serialized-prompt, owner
routing, and final outcome semantics for an `attackType` of `ranged`. Directly
using the weapon dialog would expose weapon controls and calculate FK instead
of preserving the spell result.

The serialized ranged prompt carries a generated ballistic resolution ID. The
target owner sends exactly one defended or undefended result over the existing
Ilaris system socket, and the initiating client consumes that ID once before
applying the corresponding target's Pre-Effects. This retains ownership-aware
prompt routing while preventing late or duplicate socket delivery from
reapplying effects.

### Preserve one gated completion per target

Each target receives an independent defense outcome. Only an undefended target
is handed to `applyPreEffects`; a successful defense produces an informative
chat outcome and no application. This reuses target-specific unlinked-token
context and prevents one target's defense from suppressing another target's
spell effects.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
  provide the selected target/caster context; no document mutation is added.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
  remains the visible defense prompt and outcome transport.
- No Foundry core Hook is added. The existing Ilaris custom `Ilaris.postAngriff`
  dispatch is extended only after its prompt contract is kept compatible.
- `foundry.utils.randomID` remains the existing event-ID helper. The wiki check
  is a required task before introducing any geometry or clone helper.

## Risks / Trade-offs

- **A defense result applies effects twice** → make the completion callback
  idempotent per cast/target and test duplicate prompt delivery.
- **Unlinked tokens resolve the wrong Actor** → retain the selected
  `tokenId`/`actorLink` context and cover it with current defense routing tests.

## Migration Plan

1. Add source/model support and author existing ballistic spell sources.
2. Run `npm run pack-all`, then deploy the resolution gate with unit and E2E
   coverage.
3. Rollback removes the marker and gate together; unmarked sources retain
   their current direct Pre-Effect behavior. No world migration is needed.

## Open Questions

None.

## Testing Strategy

- Pure Jest: source normalization/data assertions and an `Object.create`
  `UebernatuerlichDialog` flow test with mocked defense outcomes.
- Jest module/mock tests: existing defense handler and target-context cases
  cover owner routing and idempotent completion.
- E2E: visible target selection, casting, defense chat choice, no-effect
  defended result, and effect-producing undefended result.
  Screenshot the existing dialog and chat path; no layout insertion is allowed,
  so target list, roll controls, and summaries must stay visible in their
  existing top-to-bottom order.
