# Übernatürlich Pre-Effects — Plan

## 1. Objective

Enable all übernatürlich items (Zauber, Liturgien, Anrufungen) to define **multiple pre-effects** that, when the spell succeeds against a target, either:

- **Create an Ilaris-timed ActiveEffect** on the target (with duration amplified by maneuvers), OR
- **Apply the change instantly** (direct damage/effect, no ActiveEffect created)

Each pre-effect has its own amplification rules — some scale with Mächtige Magie, some don't.

## 2. Data Model

### 2.1 Pre-Effects Schema on Item

New `preEffects` field in **`createUebernatuerlichTalentFields()`** (`scripts/items/model-data/models.js`, line 29) — shared helper that feeds `LiturgieItemDataModel`, `ZauberItemDataModel`, and `AnrufungItemDataModel` identically. Adding it here covers all three item types (and Anrufungen, which are functionally equivalent) in one place.

```js
preEffects: new fields.ArrayField(new fields.SchemaField({
    baseDuration: new fields.NumberField({required: true, integer: true, initial: 0}),
    instant: new fields.BooleanField({initial: false}),
    amplifiedByMaechtigeMagie: new fields.BooleanField({initial: false}),
    change: new fields.SchemaField({
        key: new fields.StringField({required: true}),
        type: new fields.StringField({initial: 'add'}),   // 'add' — standard Foundry change type. NOT 'dot' (dot handler is a no-op, DOT-only)
        value: new fields.StringField({required: true}),
        maechtigBonus: new fields.StringField({initial: ''}),
        priority: new fields.NumberField({required: false, nullable: true, integer: true}),
    }),
    avoidTest: new fields.SchemaField({
        enabled: new fields.BooleanField({initial: false}),
        fertigkeit: new fields.StringField({initial: ''}),
        attribut: new fields.StringField({initial: ''}),
        diminishedOnly: new fields.BooleanField({initial: false}),
        diminishedValue: new fields.StringField({initial: ''}),
    }),
})),
```

### 2.2 Avoid / Resist Test

When `avoidTest.enabled` is `true`, after the spell succeeds against a target, the target gets a chance to resist in chat:

- `fertigkeit` **or** `attribut` — which to test against (fixed per preEffect, not a choice; exactly one is set)
- `diminishedOnly: false` — success = effect entirely avoided (not applied)
- `diminishedOnly: true` — success = effect still applied, but `change.value` is replaced with `diminishedValue` (a flat replacement value, e.g. `"-2"`)

**Avoid test delivery**: Follows the existing defence dialog pattern (`scripts/combat/hooks/combat_dialog_handlers.js`):

1. **Hook handler** (new hook `Ilaris.postPreEffectResist`) builds HTML buttons with `data-*` attributes serializing the preEffect context (target actor ID, spell UUID, preEffect index, diminishedOnly, diminishedValue, change key/value, etc.)
2. **Socket routing** via `game.socket.emit('system.Ilaris', { type: 'createResistPromptByOwner', data })` — same pattern as `routeDefensePromptToOwner()`. Resolves `executorUserId` (target's owner or GM), uses `eventId` for dedup, sets `whisperUserIds`
3. **Socket listener** in `scripts/core/init.js` (new `case 'createResistPromptByOwner'`) routes to the target owner's client
4. **Chat message creation** as whispered `ChatMessage` with `flags.Ilaris.resistPrompt: true` and the preEffect serialized data
5. **`renderChatMessageHTML` hook** for click delegation on `.resist-button` elements (same pattern as `.defend-button` in `defense-button-hook.js`)
6. **Resist resolution via FertigkeitDialog + hook**:
    - Target clicks `.resist-button` → `openSkillDialog(targetActor, { probeType: 'fertigkeit'|'attribut', ... })` opens
    - The full preEffect data (serialized in the chat message `data-*`) is passed alongside
    - After rolling, `FertigkeitDialog` fires `Ilaris.postResistTest` hook with `{ rollResult, preEffectData }`
    - A listener in the pre-effects system picks up the hook, checks the `eventId`, and applies or skips the effect
    - This avoids polling or promises on the dialog and keeps the resolution fully event-driven

All targets receive their prompts simultaneously (one socket emit per target). Each resist resolves independently. The caster must **explicitly target themselves** to receive self-cast effects — there is no auto-inclusion.

### 2.3 Amplification Rules

| Field                                   | Amplified by                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `baseDuration`                          | **Manöver** that extend spell duration (applies to all effects equally)                         |
| `change.value` + `change.maechtigBonus` | **Mächtige Magie** / **Mächtige Liturgie** maneuver — only if `amplifiedByMaechtigeMagie: true` |

**Maechtige Magie amplification formula** (from compendium research — 30+ spells analyzed):

Mächtige Magie amplification is **not** a single computable formula. Each spell defines its own bonus in the `maechtig` text field (or embedded in `modifikationen`). Patterns found:

| Pattern                  | Examples                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| `+2W6`                   | Ignifaxius, Aquafaxius, all Faxius beams, Igniplano, Lodernder Zorn           |
| `+1W6`                   | Ignisphaero, all Sphaero spheres, Hexengalle, Pandämonium, Pfeil des Isegrein |
| `+4` (flat)              | Fulminictus, Kulminatio, Hammer des Magus, Letzter Ausweg, Geistheilung       |
| `+2` (flat)              | Flammenschwert, Hexenkrallen, Ecliptifactus, Radau, Haut des Tieres           |
| `+1` (flat)              | Beute!, Brazoraghs Hieb, Adamantium, Krähenruf                                |
| `+4` (in modifikationen) | Hexenholz/Motoricus "Unsichtbarer Hieb", Gardianum "Schild gegen Dämonen"     |
| `+1W20`                  | Phexens Sternenwurf (divine)                                                  |
| `+16`                    | Zerschmetternder Bannstrahl (divine)                                          |
| `+10`                    | Largorax' Hammer (divine)                                                     |

**Design decision**: `change.maechtigBonus` is a string appended to `change.value` when Mächtige Magie is active. Example:

- `value: "2W6"`, `maechtigBonus: "+2W6"` → when active: `"2W6+2W6"` → evaluates via `foundry.dice.Roll`
- `value: "4"`, `maechtigBonus: "+4"` → when active: `"4+4"` → evaluates to 8

Each pre-effect independently controls whether Mächtige Magie amplifies it via `amplifiedByMaechtigeMagie`. Duration amplification from maneuvers applies uniformly to all effects.

### 2.4 Multi-Target

One ActiveEffect per target per preEffect. If the spell targets 3 actors and has 2 preEffects, up to 6 effects are created.

Resist prompts fire simultaneously for all targets — each target's avoid test is handled independently via async chat prompts. The effect creation does not block on resist resolution; each target's effects are created as their resist tests resolve.

### 2.5 Effect Origin Tracking

Each created ActiveEffect records its source using V14's built-in `origin` field plus Ilaris-specific flags:

```js
{
    origin: caster.actor.uuid,
    flags: {
        ilaris: {
            sourceType: 'uebernatuerlich',
            spellName: item.name,
            spellUuid: item.uuid,
            casterUuid: caster.actor.uuid,
            fertigkeiten: item.system.fertigkeiten,
        }
    }
}
```

### 2.6 Self-Cast Duration Bonus

When the **caster is also the target**, +1 is added to the duration:

```
Cast on enemy (baseDuration=5): remaining = 5 → 5 effective turns
Cast on self  (baseDuration=5): remaining = 6 → 5 effective turns (turn-end tick consumes 6→5)
```

Without this, a self-cast effect loses one turn immediately when the caster's turn ends after casting.

```js
const isSelfTarget = caster === target
const duration = baseDuration + maneuverBonus + (isSelfTarget ? 1 : 0)
```

This applies per-effect. **The caster must explicitly target themselves** — there is no auto-inclusion of the caster in `selectedActors`. If no target is selected, no effects are created.

### 2.7 Effect Creation Flow

```
Open dialog → Select targets → Click cast button → Roll
    ↓ success
    ┌─────────────────────────────────────────────┐
    │  IN PARALLEL (both fire immediately):       │
    │                                             │
    │  A) applyEnergyCost()                       │
    │     → Deduct AsP/KaP from caster            │
    │                                             │
    │  B) _applyPreEffects()                      │
    │     For each target:                        │
    │       For each preEffect in preEffects:     │
    │                                             │
    │       ├── avoidTest.enabled === true        │
    │       │   → Fire async resist prompt        │
    │       │   → When resolved:                  │
    │       │       success + !diminished → skip  │
    │       │       success + diminished → use    │
    │       │         diminishedValue             │
    │       │       fail → use full value         │
    │       │                                     │
    │       ├── instant === true                  │
    │       │   → Apply changeValue directly      │
    │       │                                     │
    │       └── instant === false                 │
    │           → Create ActiveEffect on target   │
    │             with ilarisTiming               │
    └─────────────────────────────────────────────┘

    Effect creation details (for instant === false):
        duration = (durationMultiplier > 0 ? baseDuration * durationMultiplier : baseDuration) + (isSelfTarget ? 1 : 0)
        changeValue:
            if amplifiedByMaechtigeMagie && qualityStages > 0 && maechtigBonus
                → apply maechtigBonus qualityStages times → evaluate via Roll
            else → evaluate base value
        ActiveEffect:
            { name, origin, changes: [{ key, type, value, priority }],
              system: { ilarisTiming: { durationType: 'ownerTurns', ... } },
              flags: { ilaris: { sourceType, spellName, spellUuid, casterUuid, fertigkeiten } } }
```

## 3. Integration Points

### 3.1 Item Data Model

- **File**: `scripts/items/model-data/models.js`, function `createUebernatuerlichTalentFields()` at line 29
- Adding `preEffects` there covers `ZauberItemDataModel`, `LiturgieItemDataModel`, and `AnrufungItemDataModel` in one change (all three call this shared helper)

### 3.2 Übernatürlich Dialog — Insertion Point

**Primary insertion**: `scripts/combat/dialogs/uebernatuerlich.js`, method `_angreifenKlick()` (~line 348).

After the roll succeeds and `callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', ...)` fires, energy is deducted first (sequential `await`), then pre-effects are fired and forgotten (no await — they resolve asynchronously via chat/hook callbacks):

```
_angreifenKlick():
    ... existing roll + postAngriff hook ...
    ↓
    if (rollResult.success) {
        await this.applyEnergyCost(isSuccess, is16OrHigher)  // energy first
        this._applyPreEffects(rollResult)                    // ★ NEW — fire-and-forget
    }
```

**Why sequential then fire-and-forget**: Awaiting energy ensures the actor document is fully updated before pre-effect code runs (avoids concurrent `actor.update()` conflicts on self-cast). Pre-effects are then fired without `await` because resist prompts resolve asynchronously via chat interaction — blocking here would freeze the dialog.

**Second entry point**: Pre-effects also fire when the caster clicks "Erfolgreich gewirkt" in `_energieAbrechnenKlick(isSuccess)`. This path handles spells where `schwierigkeit` is non-numeric (e.g., free-form text). Pre-effects fire **only when `isSuccess === true`** — the "Misslungen" button does not trigger them.

**Why here**: By this point, `manoeverAuswaehlen()` and `updateManoeverMods()` have run, so `this.item.manoever[]` is populated with all maneuver selections and `modificationData`. The `selectedActors` array is available from `game.user.targets`. The roll result is known.

**New method**: `_applyPreEffects(rollResult)`:

1. Get `caster` from the dialog's actor
2. Iterate `this.item.system.preEffects`
3. For each preEffect with `change.key` set:
    - Call `computePreEffectAmplification(item, this.item.manoever)` for `durationMultiplier` + `qualityStages`
    - For each target in `this.selectedActors`:
        - If `avoidTest.enabled`: fire async resist prompt via chat (resolves independently)
        - If `instant`: apply change directly to target
        - Else: create ActiveEffect via `createEmbeddedDocuments`

### 3.3 Maneuver Compendium Updates

Two new modification types are added to the maneuver compendium source files — no changes to `processModification` or `handleModifications`. These types are read directly by `computePreEffectAmplification()`:

| Type                    | Purpose                                                                  | value           | operator   | affectedByInput | Used by                           |
| ----------------------- | ------------------------------------------------------------------------ | --------------- | ---------- | --------------- | --------------------------------- |
| `INCREASE_DURATION`     | Marks a maneuver that extends effect duration                            | `2` (doubles)   | `MULTIPLY` | `true`          | Wirkungsdauer verlängern (M), (L) |
| `QUALITY_AMPLIFICATION` | Marks a maneuver that amplifies effect quality (Mächtige Magie/Liturgie) | `1` (per stage) | `MULTIPLY` | `true`          | Mächtige Magie, Mächtige Liturgie |

**Files to update** (`comp_packs/manover/_source/`):

- `M_chtige_Magie_4qLl0orvGPHIreef.json` — add `QUALITY_AMPLIFICATION` modification
- `M_chtige_Liturgie_wxO3RaUQFgMcP859.json` — add `QUALITY_AMPLIFICATION` modification
- `Wirkungsdauer_verl_ngern__M__HM7s1xPSYScr4dVp.json` — add `INCREASE_DURATION` modification
- `Wirkungsdauer_verl_ngern__L__rmDwqEGFOao1fgyo.json` — add `INCREASE_DURATION` modification

Each maneuver keeps its existing `ATTACK` modification (the −4 probe modifier). The new modification is added as a second entry (key `"1"`) alongside the existing `"0"`:

```json
"1": {
    "type": "INCREASE_DURATION",
    "value": 1,
    "operator": "MULTIPLY",
    "target": "",
    "affectedByInput": true
}
```

After editing, run `npm run pack-all` to repack the LevelDB compendiums.

### 3.4 Maneuver Amplification Helper

**New helper**: `scripts/combat/dialogs/shared-dialog-helpers.js` — reads the new modification types directly from `activeManeuvers[]` without going through `handleModifications`:

```js
/**
 * Scans active maneuvers for INCREASE_DURATION and QUALITY_AMPLIFICATION modifications.
 * @param {Item} item - The übernatürlich item
 * @param {Array} activeManeuvers - this.item.manoever with populated inputValue
 * @returns {{ durationMultiplier: number, qualityStages: number }}
 */
function computePreEffectAmplification(item, activeManeuvers) {
    let durationMultiplier = 0 // 0 = no duration maneuver active; >0 = apply as multiplier
    let qualityStages = 0

    for (const m of activeManeuvers) {
        const input = Number(m.inputValue?.value) || 0 // cast: HTML input is a string
        if (!input) continue

        for (const mod of Object.values(m.system?.modifications || {})) {
            if (mod.type === 'INCREASE_DURATION') {
                // e.g. value=2, input=1 → durationMultiplier=2 (double)
                //      value=2, input=2 → durationMultiplier=4 (quadruple)
                durationMultiplier += mod.value * input
            }
            if (mod.type === 'QUALITY_AMPLIFICATION') {
                qualityStages += mod.value * input
            }
        }
    }
    return { durationMultiplier, qualityStages }
}
```

**Duration usage**: `durationMultiplier > 0 ? baseDuration * durationMultiplier : baseDuration`. Starting at `0` is intentional — if no `INCREASE_DURATION` maneuver is active, the multiplier is not applied at all (avoids `baseDuration * 1` vs `baseDuration * 3` confusion). When `qualityStages > 0` and `amplifiedByMaechtigeMagie: true`, the `maechtigBonus` is appended `qualityStages` times to the base value before evaluation.

**Why bypass `handleModifications`**: No changes to the existing modification pipeline — zero regression risk. The new types are pure data markers read directly by the pre-effect helper.

### 3.5 Instant Application

- `instant: true` skips ActiveEffect creation entirely
- Instead, applies the change directly:
    ```js
    const current = foundry.utils.getProperty(target, change.key) ?? 0
    await target.update({ [change.key]: current + amplifiedValue })
    ```
- This is used for spells that deal direct damage on hit (e.g., direct damage spells)

### 3.6 Avoid Test Integration (Defence Dialog Pattern)

Replicates the existing defence prompt flow from `scripts/combat/hooks/combat_dialog_handlers.js`:

| Step | File                                             | Function/Change                                            | Role                                                                                      |
| ---- | ------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | `scripts/combat/hooks/combat_dialog_handlers.js` | New `routeResistPromptToOwner(targetActor, preEffectData)` | Resolves owner, emits socket                                                              |
| 2    | `scripts/core/init.js`                           | New `case 'createResistPromptByOwner'`                     | Socket listener → calls handler                                                           |
| 3    | `scripts/combat/hooks/combat_dialog_handlers.js` | New `handleResistPromptSocketEvent(data)`                  | Dedup, create whispered `ChatMessage`                                                     |
| 4    | `scripts/combat/hooks/combat_dialog_handlers.js` | New `renderChatMessageHTML` hook for `.resist-button`      | Click delegation                                                                          |
| 5    | `scripts/combat/hooks/combat_dialog_handlers.js` | New `openResistForTarget(actor, preEffectData)`            | Calls `openSkillDialog(actor, ...)` from `scripts/skills/skills-api.js`                   |
| 6    | `scripts/combat/hooks/combat_dialog_handlers.js` | `Ilaris.postResistTest` hook listener                      | FertigkeitDialog fires hook with result + preEffectData; listener applies or skips effect |

**Socket payload structure** (mirrors `createDefensePromptByOwner`):

```js
{
    type: 'createResistPromptByOwner',
    data: {
        eventId, executorUserId, targetActorId,
        content: '<button class="resist-button" data-...>Widerstehen mit {skill}</button>',
        whisperUserIds,
        // Pre-effect context for resolution:
        preEffectData: {
            spellName, spellUuid, casterUuid,
            preEffectIndex, diminishedOnly, diminishedValue,
            changeKey, changeValue, changeType,
            duration, instant,
        }
    }
}
```

**Why reuse this pattern**: Battle-tested owner routing, dedup via `eventId`, proper whisper permissions for GM visibility, and consistent UX with existing defence/fernkampf dialogs.

## 4. Steps

### Step 1 — Extend übernatürlich Item Data Model

Add `preEffects` ArrayField to `createUebernatuerlichTalentFields()` in `scripts/items/model-data/models.js` at line 29. This single change covers `ZauberItemDataModel`, `LiturgieItemDataModel`, and `AnrufungItemDataModel`.

**Where**: `scripts/items/model-data/models.js`, function `createUebernatuerlichTalentFields()` (line 29)
**Who**: code | **Depends on**: none

---

### Step 2 — Add `preEffects` to the Item Sheet Template

Extend `scripts/items/templates/uebernatuerlich_talent.hbs` with a repeatable `preEffects` section. The sheet class (`UebernatuerlichTalentSheet` in `scripts/items/sheets/uebernatuerlich-talent.js`) uses a single AppV2 part — no tab refactoring needed.

**What the template section must render** for each entry in `item.system.preEffects`:

| Field                       | Input type                                         | Bound to                                        |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `change.key`                | `<input type="text">`                              | `system.preEffects.N.change.key`                |
| `change.type`               | `<input type="text">`                              | `system.preEffects.N.change.type`               |
| `change.value`              | `<input type="text">`                              | `system.preEffects.N.change.value`              |
| `change.maechtigBonus`      | `<input type="text">`                              | `system.preEffects.N.change.maechtigBonus`      |
| `change.priority`           | `<input type="number">`                            | `system.preEffects.N.change.priority`           |
| `baseDuration`              | `<input type="number">`                            | `system.preEffects.N.baseDuration`              |
| `instant`                   | `<input type="checkbox">`                          | `system.preEffects.N.instant`                   |
| `amplifiedByMaechtigeMagie` | `<input type="checkbox">`                          | `system.preEffects.N.amplifiedByMaechtigeMagie` |
| `avoidTest.enabled`         | `<input type="checkbox">`                          | `system.preEffects.N.avoidTest.enabled`         |
| `avoidTest.fertigkeit`      | `<input type="text">`                              | `system.preEffects.N.avoidTest.fertigkeit`      |
| `avoidTest.attribut`        | `<input type="text">`                              | `system.preEffects.N.avoidTest.attribut`        |
| `avoidTest.diminishedOnly`  | `<input type="checkbox">`                          | `system.preEffects.N.avoidTest.diminishedOnly`  |
| `avoidTest.diminishedValue` | `<input type="text">`                              | `system.preEffects.N.avoidTest.diminishedValue` |
| _(delete row)_              | `<a data-action="deletePreEffect" data-index="N">` | handled in sheet JS                             |

**Add row**: A button `<a data-action="addPreEffect">` that calls `item.update({ 'system.preEffects': [...existing, defaultEntry] })`.

**Delete row**: `data-action="deletePreEffect"` + `data-index` handled in `_onAction()` override in `UebernatuerlichTalentSheet`.

The `avoidTest` sub-fields can be conditionally shown/hidden based on `avoidTest.enabled` with a CSS `display:none` or Handlebars `{{#if}}`.

**Where**: `scripts/items/templates/uebernatuerlich_talent.hbs`, `scripts/items/sheets/uebernatuerlich-talent.js`
**Who**: code | **Depends on**: 1

---

### Step 3 — Update Maneuver Compendium Source Files

Add new modification types to 4 maneuver items in `comp_packs/manover/_source/`:

- `M_chtige_Magie_*.json` — add `QUALITY_AMPLIFICATION` (value: 1, MULTIPLY, affectedByInput)
- `M_chtige_Liturgie_*.json` — add `QUALITY_AMPLIFICATION` (value: 1, MULTIPLY, affectedByInput)
- `Wirkungsdauer_verl_ngern__M__*.json` — add `INCREASE_DURATION` (value: 2, MULTIPLY, affectedByInput)
- `Wirkungsdauer_verl_ngern__L__*.json` — add `INCREASE_DURATION` (value: 2, MULTIPLY, affectedByInput)

Run `npm run pack-all` after editing.

**Where**: `comp_packs/manover/_source/` (4 JSON files)
**Who**: compendium | **Depends on**: 1 (schema must be understood)

---

### Step 4 — Implement Effect Creation in Übernatürlich Dialog

Add `_applyPreEffects(rollResult)` method to `UebernatuerlichDialog` in `uebernatuerlich.js`:

- Read `this.item.system.preEffects`
- Call `computePreEffectAmplification(item, this.item.manoever)` for `durationMultiplier` + `qualityStages`
- For each target in `this.selectedActors`:
    - If `avoidTest.enabled`: call `routeResistPromptToOwner(targetActor, preEffectData)` (socket-based, same pattern as `routeDefensePromptToOwner`)
    - If `instant`: apply change directly to target actor
    - If not `instant`: create `ActiveEffect` on target via `actor.createEmbeddedDocuments()`

**Insertion in `_angreifenKlick()`**: After `postAngriff` hook, `await applyEnergyCost()` first, then fire `this._applyPreEffects(rollResult)` without `await` (fire-and-forget).

**Second insertion in `_energieAbrechnenKlick(isSuccess)`**: Also call `this._applyPreEffects(rollResult)` — only when `isSuccess === true`. This covers spells with non-numeric `schwierigkeit` where `_angreifenKlick` does not call `applyEnergyCost` directly.

Also add the resist prompt infrastructure to `scripts/combat/hooks/combat_dialog_handlers.js`:

- `routeResistPromptToOwner()` — resolves owner, emits socket
- `handleResistPromptSocketEvent()` — dedup, creates whispered ChatMessage
- `openResistForTarget()` — calls `openSkillDialog()` from `scripts/skills/skills-api.js`; passes preEffectData alongside
- `Ilaris.postResistTest` hook listener — fired by `FertigkeitDialog` after roll; applies or skips effect based on result + `eventId` match
- `renderChatMessageHTML` hook for `.resist-button` click delegation

Add new socket case `'createResistPromptByOwner'` to `scripts/core/init.js:497`.

**Where**: `scripts/combat/dialogs/uebernatuerlich.js`, `scripts/combat/hooks/combat_dialog_handlers.js`, `scripts/core/init.js`
**Who**: code | **Depends on**: 1, 2

---

### Step 5 — Maneuver Amplification Helper

Add `computePreEffectAmplification(item, activeManeuvers)` to `shared-dialog-helpers.js`:

- Iterates `activeManeuvers[]` (already populated by `setManoevers()` + `manoeverAuswaehlen()`)
- Checks `modification.type === 'INCREASE_DURATION'` → accumulates `durationMultiplier`
- Checks `modification.type === 'QUALITY_AMPLIFICATION'` → accumulates `qualityStages`
- Returns `{ durationMultiplier, qualityStages }`
- No changes to `processModification` or `handleModifications`

**Where**: `scripts/combat/dialogs/shared-dialog-helpers.js`
**Who**: code | **Depends on**: 3

---

### Step 6 — Tests

- Spell with one `preEffect` and `instant: false`: creates ActiveEffect on target
- Spell with one `preEffect` and `instant: true`: applies change directly, no ActiveEffect
- Spell with 2 `preEffects` (one amplified, one not): correct values for each
- Duration amplified by `INCREASE_DURATION` maneuver: `originalValue` = `baseDuration * durationMultiplier`
- Value amplified by `QUALITY_AMPLIFICATION` maneuver with `maechtigBonus`: bonus applied N times
- Value NOT amplified when `amplifiedByMaechtigeMagie: false` even if `QUALITY_AMPLIFICATION` active
- **Avoid test enabled + diminishedOnly=false**: resist success → effect skipped
- **Avoid test enabled + diminishedOnly=true**: resist success → diminishedValue used
- **Multi-target**: 3 targets × 2 preEffects = 6 ActiveEffects created
- **Origin tracking**: created ActiveEffects have `origin = caster.actor.uuid` and correct flags
- **Self-cast**: `remaining` = `baseDuration + 1` on self-targeted effects
- No `preEffects` defined: no effects created (regression)
- Regression: existing tests green

**Where**: `scripts/items/_spec/`, `scripts/effects/_spec/`
**Who**: code | **Depends on**: 1-5

---

### Step 7 — Documentation

Document the `preEffects` schema, the new `INCREASE_DURATION` and `QUALITY_AMPLIFICATION` modification types, and usage in spell/liturgy definitions.

**Where**: JSDoc, `docs/faq.md`
**Who**: docs | **Depends on**: 1-3

## 5. Risks & Constraints

1. **New modification types are data-only**: `INCREASE_DURATION` and `QUALITY_AMPLIFICATION` are added to maneuver compendium source files but are NOT processed by `processModification` or `handleModifications`. They are read directly by `computePreEffectAmplification()`. This keeps the existing modification pipeline unchanged — zero regression risk.

2. **Async race conditions with multi-target**: Resist prompts fire simultaneously via chat. Effects are created as each `Ilaris.postResistTest` hook fires. Using `eventId` for dedup prevents double-application.

3. **Unlinked token permissions**: Creating ActiveEffects on NPC actors may require GM permissions. The `resolveTargetActorForDamage()` pattern from `shared-dialog-helpers.js` should be reused.

4. **`CONFIG.ILARIS.manoever_magie` / `manoever_karma` are referenced but undefined** in `actor.js:612,620` — a latent bug that should be fixed separately.

5. **Maechtige Magie amplification**: Multiple stages (input > 1) are valid in Ilaris rules. `qualityStages = mod.value * Number(input)` (e.g., 2 stages → `qualityStages=2`, `maechtigBonus` applied twice). `change.maechtigBonus` is always a plain string (e.g. `"+2W6"`, `"+4"`).

6. **`change.type: 'add'` is the default** — standard Foundry `add` change type applies the value to the target key. Do NOT use `'dot'` (its handler is a no-op; DOT is only for combat-turn damage). Authors can set a different type per preEffect as needed.

7. **`_energieAbrechnenKlick` is a second entry point** — for spells with non-numeric `schwierigkeit`, energy and pre-effects fire from the "Erfolgreich gewirkt" button, not from `_angreifenKlick`. The "Misslungen" button must NOT trigger pre-effects.

## 6. Delegation Map

| Step | Specialist | Input                                            | Expected Output                                                 |
| ---- | ---------- | ------------------------------------------------ | --------------------------------------------------------------- |
| 1    | code       | §2.1 schema, `models.js`                         | `preEffects` ArrayField on übernatürlich talent                 |
| 2    | code       | Step 1 schema, item templates                    | Repeatable pre-effects editor in sheet                          |
| 3    | compendium | 4 maneuver JSON files                            | New `INCREASE_DURATION` + `QUALITY_AMPLIFICATION` modifications |
| 4    | code       | Steps 1-2, `uebernatuerlich.js`                  | `_applyPreEffects()` method                                     |
| 5    | code       | Step 3 maneuver data, `shared-dialog-helpers.js` | `computePreEffectAmplification()` helper                        |
| 6    | code       | Steps 1-5                                        | 14 tests covering all scenarios                                 |
| 7    | docs       | Steps 1-3                                        | JSDoc + `docs/faq.md` updated                                   |

## 7. Validation

- `preEffects` list visible in spell editor
- Casting a spell with `preEffects` against a target creates all effects
- `instant: true` applies damage directly without creating an ActiveEffect
- `amplifiedByMaechtigeMagie: false` — value stays unchanged regardless of `QUALITY_AMPLIFICATION`
- `INCREASE_DURATION` maneuver → duration multiplied correctly
- `QUALITY_AMPLIFICATION` maneuver with `maechtigBonus` → bonus applied N stages
- Avoid test + `diminishedOnly: false` — resist success skips effect
- Avoid test + `diminishedOnly: true` — resist success uses diminishedValue
- Multi-target: N targets × M preEffects = N×M ActiveEffects
- Origin tracking: all created effects have correct `origin` + `flags.ilaris`
- Self-cast: `remaining` = `baseDuration + 1`
- `npm test` + `npm run lint` green
