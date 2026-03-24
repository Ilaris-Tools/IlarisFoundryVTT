# Plan: Unify Dice Roll & Preview Code in Combat Dialogs

## Goal

Reduce duplication in combat dialog preview summary builders and roll-to-chat posting while keeping maneuver calculation, energy deduction, damage application, and target-selection behavior unchanged.

## Key Findings

### 1. Summary HTML builders are duplicated, but not all at the same abstraction level

- The status/nahkampf modifier rows are straightforward duplication across attack, defense, and talent previews.
- The generic text-line parsing block is duplicated across attack, defense, damage, and talent previews.
- Damage summaries are not just a filtered version of the generic block: they also normalize line text and treat `Kein Schaden` as negative.

### 2. The chat-posting flow is duplicated in a reusable way

- The same `renderTemplate + roll.toMessage` flow appears in multiple combat-dialog paths.
- That flow is a good candidate for a shared helper.
- Hidden/blind roll posting in defense/target-resolution remains special-case logic and should stay manual.

### 3. `uebernatuerlich` looks like a missed migration, not a deliberate exception

- Combat dialogs use `evaluate_roll_with_crit()` everywhere except `scripts/combat/dialogs/uebernatuerlich.js`.
- The combat supernatural dialog still uses `roll_crit_message()` directly.
- The `spell_result.hbs` branch is effectively dead for this dialog today because the label is just the item name, not `Zauber (...)`.
- Recommended interpretation: missed migration from the earlier combat-dialog refactor.

### 4. The new chat helper should match the existing dice-helper conventions

- `scripts/dice/wuerfel_misc.js` already uses `foundry.applications.handlebars.renderTemplate(...)`.
- If `postRollToChat()` lives there, it should use the same renderer for consistency and easier test setup.
- That avoids mixing two template APIs inside the same helper module for no clear benefit.

## Plan Steps

### Phase 1: Add shared instance helpers to CombatDialog

**File: scripts/combat/dialogs/combat_dialog.js**

Add shared instance helper methods on the base class, not static helpers. Instance helpers fit the current subclass architecture better and can be called directly from `getAttackSummary()`, `getDefenseSummary()`, `getDamageSummary()`, and `getTalentSummary()`.

1. `_buildSignedModifierItem(mod, label, extraClass = '')`
    - Returns an empty string when `mod === 0`
    - Otherwise renders a positive/negative modifier row with sign and optional extra class
    - Replaces the repeated status and token-status rows

2. `_buildModifierLines(textField, options = {})`
    - Handles the repeated `split('\n')`, trim, skip-empty, class selection, and rendering flow
    - Accepts options for:
        - `sectionTitle`
        - `filterLine(line)` to exclude lines
        - `transformLine(line)` to normalize displayed text
        - `getLineClass(line)` to override the default positive/negative/neutral classification
    - This keeps attack/defense/talent summaries simple while still supporting damage-specific behavior without forcing damage into an underpowered generic helper

3. `_buildTotalModifierItem(totalMod)`
    - Returns an empty string when `totalMod === 0`
    - Otherwise renders the shared `Addierte Modifikatoren` row

### Phase 2: Add shared roll-posting helper in wuerfel_misc.js

**File: scripts/dice/wuerfel_misc.js**

Add a new named export for the standard non-hidden chat-posting path:

- `postRollToChat(rollResult, speaker, rollMode)`
- Internally renders `rollResult.templatePath` with `rollResult.templateData` via `foundry.applications.handlebars.renderTemplate(...)`
- Then posts `rollResult.roll.toMessage(...)`

This helper is only for the standard visible posting path. Hidden/blind posting remains inline where template data and whisper settings are customized.

### Phase 3: Refactor preview summaries in angriff.js

**File: scripts/combat/dialogs/angriff.js**

- `getAttackSummary()`
    - Replace status/nahkampf/maneuver/total HTML blocks with base helper calls
- `getDefenseSummary()`
    - Same refactor pattern as attack summary
- `getDamageSummary()`
    - Use `_buildModifierLines()` with damage-specific hooks:
        - `filterLine` skips trefferzone and gezielter-schlag lines when aimed strike is inactive
        - `transformLine` removes the trailing `gewählt` cleanup variants
        - `getLineClass` marks `Kein Schaden` as negative in addition to normal `+`/`-` parsing
- `_schadenKlick()`
    - Replace standard visible `renderTemplate + toMessage` with `postRollToChat(...)`
- `_verteidigenKlick()`
    - Replace only the non-defense-mode visible posting path with `postRollToChat(...)`
    - Keep the hidden defense-mode branch manual

### Phase 4: Refactor preview summaries in fernkampf_angriff.js

**File: scripts/combat/dialogs/fernkampf_angriff.js**

- `getAttackSummary()`
    - Use the same base helper methods as melee attack summary
- `getDamageSummary()`
    - Reuse the same damage-specific helper options used in melee
- `_schadenKlick()`
    - Replace standard visible posting with `postRollToChat(...)`

### Phase 5: Refactor combat supernatural dialog

**File: scripts/combat/dialogs/uebernatuerlich.js**

- `getTalentSummary()`
    - Replace status/nahkampf/maneuver/total HTML blocks with base helper calls
- `_angreifenKlick()`
    - Migrate from `roll_crit_message(...)` to `evaluate_roll_with_crit(...)`
    - Then post via `postRollToChat(...)`
    - Preserve existing semantics by setting:
        - `isSuccess = rollResult.success || rollResult.crit`
        - `is16OrHigher = rollResult.is16OrHigher`
- Keep `getEnergySummary()` separate
    - Its color semantics are intentionally reversed for energy costs
    - Its structure includes resource availability and manual accounting buttons
    - It is not a good target for the same generic helper path

### Phase 6: Refactor shared visible posting in combat_dialog.js

**File: scripts/combat/dialogs/combat_dialog.js**

- In `handleTargetSelection()`, replace only the standard visible posting path with `postRollToChat(...)`
- Keep the hidden-result branch manual because it rewrites template data and applies blind/whisper behavior

### Phase 7: Add or update tests

**Files:**

- `scripts/dice/_spec/wuerfel_misc.spec.js`
- `scripts/combat/_spec/uebernatuerlich.spec.js`
- Optional new combat-dialog summary helper spec if the extracted helper logic becomes large enough

Test work should be explicit, not just manual verification:

1. Add tests for `postRollToChat()` to confirm template rendering and `toMessage` invocation
2. Add or extend tests for the combat supernatural roll path after migrating off `roll_crit_message()`
3. If `_buildModifierLines()` gets non-trivial logic, add focused tests for:
    - skipping trefferzone lines
    - cleaning `gewählt` suffixes
    - classifying `Kein Schaden` as negative
4. Prefer a focused new spec if needed for the extracted summary-helper behavior rather than forcing UI-heavy dialog coverage into the existing supernatural logic spec

## Relevant Files

- `scripts/combat/dialogs/combat_dialog.js` — add shared instance helpers and use `postRollToChat()` in the standard visible path of `handleTargetSelection()`
- `scripts/combat/dialogs/angriff.js` — refactor preview summaries and standard visible posting paths
- `scripts/combat/dialogs/fernkampf_angriff.js` — refactor preview summaries and damage posting path
- `scripts/combat/dialogs/uebernatuerlich.js` — refactor talent summary and migrate roll execution to `evaluate_roll_with_crit()` + `postRollToChat()`
- `scripts/dice/wuerfel_misc.js` — add `postRollToChat()` export
- `scripts/dice/_spec/wuerfel_misc.spec.js` — add helper coverage
- `scripts/combat/_spec/uebernatuerlich.spec.js` — add migration regression coverage or split out a focused spec if that stays cleaner

## Out of Scope

- Changing maneuver-processing logic such as `updateManoeverMods()` or `manoeverAuswaehlen()`
- Removing legacy jQuery-era files like `nahkampf_prepare.js` and `fernkampf_prepare.js`
- Changing energy-deduction rules or damage-application rules
- Reworking `getEnergySummary()` into the generic summary helper path
- Changing skill-dialog behavior outside the combat dialogs covered here

## Verification

1. Open melee combat dialog and verify attack, defense, and damage previews still show the same totals, lines, and colors as before
2. Open ranged combat dialog and verify attack and damage previews still match current behavior
3. Open supernatural combat dialog and verify talent preview remains correct and energy summary behavior is unchanged
4. Execute visible attack, defense, and damage rolls and confirm chat output is unchanged
5. Execute defense mode and confirm the hidden/blind defense roll path still works and attack-vs-defense resolution still fires
6. Execute supernatural combat rolls and confirm energy deduction still uses the same success and `16+` behavior as before
7. Run jest specs for dice and combat and verify the new helper coverage passes
