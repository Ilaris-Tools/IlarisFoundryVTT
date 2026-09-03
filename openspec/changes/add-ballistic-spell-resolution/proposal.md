## Why

Ballistic spells currently apply their Pre-Effects immediately after a
successful casting roll. They therefore bypass the ranged-defense sequence
required by the rules. _Ignifaxius Flammenstrahl_ is the
first P2 consumer, but the missing behavior is common to every explicitly
ballistic spell and must not be implemented as a spell-specific exception.

## What Changes

- Introduce an explicit ballistic marker in supernatural spell source data and
  a common resolution path for marked spells.
- After a successful cast against a selected target, run the existing
  ranged-defense flow, including the target's available
  defense modifiers. Apply damage and all further Pre-Effects only after the
  target has not defended successfully.
- Author the marker for the current ballistic spell sources, including
  _Ignifaxius Flammenstrahl_. The change deliberately does **not** implement
  elemental side effects or _Nachbrennen_; those are owned by
  `add-nachbrennen-effect`.
- Keep ordinary targeted spells, zones, magic-resistance challenges, and
  unmarked legacy sources on their current resolution paths.

This changes existing successful-cast behavior for marked spells. It is
otherwise additive and removes no released user capability.

## Capabilities

### New Capabilities

- `ballistic-spell-resolution`: Resolves explicitly marked supernatural spells
  through ranged defense before target Pre-Effects are applied.

### Modified Capabilities

- `spell-pre-effect-data`: Supernatural Item source data can identify a spell
  as ballistic and current ballistic spell sources author that marker.
- `combat`: Targeted supernatural casts can enter the established ranged
  defense lifecycle before their rule effects resolve.

## Impact

- Primary code paths are `scripts/combat/dialogs/uebernatuerlich.js`, the
  common combat-dialog target state, and the existing defense-prompt handlers;
  tests extend the supernatural-roll and combat-dialog suites. Authoritative
  spell JSON under `comp_packs/zauberspruche-und-rituale/_source/` changes and
  requires `npm run pack-all`.
- The runtime works with selected target [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
  data, emits the existing system `Ilaris.postAngriff` event, and creates the
  existing defense [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
  prompts. No new Foundry core Hook is introduced.
- The existing `foundry.utils.randomID` utility continues to identify defense
  prompt events; no new `foundry.utils.*` helper is proposed. The community
  API guidance must be checked for a supported geometry/visibility helper
  before implementation.
- No migration, new setting, persistent document, or new rendered dialog
  layout is introduced.

## Testing Impact

- Unit: extend `scripts/combat/_spec/uebernatuerlich_roll.spec.js` and the
  relevant combat-dialog/defense handler suites to cover marker recognition,
  successful and failed defense gating, no-target and unmarked compatibility.
  Extend
  `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` to assert
  the authored ballistic sources.
- E2E/runtime: add a focused scenario in `ilaris-e2e-world-v14363-r1` with an
  active GM, a caster who owns _Ignifaxius_, and an owned target Token on an
  active Scene. Through the visible cast and defense chat path, assert that a
  defended target receives neither damage nor later Pre-Effects, while an
  undefended target does. Reuse the
  current `e2e/shared/fixtures/foundry.ts` targeting and defense helpers;
  promote a helper only when the scenario proves it reusable.
- Existing targeted-spell, ranged-defense, magic-resistance, and zone E2E
  cases are regression coverage. Capture a screenshot of the real chat/defense
  path as runtime evidence; the unchanged supernatural dialog must retain its
  target list, roll controls, and summaries in the documented order.
