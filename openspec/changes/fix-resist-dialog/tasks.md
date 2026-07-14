## 1. Fix resist-handler.js — correct skill/attribute resolution

- [ ] 1.1 In `handleResistClick()`, when `avoidTest.fertigkeit` is set: find the skill by `name` in `actor.profan.fertigkeiten` array, extract its index, `system.pw`, and `system.talente`. If not found, show `ui.notifications.warn()` and return without opening dialog
- [ ] 1.2 In `handleResistClick()`, when `avoidTest.attribut` is set (no fertigkeit): compute `pw` from `actor.system.attribute[key].pw`, resolve `fertigkeitName` from `CONFIG.ILARIS.label[key]`
- [ ] 1.3 Pass `pw`, `talentList`, and `resistAgainst: spellItemName` to `openSkillDialog()` options
- [ ] 1.4 Add `spellItemName` parameter to `handleResistClick()` via `preEffectData.spellName` (serialized in `sendResistPrompt`)
- [ ] 1.5 Add `spellName` to serialized preEffect data in `sendResistPrompt()`

## 2. Add difficulty display to FertigkeitDialog

- [ ] 2.1 In `_buildSummaryContext()`, when `this.success_val` is not null, add an "Erschwernis" row to the first section's `rows` array (position it before the `totalRow`)
- [ ] 2.2 Verify against Foundry API docs (v14) for any relevant `ApplicationV2` rendering behavior

## 3. Add resist-specific title to FertigkeitDialog

- [ ] 3.1 Add `resistAgainst` to constructor options parsing in `FertigkeitDialog` constructor
- [ ] 3.2 Update `_getDialogTitle()` static method: when `resistAgainst` is set, return `"Widerstandsprobe: <skill> (gegen <spellName>)"` instead of `"Fertigkeitsprobe: <skill>"`
- [ ] 3.3 Verify against Foundry API docs (v14) for `ApplicationV2.options.window.title`

## 4. Compendium-populated avoidTest selects on item sheet

- [ ] 4.1 In `UebernatuerlichTalentSheet._prepareContext()`, read `Ilaris.fertigkeitenPacks` setting, iterate packs via `game.packs.get(packId).getIndex()`, filter by `type: 'fertigkeit'` or `type: 'uebernatuerlicheFertigkeit'`, and build `avoidTestSkillOptions` array grouped by pack
- [ ] 4.2 Add `avoidTestAttributeOptions` from `CONFIG.ILARIS.attribute` to the sheet context
- [ ] 4.3 In `pre-effects.hbs`, replace `<input type="text" name="...avoidTest.fertigkeit">` with a `<select>` using `avoidTestSkillOptions`
- [ ] 4.4 In `pre-effects.hbs`, replace `<input type="text" name="...avoidTest.attribut">` with a `<select>` using `avoidTestAttributeOptions`
- [ ] 4.5 Handle edge case: if the currently-stored value is not in the select options, include it as a fallback `<option>` with a visual indicator (e.g., "Nicht verfügbar")
- [ ] 4.6 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers for building select option data

## 5. Validation and testing

- [ ] 5.1 Run `npm test` and fix any test failures
- [ ] 5.2 Run `npm run lint` and fix any lint issues
- [ ] 5.3 Manually test: open a Zauber item sheet, verify avoidTest fields are `<select>` elements populated with skills and attributes
- [ ] 5.4 Manually test: configure a resist test on a spell, cast it, verify the resist dialog shows "Widerstandsprobe" title, correct PW, and "Erschwernis" row in preview
- [ ] 5.5 Manually test: attribute-only resist (no fertigkeit configured) — verify correct attribute PW is used
- [ ] 5.6 Manually test: skill not found on actor — verify warning notification and no dialog
- [ ] 5.7 Run `npm run pack-all` (no compendium data changes, but verify clean)
