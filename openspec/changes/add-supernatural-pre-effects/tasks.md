## 1. Data Model

- [ ] 1.1 Add `preEffects` ArrayField to `createUebernatuerlichTalentFields()` in `scripts/items/model-data/models.js` with schema: `baseDuration`, `instant`, `amplifiedByMaechtigeMagie`, `change` (key, type, value, maechtigBonus, priority), `avoidTest` (enabled, fertigkeit, attribut, diminishedOnly, diminishedValue)
- [ ] 1.2 Verify against Foundry API docs (v14) for `fields.ArrayField` and `fields.SchemaField` constructors
- [ ] 1.3 Run `npm test` to confirm data model changes don't break existing tests
- [ ] 1.4 Run `npm run lint` to confirm code style

## 2. Pre-Effects Subsystem

- [ ] 2.1 Create `scripts/effects/pre-effects/` directory with `pre-effects-processor.js`
- [ ] 2.2 Implement `_applyPreEffects(rollResult)` in `pre-effects-processor.js` — iterates targets and preEffects, handles instant vs. ActiveEffect creation, self-cast bonus, Mächtige Magie amplification
- [ ] 2.3 Implement `_createActiveEffectFromPreEffect(target, preEffect, caster, spellItem)` — creates IlarisActiveEffect with ilarisTiming, origin, and flags
- [ ] 2.4 Implement `_applyInstantPreEffect(target, preEffect)` — applies change value directly to target actor
- [ ] 2.5 Verify `foundry.dice.Roll` API for formula evaluation of `maechtigBonus` — https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html
- [ ] 2.6 Check foundryvtt.wiki for `foundry.utils.deepClone` and `foundry.utils.mergeObject` patterns

## 3. Resist Test System

- [ ] 3.1 Create `scripts/effects/pre-effects/resist-handler.js`
- [ ] 3.2 Implement socket listener (new `case 'createResistPromptByOwner'` in `scripts/core/init.js`) for routing resist prompts
- [ ] 3.3 Implement `sendResistPrompt(targetActor, preEffect, spellItem)` — creates whispered ChatMessage with serialized preEffect data in `data-*` attributes
- [ ] 3.4 Implement `renderChatMessageHTML` click delegation for `.resist-button` (in `resist-handler.js`, following `defense-button-hook.js` pattern)
- [ ] 3.5 Implement resist resolution: open FertigkeitDialog, fire `Ilaris.postResistTest` hook on completion
- [ ] 3.6 Implement `Ilaris.postResistTest` listener that applies or skips the effect based on resist outcome
- [ ] 3.7 Verify `ChatMessage` API for whispered messages — https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html
- [ ] 3.8 Verify `game.socket` API for emit pattern — https://foundryvtt.com/api/v14/classes/foundry.server.SocketInterface.html

## 4. UebernatuerlichDialog Integration

- [ ] 4.1 Import pre-effects processor in `scripts/combat/dialogs/uebernatuerlich.js`
- [ ] 4.2 Add `this._applyPreEffects(rollResult)` call in `_angreifenKlick()` after `await this.applyEnergyCost(...)` — fire-and-forget (no await)
- [ ] 4.3 Guard: only call `_applyPreEffects` when `rollResult.success` and item has `preEffects.length > 0`

## 5. Testing

- [ ] 5.1 Create `scripts/effects/pre-effects/_spec/pre-effects.test.js` with unit tests for: data model schema, self-cast bonus, Mächtige Magie amplification formula, avoid test logic (full avoid, diminished, failed resist)
- [ ] 5.2 Create `scripts/effects/pre-effects/_spec/resist-handler.test.js` with unit tests for: chat message serialization, resist resolution outcomes
- [ ] 5.3 Run `npm test` to confirm all tests pass

## 6. Validation

- [ ] 6.1 Run `npm run lint` to confirm code style
- [ ] 6.2 Run `npm run pack-all` (no compendium data changes, but verify no build errors)
- [ ] 6.3 Manual test: create a Zauber with a preEffect, cast it on a target, verify ActiveEffect appears
- [ ] 6.4 Manual test: create a Zauber with avoidTest, verify resist prompt appears and resolves correctly
- [ ] 6.5 Manual test: self-cast a spell, verify +1 duration bonus
