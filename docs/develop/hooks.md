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

### Globale Mirror-Hooks (Combat)

Alle Combat-Dialog-Hooks werden zusaetzlich global gespiegelt. Dabei bleiben
die Original-Hooks lokal, und es wird ein zweiter Hook auf allen Clients
ausgeloest:

- Original: `Ilaris.<name>` (lokal)
- Globaler Mirror: `Ilaris.global.<name>` (netzwerkweit)

Beispiele:

- `Ilaris.preAngriff` -> `Ilaris.global.preAngriff`
- `Ilaris.postSchaden` -> `Ilaris.global.postSchaden`
- `Ilaris.targetSelectionComplete` -> `Ilaris.global.targetSelectionComplete`

Der globale Mirror-Hook erhaelt ein Payload-Objekt mit Metadaten und
serialisierten Argumenten (`argsSummary`), nicht die originalen Live-Objekte
der Dialoginstanz.

Skill-Dialog-Hooks werden aktuell **nicht** global gespiegelt. Sie feuern lokal
auf dem Client, der den Dialog oeffnet oder den Wurf ausloest.

---

## Dialog-Lebenszyklus

### `Ilaris.preSkillDialog` _(cancellable)_

Wird in `openSkillDialog()` gefeuert, bevor ein Fertigkeits-, Attribut- oder
Freie-Fertigkeit-Dialog instanziiert wird. Rueckgabe von `false` verhindert das
Oeffnen; die Funktion gibt dann `null` zurueck.

```js
Hooks.on('Ilaris.preSkillDialog', (actor, options) => {
    if (actor.type === 'kreatur' && options.probeType === 'attribut') return false
})
```

| Parameter | Typ      | Beschreibung                               |
| --------- | -------- | ------------------------------------------ |
| `actor`   | `Actor`  | Der handelnde Akteur                       |
| `options` | `object` | Dialogoptionen fuer `openSkillDialog(...)` |

---

### `Ilaris.skillDialogRendered`

Wird nach dem ersten Rendern des Dialogs gefeuert, sobald die initiale
Preview-Berechnung abgeschlossen ist.

```js
Hooks.on('Ilaris.skillDialogRendered', (dialog, state) => {
    console.log(dialog, state.finalPW)
})
```

| Parameter | Typ                | Beschreibung                                |
| --------- | ------------------ | ------------------------------------------- |
| `dialog`  | `FertigkeitDialog` | Die gerenderte Dialoginstanz                |
| `state`   | `object`           | Normalisierter Preview-Zustand, siehe unten |

---

### `Ilaris.skillDialogStateChanged`

Wird nach jeder Preview-Aktualisierung gefeuert, inklusive der initialen
Berechnung beim ersten Render.

```js
Hooks.on('Ilaris.skillDialogStateChanged', (dialog, state) => {
    console.log(state.diceFormula, state.finalPW, state.schips)
})
```

| Parameter | Typ                | Beschreibung                      |
| --------- | ------------------ | --------------------------------- |
| `dialog`  | `FertigkeitDialog` | Die Dialoginstanz                 |
| `state`   | `object`           | Normalisierter Berechnungszustand |

Relevante Felder in `state`:

| Feld                   | Typ        | Beschreibung                                           |
| ---------------------- | ---------- | ------------------------------------------------------ |
| `reason`               | `string`   | `'render'`, `'change'` oder `'roll'`                   |
| `probeType`            | `string`   | `'fertigkeit'`, `'attribut'`, `'freieFertigkeit'`, ... |
| `label`                | `string`   | Effektives Probenlabel inklusive Talentzusatz          |
| `diceFormula`          | `string`   | Rohformel wie `3d20dl1dh1`                             |
| `formattedDiceFormula` | `string`   | Formatierte Formel fuer die Anzeige                    |
| `effectivePW`          | `number`   | Effektiver Basis-PW bzw. PW(T)                         |
| `finalPW`              | `number`   | Endwert inklusive Status- und Dialogmodifikatoren      |
| `totalMod`             | `number`   | Summe aller additiven Modifikatoren                    |
| `talent`               | `object`   | Auswahlzustand und verfuegbare Talentnamen             |
| `schips`               | `object`   | Auswahl, Verfuegbarkeit und Textstatus fuer Schips     |
| `modifiers.lines`      | `object[]` | Einzelne Modifikatorzeilen fuer Preview/Erweiterungen  |

---

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

### `Ilaris.preSkillRoll` _(cancellable)_

Wird zu Beginn von `FertigkeitDialog._executeRoll()` gefeuert. Rueckgabe von
`false` verhindert den Wurf, die Chat-Nachricht und den Schips-Verbrauch.

```js
Hooks.on('Ilaris.preSkillRoll', (dialog, payload) => {
    if (payload.finalPW < 0) return false
})
```

| Parameter | Typ                | Beschreibung                             |
| --------- | ------------------ | ---------------------------------------- |
| `dialog`  | `FertigkeitDialog` | Die aufrufende Dialoginstanz             |
| `payload` | `object`           | Rollkontext inklusive Formel und Preview |

---

### `Ilaris.postSkillRoll`

Wird nach dem Chat-Post des Wurfs gefeuert.

```js
Hooks.on('Ilaris.postSkillRoll', (dialog, payload) => {
    console.log(payload.formula, payload.total, payload.chatMessage)
})
```

| Parameter | Typ                | Beschreibung                 |
| --------- | ------------------ | ---------------------------- |
| `dialog`  | `FertigkeitDialog` | Die aufrufende Dialoginstanz |
| `payload` | `object`           | Strukturierter Roll-Payload  |

Relevante Zusatzfelder in `payload`:

| Feld                         | Typ           | Beschreibung                                           |
| ---------------------------- | ------------- | ------------------------------------------------------ |
| `formula`                    | `string`      | Vollstaendige Rollformel                               |
| `text`                       | `string`      | Zusatztext fuer den Chat-Flavor                        |
| `rollMode`                   | `string`      | Gewaehlter Foundry-Rollmodus                           |
| `rollResult`                 | `object`      | Rueckgabe von `evaluate_roll_with_crit(...)`           |
| `roll`                       | `Roll`        | Die ausgewertete Foundry-Rollinstanz                   |
| `total`                      | `number`      | Wurfergebnis                                           |
| `crit` / `fumble`            | `boolean`     | Kritischer Erfolg bzw. Patzer                          |
| `success`                    | `boolean`     | Erfolg gemaess `evaluate_roll_with_crit(...)`          |
| `chatMessage`                | `ChatMessage` | Rueckgabe von `Roll.toMessage(...)`                    |
| `schipsConsumed`             | `boolean`     | Ob tatsaechlich eine Schips-Ressource verbraucht wurde |
| `schipsConsumptionPrevented` | `boolean`     | Ob der Pre-Schips-Hook den Verbrauch unterbunden hat   |

---

### `Ilaris.preSkillSchipsConsumption` _(cancellable)_

Wird direkt vor `actor.update(...)` fuer den Schips-Verbrauch gefeuert.
Rueckgabe von `false` verhindert nur den Ressourcenverbrauch; der Wurf selbst
laeuft weiter.

```js
Hooks.on('Ilaris.preSkillSchipsConsumption', (dialog, payload) => {
    if (payload.actor.hasPlayerOwner === false) return false
})
```

| Parameter | Typ                | Beschreibung                                                   |
| --------- | ------------------ | -------------------------------------------------------------- |
| `dialog`  | `FertigkeitDialog` | Die aufrufende Dialoginstanz                                   |
| `payload` | `object`           | Rollkontext plus `amount`, `remainingBefore`, `remainingAfter` |

---

### `Ilaris.postSkillSchipsConsumption`

Wird direkt nach erfolgreichem `actor.update(...)` fuer den Schips-Verbrauch
gefeuert.

```js
Hooks.on('Ilaris.postSkillSchipsConsumption', (dialog, payload) => {
    console.log(payload.remainingBefore, payload.remainingAfter)
})
```

| Parameter | Typ                | Beschreibung                         |
| --------- | ------------------ | ------------------------------------ |
| `dialog`  | `FertigkeitDialog` | Die aufrufende Dialoginstanz         |
| `payload` | `object`           | Rollkontext plus Verbrauchsmetadaten |

---

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

Wird nach `evaluate_roll_with_crit()` in allen drei Dialog-Klassen gefeuert –
und zwar **nachdem** der Angriffswurf ins Chat gepostet wurde.
Ersetzt den früheren Hook `Ilaris.fernkampfAngriffClick` (Breaking Change).

> **Interner Handler**: `scripts/combat/hooks/combat_dialog_handlers.js`
> registriert einen eigenen `postAngriff`-Handler, der Verteidigungsprompts
> (als geflüsterte Chat-Nachrichten) an die Zielakteure sendet.
> Externe Module können denselben Hook verwenden, ohne die Dialog-Implementierung
> zu berühren.
>
> **Globales Routing**: Der Prompt wird per Socket-Event `createDefensePromptByOwner`
> an den verantwortlichen Owner-Client des Ziel-Akteurs zugestellt.
> Fallback-Reihenfolge: aktiver Non-GM-Owner → aktiver GM → aktueller Nutzer.
> Idempotenz über `eventId`. Whisper-Empfänger: Owner + aktive GMs.

```js
Hooks.on('Ilaris.postAngriff', (rollResult, dialog) => {
    console.log('Angriffsergebnis:', rollResult.roll.total)
    // dialog.selectedActors enthält die ausgewählten Ziele
    // dialog.attackType: 'melee' | 'ranged' | 'supernatural'
})
```

| Parameter    | Typ            | Beschreibung                                       |
| ------------ | -------------- | -------------------------------------------------- |
| `rollResult` | `object`       | Ergebnis von `evaluate_roll_with_crit`             |
| `dialog`     | `CombatDialog` | Die aufrufende Dialog-Instanz (inkl. `attackType`) |

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

> Hinweis global: Zusätzlich wird `Ilaris.global.postVerteidigung` als
> Mirror-Hook mit serialisiertem Payload auf allen Clients gefeuert.

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

> **Interner Handler**: `scripts/combat/hooks/combat_dialog_handlers.js`
> registriert einen eigenen `postSchaden`-Handler, der den Schaden automatisch
> auf alle Ziele in `dialog.selectedActors` anwendet (via `applyDamageToTarget`).
>
> **Globales Routing (neu)**: Die eigentliche Ausfuehrung erfolgt netzwerkweit
> ueber `game.socket` mit dem Event-Typ `applyDamageByOwner`.
> Dabei wird ein verantwortlicher Ausfuehrer bestimmt:
>
> 1. aktiver Non-GM-Owner des Ziel-Akteurs,
> 2. sonst aktiver GM,
> 3. sonst aktueller Nutzer (falls update-berechtigt).
>    Zur Vermeidung doppelter Anwendung wird jede Schadensnachricht ueber `eventId`
>    idempotent verarbeitet.

```js
Hooks.on('Ilaris.postSchaden', (rollResult, dialog) => {
    console.log('Schaden:', rollResult.roll.total)
    // dialog.selectedActors enthält die Ziele, auf die Schaden angewandt wird
    // dialog.damageType, dialog.trueDamage für Schadensmodifikatoren
})
```

| Parameter    | Typ            | Beschreibung                           |
| ------------ | -------------- | -------------------------------------- |
| `rollResult` | `object`       | Ergebnis von `evaluate_roll_with_crit` |
| `dialog`     | `CombatDialog` | Die aufrufende Dialog-Instanz          |

> Hinweis global: Zusätzlich wird `Ilaris.global.postSchaden` als Mirror-Hook
> mit serialisiertem Payload auf allen Clients gefeuert.

---

## Öffentliche API

Externe Module können Dialoge direkt öffnen, ohne interne Klassen importieren
zu müssen:

```js
import { openCombatDialog, openDefenseForTarget } from 'systems/Ilaris/scripts/combat/combat-api.js'
import { openSkillDialog } from 'systems/Ilaris/scripts/skills/skills-api.js'

const dialog = await openCombatDialog(actor, item, 'melee')
// dialog ist null, wenn Ilaris.preCombatDialog false zurückgegeben hat

const skillDialog = await openSkillDialog(actor, {
    probeType: 'fertigkeit',
    fertigkeitKey: 'athletik',
    fertigkeitName: 'Athletik',
    pw: 14,
    talentList: {
        0: 'Klettern',
    },
})
// skillDialog ist null, wenn Ilaris.preSkillDialog false zurückgegeben hat
```

### `openSkillDialog(actor, options)`

Gemeinsamer Einstieg fuer Fertigkeits-, Attributs-, freie und einfache Proben.

| Parameter | Typ      | Beschreibung                                                         |
| --------- | -------- | -------------------------------------------------------------------- |
| `actor`   | `Actor`  | Der handelnde Akteur                                                 |
| `options` | `object` | Dialogoptionen wie `probeType`, `fertigkeitName`, `pw`, `talentList` |

**Rückgabe**: `Promise<FertigkeitDialog|null>`

### `openCombatDialog(actor, item, type, options?)`

| Parameter | Typ      | Beschreibung                                |
| --------- | -------- | ------------------------------------------- |
| `actor`   | `Actor`  | Der handelnde Akteur                        |
| `item`    | `Item`   | Waffe oder Fähigkeit                        |
| `type`    | `string` | `'melee'`, `'ranged'` oder `'supernatural'` |
| `options` | `object` | Optionale Optionen für den Dialog           |

**Rückgabe**: `Promise<CombatDialog|null>`

---

### `openDefenseForTarget(actor, attackingActor, weaponId, rollResult, attackType, htmlDOM)`

Öffnet den passenden Verteidigungsdialog oder die Akrobatik-Probe für einen
Verteidigungsbutton-Klick. Kapselt Waffensuche, Roll-Modifikation für
Fernkampf (fester Wert 28) und Akrobatik-Logik.

| Parameter        | Typ           | Beschreibung                                             |
| ---------------- | ------------- | -------------------------------------------------------- |
| `actor`          | `Actor`       | Der verteidigende Akteur                                 |
| `attackingActor` | `Actor\|null` | Der angreifende Akteur (kann null sein)                  |
| `weaponId`       | `string`      | Waffen-ID oder `'akrobatik'` für die Ausweich-Probe      |
| `rollResult`     | `object`      | Serialisiertes Angriffs-Würfelergebnis                   |
| `attackType`     | `string`      | `'melee'` oder `'ranged'`                                |
| `htmlDOM`        | `HTMLElement` | Chat-Nachricht-DOM (für Akrobatik-UI-Zustandsverwaltung) |

**Rückgabe**: `Promise<CombatDialog|null>`

---

## Architektur: Verantwortungsgrenze Dialog ↔ Handler

Ab Version 2026-05-02 gilt folgende Trennung:

| Verantwortung                            | Ort                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Manöver auslesen, Würfelformel bauen     | Dialogklasse                                                                                                      |
| Würfeln + Roll ins Chat posten           | Dialogklasse                                                                                                      |
| Hooks feuern (`preX` / `postX`)          | Dialogklasse                                                                                                      |
| Globale Hook-Spiegelung                  | `global_combat_hooks.js` + Socket `broadcastCombatHook`                                                           |
| Verteidigungsprompts an Ziele dispatchen | `handlePostAngriff` → `routeDefensePromptToOwner` in `combat_dialog_handlers.js`                                  |
| Globales Prompt-Routing (Socket)         | `createDefensePromptByOwner` in `setupIlarisSocket` / `handleCreateDefensePromptByOwnerRequest` in `core/init.js` |
| Schaden auf Ziele dispatchen             | `handlePostSchaden` in `combat_dialog_handlers.js`                                                                |
| Owner-Auswahl (Schaden + Prompt)         | `resolveDamageExecutorUserId` in `shared_dialog_helpers.js`                                                       |
| Globales Schadensrouting (Socket)        | `routeDamageToOwner` in `shared_dialog_helpers.js` + `applyDamageByOwner` in `core/init.js`                       |
| Verteidigungsdialog per Button öffnen    | `openDefenseForTarget` in `combat-api.js`                                                                         |
| Akrobatik-Ausweichen                     | `handleAkrobatikDefense` in `combat-api.js`                                                                       |

### Beispiel-Flow: Nahkampf

```
Spieler klickt „Angreifen"
    │
    ▼
AngriffDialog._angreifenKlick()
    │  1. Manöver lesen + Würfeln
    │  2. handleTargetSelection(rollResult, 'melee')
    │     → Roll ins Chat (ggf. verborgen)
    │  3. Hooks.callAll('Ilaris.postAngriff', rollResult, dialog)
    │
    ▼
handlePostAngriff(rollResult, dialog)  [in combat_dialog_handlers.js]
    │  Für jedes dialog.selectedActors-Ziel:
    │  → Waffe(n) des Ziels ermitteln
    │  → routeDefensePromptToOwner(targetActor, contentHtml)
    │
    ▼
routeDefensePromptToOwner()  [in combat_dialog_handlers.js]
    │  Owner-Executor bestimmen (Owner → GM)
    │  Socket-Event `createDefensePromptByOwner` mit eventId
    │
    ▼
handleCreateDefensePromptByOwnerRequest()  [in core/init.js]
    │  Guard: nur Executor-Client
    │  Guard: eventId nicht doppelt
    │  ChatMessage.create(whisper: [Owner, GMs])
    │
    ▼
Verteidiger klickt „Verteidigen mit [Waffe]"
    │
    ▼
defense_button_hook.js  (UI-Delegation)
    │  Daten-Attribute lesen + validieren
    │  Buttons deaktivieren
    │
    ▼
openDefenseForTarget(actor, attackingActor, weaponId, rollResult, 'melee', htmlDOM)
    │  [in combat-api.js]
    │  Waffe im Inventar suchen
    │  AngriffDialog im isDefenseMode öffnen
```

### Beispiel-Flow: Schaden (global mit Owner)

```
Spieler klickt „Schaden"
    │
    ▼
AngriffDialog._schadenKlick() / FernkampfAngriffDialog._schadenKlick()
    │  1. Schadenswurf auswerten
    │  2. Roll ins Chat posten
    │  3. Hooks.callAll('Ilaris.postSchaden', rollResult, dialog)
    │
    ▼
handlePostSchaden(rollResult, dialog)  [in combat_dialog_handlers.js]
    │  Fuer jedes Ziel:
    │  → applyDamageToTarget(...)
    │
    ▼
routeDamageToOwner(target, damage, ...)
    │  [in shared_dialog_helpers.js]
    │  1. Ziel-Akteur aufloesen (Token/ActorLink)
    │  2. Executor bestimmen (Owner → GM → aktueller User)
    │  3. Socket-Event `applyDamageByOwner` mit `eventId` senden
    │
    ▼
setupIlarisSocket() / handleApplyDamageByOwnerRequest()  [in core/init.js]
    │  Nur der bestimmte Executor verarbeitet das Event
    │  Deduplizierung ueber `eventId`
    │  Berechtigung wird vor Update erneut geprueft
    │
    ▼
_applyDamageDirectly(targetActor, ...)
```

### Beispiel-Flow: Fernkampf

```
Spieler klickt „Angreifen" (Fernkampf)
    │
    ▼
FernkampfAngriffDialog._angreifenKlick()
    │  1. Manöver lesen + Würfeln
    │  2. handleTargetSelection(rollResult, 'ranged')
    │     → Roll ins Chat (nicht verborgen)
    │  3. Hooks.callAll('Ilaris.postAngriff', rollResult, dialog)
    │
    ▼
handlePostAngriff(rollResult, dialog)  [nur wenn rollResult.success]
    │  Für jedes Ziel:
    │  → Schild-Waffen filtern
    │  → Verteidigungsprompt + Akrobatik-Button senden
    │
    ▼
Verteidiger klickt „Verteidigen mit Akrobatik"
    │
    ▼
openDefenseForTarget(..., 'akrobatik', rollResult, 'ranged', htmlDOM)
    │
    ▼
handleAkrobatikDefense(actor, rollResult, htmlDOM)
    │  Buttons deaktivieren
    │  Ausweichen-Dialog anzeigen (Legacy Dialog mit Schips-Auswahl)
    │  Ergebnis ins Chat posten
```

---

## Breaking Changes

| Alter Hook                     | Neuer Hook           |
| ------------------------------ | -------------------- |
| `Ilaris.fernkampfAngriffClick` | `Ilaris.postAngriff` |
