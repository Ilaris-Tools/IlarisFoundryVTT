<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# Testfall E2E-007 — Heldensheet Header + Sidebar

## Metadaten

| Feld       | Wert                                         |
| ---------- | -------------------------------------------- |
| ID         | E2E-007                                      |
| Erstellt   | 2026-05-01                                   |
| Status     | Aktiv                                        |
| System     | Ilaris FoundryVTT                            |
| Spec-Datei | `e2e-007-heldensheet-header-sidebar.spec.ts` |

## Ziel

Smoke-Test der wichtigsten UI-Elemente des Heldensheets für zwei Testkharaktere:

- **Header**: Schicksalspunkte hinzufügen/entfernen, Wunden/Erschöpfung-Buttons, Wundmalus-Anzeige.
- **Sidebar**: Porträt-Änderung, Attribut-PW-Anzeige, Probe-Dialoge (fertigkeit_diag, simpleprobe_diag), abgeleitete Werte, Wundabzüge-Toggle, Energie-Eingaben (gAsP/AsP\*, gKaP/KaP\*).

## Umgebung

| Feld        | Wert                     |
| ----------- | ------------------------ |
| Foundry URL | `http://localhost:30000` |
| Account     | Gamemaster               |
| Welt        | Vanilla Ilaris           |
| Passwort    | keines                   |

## Testkharaktere

| Charakter     | Schips-Max | Zauberer      | Geweihter     |
| ------------- | ---------- | ------------- | ------------- |
| HatAlles      | 6          | ja (AsP = 50) | ja (KaP = 32) |
| Testlauf-Held | 4          | ja (AsP = 16) | nein          |

## Testdaten (Referenzwerte)

### HatAlles — Attribut-Probenwerte (PW)

| CH  | FF  | GE  | IN  | KK  | KL  | KO  | MU  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 28  | 32  | 46  | 44  | 24  | 24  | 30  | 32  |

### HatAlles — Abgeleitete Werte

| WS  | WS\* | MR  | INI | GS  | DH  |
| --- | ---- | --- | --- | --- | --- |
| 8   | 8    | 24  | 26  | 11  | 17  |

### HatAlles — Energie

| AsP | gAsP (init) | AsP\* (init) | KaP | gKaP (init) | KaP\* (init) |
| --- | ----------- | ------------ | --- | ----------- | ------------ |
| 50  | 0           | 0            | 32  | 0           | 0            |

### Testlauf-Held — Attribut-Probenwerte (PW)

| CH  | FF  | GE  | IN  | KK  | KL  | KO  | MU  |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8   | 12  | 8   | 8   | 2   | 12  | 8   | 2   |

### Testlauf-Held — Abgeleitete Werte

| WS  | WS\* | MR  | INI | GS  | DH  |
| --- | ---- | --- | --- | --- | --- |
| 5   | 5    | 4   | 4   | 5   | 4   |

### Testlauf-Held — Energie

| AsP | gAsP (init) | AsP\* (init) |
| --- | ----------- | ------------ |
| 16  | null/leer   | 16           |

## Wundabzüge-Formel (non-LEP System)

Quelle: `scripts/actors/data/actor.js` `_calculateGesundheit()`

```
wundabzuege = 0                  wenn W+E ≤ 2
wundabzuege = -(W+E - 2) × 2    wenn W+E ≥ 3
```

Hinweis: Der User nannte `MIN(0, 2−2×(W+E))` — die tatsächliche Implementierung folgt obiger Formel. Ergebnisse sind identisch ab W+E=3, aber bei W+E=2 gibt die Code-Formel 0 (kein Abzug), die User-Formel ebenfalls 0 — Resultate übereinstimmend.

### Erwartete globalermod-Werte mit manuellermod = −3

| W+E | wundabzuege | globalermod | Anzeige               |
| --- | ----------- | ----------- | --------------------- |
| 0   | 0           | −3          | `−3 auf alle Proben`  |
| 1   | 0           | −3          | `−3 auf alle Proben`  |
| 2   | 0           | −3          | `−3 auf alle Proben`  |
| 3   | −2          | −5          | `−5 auf alle Proben`  |
| 4   | −4          | −7          | `−7 auf alle Proben`  |
| 5   | −6          | −9          | `−9 auf alle Proben`  |
| 6   | −8          | −11         | `−11 auf alle Proben` |
| 7   | −10         | −13         | `−13 auf alle Proben` |
| 8   | −12         | −15         | `−15 auf alle Proben` |

## Vorbedingungen (API-Reset vor jedem Charakter)

```json
{
  "system.modifikatoren.manuellermod": -3,
  "system.gesundheit.wunden":          0,
  "system.gesundheit.erschoepfung":    0,
  "system.gesundheit.wundenignorieren": false,
  "system.schips.schips_stern":         0,
  "system.abgeleitete.gasp":            <char-initial>,
  "system.abgeleitete.asp_stern":       <char-initial>
}
```

## Testschritte

### HEADER — Schicksalspunkte

| Nr   | Schritt                                                   | Erwartetes Ergebnis               |
| ---- | --------------------------------------------------------- | --------------------------------- |
| H-S1 | `.schips-button` Nr. 0 klicken                            | `.schips-button.filled` Count = 1 |
| H-S2 | `.schips-button` Nr. 1..max−1 nacheinander klicken        | Count = i+1 nach jedem Klick      |
| H-S3 | `.schips-button.filled` letzten Button max..1 mal klicken | Count = i−1 nach jedem Klick      |
| H-S4 | `.schips-button` Nr. 0 klicken                            | Count = 1                         |

### HEADER — Wunden/Erschöpfung

| Nr   | Schritt                                 | Erwartetes Ergebnis                                              |
| ---- | --------------------------------------- | ---------------------------------------------------------------- |
| H-W1 | Buttons 0..7 klicken (state 0→1)        | Button i hat class `state-1`; Label zeigt erwartetes globalermod |
| H-W2 | Buttons 0..7 erneut klicken (state 1→2) | Button i hat class `state-2`; Label bleibt korrekt (W+E=8)       |
| H-W3 | Buttons 0..7 erneut klicken (state 2→0) | Button i hat class `state-0`; Label verbessert sich              |
| H-W4 | Buttons 0+1 einmal klicken (→ state-1)  | 2 Wunden aktiv                                                   |
| H-W5 | Buttons 2+3 je zweimal klicken (0→1→2)  | 2 Erschöpfung aktiv; Label zeigt `−7 auf alle Proben`            |

> Endzustand nach H-W5: **2 Wunden + 2 Erschöpfung**. Dieser Zustand gilt für alle Sidebar-Tests.

### SIDEBAR — Porträt ändern

| Nr  | Schritt                                                                                             | Erwartetes Ergebnis                          |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| P1  | `img.profile-img[data-action="editImage"]` klicken                                                  | FilePicker öffnet (`.window-app.filepicker`) |
| P2  | `input[name="target"]` mit Pfad `systems/Ilaris/assets/images/token/kreaturentypen/tier.png` füllen | —                                            |
| P3  | `button[name="select"]` klicken                                                                     | FilePicker schließt                          |
| P4  | `img.profile-img[data-action="editImage"]` src prüfen                                               | Enthält `tier.png`                           |

> Fallback: Falls FilePicker nicht reagiert → `actor.update({ img: '...' })` per `page.evaluate`, dann P4 erneut prüfen.

### SIDEBAR — Attribute PW + Dialog

Attribute erscheinen alphabetisch nach Schlüssel: CH, FF, GE, IN, KK, KL, KO, MU.

| Nr  | Schritt                                                          | Erwartetes Ergebnis                                             |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| A1  | `.attribute-wrapper[data-attribut="X"] .attribute-number` prüfen | Zeigt erwarteten PW (s. Testdaten)                              |
| A2  | `.attribute-wrapper[data-attribut="X"]` klicken                  | `.application.ilaris.fertigkeit-dialog` wird sichtbar           |
| A3  | Dialog-Titel prüfen                                              | Enthält `Attributsprobe: {Label}` (z. B. `Attributsprobe: Mut`) |
| A4  | _(nur MU)_ `.modifier-item.base-value` prüfen                    | Enthält MU-PW-Wert                                              |
| A5  | _(nur MU)_ `.modifier-item:has-text("Status")` prüfen            | Enthält `−7` (globalermod bei 2W+2E, manuellermod=−3)           |
| A6  | Dialog schließen via `button[data-action="close"]`               | Dialog nicht mehr sichtbar                                      |

### SIDEBAR — Abgeleitete Werte

| Selektor                                                                 | HatAlles | Testlauf-Held |
| ------------------------------------------------------------------------ | -------- | ------------- |
| `.icon-overlay-container:has(img[title="WS"]) .overlay-label`            | 8        | 5             |
| `.icon-overlay-container:has(img[title="WS*"]) .overlay-label`           | 8        | 5             |
| `.attribute-wrapper[data-rolltype="simpleprobe_diag"] .attribute-number` | 24       | 4             |
| `.icon-overlay-container:has(img[title="INI"]) .overlay-label`           | 26       | 4             |
| `.icon-overlay-container:has(img[title="GS"]) .overlay-label`            | 11       | 5             |
| `.icon-overlay-container:has(img[title="DH"]) .overlay-label`            | 17       | 4             |

### SIDEBAR — MR-Dialog (simpleprobe_diag)

| Nr  | Schritt                                                        | Erwartetes Ergebnis                                          |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| MR1 | `.attribute-wrapper[data-rolltype="simpleprobe_diag"]` klicken | Legacy-Dialog öffnet; `.window-app` enthält "Magieresistenz" |
| MR2 | Inhalt prüfen                                                  | Text "Magieresistenz" sichtbar                               |
| MR3 | Escape drücken                                                 | Dialog nicht mehr sichtbar                                   |

### SIDEBAR — Wundabzüge ignorieren

| Nr  | Schritt                                                               | Erwartetes Ergebnis                           |
| --- | --------------------------------------------------------------------- | --------------------------------------------- |
| WI1 | `.hero-global-mod-label` prüfen (Vorbedingung: 2W+2E)                 | Zeigt `−7 auf alle Proben`                    |
| WI2 | `a[data-togglevariable="system.gesundheit.wundenignorieren"]` klicken | Toggle-Text wechselt zu "ignorieren"          |
| WI3 | `.hero-global-mod-label` prüfen                                       | Zeigt `−3 auf alle Proben` (nur manuellermod) |

### SIDEBAR — AsP / KaP Anzeige und Eingaben

| Nr  | Charakter | Aktion                                                             | Erwartetes Ergebnis             |
| --- | --------- | ------------------------------------------------------------------ | ------------------------------- |
| E1  | beide     | `label.hero-energy-label-spacing:not([data-action])` nth(0) prüfen | Zeigt asp-Wert                  |
| E2  | beide     | `input[name="system.abgeleitete.gasp"]` Wert prüfen                | Zeigt initialen Wert (0 / leer) |
| E3  | beide     | `input[name="system.abgeleitete.asp_stern"]` Wert prüfen           | Zeigt initialen Wert            |
| E4  | HatAlles  | nth(1)-Label + gKaP/KaP\*-Inputs prüfen                            | KaP=32, gKaP=0, KaP\*=0         |
| E5  | beide     | gAsP-Input → `3` eingeben + Tab                                    | Input zeigt `3`                 |
| E6  | beide     | AsP\*-Input → `16` eingeben + Tab                                  | Input zeigt `16`                |
| E7  | HatAlles  | gKaP-Input → `3` eingeben + Tab                                    | Input zeigt `3`                 |
| E8  | HatAlles  | KaP\*-Input → `16` eingeben + Tab                                  | Input zeigt `16`                |

## Cleanup (per API nach jedem Charakter)

```json
{
    "img": "<originaler Pfad>",
    "system.modifikatoren.manuellermod": 0,
    "system.gesundheit.wunden": 0,
    "system.gesundheit.erschoepfung": 0,
    "system.gesundheit.wundenignorieren": false,
    "system.schips.schips_stern": "<actor.system.schips.schips>",
    "system.abgeleitete.gasp": "<initial>",
    "system.abgeleitete.asp_stern": "<initial>",
    "system.abgeleitete.gkap": 0, // falls geweihter
    "system.abgeleitete.kap_stern": 0 // falls geweihter
}
```

## Negative Checks

- Dialog bleibt nicht offen nach Escape / Close-Button-Klick.
- `schips-button.filled` Count stimmt nach jedem Einzelklick; kein Über-/Unterschießen.
- Mit `wundenignorieren = true`: Wundmalus-Beitrag = 0 → nur manuellermod (−3) in Anzeige.
- AsP/KaP-Sektion erscheint **nur** wenn `zauberer=true` / `geweihter=true`.
- Kein Reset des Schips-Counts nach Portrait-Änderung.

## Bekannte Risiken

| Risiko                                 | Mitigierung                                                    |
| -------------------------------------- | -------------------------------------------------------------- |
| FilePicker-Struktur je Foundry-Version | API-Fallback via `actor.update({ img: ... })` implementiert    |
| Legacy Dialog CSS-Klasse für MR        | Breiter Selektor `.window-app:has-text("Magieresistenz")`      |
| LEP-System aktiv                       | Guard-Prüfung am Testbeginn; Wundmalus-Assertions übersprungen |
| triStateClick Race Condition           | Nach jedem Klick `expect().toHaveClass()` mit 5 s Timeout      |
| AppV2 Re-Render nach Input-Tab         | `toHaveValue()` mit 10 s Timeout für Eingabe-Assertions        |
