## Context

Damage-type behavior is parsed centrally and instant spell damage is applied
through `_applyDamageDirectly`. The effect subsystem already owns target
ActiveEffects, countercheck prompts, owner-turn progression, and independent
condition sources. _Nachbrennen_ needs a one-shot delayed consequence, not a
generic damage-over-time effect and not a duplicate status document.

## Goals / Non-Goals

**Goals:**

- Bind a reusable named elemental side effect to configured fire damage.
- Create a visible pending application on a failed KO-20 check, complete it
  once after four target initiative phases, and allow extinguishing by removal.
- Add _Ignifaxius_ as the first authored consumer after ballistic resolution.

**Non-Goals:**

- No other elemental side effect, no automatic token movement, and no
  _Wand aus Flammen_ or _Ignisphaero_ source implementation.
- No bespoke effects-sheet UI or manual timer counter.

## Decisions

### Keep the trigger on damage-type behavior

Extend the existing optional `behavior` object with an `elementalSideEffect`
string or `null`. Every built-in damage type will author that field explicitly:
`FEUER` uses `nachbrennen`; all other built-ins use `null`. Direct damage resolves the configured type before
dispatching. This allows a world to rebind or omit the behavior and prevents
hard-coding `FEUER` in the Pre-Effect processor. An `Ignifaxius`-only branch
was rejected because later fire consumers would duplicate it.

The setting editor owns the value: it SHALL expose `elementalSideEffect` as an
editable optional value, so a world can remove or rebind `nachbrennen` without
source-code changes. An unregistered non-empty value is inert and reported as
a configuration warning rather than silently treated as Nachbrennen.

### Model pending burn as a source-owned Ilaris condition

Use the existing condition-source ledger with a dedicated `nachbrennen`
status/source payload containing application identity, target timing, and final
wound operation. It stays visible in the normal Actor status/effects surface.
The owner-turn reducer decrements only its source; expiry applies one wound,
posts an outcome, and removes only that source. A generic DOT was rejected:
it ticks repeatedly and does not represent a removable one-shot consequence.

### Treat effect removal as extinguishing

Removing the named pending source through the current effect UI prevents the
completion. Other condition sources remain intact through the existing
source-ledger rules. A new "Löschen" button was rejected because the effects
surface already owns document deletion and confirmation.

## API Surface

- [Actor#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#createEmbeddedDocuments)
  and [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments)
  create/remove target [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  records using the existing condition ledger.
- The documented [combatTurn](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html)
  Hook has signature `(combat, updateData, updateOptions)` and remains the
  owner-turn trigger. Existing registration is extended; no new core hook is
  introduced.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
  records countercheck and one-shot completion results.
- `foundry.utils.randomID` identifies applications and `foundry.utils.deepClone`
  preserves source data. The community wiki must be checked before any new
  helper is introduced.

## Risks / Trade-offs

- **An expiry is processed twice by multiple clients** → reuse the existing
  authoritative owner-turn/GM execution path and record source completion
  before damage; test duplicate turn notifications.
- **One condition source removal erases another** → use the existing
  `removeConditionSource` semantics and test shared sources.
- **The KO check is bypassed by non-damage effects** → dispatch only from the
  resolved direct-damage path; any future effect-only caller must use an
  explicit resolver contract.

## Migration Plan

1. Extend default damage-type data/UI serialization and compatibility defaults.
2. Implement and test the condition lifecycle, then author Ignifaxius and run
   `npm run pack-all` after the ballistic change is present.
3. No user-data migration is required: absent `elementalSideEffect` remains
   inert. Rollback deletes pending new sources safely through normal effects
   management.

## Open Questions

None. Explicit removal is the approved extinguishing rule for this scope.

## Testing Strategy

- Pure Jest: parse legacy and named behavior; resolver dispatch/no-dispatch.
- Jest mocked Actor/ActiveEffect tests: KO success/failure, target-turn count,
  one final wound, idempotence, and source-isolated extinguishing.
- E2E: player-visible countercheck, effect/status appearance, combat advances,
  final chat/wound, and manual effect deletion path. Screenshot the existing
  effects/status and chat surfaces; their current placement remains unchanged.
