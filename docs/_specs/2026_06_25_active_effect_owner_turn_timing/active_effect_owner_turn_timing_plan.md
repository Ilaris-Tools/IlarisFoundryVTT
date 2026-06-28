# ActiveEffect Owner-Scoped Turn Timing Plan

## 1. Objective

Adapt the Ilaris FoundryVTT system so ActiveEffect duration tracked in turns is **reduced only on the owning combatant's turn**, not on every combatant's turn. DoT behavior and manual advance are explicitly out of scope.

## 2. Architecture Decision

After researching dnd5e, WFRP4e, and PF2e, the approach is modeled on **WFRP4e's condition system**: add Ilaris-specific effect configuration to the ActiveEffect dialog, store it in `system` data, and process effects in combat hooks. No fragile core overrides needed.

### Why override `updateDuration` / `isExpiryEvent`

- `isExpiryEvent` → overridden to return `false` for Ilaris-timed effects, preventing core from expiring them (Step 3 handles expiry)
- `updateDuration` → overridden to **skip** core processing for Ilaris-timed effects, preventing core from independently decrementing `duration.turns` each combat turn (regardless of owner), which would create a conflicting counter
- These are defensive guards, not the timing mechanism itself — the actual decrement/expiry happens in combat hooks (Step 3)
- WFRP4e's pattern (extend config, process in hooks) is proven and stable

### WFRP4e's pattern in detail

WFRP4e's conditions (Bleeding, Ablaze, etc.) store `system.condition.value` (stack count) and `system.condition.trigger` (`"endRound"`, `"endTurn"`). The ActiveEffect config is extended via:

- `WFRP4eActiveEffectConfig` (11 lines, extends `WarhammerActiveEffectConfig`, sets `systemTemplate=""`, overrides `hiddenProperties()`)
- `WFRP4eActiveEffectModel` (adds `condition` SchemaField: `{value: NumberField, numbered: BooleanField, trigger: StringField}`)
- Combat hooks (`checkStartTurnConditions`/`checkEndTurnConditions`) filter effects by `condition.trigger` and process them

Ilaris follows the same pattern but adapted for **Foundry V14**: a custom `IlarisActiveEffectConfig` extending the core `ActiveEffectConfig` with a new **tab** (using AppV2's built-in `TABS`/`PARTS` system), a TypeDataModel extending `foundry.data.ActiveEffectTypeDataModel` (V14's built-in base which already defines `changes`), and combat hooks to process.

### Foundry V14 ActiveEffectConfig AppV2 Architecture (Research Results)

The V14 `ActiveEffectConfig` (`foundry.applications.sheets.ActiveEffectConfig`) is already an AppV2 application:

```
Static PARTS (core):
├── header     → template
├── tabs       → template (navigation)
├── details    → template, scrollable
├── duration   → template
├── changes    → template, scrollable, templates[]
└── footer     → template

Static TABS (core):
└── sheet:
    ├── initial: "details"
    ├── labelPrefix: "EFFECT.Tab"
    └── tabs: [{id:"details", icon:"fa-solid fa-circle-info"},
               {id:"duration", icon:"fa-solid fa-hourglass-half"},
               {id:"changes", icon:"fa-solid fa-pen-to-square"}]
```

Key AppV2 tab infrastructure available to subclasses:

- `changeTab(tab, group, options)` — programmatic tab switching
- `_getTabsConfig(group)` — returns `ApplicationTabsConfiguration | null`
- `_prepareTabs(group)` — prepares tab data for rendering (called in `_prepareContext`)
- `_preparePartContext(partId, context)` — per-part context injection
- `_onClickTab(event)` — tab click handler
- `tabGroups` instance property — tracks active tab per group

**Ilaris current state** (no ActiveEffectConfig customization):

- `CONFIG.ActiveEffect.documentClass = IlarisActiveEffect` — only the document class is swapped
- No custom ActiveEffectConfig class; the default Foundry `ActiveEffectConfig` renders for all effect editing
- No `foundry.applications.apps.DocumentSheetConfig.registerSheet` call for ActiveEffect
- `scripts/effects/active-effects.js` — 23-line stub, no code

### Why a custom AppV2 tab (not a render hook)?

- `renderActiveEffectConfig` hooks are V1-era patterns; V14 AppV2 applications use `TABS`/`PARTS` overrides
- The core `ActiveEffectConfig` already has a `duration` tab — adding our own "Ilaris Dauer" tab alongside it is the canonical AppV2 approach
- Tab-based extension gives proper lifecycle integration: `_preparePartContext`, `_prepareSubmitData`, `_onChangeForm` all work naturally
- No fragile DOM manipulation needed

## 3. Research Summary

| System               | Approach                                                | Overrides `updateDuration`?  | Overrides `isExpiryEvent`? |
| -------------------- | ------------------------------------------------------- | ---------------------------- | -------------------------- |
| **dnd5e**            | Accepts core default                                    | No                           | No                         |
| **WFRP4e**           | Custom `system.condition` + combat hooks                | No                           | No                         |
| **PF2e**             | Custom `EffectTracker` + own duration math              | No                           | No                         |
| **Dragonbane SE**    | Status UI library only                                  | No                           | No                         |
| **Ilaris (planned)** | Custom `system.ilarisTiming` + AppV2 tab + combat hooks | Skip core for Ilaris effects | Guard: skip Ilaris effects |

**Implementation status**: ✅ Complete

- `IlarisActiveEffect` in `scripts/effects/active-effect.js` — overrides `isExpiryEvent()`, `updateDuration()`, `apply()`, `_applyCustom()`
- `IlarisActiveEffectDataModel` in `scripts/effects/model-data/ilaris-effect-model.js` — extends `foundry.data.ActiveEffectTypeDataModel`, adds `ilarisTiming` via `super.defineSchema()`
- `IlarisActiveEffectConfig` in `scripts/effects/ilaris-effect-config.js` — AppV2 tab + `_onRender` for UI sync
- `scripts/effects/combat-turn-hooks.js` — combatTurn/combatRound/updateCombat hooks with two-phase turnEnd flow
- `CONFIG.ActiveEffect.dataModels["base"]` registered in `type-data-models.js`
- `ilarisTiming` stored as `system.ilarisTiming` (TypeDataModel maps to `system` automatically)

## 4. Steps

### Step 0 — Relocate `IlarisActiveEffect` to `scripts/effects/`

Move the `IlarisActiveEffect` class from `scripts/core/documents/active-effect.js` to `scripts/effects/active-effect.js`. This consolidates all effect-related code under `scripts/effects/`.

**Move**: `scripts/core/documents/active-effect.js` → `scripts/effects/active-effect.js`

The relative import path for `configure-game-settings.model.js` changes from `../../settings/` to `../settings/`.

**Update imports in**:

- `scripts/core/init.js` line 2: `'./documents/active-effect.js'` → `'../effects/active-effect.js'`
- `scripts/effects/dot-effects.js` line 1: `'../core/documents/active-effect.js'` → `'./active-effect.js'`

**Where**: Move file, update 2 imports
**Who**: code | **Depends on**: none

---

### Step 1 — DELETED (No TypeDataModel needed)

**Removed.** The initial plan attempted to register an `IlarisEffectTimingModel` via `CONFIG.ActiveEffect.dataModels`, but `CONFIG.ActiveEffect.dataModels` registers **complete replacement** schemas — each entry must include all base ActiveEffect fields (`changes`, `disabled`, `duration`, etc.). Foundry rejected the model with "must define a changes field in its schema."

Instead, `system.ilarisTiming` is stored as a plain JS object on the ActiveEffect's `system` field, which is already an `ObjectField` that serializes arbitrary nested data. No schema registration is required. The config sheet (Step 2) writes to `system.ilarisTiming` via `_prepareSubmitData`, and combat hooks (Step 3) read from it via `effect.system?.ilarisTiming`.

**Where**: Nothing
**Who**: code | **Depends on**: —

---

### Step 2 — Create IlarisActiveEffectConfig with AppV2 "Ilaris Dauer" Tab

Create a custom `IlarisActiveEffectConfig` class extending `foundry.applications.sheets.ActiveEffectConfig`. This adds a **new "Ilaris Dauer" tab** to the existing `sheet` tab group alongside the core `details`, `duration`, and `changes` tabs. Uses AppV2's `TABS`/`PARTS` system — no render hooks or DOM manipulation.

**New file: `scripts/effects/ilaris-effect-config.js`**:

```js
export class IlarisActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    /**
     * Add the Ilaris Dauer part alongside core parts.
     * Core parts: header, tabs, details, duration, changes, footer
     * @override
     */
    static PARTS = {
        ...foundry.applications.sheets.ActiveEffectConfig.PARTS,
        ilarisDuration: {
            template: 'systems/Ilaris/scripts/effects/templates/ilaris-duration-tab.hbs',
        },
    }

    /**
     * Add Ilaris Dauer tab to the existing sheet tab group.
     * Core tabs: details, duration, changes
     * @override
     */
    static TABS = {
        sheet: {
            ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet,
            tabs: [
                ...foundry.applications.sheets.ActiveEffectConfig.TABS.sheet.tabs,
                { id: 'ilarisDuration', icon: 'fa-solid fa-clock', label: 'Ilaris Dauer' },
            ],
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.ilarisTiming = this._getIlarisTimingData()
        context.ilarisDurationTypes = {
            '': 'Keine (Standard)',
            ownerTurns: 'Eigener Zug',
        }
        context.ilarisExpiresOnOptions = {
            turnStart: 'Rundenbeginn',
            turnEnd: 'Rundenende',
        }
        context.tabs = this._prepareTabs('sheet')
        return context
    }

    /** @override */
    async _preparePartContext(partId, context) {
        if (partId === 'ilarisDuration') {
            context.ilarisTiming = this._getIlarisTimingData()
            context.ilarisDurationTypes = {
                '': 'Keine (Standard)',
                ownerTurns: 'Eigener Zug',
            }
            context.ilarisExpiresOnOptions = {
                turnStart: 'Rundenbeginn',
                turnEnd: 'Rundenende',
            }
            context.tab = context.tabs[partId]
        }
        return super._preparePartContext(partId, context)
    }

    /** @override */
    async _prepareSubmitData(event, form, formData, updateData) {
        const submitData = await super._prepareSubmitData(event, form, formData, updateData)

        // Extract Ilaris timing fields from form
        const fd = formData.object || formData
        const durationType = fd.ilarisDurationType || ''
        const remaining = parseInt(fd.ilarisRemaining, 10) || 0
        const expiresOn = fd.ilarisExpiresOn || 'turnStart'

        if (durationType === 'ownerTurns') {
            submitData['system.ilarisTiming'] = {
                durationType,
                remaining,
                originalValue: remaining,
                expiresOn,
            }
            // Prevent core from tracking a conflicting duration counter.
            // V14 stores duration as a nested SchemaField { value, units }.
            // The Ilaris combat hooks (Step 3) handle all decrement/expiry.
            submitData['duration.value'] = 0
            submitData['duration.units'] = 'none'
        } else {
            // Clear Ilaris timing if not using ownerTurns
            submitData['system.ilarisTiming'] = null
        }

        return submitData
    }

    /**
     * Build timing data from the current effect document.
     * @returns {object}
     */
    _getIlarisTimingData() {
        const timing = this.document.system?.ilarisTiming || {}
        return {
            durationType: timing.durationType || '',
            remaining: timing.remaining ?? 0,
            originalValue: timing.originalValue ?? 0,
            expiresOn: timing.expiresOn || 'turnStart',
        }
    }
}
```

**New template: `scripts/effects/templates/ilaris-duration-tab.hbs`**:

```handlebars
<fieldset>
    <legend>Ilaris Runden-Dauer</legend>
    <div class='form-group'>
        <label>Dauer-Typ</label>
        <div class='form-fields'>
            <select name='ilarisDurationType'>
                {{selectOptions ilarisDurationTypes selected=ilarisTiming.durationType}}
            </select>
        </div>
        <p class='hint'>"Eigener Zug" verringert die Dauer nur im Zug des Trägers.</p>
    </div>

    {{#if (eq ilarisTiming.durationType 'ownerTurns')}}
        <div class='form-group'>
            <label>Verbleibende Runden</label>
            <div class='form-fields'>
                <input
                    type='number'
                    name='ilarisRemaining'
                    value='{{ilarisTiming.remaining}}'
                    min='0'
                    step='1'
                />
            </div>
            <p class='hint'>Wird im Zug des Trägers um 1 verringert. Bei 0 läuft der Effekt aus.</p>
        </div>

        <div class='form-group'>
            <label>Ablaufzeitpunkt</label>
            <div class='form-fields'>
                <select name='ilarisExpiresOn'>
                    {{selectOptions ilarisExpiresOnOptions selected=ilarisTiming.expiresOn}}
                </select>
            </div>
            <p class='hint'>"Rundenbeginn": Effekt endet sofort wenn verbleibende Runden = 0.
                "Rundenende": Effekt wirkt noch die letzte Runde.</p>
        </div>
    {{/if}}
</fieldset>
```

**Registration in `scripts/core/init.js`** (add after the existing `CONFIG.ActiveEffect.documentClass` line):

```js
// Register Ilaris ActiveEffect sheet (AppV2 tab extension)
foundry.applications.apps.DocumentSheetConfig.registerSheet(
    ActiveEffect,
    'Ilaris',
    IlarisActiveEffectConfig,
    { makeDefault: true, label: 'Ilaris' },
)
```

**Where**: New `scripts/effects/ilaris-effect-config.js`, new `scripts/effects/templates/ilaris-duration-tab.hbs`, import and registration in `init.js`
**Who**: code | **Depends on**: 0

---

### Step 3 — Process Effects in Combat Turn Hooks

Three hooks process Ilaris-timed effects with a **two-phase flow** for `turnEnd` expiry:

| Hook           | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `combatTurn`   | Phase 1 — evaluate effects on the current combatant's actor   |
| `combatRound`  | Phase 1 — also evaluate last combatant when round wraps       |
| `updateCombat` | Phase 2 — apply deferred decrement/expiry for turnEnd effects |

**Phase 1** (`reduceEffectDurationForCombatant`):

- Finds effects with `durationType === 'ownerTurns'` on the combatant's actor
- Computes `newRemaining = remaining - 1`
- For `turnStart`: immediately updates `remaining` (or deletes if ≤ 0)
- For `turnEnd`: sets `_pendingExpiry` (if ≤ 0) or `_pendingDurationChange` flag **without** updating `remaining` — actual update deferred to Phase 2

**Phase 2** (`updateCombat`):

- Scans all combatants for turnEnd effects with pending flags
- Re-computes `newRemaining = remaining - 1` and applies the update/delete

**Implementation**: `scripts/effects/combat-turn-hooks.js`
**Who**: code | **Depends on**: 0, 2

```js
import { IlarisActiveEffect } from './active-effect.js'

Hooks.on('combatTurn', async (combat, prior, current) => {
    // GM-only to avoid duplicate processing
    if (!game.user.isGM) return

    const combatant = combat.combatants.get(current.combatantId)
    const actor = combatant?.actor
    if (!actor) return

    // Find Ilaris-timed effects on the current combatant's actor
    const effects = actor.effects.filter(
        (e) =>
            !e.disabled && !e.isSuppressed && e.system?.ilarisTiming?.durationType === 'ownerTurns',
    )

    for (const effect of effects) {
        const timing = effect.system.ilarisTiming
        const newRemaining = timing.remaining - 1

        if (newRemaining <= 0 && timing.expiresOn === 'turnStart') {
            // turnStart: expire immediately
            await effect.delete()
            ChatMessage.create({
                content: `<p><strong>${effect.name}</strong> auf ${actor.name} ist ausgelaufen.</p>`,
            })
        } else if (newRemaining <= 0 && timing.expiresOn === 'turnEnd') {
            // turnEnd: queue expiry for end of this combatant's turn
            // Defer deletion until the next combat update (turn changes)
            await effect.update({
                'system.ilarisTiming.remaining': newRemaining,
                'system.ilarisTiming._pendingExpiry': true,
            })
        } else {
            // Still active: just decrement
            await effect.update({ 'system.ilarisTiming.remaining': newRemaining })
        }
    }
})

// Handle turnEnd-pending expiries when combat advances to the next turn
Hooks.on('updateCombat', async (combat, changed, options, userId) => {
    if (!game.user.isGM) return
    if (!('turn' in changed)) return // only process turn changes

    for (const combatant of combat.combatants) {
        const actor = combatant.actor
        if (!actor) continue

        const pendingEffects = actor.effects.filter((e) => e.system?.ilarisTiming?._pendingExpiry)
        for (const effect of pendingEffects) {
            await effect.delete()
            ChatMessage.create({
                content: `<p><strong>${effect.name}</strong> auf ${actor.name} ist ausgelaufen.</p>`,
            })
        }
    }
})

console.log('Ilaris | Combat turn effect hooks registered')
```

**Where**: New `scripts/effects/combat-turn-hooks.js`, imported from `scripts/effects/hooks.js`
**Who**: code | **Depends on**: 0, 2

---

### Step 4 — Add `IlarisActiveEffect.isExpiryEvent` Override

Add an `isExpiryEvent` override to prevent core ActiveEffect duration expiry from interfering with Ilaris-timed effects. Ilaris-timed effects return `false` (their timing is handled by Step 3). All others delegate to `super`.

```js
isExpiryEvent(event, context) {
    if (this.system?.ilarisTiming?.durationType === "ownerTurns") return false;
    return super.isExpiryEvent(event, context);
}
```

**Where**: `scripts/effects/active-effect.js` (relocated in Step 0)
**Who**: code | **Depends on**: 0

---

### Step 5 — Add `IlarisActiveEffect.updateDuration` Override

Add an `updateDuration` override that **skips** core duration processing for Ilaris-timed effects. Without this guard, the core would independently decrement `duration.turns` every combat turn (regardless of owner), creating a conflicting counter. The owner-scoped turn processing in Step 3 handles all decrement/expiry.

```js
updateDuration(context) {
    // Ilaris-timed effects are tracked by combat hooks (Step 3), not core.
    if (this.system?.ilarisTiming?.durationType === "ownerTurns") return;
    return super.updateDuration(context);
}
```

**Where**: `scripts/effects/active-effect.js` (relocated in Step 0)
**Who**: code | **Depends on**: 0, 3

---

### Step 6 — Retire `scripts/effects/active-effects.js`

Remove the 23-line stub and its import from `scripts/effects/hooks.js`.

**Where**: `scripts/effects/active-effects.js`, `scripts/effects/hooks.js`
**Who**: code | **Depends on**: none

---

### Step 7 — Add Automated Tests

Data model validation, combat hook owner-scoping, expiry timing, `isExpiryEvent` guard, `updateDuration` cleanup, regression (DoT, full suite).

**Where**: `scripts/effects/_spec/`, `scripts/core/_spec/`
**Who**: code | **Depends on**: 0, 2, 3, 4, 5, 6

---

### Step 8 — Developer Documentation

Document WFRP4e pattern choice, data model contract, combat hook lifecycle.

**Where**: JSDoc in new files, repo memory
**Who**: docs | **Depends on**: 0, 2, 3

## 5. Validation

- Step 0: `IlarisActiveEffect` lives in `scripts/effects/active-effect.js`; `init.js` and `dot-effects.js` imports updated
- Step 1: N/A — removed. `system.ilarisTiming` stored as plain object on ActiveEffect's `ObjectField`
- Step 2: ActiveEffect config shows new "Ilaris Dauer" tab; tab toggles between Ilaris fields and core duration; `foundry.applications.apps.DocumentSheetConfig` registration active
- Step 3: Two combatants, Ilaris-timed effects — decrement only on owner's turn
- Step 4: `isExpiryEvent` returns `false` for Ilaris-timed effects, delegates to `super` for others
- Step 5: `updateDuration` skips core decrement for Ilaris-timed effects; core `duration.value`/`duration.units` remain unchanged
- Step 6: Stub deleted, imports cleaned
- Step 7: `npm test` + `npm run lint` — all green

## 6. Delegation Map

| Step | Input                                                                                            | Output                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 0    | Current `scripts/core/documents/active-effect.js`, `init.js`, `dot-effects.js`                   | `IlarisActiveEffect` relocated to `scripts/effects/active-effect.js`; 2 imports updated              |
| 1    | —                                                                                                | **REMOVED** — `system.ilarisTiming` stored as plain object, no TypeDataModel needed                  |
| 2    | V14 `ActiveEffectConfig` (AppV2 TABS/PARTS), V14 `foundry.applications.apps.DocumentSheetConfig` | `IlarisActiveEffectConfig` class with "Ilaris Dauer" tab, Handlebars template, registered as default |
| 3    | Combat hooks, WFRP4e CombatHelpers                                                               | Owner-scoped effect processing                                                                       |
| 4    | `IlarisActiveEffect` class                                                                       | `isExpiryEvent` guard for Ilaris-timed effects                                                       |
| 5    | `IlarisActiveEffect` class                                                                       | `updateDuration` skips core processing for Ilaris-timed effects                                      |
| 6    | Stub + import                                                                                    | Removed                                                                                              |
| 7    | All new code                                                                                     | Unit tests                                                                                           |
| 8    | Architecture decisions                                                                           | JSDoc + repo memory                                                                                  |
