## 1. Data Model

- [ ] 1.1 Add `preEffects` ArrayField to `createUebernatuerlichTalentFields()` in `scripts/items/model-data/models.js` with schema: `baseDuration`, `instant`, `changes` (ArrayField of SchemaField with: `key`, `type`, `value`, `amplifiedByMaechtigeMagie`, `maechtigBonus`, `damageType`, `priority`), `avoidTest` (enabled, fertigkeit, attribut, diminishedOnly, diminishedValue, resistDifficulty)
- [ ] 1.2 Verify against Foundry API docs (v14) for `fields.ArrayField` and `fields.SchemaField` constructors
- [ ] 1.3 Run `npm test` to confirm data model changes don't break existing tests
- [ ] 1.4 Run `npm run lint` to confirm code style

## 2. Pre-Effects GUI (Item Sheet)

- [ ] 2.1 Add `preEffects` PARTS entry to `UebernatuerlichTalentSheet` static PARTS with template `systems/Ilaris/scripts/items/templates/pre-effects.hbs`
- [ ] 2.2 Create `scripts/items/templates/pre-effects.hbs` — renders `system.preEffects` array as editable cards; each card shows: baseDuration input, instant checkbox, changes list (each change: key input, type select, value input, amplifiedByMaechtigeMagie checkbox, maechtigBonus input shown conditionally, damageType select (PROFAN/STUMPF), priority input) with add/remove change buttons, avoidTest toggle + conditional sub-fields (inkl. resistDifficulty), delete pre-effect button; "Add Pre-Effect" button at bottom
- [ ] 2.3 Create `scripts/items/styles/pre-effects.css` for pre-effects section styling
- [ ] 2.4 Verify form field `name` attributes follow the pattern `system.preEffects.<index>.<property>` for proper Foundry form binding
- [ ] 2.5 Run `npm run lint` to confirm code style

## 3. Pre-Effects Subsystem

- [ ] 2.1 Create `scripts/effects/pre-effects/` directory with `pre-effects-processor.js`
- [ ] 3.2 Implement `_applyPreEffects(rollResult)` in `pre-effects-processor.js` — iterates targets (using `resolveTargetActorForDamage()` for unlinked token support) and preEffects, computes effective duration as `baseDuration + maneuverDurationBonus (+1 if self-cast)`, handles instant vs. ActiveEffect creation, Mächtige Magie amplification
- [ ] 3.3 Implement `_createActiveEffectFromPreEffect(target, preEffect, caster, spellItem)` — creates IlarisActiveEffect with ilarisTiming, origin, and flags
- [ ] 3.4 Implement `_applyInstantPreEffect(target, preEffect)` — for changes targeting `system.gesundheit.wunden` or `system.gesundheit.erschoepfungen`, calls `_applyDamageDirectly(targetActor, resolvedValue, damageType, false, speaker)` from `shared-dialog-helpers.js`; for other keys, applies the change value directly via `actor.update()`
- [ ] 3.5 Verify `foundry.dice.Roll` API for formula evaluation of `maechtigBonus` — https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html
- [ ] 3.6 Check foundryvtt.wiki for `foundry.utils.deepClone` and `foundry.utils.mergeObject` patterns

## 4. Resist Test System

- [ ] 4.1 Modify `scripts/skills/dialogs/fertigkeit.js`: add `this.success_val = options.success_val || null` to constructor; pass `this.success_val` as 4th argument to `evaluate_roll_with_crit()` in `_executeRoll()` (line ~546)
- [ ] 4.2 Create `scripts/effects/pre-effects/resist-handler.js` and implement socket listener (new `case 'createResistPromptByOwner'` in `scripts/core/init.js` `setupIlarisSocket()` switch, following `createDefensePromptByOwner` pattern) for routing resist prompts
- [ ] 4.3 Implement `sendResistPrompt(targetActor, preEffect, spellItem)` — creates whispered ChatMessage with serialized preEffect data in `data-*` attributes
- [ ] 4.4 Implement `renderChatMessageHTML` click delegation for `.resist-button` (in `resist-handler.js`, following `defense-button-hook.js` pattern)
- [ ] 4.5 Implement resist resolution: on `.resist-button` click, compute resist difficulty as `avoidTest.resistDifficulty + (Mächtige Magie QS × 4)` (with `resistDifficulty` defaulting to 12 if not set), open FertigkeitDialog with `probeType: 'fertigkeit'` or `'attribut'` based on `avoidTest` config AND `success_val: resistDifficulty`; attach `dialog._resistContext = {eventId, preEffectData, spellUuid}` after construction
- [ ] 4.6 Implement listener on existing `Ilaris.postSkillRoll` hook that checks `dialog._resistContext` to identify resist tests; on match, apply or skip the effect based on `rollResult.success` and `diminishedOnly`
- [ ] 4.7 Verify `ChatMessage` API for whispered messages — https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html
- [ ] 4.8 Verify `game.socket` API for emit pattern — https://foundryvtt.com/api/v14/classes/foundry.server.SocketInterface.html

## 5. UebernatuerlichDialog Integration

- [ ] 5.1 Import pre-effects processor in `scripts/combat/dialogs/uebernatuerlich.js`
- [ ] 5.2 Add `this._applyPreEffects(rollResult)` call in `_angreifenKlick()` after `super._updateSchipsStern()` (line 373) — outside the `if (difficulty)` block, guarded by `isSuccess && this.item.system.preEffects?.length > 0` — fire-and-forget (no await)
- [ ] 5.3 Add `this._applyPreEffects(rollResult)` call in `_energieAbrechnenKlick(isSuccess)` after `await this.applyEnergyCost(...)` — guarded by `isSuccess && this.item.system.preEffects?.length > 0` — fire-and-forget (no await). This covers non-standard difficulty spells where the user manually confirms success via `✅ Erfolgreich gewirkt`.

## 6. Testing

- [ ] 6.1 Create `scripts/effects/pre-effects/_spec/pre-effects.test.js` with unit tests for: data model schema, self-cast bonus, Mächtige Magie amplification formula, avoid test logic (full avoid, diminished, failed resist)
- [ ] 6.2 Create `scripts/effects/pre-effects/_spec/resist-handler.test.js` with unit tests for: chat message serialization, resist resolution outcomes
- [ ] 6.3 Run `npm test` to confirm all tests pass

## 7. Validation

- [ ] 7.1 Run `npm run lint` to confirm code style
- [ ] 7.2 Run `npm run pack-all` (no compendium data changes, but verify no build errors)
- [ ] 7.3 Manual test: create a Zauber with a preEffect, cast it on a target, verify ActiveEffect appears
- [ ] 7.4 Manual test: create a Zauber with avoidTest, verify resist prompt appears and resolves correctly
- [ ] 7.5 Manual test: self-cast a spell, verify +1 duration bonus
