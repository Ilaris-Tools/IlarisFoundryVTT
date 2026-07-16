## Why

The resist dialog for spell pre-effects (Widerstandsprobe) opens a FertigkeitDialog that has three critical issues: the target difficulty (Erschwernis) is never shown to the player, the skill/attribute resolution is broken for attribute probes (PW always 0), and the item sheet uses free-text fields for skill/attribute names with no validation — allowing typos and non-existent skills. Fixing these ensures players can make informed resist decisions and GMs can configure resist tests correctly.

## What Changes

- **Show resist difficulty in FertigkeitDialog summary**: Display `Erschwernis: <target>` alongside the existing dice formula and modifier preview, so players see what number they need to beat before rolling
- **Fix attribute PW resolution for resist tests**: When `probeType === 'attribut'`, pre-compute the PW from `actor.system.attribute[key].pw` in the resist handler (matching the pattern from `wuerfel.js:33`) and pass it to `openSkillDialog` — currently PW defaults to 0
- **Fix skill name→index resolution for resist tests**: `FertigkeitDialog._calculateModifiers()` expects `fertigkeitKey` to be a numeric array index into `actor.profan.fertigkeiten[]`, but the resist handler passes a skill `name` string. The resist handler will resolve the name to its array index and pass `pw`, `talentList`, and the correct `fertigkeitKey` index
- **Replace free-text avoidTest fields with compendium-populated `<select>`**: The item sheet's `avoidTest.fertigkeit` and `avoidTest.attribut` fields become dropdowns. The skill dropdown is populated from configured compendium packs (`Ilaris.fertigkeitenPacks` setting). The attribute dropdown uses the fixed 8 attributes (`CONFIG.ILARIS.attribute`)
- **Differentiate resist dialog visually**: Dialog title changes from `"Fertigkeitsprobe: X"` to `"Widerstandsprobe: X (gegen <Spellname>)"` so the player understands they're making a resist test, not a normal skill check

## Capabilities

### New Capabilities

- `resist-dialog-ux`: Difficulty display in FertigkeitDialog preview, resist-specific dialog title, and compendium-populated avoidTest field selects on the item sheet

### Modified Capabilities

- `supernatural-pre-effects`: The existing "Avoid/resist test" and "Resist resolution via FertigkeitDialog" requirements are updated to specify correct skill name→index resolution, attribute PW pre-computation, difficulty display, and compendium-based field selection

## Impact

- **`scripts/effects/pre-effects/resist-handler.js`**: Fix `handleResistClick()` to resolve skill name→index, compute attribute PW, pass `pw`, `talentList`, and `spellName` to `openSkillDialog`
- **`scripts/skills/dialogs/fertigkeit.js`**: Add `Erschwernis` row to `_buildSummaryContext()`, accept `resistAgainst` option for title differentiation
- **`scripts/items/templates/pre-effects.hbs`**: Replace `<input type="text">` with `<select>` for `avoidTest.fertigkeit` and `avoidTest.attribut`
- **`scripts/items/sheets/uebernatuerlich-talent.js`** (sheet context): Populate `avoidTestSkillOptions` from configured compendium packs and `avoidTestAttributeOptions` from `CONFIG.ILARIS.attribute`
- **`openspec/specs/supernatural-pre-effects/spec.md`**: Delta spec updating affected scenarios
