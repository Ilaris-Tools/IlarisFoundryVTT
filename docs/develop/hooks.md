# Hooks – Ilaris FoundryVTT System

Das Ilaris-System stellt eigene Foundry-Hooks bereit, damit externe Module den
Dialog-Lebenszyklus, die Zielauswahl sowie die Würfelwürfe im Kampfsystem
abfangen und erweitern können.

Alle Hooks verwenden den Namensraum **`Ilaris.<hookName>`**.

---

## Konventionen

| Typ                    | Funktion                       | Rückgabewert `false` bricht ab?   |
| ---------------------- | ------------------------------ | --------------------------------- |
| Cancellable Hook       | `Hooks.call('Ilaris.…', …)`    | Ja – Aktion wird nicht ausgeführt |
| Benachrichtigungs-Hook | `Hooks.callAll('Ilaris.…', …)` | Nein                              |

---

## Dialog-Lebenszyklus

### `Ilaris.preCombatDialog` _(cancellable)_

Wird in `openCombatDialog()` gefeuert, bevor der Dialog instanziiert wird.
Rückgabe von `false` verhindert das Öffnen; die Funktion gibt dann `null` zurück.

```js
Hooks.on('Ilaris.preCombatDialog', (actor, item, type, options) => {
    if (someCondition) return false // Dialog wird nicht geöffnet
})
```

| Parameter | Typ      | Beschreibung                                |
| --------- | -------- | ------------------------------------------- |
| `actor`   | `Actor`  | Der handelnde Akteur                        |
| `item`    | `Item`   | Waffe oder übernatürliche Fähigkeit         |
| `type`    | `string` | `'melee'`, `'ranged'` oder `'supernatural'` |
| `options` | `object` | Weitergereichte Optionen (mutierbar)        |

---

### `Ilaris.combatDialogRendered`

Wird am Ende von `CombatDialog._onRender()` gefeuert (nach jedem Render).

```js
Hooks.on('Ilaris.combatDialogRendered', (dialog) => {
    console.log('Dialog gerendert:', dialog)
})
```

| Parameter | Typ            | Beschreibung           |
| --------- | -------------- | ---------------------- |
| `dialog`  | `CombatDialog` | Die gerenderte Instanz |

---

## Zielauswahl

### `Ilaris.preTargetSelection` _(cancellable)_

Wird gefeuert, bevor Ziele gesetzt werden – sowohl bei der automatischen
Übernahme aus `game.user.targets` als auch beim Öffnen des
`TargetSelectionDialog`. Rückgabe von `false` bricht den Vorgang ab.

```js
Hooks.on('Ilaris.preTargetSelection', (dialog, candidates) => {
    if (!candidates) return // Zielauswahl-Dialog wurde geöffnet
    console.log('Kandidaten:', candidates)
})
```

| Parameter    | Typ            | Beschreibung               |
| ------------ | -------------- | -------------------------- | ------------------------------------------------------------------ |
| `dialog`     | `CombatDialog` | Der zugehörige Kampfdialog |
| `candidates` | `Token[]       | null`                      | Tokenliste (automatische Übernahme) oder `null` (manueller Dialog) |

---

### `Ilaris.targetSelectionComplete`

Wird gefeuert, nachdem `this.selectedActors` gesetzt wurde.

```js
Hooks.on('Ilaris.targetSelectionComplete', (dialog, selectedActors) => {
    console.log('Ausgewählte Ziele:', selectedActors)
})
```

| Parameter        | Typ            | Beschreibung                       |
| ---------------- | -------------- | ---------------------------------- |
| `dialog`         | `CombatDialog` | Der zugehörige Kampfdialog         |
| `selectedActors` | `object[]`     | Array der ausgewählten Zielobjekte |

---

## Würfelwürfe

### `Ilaris.preAngriff` _(cancellable)_

Wird zu Beginn von `_angreifenKlick()` in allen drei Dialog-Klassen gefeuert.

```js
Hooks.on('Ilaris.preAngriff', (dialog) => {
    if (dialog.actor.id === myActorId) return false // Angriff blockieren
})
```

| Parameter | Typ            | Beschreibung                  |
| --------- | -------------- | ----------------------------- |
| `dialog`  | `CombatDialog` | Die aufrufende Dialog-Instanz |

---

### `Ilaris.postAngriff`

Wird nach `evaluate_roll_with_crit()` in allen drei Dialog-Klassen gefeuert.
Ersetzt den früheren Hook `Ilaris.fernkampfAngriffClick` (Breaking Change).

```js
Hooks.on('Ilaris.postAngriff', (rollResult, dialog) => {
    console.log('Angriffsergebnis:', rollResult.roll.total)
})
```

| Parameter    | Typ            | Beschreibung                           |
| ------------ | -------------- | -------------------------------------- |
| `rollResult` | `object`       | Ergebnis von `evaluate_roll_with_crit` |
| `dialog`     | `CombatDialog` | Die aufrufende Dialog-Instanz          |

---

### `Ilaris.preVerteidigung` _(cancellable)_

Wird zu Beginn von `AngriffDialog._verteidigenKlick()` gefeuert.

```js
Hooks.on('Ilaris.preVerteidigung', (dialog) => false) // Verteidigung blockieren
```

| Parameter | Typ             | Beschreibung                  |
| --------- | --------------- | ----------------------------- |
| `dialog`  | `AngriffDialog` | Die aufrufende Dialog-Instanz |

---

### `Ilaris.postVerteidigung`

Wird nach dem Verteidigungswurf in `AngriffDialog._verteidigenKlick()` gefeuert.

```js
Hooks.on('Ilaris.postVerteidigung', (rollResult, dialog) => {
    console.log('VT-Ergebnis:', rollResult.roll.total)
})
```

| Parameter    | Typ             | Beschreibung                           |
| ------------ | --------------- | -------------------------------------- |
| `rollResult` | `object`        | Ergebnis von `evaluate_roll_with_crit` |
| `dialog`     | `AngriffDialog` | Die aufrufende Dialog-Instanz          |

---

### `Ilaris.preSchaden` _(cancellable)_

Wird zu Beginn von `_schadenKlick()` in `AngriffDialog` und
`FernkampfAngriffDialog` gefeuert.

```js
Hooks.on('Ilaris.preSchaden', (dialog) => false) // Schadenswurf blockieren
```

| Parameter | Typ            | Beschreibung                  |
| --------- | -------------- | ----------------------------- |
| `dialog`  | `CombatDialog` | Die aufrufende Dialog-Instanz |

---

### `Ilaris.postSchaden`

Wird nach dem Schadenswurf und dem Chat-Post in `_schadenKlick()` gefeuert.

```js
Hooks.on('Ilaris.postSchaden', (rollResult, dialog) => {
    console.log('Schaden:', rollResult.roll.total)
})
```

| Parameter    | Typ            | Beschreibung                           |
| ------------ | -------------- | -------------------------------------- |
| `rollResult` | `object`       | Ergebnis von `evaluate_roll_with_crit` |
| `dialog`     | `CombatDialog` | Die aufrufende Dialog-Instanz          |

---

## Öffentliche API

Externe Module können Dialoge direkt öffnen, ohne interne Klassen importieren
zu müssen:

```js
const { openCombatDialog } = game.modules.get('mein-modul').api
// oder direkt über den globalen Import (wenn das Modul Zugriff hat):
import { openCombatDialog } from 'systems/Ilaris/scripts/combat/combat-api.js'

const dialog = await openCombatDialog(actor, item, 'melee')
// dialog ist null, wenn Ilaris.preCombatDialog false zurückgegeben hat
```

### `openCombatDialog(actor, item, type, options?)`

| Parameter | Typ      | Beschreibung                                |
| --------- | -------- | ------------------------------------------- |
| `actor`   | `Actor`  | Der handelnde Akteur                        |
| `item`    | `Item`   | Waffe oder Fähigkeit                        |
| `type`    | `string` | `'melee'`, `'ranged'` oder `'supernatural'` |
| `options` | `object` | Optionale Optionen für den Dialog           |

**Rückgabe**: `Promise<CombatDialog|null>`

---

## Breaking Changes

| Alter Hook                     | Neuer Hook           |
| ------------------------------ | -------------------- |
| `Ilaris.fernkampfAngriffClick` | `Ilaris.postAngriff` |
