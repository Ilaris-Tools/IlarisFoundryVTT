# Testfall E2E-009 – UebernatuerlichDialog: Übernatürliche Fertigkeit

## Überblick

| Feld              | Wert                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| **ID**            | E2E-009                                                               |
| **Klasse**        | `UebernatuerlichDialog` (`scripts/combat/dialogs/uebernatuerlich.js`) |
| **Testart**       | Playwright E2E – Chromium                                             |
| **Testcharakter** | `HatAlles` (erster Zauber in der Zauberliste, außer Szenario D)       |
| **URL**           | `http://localhost:30000`                                              |
| **Account**       | Gamemaster (kein Passwort)                                            |
| **Welt**          | Vanilla Ilaris                                                        |
| **Status**        | Erstellt                                                              |

## Vorbedingungen

- Foundry VTT läuft auf `localhost:30000`
- Welt „Vanilla Ilaris" ist aktiv; Charakter `HatAlles` existiert
- HatAlles besitzt mindestens einen Zauber, einen Zauber „Dämonenbann" (Szenario D),
  sowie die Vorteile **Verbotene Pforten** und **Blutmagie**
- AsP von HatAlles zu Beginn: ~50, KaP: ~32, Wunden: 0 (Ausgangswert wird runtime ermittelt)
- Wird in `afterAll` vollständig wiederhergestellt

## Shared State

Alle Szenarien laufen in **einer gemeinsamen Browser-Session** ohne Login-Wiederholung.
AsP/KaP/Wunden werden **nur in `afterAll`** auf den Ausgangswert zurückgesetzt.

## Szenarien

### Szenario A – Dialog öffnen: AsP-Kosten-Anzeige und Default-Werte

**Ziel**: Übernatürlichen Fertigkeiten-Tab öffnen, Roll-Icon für den ersten Zauber klicken,
Dialog sicherstellen und Energie-Anzeige prüfen. Kein Würfelwurf.

**Schritte**:

1. Übernatürlich-Tab öffnen (`nav [data-tab="uebernatuerlich"]`)
2. Ersten Zauber in der Liste über `[data-rolltype="magie_diag"]` anklicken
3. Dialog `.application.uebernatuerlich-dialog` sicherstellen
4. Dialogtitel enthält „Übernatürliche Fertigkeit:" und den Zaubernamen
5. Energie-Summary `.modifier-summary.energy-summary` prüfen

**Erwartungen**:

- Dialog sichtbar mit korrektem Titel
- Energie-Summary zeigt „Basiskosten:" und „Verfügbar:"
- Keine `.notification.error` sichtbar

---

### Szenario B – Erfolg + Triumph (d20=20, neutralMod=-PW)

**Ziel**: Erfolgreichen Würfelwurf erzwingen (Triumph bei d20=20), AsP-Abzug prüfen.

**Schritte**:

1. Dialog für ersten Zauber öffnen
2. `neutralMod = -(PW des Zaubers)` via `page.evaluate` berechnen (Laufzeitwert)
3. Modifikator-Input (`input[id^="modifikator-"]`) auf `neutralMod` setzen
4. `CONFIG.Dice.randomUniform = () => 0.01` → W20-Ergebnis = 20 (Triumph + Erfolg)
5. `asp_stern` vor dem Wurf lesen
6. Würfelwurf-Button (`.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]`) klicken
7. Auf 2 neue Chat-Nachrichten warten

**Erwartungen**:

- Roll-Nachricht: `flavor` enthält Zaubernamen
- Energie-Nachricht: `content` enthält „Das Wirken ist dir gelungen"
- `asp_stern` nach dem Wurf < `asp_stern` vorher (volle Kosten abgezogen)
- Keine `.notification.error`

---

### Szenario C – Misserfolg + Patzer (d20=1, neutralMod=-PW)

**Ziel**: Misslungenen Würfelwurf erzwingen (Patzer bei d20=1), halbe AsP-Kosten prüfen.

**Hintergrund**: Bei `neutralMod = -PW` gilt `bonuses = 0`.

- `d20=1 → minPossibleResult = 1 < schwierigkeit` → Patzer ausgelöst
- Bei Misserfolg: Kosten = `ceil(Basiskosten / 2)` (Standard ohne Liturgische Sorgfalt)

**Schritte**:

1. Dialog für ersten Zauber erneut öffnen
2. `neutralMod = -PW` berechnen und setzen
3. `CONFIG.Dice.randomUniform = () => 0.99` → W20-Ergebnis = 1
4. `asp_stern` vor dem Wurf lesen
5. Würfeln, 2 neue Chat-Nachrichten abwarten

**Erwartungen**:

- Roll-Nachricht: `flavor` enthält Zaubernamen
- Energie-Nachricht: `content` enthält „Das Wirken ist dir nicht gelungen"
- `asp_stern` nach dem Wurf < vorher (halbe Kosten abgezogen)
- Keine `.notification.error`

---

### Szenario D – Dämonenbann: manuelle Energie-Buttons (nicht-numerische Schwierigkeit)

**Ziel**: Zauber mit nicht-numerischer Schwierigkeit testen. Nach dem Würfelwurf erscheinen
manuelle Energie-Buttons, da keine automatische Abrechnung erfolgt.

**Schritte**:

1. Dialog für „Dämonenbann" öffnen (Rolltype: `magie_diag` oder `karma_diag`)
2. Energie-Buttons `.clickable-summary.energie-erfolg` und `.energie-misserfolg` prüfen (sichtbar)
3. Würfeln → 1 neue Chat-Nachricht (nur Roll-Msg, keine Auto-Energie)
4. `.clickable-summary.energie-erfolg` klicken → 2 weitere Nachrichten abwarten
    - Nachricht 1: Energie-Abrechnung (`spell_result.hbs`)
    - Nachricht 2: Titel-Nachricht (`probenchat_profan.hbs`)

**Erwartungen**:

- Roll-Nachricht: `flavor` enthält „Dämonenbann"
- Energie-Nachricht: `content` enthält „Das Wirken ist dir gelungen"
- Titel-Nachricht: `flavor` enthält „Dämonenbann" und „Kosten:"
- Keine `.notification.error`

---

### Szenario E – Verbotene Pforten (1 Vorteil): Wunden als Energiequelle

**Ziel**: Verbotene Pforten (1 Vorteil, Multiplikator WS+4) greift ein, wenn asP < Kosten.
Mechanik: `wunden += ceil(modEnergy / (WS+4))`, tatsächlicher AsP-Abzug wird reduziert.

**Vorbereitung**: `asp_stern = 1` via `page.evaluate`; `energy_override = 5` im Dialog.
→ `maxReduction = 5 - 1 = 4`, `calculatedWounds = 1`, `endCost = 1`, `asp_stern → 0`.

**Schritte**:

1. `asp_stern` auf 1 setzen (Laufzeit via `actor.update`)
2. Dialog für ersten Zauber öffnen
3. Energy-Override-Input (`input[name="item.system.manoever.energyOverride"]`) auf `5` setzen
4. Verbotene-Pforten-Radio (`input[name="verbotene_pforten_toggle"][value="4"]`) aktivieren
5. `CONFIG.Dice.randomUniform = () => 0.01` → d20=20 → Erfolg
6. Würfeln, 2 Chat-Nachrichten abwarten
7. `gesundheit.wunden` nach dem Wurf lesen

**Erwartungen**:

- Energie-Nachricht: `content` enthält „Das Wirken ist dir gelungen"
- `wunden` nach dem Wurf > `wunden` vor dem Wurf (VP-Wunden wurden verbucht)

---

### Szenario F – Blutmagie: volle Kostendeckung, kein AsP-Abzug

**Ziel**: Blutmagie-Input so hoch setzen, dass `mod_energy` auf 0 sinkt.
Mechanik: `blutmagieReduction = min(mod_energy, blutmagieInput)` → `mod_energy = 0` → `cost = 0`.
Kein AsP-Abzug, keine Wunden.

**Schritte**:

1. Dialog für ersten Zauber öffnen
2. Blutmagie-Input (`input#blutmagie`) auf `100` setzen (deckt alle realistischen Kosten)
3. `asp_stern` und `wunden` vor dem Wurf lesen
4. `CONFIG.Dice.randomUniform = () => 0.01` → d20=20 → Erfolg
5. Würfeln, 2 Chat-Nachrichten abwarten

**Erwartungen**:

- Energie-Nachricht: enthält „Das Wirken ist dir gelungen" und „0 Energie"
- `asp_stern` nach dem Wurf = vorher (kein Abzug)
- `wunden` nach dem Wurf = vorher (keine VP-Wunden)
- Keine `.notification.error`

---

### Szenario G – Energy Override = 0: kein AsP-Abzug, keine Fehlermeldung

**Ziel**: Manuelle Kostenübersteuerung auf 0 → kein Energieabzug, kein Fehler.

**Schritte**:

1. Dialog für ersten Zauber öffnen
2. Energy-Override-Input auf `0` setzen
3. `asp_stern` vor dem Wurf lesen
4. `CONFIG.Dice.randomUniform = () => 0.01` → d20=20
5. Würfeln, 2 Chat-Nachrichten abwarten

**Erwartungen**:

- Energie-Nachricht: enthält „Das Wirken ist dir gelungen" und „0 Energie"
- `asp_stern` unverändert
- Keine `.notification.error`

---

### Szenario H – Energiemangel: Fehlermeldung erwartet

**Ziel**: Wenn `endCost > currentEnergy`, erscheint `ui.notifications.error`.
Das System bucht trotzdem bis 0 ab (kein Absturz), zeigt aber die Fehlermeldung.

**Schritte**:

1. Dialog für ersten Zauber öffnen (AsP ist nach Szenario E bei 0)
2. Energy-Override-Input auf `100` setzen (weit über vorhandenen AsP)
3. `CONFIG.Dice.randomUniform = () => 0.01` → d20=20
4. Würfeln, 2 Chat-Nachrichten abwarten

**Erwartungen**:

- `.notification.error` sichtbar
- Fehlermeldung enthält „Nicht genug Ressourcen"

---

## Technische Referenz

### Dialog-Selektoren

| Zweck                     | Selektor                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| Dialog-Root               | `.application.uebernatuerlich-dialog`                                         |
| Dialog schließen          | `[data-action="close"]` (im Dialog-Header)                                    |
| Tab-Button Übernatürlich  | `nav [data-tab="uebernatuerlich"]`                                            |
| Roll-Icon Zauber          | `[data-action="rollable"][data-rolltype="magie_diag"]`                        |
| Roll-Icon Liturgie        | `[data-action="rollable"][data-rolltype="karma_diag"]`                        |
| Würfelwurf-Button         | `.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]` |
| Energie-Summary           | `.modifier-summary.energy-summary`                                            |
| Energie-Erfolg-Button     | `.clickable-summary.energie-erfolg`                                           |
| Energie-Misserfolg-Button | `.clickable-summary.energie-misserfolg`                                       |
| Modifikator-Input         | `input[id^="modifikator-"]`                                                   |
| Energy-Override-Input     | `input[name="item.system.manoever.energyOverride"]`                           |
| Verbotene-Pforten-Radio   | `input[name="verbotene_pforten_toggle"][value="4"]` (1 Vorteil)               |
| Blutmagie-Input           | `input#blutmagie`                                                             |
| Fehlermeldung             | `.notification.error`                                                         |

### Chat-Nachrichtenstruktur

| Aktion                              | Anzahl neue Nachrichten | Inhalt                                                    |
| ----------------------------------- | ----------------------- | --------------------------------------------------------- |
| Würfeln (numerische Schwierigkeit)  | 2                       | Roll (flavor = Zaubername), Energie (spell_result.hbs)    |
| Würfeln (nicht-numerische Schwier.) | 1                       | Roll (flavor = Zaubername)                                |
| Energie-Erfolg-Button klicken       | 2                       | Energie (spell_result.hbs), Titel (probenchat_profan.hbs) |

### Patzer/Triumph-Mechanik

`CONFIG.Dice.randomUniform = () => 0.01` → W20 = 20 (Triumph + Erfolg, da 20 >= schwierigkeit)
`CONFIG.Dice.randomUniform = () => 0.99` → W20 = 1 (Patzer + Misserfolg, da 1 < schwierigkeit)
`neutralMod = -PW` stellt sicher, dass `bonuses = 0` → reines W20-Ergebnis entscheidet.

### Verbotene-Pforten-Mechanik

```
energyPerWound = WS + multiplier   (WS=8, multiplier=4 → 12 je Wunde)
calculatedWounds = ceil(mod_energy / energyPerWound)
maxReduction = mod_energy - availableEnergy
actualReduction = min((WS + mult) * calculatedWounds, maxReduction)
mod_energy -= actualReduction
```

### Blutmagie-Mechanik

```
blutmagieReduction = min(mod_energy, blutmagie.value)
mod_energy -= blutmagieReduction
```

Mit `blutmagie.value = 100` und realistischen Kosten ≤ 100: `mod_energy = 0` → kein AsP-Abzug.

### Energy-Override-Mechanik

```js
if (manoever.set_energy_cost?.value != null) mod_energy = manoever.set_energy_cost.value
```

Überschreibt die Basiskosten des Zaubers mit dem Eingabewert.
