# DoT Active Effects — Adaption an das Ilaris-System

## 1. Ziel

DoT-Effekte (Damage over Time / Erschöpfung über Zeit) als **first-class Change Type** in Foundry V14 registrieren und in das Ilaris-Timing-System integrieren.

- DoTs verwenden den Ilaris-Timer (`ilarisTiming`) mit `durationType: "ownerTurns"` und `expiresOn: "turnEnd"`
- DoTs ticken immer am **Ende** des Eigentümer-Zugs
- DoTs modifizieren `system.gesundheit.wunden` oder `system.gesundheit.erschoepfungen` um den im Change-Value angegebenen Betrag
- Der alte Key-Prefix-Matching-Ansatz (`key.startsWith('system.gesundheit.wunden')`) wird durch `change.type === "dot"` ersetzt
- Der `updateActiveEffect`-Hook aus `dot-effects.js` wird entfernt — DoT-Damage wird direkt in `combat-turn-hooks.js` angewendet

## 2. Architektur

### 2.1 Foundry V14 Change Type API

Foundry V14 bietet `CONFIG.ActiveEffect.changeTypes` zur Registrierung eigener Change-Typen:

```ts
// https://foundryvtt.com/api/v14/interfaces/CONFIG.ActiveEffectChangeTypeConfig.html
interface ActiveEffectChangeTypeConfig {
    defaultPriority: number // Sortierung (0 = zuerst, 50 = zuletzt)
    label: string // Anzeigename im Dropdown
    handler?: ActiveEffectChangeHandler | null // Anwendungslogik
    render?: ActiveEffectChangeRenderer | null // UI-Rendering (optional)
}

// https://foundryvtt.com/api/v14/types/foundry.documents.types.ActiveEffectChangeHandler.html
type ActiveEffectChangeHandler = (
    targetDoc: Actor | Item | TokenDocument,
    change: ActiveEffectChangeData,
    options?: { field?; replacementData?; modifyTarget? },
) => Promise<Record<string, unknown> | void>
```

**Bestehende Change-Typen** (V14 built-in):

| Type        | Priority | Verhalten                                                       |
| ----------- | -------- | --------------------------------------------------------------- |
| `custom`    | 0        | Kein autom. Apply. `_applyCustom` oder `applyActiveEffect`-Hook |
| `multiply`  | 10       | Multipliziert Basiswert                                         |
| `add`       | 20       | Addiert Werte, konkateniert Strings                             |
| `subtract`  | 20       | Subtrahiert numerische Werte                                    |
| `downgrade` | 30       | `min(base, effect)`                                             |
| `upgrade`   | 40       | `max(base, effect)`                                             |
| `override`  | 50       | Ersetzt komplett                                                |

### 2.2 Ilaris `"dot"` Change Type

```js
CONFIG.ActiveEffect.changeTypes['dot'] = {
    label: 'Ilaris.SchadenÜberZeit',
    defaultPriority: 0, // wie custom — keine automatische Anwendung
    handler: IlarisActiveEffect.#applyDotChange,
}
```

Der **Handler** (`#applyDotChange`):

- Prüft ob der Effect `ilarisTiming` gesetzt hat (sonst Warnung)
- Wendet den Change-Wert **nicht sofort** an — DoTs wirken nur über Combat-Hooks
- Validiert dass der Key auf `system.gesundheit.wunden` oder `system.gesundheit.erschoepfungen` zeigt
- Gibt `null` zurück (kein normaler Apply)

### 2.3 DoT-Lebenszyklus

```
Runde 1, Start von A: remaining 3 → 2 (turnStart)
Runde 1, Ende von A:  applyDotDamage() — Schaden! (remaining=2, läuft weiter)

Runde 2, Start von A: remaining 2 → 1
Runde 2, Ende von A:  applyDotDamage() — Schaden! (remaining=1)

Runde 3, Start von A: remaining 1 → 0
Runde 3, Ende von A:  applyDotDamage() — Schaden! + remaining=0 + turnEnd → EXPIRE
```

### 2.4 Integration in combat-turn-hooks.js

In `reduceEffectDurationForCombatant`, für jeden Effect in der `turnEnd`-Phase:

```js
// Nach dem Decrement-Check:
if (effect.hasDotChanges) {
    for (const change of effect.dotChanges) {
        await IlarisActiveEffect.applyDotDamage(actor, change, effect)
    }
}
```

`hasDotChanges` / `dotChanges` sind Hilfs-Getter auf `IlarisActiveEffect`:

```js
get hasDotChanges() {
    return this.changes.some(c => c.type === "dot")
}
get dotChanges() {
    return this.changes.filter(c => c.type === "dot")
}
```

### 2.5 Was wegfällt

| Alte Komponente                                                    | Grund                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `updateActiveEffect` Hook in `dot-effects.js`                      | DoT-Damage wird direkt in `combat-turn-hooks.js` angewendet |
| Key-Prefix-Matching (`key.startsWith('system.gesundheit.wunden')`) | Ersetzt durch `change.type === "dot"`                       |
| `_applyCustom`-Check auf `system.gesundheit.wunden`                | Ersetzt durch Handler-Logik im Change-Type                  |

## 3. Schritte

### Step 1 — `"dot"` Change Type in `CONFIG.ActiveEffect.changeTypes` registrieren

In `scripts/core/init.js` (oder `scripts/effects/hooks.js`): `"dot"` Change-Type registrieren mit `defaultPriority: 0`, Label, und Handler.

**Handler-Logik**:

- Prüft `this.ilarisTiming?.durationType === 'ownerTurns'` → sonst `ui.notifications.warn`
- Validiert Key → nur `system.gesundheit.wunden` oder `system.gesundheit.erschoepfungen`
- Gibt `null` zurück — keine sofortige Anwendung

**Where**: `scripts/core/init.js`
**Who**: code | **Depends on**: active-effect-timing (bereits implementiert)

---

### Step 2 — `IlarisActiveEffect`-Getter für DoT-Changes

```js
get hasDotChanges() {
    return this.changes.some(c => c.type === "dot")
}
get dotChanges() {
    return this.changes.filter(c => c.type === "dot")
}
```

**Where**: `scripts/effects/active-effect.js`
**Who**: code | **Depends on**: 1

---

### Step 3 — DoT-Damage in `combat-turn-hooks.js` einbauen

In `reduceEffectDurationForCombatant`, in der `turnEnd`-Phase: nach dem Flag-Setzen für `_pendingExpiry` / `_pendingDurationChange`, DoT-Damage anwenden:

```js
// Apply DOT damage at end of owner's turn
if (effect.hasDotChanges) {
    for (const change of effect.dotChanges) {
        await IlarisActiveEffect.applyDotDamage(actor, change, effect)
    }
}
```

**Where**: `scripts/effects/combat-turn-hooks.js`
**Who**: code | **Depends on**: 2

---

### Step 4 — `_applyCustom` bereinigen

`_applyCustom` entfernt den Key-Prefix-Check. Stattdessen leitet der `"dot"` Change-Type-Handler alles Nötige.

**Where**: `scripts/effects/active-effect.js`
**Who**: code | **Depends on**: 1

---

### Step 5 — `dot-effects.js` bereinigen

`updateActiveEffect`-Hook und `applyDotEffectToActor`-Funktion entfernen. Datei auf Import + Log reduzieren (oder ganz entfernen, falls `hooks.js` direkt `combat-turn-hooks.js` importiert).

**Where**: `scripts/effects/dot-effects.js`, `scripts/effects/hooks.js`
**Who**: code | **Depends on**: 3

---

### Step 6 — `applyDotDamage` erweitern

Aktuell nur `system.gesundheit.wunden` — erweitern auf `system.gesundheit.erschoepfungen` basierend auf `change.key`:

```js
static async applyDotDamage(actor, change, effect) {
    const targetPath = change.key  // "system.gesundheit.wunden" oder "system.gesundheit.erschoepfungen"
    let damageValue = parseFloat(change.value) || 0
    // ... @-Auflösung wie bisher ...
    const current = foundry.utils.getProperty(actor, targetPath) ?? 0
    await actor.update({ [targetPath]: current + damageValue })
    // ... ChatMessage wie bisher ...
}
```

**Where**: `scripts/effects/active-effect.js`
**Who**: code | **Depends on**: 1

---

### Step 7 — Tests

- DoT mit 3× `ownerTurns`: 3× Schaden (je am Zug-Ende), dann expired
- DoT auf `system.gesundheit.erschoepfungen`: Erschöpfung steigt pro Tick
- DoT ohne `ilarisTiming`: Change-Type-Handler warnt
- `change.type === "dot"` wird korrekt erkannt
- Nicht-DoT Ilaris-Effekte: unverändert
- Regression: bestehende Tests grün

**Where**: `scripts/effects/_spec/`
**Who**: code | **Depends on**: 1-6

---

### Step 8 — Doku

DoT-Nutzung dokumentieren: Change-Type `"dot"`, Key `system.gesundheit.wunden` oder `system.gesundheit.erschoepfungen`, `ilarisTiming` mit `durationType: "ownerTurns"` und `expiresOn: "turnEnd"`.

**Where**: JSDoc, `docs/faq.md`
**Who**: docs | **Depends on**: 1-3

## 4. Validation

- `"dot"` erscheint im Change-Type-Dropdown des ActiveEffect-Dialogs
- DoT mit 3 Runden `ownerTurns`: 3× Schaden am Zug-Ende, dann expired
- DoT auf `system.gesundheit.erschoepfungen`: Erschöpfung steigt
- DoT auf Combatant A: tickt NUR wenn A am Zug
- `npm test` + `npm run lint` grün
- `dot-effects.js` `updateActiveEffect`-Hook entfernt

### Step 4 — Alten Tick-Service bereinigen

Auskommentierten `updateActiveEffect`-Hook und `_applyDotTickToActor` aus `dot-effects.js` entfernen. Datei auf Import + Log reduzieren.

**Where**: `scripts/effects/dot-effects.js`
**Who**: code | **Depends on**: 2

---

### Step 5 — `_applyCustom`-Kommentar aktualisieren

Verweis von "Tick-Service in effects/dot-effects.js" auf "combat-turn-hooks.js" ändern.

**Where**: `scripts/effects/active-effect.js`
**Who**: code | **Depends on**: 2

---

### Step 6 — Tests

- DoT mit `ilarisTiming`: `remaining` decrementiert → Schaden angewendet
- DoT ohne `ilarisTiming`: `_preCreate` blockiert
- DoT mit `originalValue = 0`: `_preCreate` blockiert
- DoT expired: kein Schaden nach `remaining = 0`
- Nicht-DoT Ilaris-Effekte: unverändert
- Regression: bestehende Tests grün

**Where**: `scripts/effects/_spec/`
**Who**: code | **Depends on**: 1-5

---

### Step 7 — Doku

DoT-Nutzung dokumentieren: Type `ilarisTiming`, `durationType: ownerTurns`, `originalValue` = Ticks, Schaden im Change-Value.

**Where**: JSDoc, `docs/faq.md`
**Who**: docs | **Depends on**: 1-4

## 4. Validation

- DoT mit 3 Runden `ownerTurns`: 3× Schaden, dann expired
- DoT auf Combatant A: decrementiert NUR wenn A am Zug
- `_preCreate` blockiert DoT ohne `ilarisTiming`
- `npm test` + `npm run lint` grün
