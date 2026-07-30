## Context

The resist dialog system for spell pre-effects (`avoidTest`) opens `FertigkeitDialog` — the same dialog used for normal skill checks. Three bugs make it unusable:

1. **Difficulty hidden**: `success_val` (Erschwernis) is stored on the dialog instance but never rendered in the preview summary. Players roll blind.
2. **Attribute PW always 0**: `FertigkeitDialog._calculateModifiers()` has no branch for `probeType === 'attribut'`. The `pw` defaults to 0 because the resist handler never passes it. The working sheet path in `wuerfel.js:33` pre-computes `pw` from `systemData.attribute[key].pw` — the resist handler must do the same.
3. **Skill name→index mismatch**: `FertigkeitDialog._calculateModifiers()` accesses `actor.profan.fertigkeiten[fertigkeitKey]` using the numeric array index (from Handlebars `{{@index}}`). The resist handler passes a skill `name` string (e.g., `"Athletik"`). `array["Athletik"]` returns `undefined`, causing PW fallback to 0.

Additionally, the item sheet uses free-text `<input>` fields for `avoidTest.fertigkeit` and `avoidTest.attribut`, with no validation against available skills or attributes.

## Goals / Non-Goals

**Goals:**

- Show the resist difficulty (Erschwernis) as a row in the FertigkeitDialog preview summary
- Correctly resolve skill name → actor array index + PW + talentList before opening the dialog
- Correctly compute attribute PW from `actor.system.attribute[key].pw` before opening the dialog
- Replace free-text avoidTest fields with validated `<select>` dropdowns (compendium skills, fixed attributes)
- Differentiate the dialog title as "Widerstandsprobe" with spell context

**Non-Goals:**

- Changing `FertigkeitDialog._calculateModifiers()` lookup mechanism (index-based access preserved)
- Changing the `wuerfel.js` sheet roll path (it already works correctly)
- Adding new compendium packs or modifying compendium data
- Changing the resist resolution flow (postSkillRoll hook, `_resistContext`)

## Decisions

### Decision 1: Pre-compute PW in resist-handler rather than add attribute branch to FertigkeitDialog

**Chosen**: Pre-compute `pw` from `actor.system.attribute[key].pw` in `handleResistClick()`, pass it to `openSkillDialog({pw})`.

**Rationale**: The existing sheet path (`wuerfel.js:33`) already does this. `FertigkeitDialog` already accepts `pw` as an option and uses it as fallback. Adding an attribute branch to `_calculateModifiers` would require duplicating the attribute→pw lookup logic and handling edge cases (attribute not found, etc.) inside the dialog. Minimal change wins.

**Alternative considered**: Add `else if (probeType === 'attribut')` branch in `_calculateModifiers()`. Rejected because it adds complexity to a dialog that already works correctly when `pw` is pre-computed.

### Decision 2: Resolve skill name→index in resist-handler rather than change FertigkeitDialog to search by name

**Chosen**: In `handleResistClick()`, find the skill by `name` in the `actor.profan.fertigkeiten` array, extract its index, `pw`, `pwt`, and `talentList`, then pass all resolved values to `openSkillDialog`.

**Rationale**: This is a "resolve at the boundary" pattern. `FertigkeitDialog` was designed for index-based access (matching the `#each` iteration in Handlebars). Changing it to search by name would also require updating `wuerfel.js` (which passes indices). Keeping the dialog unchanged minimizes regression risk.

**Alternative considered**: Change `fertigkeitKey` lookup from `array[idx]` to `array.find(f => f.name === key)`. Rejected because it would break the existing sheet roll path and require coordinated changes.

### Decision 3: Difficulty displayed as a summary row, not a separate UI element

**Chosen**: Add an `Erschwernis` row to `_buildSummaryContext()`'s sections, displayed after modifiers and before the total row.

**Rationale**: The summary section already shows the dice formula, base PW, and modifiers. Adding the target difficulty here gives players the complete picture in one glance. A separate UI element would fragment the information.

### Decision 4: Compendium select uses `getIndex()` for population, stores skill `name`

**Chosen**: In the item sheet's `_prepareContext()`, iterate configured packs via `game.packs.get(packId).getIndex()`, filter entries by `type: 'fertigkeit'` or `type: 'uebernatuerlicheFertigkeit'`, and populate a `<select>` with skill `name` values. The stored value remains the skill `name` string (the canonical identifier throughout the codebase).

**Rationale**: `getIndex()` is lighter than `getDocuments()` — it only loads metadata, not full item documents. Skill `name` (e.g., `"Athletik"`) is the canonical cross-reference identifier used everywhere: talents reference it via `system.fertigkeit`, weapons via `system.fertigkeit`, and the actor builder matches talents to skills by name.

**Alternative considered**: Store `_id` instead of `name`. Rejected because all existing cross-references use `name`, and `_id` is only used for compendium retrieval (`pack.getDocument(_id)`).

### Decision 5: Attribute select uses `CONFIG.ILARIS.attribute`

**Chosen**: Populate the attribute dropdown from `CONFIG.ILARIS.attribute` (fixed array of `{value, label}` for KO, MU, GE, KK, IN, KL, CH, FF).

**Rationale**: Attributes are a closed set of 8 values, always the same regardless of game configuration. Using the existing config avoids hardcoding.

## API Surface

### Foundry classes used

- `foundry.applications.api.ApplicationV2` / `HandlebarsApplicationMixin` — FertigkeitDialog base (existing, no change)
- `ChatMessage` — resist prompt creation (existing, no change)
- `CompendiumCollection` — via `game.packs.get(packId).getIndex()` for populating skill select

### Hook events

- `Ilaris.postSkillRoll` — existing listener in resist-handler.js for resolution (no change to signature)
- `Ilaris.preSkillDialog` — existing cancellable hook in skills-api.js (no change)
- `Ilaris.skillDialogRendered` / `Ilaris.skillDialogStateChanged` — existing hooks in FertigkeitDialog (no change)

### Foundry utils used

- `foundry.utils.randomID()` — existing usage (no change)
- `foundry.utils.fromUuid()` — existing usage (no change)

### Game settings read

- `Ilaris.fertigkeitenPacks` — JSON array of compendium pack IDs, read in item sheet `_prepareContext()`

## Risks / Trade-offs

- **[Risk] `getIndex()` may not be loaded yet on sheet open** → Mitigation: `await pack.getIndex()` ensures the index is loaded before iteration
- **[Risk] Skill removed from compendium after avoidTest configured** → Mitigation: The select shows current compendium skills; if a previously configured skill is removed, the stored `name` string persists in data but won't appear in the dropdown. Add a fallback `<option>` for the currently-stored value when it's not in the select list
- **[Risk] `actor.profan.fertigkeiten` is empty when resist button clicked** → Mitigation: If the resolved index is -1 (not found), show a warning notification and don't open the dialog
- **[Trade-off] Compendium index loaded on every sheet render** → Acceptable because `getIndex()` is lightweight (metadata only), and item sheets are opened infrequently compared to actor sheets
