# Coding-Agent Tasks: Combat CSS Refactor

**Quelle**: `combat-css-refactor-plan.md`  
**Ziel**: Inline-Styles + embedded `<style>` aus Combat-Dialog-Templates entfernen, zentralisierte CSS-Struktur mit Scoping einführen.

---

## 0) Rahmenbedingungen

- Arbeite **nur** im Scope der Combat-Dialoge und zugehörigen Styles.
- Keine UX-Änderungen, nur Style-Migration/Scoping.
- `oninput`-JS in HBS bleibt unverändert.
- Bestehende Funktionalität muss visuell/funktional gleich bleiben.

---

## 1) CSS-Datei konsolidieren

### Task 1.1 – Neue zentrale CSS-Datei anlegen

- Erstelle `scripts/combat/styles/combat-dialogs.css`.
- Überführe Inhalte aus:
    - `scripts/combat/styles/combat.css`
    - `scripts/combat/styles/defense-prompt.css`
    - embedded `<style>` aus `scripts/combat/templates/dialogs/target_selection.hbs`
- Strukturiere in klaren Sektionen:
    - Shared Combat Dialog Styles
    - Angriff Dialog
    - Fernkampf Dialog
    - Übernatürlich Dialog
    - Target Selection Dialog
    - Defense Prompt
    - `[UNUSED]` Legacy-Klassen

### Task 1.2 – Shared Utility-Klassen definieren

- Ergänze in `combat-dialogs.css`:
    - `.ilaris.combat-dialog .target-selection-container`
    - `.ilaris.combat-dialog .selected-actors-display-flex`
    - `.ilaris.combat-dialog .combat-select-narrow`
    - `.ilaris.combat-dialog .combat-button-narrow`

### Akzeptanzkriterien

- Neue Datei existiert und enthält alle migrierten Regeln.
- Scoping ist konsistent (`.ilaris.combat-dialog...` bzw. `.chat-message...` für Defense Prompt).
- Keine benötigte Regel bleibt nur in alter Datei zurück.

---

## 2) HBS-Templates refactoren (Inline-Styles entfernen)

### Task 2.1 – `angriff.hbs`

- Entferne alle `style="..."`.
- Ersetze durch Klassen:
    - `max-width: 150px` → `.combat-select-narrow` / `.combat-button-narrow`
    - Container-Layout (`margin`, `justify-content`, `align-items`) → `.target-selection-container`
    - `flex: 1` → `.selected-actors-display-flex`

### Task 2.2 – `fernkampf_angriff.hbs`

- Gleiche Migration wie in `angriff.hbs`.

### Task 2.3 – `uebernatuerlich.hbs`

- Gleiche Migration wie in `angriff.hbs`.

### Task 2.4 – `target_selection.hbs`

- Entferne **alle** `style="..."` Attribute.
- Entferne den kompletten embedded `<style>`-Block.
- Setze neue Klassen auf Elemente (z. B. `target-sel-*`).
- Ersetze alte Klassen im Markup:
    - `hostile` → `target-sel-hostile`
    - `neutral` → `target-sel-neutral`
    - `friendly` → `target-sel-friendly`
    - `actor-row` → `target-sel-row`
    - `current-actor` → `target-sel-current`
    - `separator` → `target-sel-separator-row` (bzw. `target-sel-separator` für `<hr>`)
    - `actor-image` → `target-sel-actor-image`

### Akzeptanzkriterien

- In allen betroffenen HBS-Dateien: **0×** `style=`.
- In `target_selection.hbs`: **0×** `<style>`-Block.
- Markup nutzt die neuen Klassen konsistent.

---

## 3) Dialog-spezifische Klassen im JavaScript setzen

### Task 3.1 – Dialog-Rendering prüfen und ergänzen

- Finde die Dialog-Klassen/Renderpfade für:
    - Angriff
    - Fernkampf
    - Übernatürlich
    - Target Selection
- Ergänze beim Rendern Klassen am Dialog-Root:
    - `angriff-dialog`
    - `fernkampf-dialog`
    - `uebernatuerlich-dialog`
    - `target-sel`

### Akzeptanzkriterien

- Gerenderte Dialoge haben Root-Kombination aus `.ilaris.combat-dialog` + dialogspezifischer Klasse.
- CSS-Scoping greift ohne globale Nebenwirkungen.

---

## 4) Referenzen auf neue CSS-Datei umstellen

### Task 4.1 – Stylesheet-Registrierung anpassen

- Prüfe, wo `combat.css` und `defense-prompt.css` eingebunden werden (z. B. `system.json`, Loader-Skripte).
- Binde `combat-dialogs.css` ein.
- Entferne/ersetze alte Referenzen, sofern Migration vollständig ist.

### Akzeptanzkriterien

- Laufzeit lädt `combat-dialogs.css`.
- Keine fehlenden Styles durch nicht geladene Datei.

---

## 5) Legacy-CSS markieren

### Task 5.1 – Unbenutzte Regeln kennzeichnen

- Identifiziere Klassen in der neuen CSS-Datei, die derzeit nicht von HBS/JS genutzt werden.
- Ergänze `/* [UNUSED] */` direkt an den betreffenden Regeln oder als dedizierten Abschnitt.

### Akzeptanzkriterien

- `[UNUSED]` Markierungen vorhanden und nachvollziehbar.

---

## 6) Cleanup alter CSS-Dateien

### Task 6.1 – Alte Dateien behandeln

- Nach erfolgreicher Migration:
    - `scripts/combat/styles/defense-prompt.css` löschen oder deprecaten.
    - `scripts/combat/styles/combat.css` löschen/deprecaten (je nach Projektkonvention).
- Falls Dateien erhalten bleiben müssen, klaren Hinweis-Kommentar einfügen, dass `combat-dialogs.css` die aktive Quelle ist.

### Akzeptanzkriterien

- Keine doppelte aktive Definition derselben Regeln über mehrere Dateien.

---

## 7) Validierung

### Task 7.1 – Statische Checks

- Suche projektweit nach:
    - `style="` in `scripts/combat/templates/dialogs/**/*.hbs`
    - `<style>` in `scripts/combat/templates/dialogs/**/*.hbs`
- Ergebnis muss leer sein (für Scope-Dateien).

### Task 7.2 – Visuelle Smoke-Checks im Spiel

- Angriff-Dialog: Select/Button-Breiten und Layout korrekt.
- Fernkampf-Dialog: dito.
- Übernatürlich-Dialog: dito.
- Target-Selection: Tabelle, Hover, Selection, Friendly/Neutral/Hostile-Farben korrekt.
- Defense-Prompt: Highlighting/Animation weiterhin korrekt.

### Akzeptanzkriterien

- Keine regressionssichtbaren Layoutfehler in den 5 betroffenen UI-Bereichen.

---

## 8) Dokumentation aktualisieren

### Task 8.1 – Planstatus ergänzen

- In `combat-css-refactor-plan.md` Completion-Status ergänzen (abgeschlossene Phasen abhaken).
- Kurz notieren:
    - welche Dateien geändert wurden,
    - welche alten CSS-Dateien entfernt/ersetzt wurden,
    - ob `[UNUSED]` Klassen markiert sind.

### Akzeptanzkriterien

- Plan-Datei spiegelt den tatsächlichen Implementierungsstand.

---

## Definition of Done (gesamt)

- 0 Inline-Styles in den betroffenen HBS-Dateien.
- 0 embedded `<style>`-Blöcke in den betroffenen HBS-Dateien.
- Neue zentrale CSS-Datei aktiv und geladen.
- Dialog-spezifisches Scoping funktionsfähig.
- Keine doppelten aktiven CSS-Definitionen.
- Visuelle Smoke-Checks ohne auffällige Regressionen.
