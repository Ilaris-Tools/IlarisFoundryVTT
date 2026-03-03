# Refaktor: Combat Dialog Inline Styles zu CSS + Class Scoping

**Status**: Planning
**Priority**: High
**Modified**: 2026-02-28

---

## Überblick

Ziel ist die Beseitigung ALLER Inline-Styles (`style="..."`) und embedded `<style>` Blöcke aus den Combat Dialog HBS-Dateien in `scripts/combat/templates/dialogs/` und deren Umzug in CSS-Dateien mit korrektem Scoping.

**Scope-Strategie**:

- **Gemeinsamer Root**: `.ilaris.combat-dialog`
- **Dialog-spezifische Scopes**:
    - `.ilaris.combat-dialog.angriff-dialog`
    - `.ilaris.combat-dialog.fernkampf-dialog`
    - `.ilaris.combat-dialog.uebernatuerlich-dialog`
    - `.ilaris.combat-dialog.target-sel` (für target selection)

---

## Anforderungen

### ✅ Inline Styles

- **Ziel**: ALLE Inline-Styles (`style="..."`) aus HBS entfernen
- **Embedded CSS**: `<style>` Blöcke aus HBS in externe CSS-Datei auslagern (betrifft: `target_selection.hbs`)
- **Erlaubte Inhalte**: Nur `class`, `data-*`, `name`, `value`, `type`, `id` etc. - keine `style=`
- **JavaScript**: oninput-Statements bleiben (nicht im Scope dieses Refactorings)

### ✅ Class Scoping

- **Root**: `.ilaris.combat-dialog CLASS`
- **Angriff-Dialog**: `.ilaris.combat-dialog.angriff-dialog CLASS`
- **Fernkampf-Dialog**: `.ilaris.combat-dialog.fernkampf-dialog CLASS`
- **Übernatürlich-Dialog**: `.ilaris.combat-dialog.uebernatuerlich-dialog CLASS`
- **Target Selection**: `.ilaris.combat-dialog.target-sel CLASS`

### ✅ CSS-Datei-Struktur

- **Zusammenführung**: `combat.css` + `defense-prompt.css` + embedded styles aus `target_selection.hbs`
- **Neue Datei**: `scripts/combat/styles/combat-dialogs.css` (zentral)
- **Strukturierung**: Nach Dialog-Typ und Funktionalität
- **Markierungen**: CSS-Klassen die NICHT in HBS/JS verwendet werden → `/* [UNUSED] */` Kommentare

---

## Phase 1: Analyse - Inline Styles katalogisieren

### 1.1 Gefundene Inline Styles nach HBS-File

#### `angriff.hbs` 🔴 **HÖCHSTE PRIORITÄT** (Meiste Inline Styles)

| Zeile | Style                                                                              | Verwendungszweck                      | Neue Klasse                     |
| ----- | ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- |
| 60    | `style="max-width: 150px"`                                                         | Select Width (Reichweitenunterschied) | `.combat-select-narrow`         |
| 83    | `style="margin: 10px 0; justify-content: space-between; align-items: flex-start;"` | Target Selection Container Layout     | `.target-selection-container`   |
| 85    | `style="flex: 1;"`                                                                 | Selected Actors Display Flex          | `.selected-actors-display-flex` |
| 87    | `style="max-width: 150px"`                                                         | Target Button Width                   | `.combat-button-narrow`         |
| 118   | `style="max-width: 150px"`                                                         | Select Width (Treffer Zone)           | `.combat-select-narrow`         |
| 169   | `style="max-width: 150px"`                                                         | Select Width (Rollmode)               | `.combat-select-narrow`         |

#### `fernkampf_angriff.hbs` 🔴 **HÖCHSTE PRIORITÄT** (Ähnliche Patterns wie angriff.hbs)

| Zeile | Style                                                                              | Verwendungszweck                      | Neue Klasse                     |
| ----- | ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- |
| 49    | `style="max-width: 150px"`                                                         | Select Width (Reichweitenunterschied) | `.combat-select-narrow`         |
| 70    | `style="margin: 10px 0; justify-content: space-between; align-items: flex-start;"` | Target Selection Container Layout     | `.target-selection-container`   |
| 72    | `style="flex: 1;"`                                                                 | Selected Actors Display Flex          | `.selected-actors-display-flex` |
| 74    | `style="max-width: 150px"`                                                         | Target Button Width                   | `.combat-button-narrow`         |
| 103   | `style="max-width: 150px"`                                                         | Select Width (Treffer Zone)           | `.combat-select-narrow`         |
| 147   | `style="max-width: 150px"`                                                         | Select Width (Rollmode)               | `.combat-select-narrow`         |

#### `uebernatuerlich.hbs` 🔴 **HÖCHSTE PRIORITÄT** (Ähnliche Patterns)

| Zeile | Style                                                                              | Verwendungszweck                  | Neue Klasse                     |
| ----- | ---------------------------------------------------------------------------------- | --------------------------------- | ------------------------------- |
| 51    | `style="margin: 10px 0; justify-content: space-between; align-items: flex-start;"` | Target Selection Container Layout | `.target-selection-container`   |
| 53    | `style="flex: 1;"`                                                                 | Selected Actors Display Flex      | `.selected-actors-display-flex` |
| 55    | `style="max-width: 150px"`                                                         | Target Button Width               | `.combat-button-narrow`         |
| 98    | `style="max-width: 150px"`                                                         | Select Width (Treffer Zone)       | `.combat-select-narrow`         |
| 140   | `style="max-width: 150px"`                                                         | Select Width (Rollmode)           | `.combat-select-narrow`         |

#### `target_selection.hbs` 🔴 **KRITISCH** (Embedded `<style>` Block)

**Inline Styles**:

| Zeile | Style                                            | Verwendungszweck          | Neue Klasse                      |
| ----- | ------------------------------------------------ | ------------------------- | -------------------------------- |
| 1     | `style="margin-bottom: 10px; min-height: 20px;"` | Selected Actors Container | `.target-sel-selected-container` |
| 3     | `style="width: 100%;"`                           | Table Full Width          | `.target-sel-table-full`         |
| 7     | `style="text-align: left; width: 50px;"`         | Image Column Header       | `.target-sel-col-image`          |
| 8     | `style="text-align: left;"`                      | Name Column Header        | `.target-sel-col-name`           |
| 9     | `style="text-align: left;"`                      | Distance Column Header    | `.target-sel-col-distance`       |
| 10    | `style="text-align: left;"`                      | Status Column Header      | `.target-sel-col-status`         |
| 22    | `style="margin: 5px 0;"`                         | Separator HR Styling      | `.target-sel-separator`          |

**Embedded CSS Block** (Zeilen 37-60):

| CSS-Klasse                | Style-Properties                                                                                          | Problem                      | Neue Klasse                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------- |
| `.hostile`                | `color: #ff4444;`                                                                                         | Direkt in Template           | `.target-sel-hostile`             |
| `.neutral`                | `color: #ffaa00;`                                                                                         | Direkt in Template           | `.target-sel-neutral`             |
| `.friendly`               | `color: #44ff44;`                                                                                         | Direkt in Template           | `.target-sel-friendly`            |
| `table th`                | `padding: 5px;`                                                                                           | Element-Selektor im Template | `.target-sel-th`                  |
| `table td`                | `padding: 3px 5px; vertical-align: middle;`                                                               | Element-Selektor im Template | `.target-sel-td`                  |
| `.actor-row`              | `cursor: pointer;`                                                                                        | Inline CSS                   | `.target-sel-row`                 |
| `.actor-row:hover`        | `background-color: rgba(0, 0, 0, 0.1);`                                                                   | Inline CSS                   | `.target-sel-row:hover`           |
| `.actor-row.selected`     | `background-color: rgba(0, 150, 255, 0.2);`                                                               | Inline CSS                   | `.target-sel-selected`            |
| `.current-actor`          | `background-color: rgba(0, 0, 0, 0.05);`                                                                  | Inline CSS                   | `.target-sel-current`             |
| `.current-actor.selected` | `background-color: rgba(0, 150, 255, 0.3);`                                                               | Inline CSS                   | `.target-sel-current.selected`    |
| `.separator`              | `background: none !important; cursor: default !important;`                                                | Inline CSS                   | `.target-sel-separator-row`       |
| `.separator:hover`        | `background: none !important;`                                                                            | Inline CSS                   | `.target-sel-separator-row:hover` |
| `#selected-actors`        | `padding: 5px; border-radius: 3px;`                                                                       | ID-Selector im Template      | `.target-sel-selected-actors`     |
| `.actor-image`            | `width: 40px; height: 40px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(0, 0, 0, 0.2);` | Inline CSS                   | `.target-sel-actor-image`         |

---

## Phase 2: CSS-Refactoring - Neue Klassen mit Scoping

### 2.1 Neue CSS-Struktur

**Zusammenführung**:

- `scripts/combat/styles/combat.css` (bestehend)
- `scripts/combat/styles/defense-prompt.css` (bestehend)
- Embedded `<style>` aus `target_selection.hbs`

**Zielstruktur**: `scripts/combat/styles/combat-dialogs.css` (neu, zentral)

### 2.2 CSS Sections nach Dialog-Typ

```css
/* ========================================== */
/*  Combat Dialog Styles - Ilaris System     */
/* ========================================== */

/* --- Shared Dialog Styles --- */
.ilaris.combat-dialog ...

/* --- Angriff Dialog --- */
.ilaris.combat-dialog.angriff-dialog ...

/* --- Fernkampf Dialog --- */
.ilaris.combat-dialog.fernkampf-dialog ...

/* --- Übernatürlich Dialog --- */
.ilaris.combat-dialog.uebernatuerlich-dialog ...

/* --- Target Selection Dialog --- */
.ilaris.combat-dialog.target-sel ...

/* --- Defense Prompt (Chat Message) --- */
.ilaris-defense-prompt-highlight ...

/* --- [UNUSED] Legacy Classes --- */
/* Folgende Klassen in CSS aber nicht in HBS/JS:
   - .clickable-summary
   - .angreifen
   - usw.
*/
```

### 2.3 Detaillierte CSS-Klassen

#### Shared Combat Dialog Classes

```css
/* Base dialog container and overflow */
.ilaris.combat-dialog .window-content {
    overflow: auto;
}

/* Target selection container - flex layout with spacing */
.ilaris.combat-dialog .target-selection-container {
    margin: 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

/* Selected actors display - flex grow */
.ilaris.combat-dialog .selected-actors-display-flex {
    flex: 1;
}

/* Narrow select/button width utility */
.ilaris.combat-dialog .combat-select-narrow {
    max-width: 150px;
}

.ilaris.combat-dialog .combat-button-narrow {
    max-width: 150px;
}
```

#### Angriff Dialog Classes

```css
/* Angriff dialog specific styles (inherits shared) */
.ilaris.combat-dialog.angriff-dialog {
    /* Dialog-specific rules if needed */
}
```

#### Fernkampf Dialog Classes

```css
/* Fernkampf dialog specific styles (inherits shared) */
.ilaris.combat-dialog.fernkampf-dialog {
    /* Dialog-specific rules if needed */
}
```

#### Übernatürlich Dialog Classes

```css
/* Übernatürlich dialog specific styles (inherits shared) */
.ilaris.combat-dialog.uebernatuerlich-dialog {
    /* Dialog-specific rules if needed */
}
```

#### Target Selection Dialog Classes

```css
/* ========== Target Selection Dialog (target_selection.hbs) ========== */

/* Container for selected actors display */
.ilaris.combat-dialog.target-sel #selected-actors,
.ilaris.combat-dialog.target-sel .target-sel-selected-actors {
    margin-bottom: 10px;
    min-height: 20px;
    padding: 5px;
    border-radius: 3px;
}

/* Full width table */
.ilaris.combat-dialog.target-sel .target-sel-table-full {
    width: 100%;
}

/* Table header cells */
.ilaris.combat-dialog.target-sel .target-sel-th {
    padding: 5px;
}

/* Table data cells */
.ilaris.combat-dialog.target-sel .target-sel-td {
    padding: 3px 5px;
    vertical-align: middle;
}

/* Image column styling */
.ilaris.combat-dialog.target-sel .target-sel-col-image {
    text-align: left;
    width: 50px;
}

/* Name column styling */
.ilaris.combat-dialog.target-sel .target-sel-col-name {
    text-align: left;
}

/* Distance column styling */
.ilaris.combat-dialog.target-sel .target-sel-col-distance {
    text-align: left;
}

/* Status column styling */
.ilaris.combat-dialog.target-sel .target-sel-col-status {
    text-align: left;
}

/* Actor row - clickable with hover effect */
.ilaris.combat-dialog.target-sel .target-sel-row {
    cursor: pointer;
}

.ilaris.combat-dialog.target-sel .target-sel-row:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

/* Actor row when selected */
.ilaris.combat-dialog.target-sel .target-sel-row.selected {
    background-color: rgba(0, 150, 255, 0.2);
}

/* Current actor (self) styling */
.ilaris.combat-dialog.target-sel .target-sel-current {
    background-color: rgba(0, 0, 0, 0.05);
}

.ilaris.combat-dialog.target-sel .target-sel-current.selected {
    background-color: rgba(0, 150, 255, 0.3);
}

/* Separator row styling */
.ilaris.combat-dialog.target-sel .target-sel-separator-row {
    background: none !important;
    cursor: default !important;
}

.ilaris.combat-dialog.target-sel .target-sel-separator-row:hover {
    background: none !important;
}

/* Separator HR styling */
.ilaris.combat-dialog.target-sel .target-sel-separator {
    margin: 5px 0;
}

/* Actor image styling */
.ilaris.combat-dialog.target-sel .target-sel-actor-image {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid rgba(0, 0, 0, 0.2);
}

/* Disposition colors */
.ilaris.combat-dialog.target-sel .target-sel-hostile {
    color: #ff4444;
}

.ilaris.combat-dialog.target-sel .target-sel-neutral {
    color: #ffaa00;
}

.ilaris.combat-dialog.target-sel .target-sel-friendly {
    color: #44ff44;
}
```

#### Defense Prompt Chat Message Classes

```css
/* ========== Defense Prompt Chat Message ========== */

/* Highlighting for defense prompt when targeted player is active */
.chat-message.ilaris-defense-prompt-highlight {
    border: 3px solid #ff6b00 !important;
    box-shadow: 0 0 15px rgba(255, 107, 0, 0.7) !important;
    animation: defense-pulse 1.5s ease-in-out infinite;
    transform: scale(1.015);
}

/* Pulsing animation for highlighted defense message */
@keyframes defense-pulse {
    0% {
        box-shadow: 0 0 15px rgba(255, 107, 0, 0.7);
    }
    50% {
        box-shadow: 0 0 25px rgba(255, 107, 0, 1);
    }
    100% {
        box-shadow: 0 0 15px rgba(255, 107, 0, 0.7);
    }
}

/* Style for defend buttons */
.defend-button {
    margin: 0 5px 5px 0;
}

/* Disabled defense buttons */
.defend-button:disabled {
    cursor: not-allowed !important;
}
```

#### Legacy/Summary Combat Styles

```css
/* ========== Combat Feature Styles (Summary Sections) ========== */

/* Clickable combat summary sections */
.ilaris.combat-dialog .clickable-summary {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    border-radius: 5px;
    margin-bottom: 10px;
}

.ilaris.combat-dialog .clickable-summary:hover {
    transform: translateY(-1px);
}

.ilaris.combat-dialog .clickable-summary h4 {
    cursor: pointer;
    font-weight: bold;
}

/* Attack summary variant */
.ilaris.combat-dialog .clickable-summary.angreifen:hover {
    border-color: #8b0000;
    box-shadow: 0 0 8px rgba(139, 0, 0, 0.3);
}

.ilaris.combat-dialog .clickable-summary.angreifen:hover h4 {
    color: #8b0000 !important;
    text-shadow: 0 0 3px rgba(139, 0, 0, 0.5);
}

/* Defense summary variant */
.ilaris.combat-dialog .clickable-summary.verteidigen:hover {
    border-color: #006400;
    box-shadow: 0 0 8px rgba(0, 100, 0, 0.3);
}

.ilaris.combat-dialog .clickable-summary.verteidigen:hover h4 {
    color: #006400 !important;
    text-shadow: 0 0 3px rgba(0, 100, 0, 0.5);
}

/* Damage summary variant */
.ilaris.combat-dialog .clickable-summary.schaden:hover {
    border-color: #cc4400;
    box-shadow: 0 0 8px rgba(204, 68, 0, 0.3);
}

.ilaris.combat-dialog .clickable-summary.schaden:hover h4 {
    color: #cc4400 !important;
    text-shadow: 0 0 3px rgba(204, 68, 0, 0.5);
}
```

---

## Phase 3: HBS-Updates - Inline Styles entfernen

### 3.1 Prioritäts-Reihenfolge

1. **Kritisch** (viele Styles, am häufigsten):
    - `target_selection.hbs` (embedded `<style>` Block!)
    - `angriff.hbs`
    - `fernkampf_angriff.hbs`

2. **Hoch**:
    - `uebernatuerlich.hbs`

### 3.2 HBS-Refactoring Strategy

#### Schritt 1: Dialog-Container Class hinzufügen

**JavaScript-Seite**: Dialog-Klassen beim Rendern setzen

```javascript
// In der Dialog-Render-Methode:
html.addClass('angriff-dialog') // bzw. fernkampf-dialog, uebernatuerlich-dialog
```

#### Schritt 2: Beispiel-Refactoring angriff.hbs

**VORHER** (inline styles):

```handlebars
<select id='rwdf-{{dialogId}}' name='item.system.manoever.rwdf.selected' style='max-width: 150px'>
    <option value='0'>Ideal</option>
</select>

<div
    class='flexrow'
    style='margin: 10px 0; justify-content: space-between; align-items: flex-start;'
>
    <div class='selected-actors-display' style='flex: 1;'>
        ...
    </div>
    <button style='max-width: 150px' type='button' data-action='showNearby'>
        Andere Akteure
    </button>
</div>
```

**NACHHER** (mit CSS-Klassen):

```handlebars
<select
    id='rwdf-{{dialogId}}'
    name='item.system.manoever.rwdf.selected'
    class='combat-select-narrow'
>
    <option value='0'>Ideal</option>
</select>

<div class='flexrow target-selection-container'>
    <div class='selected-actors-display selected-actors-display-flex'>
        ...
    </div>
    <button class='combat-button-narrow' type='button' data-action='showNearby'>
        Andere Akteure
    </button>
</div>
```

#### Schritt 3: target_selection.hbs - Embedded Style entfernen

**VORHER**:

```handlebars
<style>
    .hostile { color: #ff4444; }
    .neutral { color: #ffaa00; }
    ...
</style>
```

**NACHHER**:

```handlebars
<!-- Styles moved to combat-dialogs.css -->
```

Klassen umbenennen:

- `.hostile` → `.target-sel-hostile`
- `.neutral` → `.target-sel-neutral`
- `.friendly` → `.target-sel-friendly` (mit Scope)
- `table th` → `.target-sel-th` (explizite Klasse statt Element-Selektor)
- Etc.

---

## Phase 4: JavaScript Setup - Dialog-Klassen

Überprüfen/hinzufügen der Dialog-Typ-Klassen in den Dialog-Konstruktoren:

```javascript
// combatDialogClass.js oder wo die Dialoge definiert sind

class AngriffDialog extends Dialog {
    render(force, options) {
        return super.render(force, options)
    }

    _injectHTML(html) {
        super._injectHTML(html)
        html.addClass('angriff-dialog') // Hinzufügen
        return html
    }
}

class FernkampfAngriffDialog extends Dialog {
    // Ähnlich: html.addClass('fernkampf-dialog');
}

class UebernatuerlichDialog extends Dialog {
    // Ähnlich: html.addClass('uebernatuerlich-dialog');
}

class TargetSelectionDialog extends Dialog {
    // html.addClass('target-sel');
}
```

---

## Phase 5: CSS File Setup & Merge

### 5.1 Zusammenführung

Erstelle `scripts/combat/styles/combat-dialogs.css` mit folgendem Inhalt:

1. Alle bestehenden Styles aus `combat.css`
2. Alle bestehenden Styles aus `defense-prompt.css`
3. Alle CSS aus target_selection.hbs erneut definiert mit neuem Scoping
4. Alle neuen Klassen für Inline Styles

### 5.2 Struktur-Beispiel

```css
/* ========================================== */
/*  Combat Dialog Styles - Ilaris System     */
/* ========================================== */

/* --- Base Combat Dialog --- */
.ilaris.combat-dialog .window-content {
  overflow: auto;
}

/* --- Angriff-spezifisch --- */
.ilaris.combat-dialog.angriff-dialog /* Styles here */

/* --- Fernkampf-spezifisch --- */
.ilaris.combat-dialog.fernkampf-dialog /* Styles here */

/* --- Übernatürlich-spezifisch --- */
.ilaris.combat-dialog.uebernatuerlich-dialog /* Styles here */

/* --- Target Selection Dialog --- */
.ilaris.combat-dialog.target-sel /* ... */

/* --- Defense Prompt Messages --- */
.chat-message.ilaris-defense-prompt-highlight /* ... */

/* --- [UNUSED] Legacy / Summary Sections --- */
/* Folgende Klassen fallen unter "Summary" Feature:
   - .clickable-summary (nur für Zusammenfassungen, nicht in Dialog-Templates)
   - .angreifen:hover, .verteidigen:hover, .schaden:hover
   Diese könnten in eine separate Datei ausgelagert werden.
*/
```

---

## Phase 6: Testing & Validierung

### 6.1 Visuelle Tests

- [ ] Angriff-Dialog: Alle Selects und Buttons richtig width
- [ ] Fernkampf-Dialog: Layout korrekt, Target Selection Container
- [ ] Übernatürlich-Dialog: Alle Inputs/Selects styled
- [ ] Target Selection: Tabelle korrekt, Farben (hostile/neutral/friendly)
- [ ] Target Selection: Separators nicht gehovered
- [ ] Defense Prompt: Animation läuft korrekt

### 6.2 Code Review

- [ ] Keine `style=` Attribute mehr in HBS
- [ ] Keine `<style>` Blöcke in HBS
- [ ] Alle Klassen mit `.ilaris.combat-dialog.*` gescoppt
- [ ] Dialog-Typ-Klassen werden korrekt gesetzt (JavaScript)
- [ ] Keine doppelten CSS-Definitionen
- [ ] [UNUSED] Klassen dokumentiert

---

## Phase 7: Cleanup - Alte CSS-Dateien

Nach erfolgreicher Migration:

- [ ] `scripts/combat/styles/defense-prompt.css` löschen
- [ ] `scripts/combat/styles/combat.css` backup und mit Hinweis versehen OR löschen
- [ ] System.json überprüfen, ob Stylesheet-Referenzen aktualisiert sind

---

## Deliverables

1. **`scripts/combat/styles/combat-dialogs.css`** (NEU)
    - Zusammengeführt aus combat.css + defense-prompt.css + target_selection.hbs
    - Mit neuen Scoping-Strukturen
    - Alle neuen Klassen für Inline Styles
    - [UNUSED] Markierungen für zukünftige Optimierungen

2. **HBS-Files aktualisiert** (alle in `scripts/combat/templates/dialogs/`):
    - `angriff.hbs` ⭐
    - `fernkampf_angriff.hbs` ⭐
    - `uebernatuerlich.hbs`
    - `target_selection.hbs` ⭐⭐ (embedded style entfernen)

3. **JavaScript-Updates** (für Dialog-Klassen):
    - Dialog-Konstruktoren prüfen und `.add-class()` für Dialog-Typ hinzufügen

4. **Dokumentation**:
    - Diese Plan-Datei aktualisiert mit _Completion Status_
    - Migration-Guide für ggf. Custom Sheets

---

## Zeitschätzung

| Phase                               | Aufwand       | Status |
| ----------------------------------- | ------------- | ------ |
| Phase 1: Analyse (DONE)             | ✅ Done       | ✅     |
| Phase 2: CSS-Refactoring            | ~1-1.5 Std.   | ⏳     |
| Phase 3: HBS-Updates                | ~1-1.5 Std.   | ⏳     |
| Phase 4: JavaScript Setup           | ~0.5 Std.     | ⏳     |
| Phase 5: CSS File Merge             | ~0.5 Std.     | ⏳     |
| Phase 6: Testing & Validierung      | ~1 Std.       | ⏳     |
| Phase 7: Cleanup (alte CSS löschen) | ~0.25 Std.    | ⏳     |
| **Gesamt**                          | **~5-6 Std.** |        |

---

## Notes

- **Dialog Classes**: Müssen in JavaScript beim Dialog-Rendering hinzugefügt werden (`.addClass()`)
- **Scope Pattern**: `.ilaris.combat-dialog` Root + Dialog-spezifische Varianten
- **Target Selection**: `<style>` Block ist KRITISCH - muss komplett entfernt werden
- **oninput JS**: Bleibt wie ist (nicht in Scope dieses Refactorings)
- **Backwards Compatibility**: Alle alten Klassen mit `/* [UNUSED] */` dokumentiert

---

**🎯 Ziel nach Completion**:

- ✅ 0 Inline Styles (`style=`) in HBS
- ✅ 0 Embedded `<style>` Blöcke in HBS
- ✅ Alle Klassen mit `.ilaris.combat-dialog.*` Scoping
- ✅ Zentrale CSS-Datei mit klarer Dialog-Struktur
- ✅ Dokumentierte Unused Classes für zukünftige Reviews
