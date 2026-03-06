# Refaktor: Inline Styles zu CSS + Class Scoping

**Status**: Planning
**Priority**: High
**Modified**: 2026-02-26

---

## Überblick

Ziel ist die Beseitigung ALLER Inline-Styles (`style="..."`) aus den HBS-Dateien in `scripts/actors/templates` und deren Umzug in CSS-Dateien mit korrektem Scoping. Zusätzlich müssen alle genutzten Klassen mit `.ilaris.sheet.actor.helden` / `.ilaris.sheet.actor.kreaturen` / `.ilaris.sheet.actor` (nur für beide Typen) korrekt gescopped werden.

---

## Anforderungen

### ✅ Inline Styles

- **Ziel**: ALLE Inline-Styles aus HBS-Dateien entfernen
- **Erlaubte Inhalte**: Nur `class`, `data-*`, `name`, `value`, `type` etc. - keine `style=`
- **Best Practice**: Conditional Styling (z.B. `{{#if ...}}`) wird durch CSS-Selektoren / Attribute-Selektoren gelöst

### ✅ Class Scoping

- **Helden-spezifisch**: `.ilaris.sheet.actor.helden CLASS`
- **Kreaturen-spezifisch**: `.ilaris.sheet.actor.kreaturen CLASS`
- **Beide Typen**: `.ilaris.sheet.actor CLASS`
- **Anwendung**: Gilt für ALLE Klassen, die in den HBS-Templates verwendet werden

### ✅ CSS-Datei-Struktur

- **Zusammenführung**: `actors.css` + `sidebar.css` → eine Datei (z.B. `actor-sheet.css`)
- **Strukturierung**: Nach HBS-Files gegliedert (header, navigation, sidebar, tabs)
- **Markierungen**: Alle CSS-Klassen, die NICHT in HBS verwendet werden, müssen mit Kommentar gekennzeichnet sein

---

## Phase 1: Analyse - Inline Styles katalogisieren

### 1.1 Gefundene Inline Styles nach HBS-File

#### `held-header.hbs`

✗ **Keine Inline Styles gefunden** - nur Layout mit Handlebars

#### `held-navigation.hbs`

✗ **Keine Inline Styles gefunden** - nur Layout mit Handlebar-Classes

#### `held-sidebar.hbs` 🔴 **HÖCHSTE PRIORITÄT**

| Zeile | Style                                                                                                                    | Verwendungszweck                               | Neue Klasse                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------ |
| 45    | `style="font-size: 12px"`                                                                                                | Schrift-Größe für Energy-Labels                | `.hero-energy-font-small`      |
| 47    | `style="margin-right: 0.5em"`                                                                                            | Spacing zwischen Label-Elementen (AsP Label)   | `.hero-energy-label-spacing`   |
| 48    | `style="margin-right: 0.5em"`                                                                                            | Spacing zwischen Label-Elementen (AsP Value)   | `.hero-energy-value-spacing`   |
| 50    | `style="margin-right: 0.1em"`                                                                                            | Spacing zwischen Label-Elementen (gAsP Label)  | `.hero-energy-label-compact`   |
| 51    | `style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;"` | Input-Styling für gAsP                         | `.hero-energy-input`           |
| 53    | `style="margin-right: 0.1em"`                                                                                            | Spacing zwischen Label-Elementen (AsP\* Label) | `.hero-energy-label-compact`   |
| 54    | `style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;"` | Input-Styling für AsP\*                        | `.hero-energy-input`           |
| 60    | `style="display: none; margin-left: 0.5em;"`                                                                             | Expandable View für AsP zugekauft              | `.hero-energy-expandable`      |
| 68    | `style="margin-right: 0.5em"`                                                                                            | Spacing zwischen Label-Elementen (KaP Label)   | `.hero-energy-label-spacing`   |
| 71    | `style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;"` | Input-Styling für gKaP                         | `.hero-energy-input`           |
| 73    | `style="margin-right: 0.1em"`                                                                                            | Spacing zwischen Label-Elementen (KaP\* Label) | `.hero-energy-label-compact`   |
| 74    | `style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;"` | Input-Styling für KaP\*                        | `.hero-energy-input`           |
| 80    | `style="display: none; margin-left: 0.5em;"`                                                                             | Expandable View für KaP zugekauft              | `.hero-energy-expandable`      |
| 86    | `style="margin-top: 1.5em; font-size: 12px;"`                                                                            | Wrapper für Wundabzug-Toggle                   | `.hero-energy-section-spacing` |
| 93    | `style="color: {{#if ...}}..."`                                                                                          | Conditional Toggle Styling                     | CSS-Attribute Selektoren       |
| 99    | `style="margin-top: 0.5em; font-size: 12px;"`                                                                            | Spacing für Global-Mod Display                 | `.hero-energy-section-spacing` |
| 107   | `style="margin-top: 0.5em; font-size: 12px;"`                                                                            | Spacing für Manueller Mod Input                | `.hero-energy-section-spacing` |
| 109   | `style="color: #efe6d8; background-color: transparent; width: 3em; padding: 0; padding-left: 4px;"`                      | Input-Styling für Manueller Mod                | `.hero-energy-input`           |
| 114   | `style="margin-top: 0.5em; text-align: center;"`                                                                         | Sync-Button Container                          | `.hero-sync-button-wrapper`    |

#### `kreatur.hbs` 🔴 **HÖCHSTE PRIORITÄT**

| Zeile | Style                                                                                                                                                 | Verwendungszweck                                  | Neue Klasse                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 4     | `style="display: flex; justify-content: space-between;"`                                                                                              | Header Layout (flex)                              | `.kreatur-header-layout`                    |
| 6     | `style=""`                                                                                                                                            | Leeres Style - **ENTFERNEN**                      | -                                           |
| 12    | `style="clear: both"`                                                                                                                                 | Clear Float                                       | Nicht nötig, flexbox verwenden              |
| 54    | `style="{{#if ...}}text-decoration:line-through;{{/if}}"`                                                                                             | Conditional Strikethrough (Wundabzüge ignorieren) | CSS-Attribute Selektoren / `.strikethrough` |
| 73    | `style="width: 100%; padding-top: 1px; padding-bottom: 1px; margin-top: 1px; margin-bottom: 1px; border-top: 1px solid darkred; border-bottom: 0px;"` | HR Styling                                        | `.kreatur-divider-red`                      |
| 75    | `style="color: {{modColor ...}}"`                                                                                                                     | Conditional Color (Global Mod)                    | CSS-Attribute Selektoren                    |
| 128   | `style="opacity: 0.4;"`                                                                                                                               | Disabled State für Attribute Section              | `.kreatur-section-disabled`                 |
| 132   | `style="width: 30px;"`                                                                                                                                | Input Width für PW Feld                           | `.kreatur-input-narrow`                     |
| 145   | `style="float: right"`                                                                                                                                | Float Kampfwerte Mod                              | `.kreatur-kampfwerte-float-right`           |
| 146   | `style="color: {{modColor ...}}"`                                                                                                                     | Conditional Color (Nahkampfmod)                   | CSS-Attribute Selektoren                    |
| 153   | `style="opacity: 0.4;"`                                                                                                                               | Disabled State für Kampfwerte Section             | `.kreatur-section-disabled`                 |
| 158   | `style="width: 30px;"`                                                                                                                                | Input Width für Kampfwert Feld                    | `.kreatur-input-narrow`                     |
| 386   | `style="max-width: 150px;"`                                                                                                                           | Select Max Width                                  | `.kreatur-select-narrow`                    |
| 390   | `style="max-width: 150px;"`                                                                                                                           | Select Max Width (Kopie)                          | `.kreatur-select-narrow`                    |

#### `held/tabs/attribute.hbs` 🟡 **MITTLERE PRIORITÄT**

| Zeile | Style                                                                                 | Verwendungszweck        | Neue Klasse                   |
| ----- | ------------------------------------------------------------------------------------- | ----------------------- | ----------------------------- |
| 3     | `style="display: flex; gap: 1em; align-items: flex-start;"`                           | Tab Container Layout    | `.hero-tab-container-flex`    |
| 6     | `style="font-size:10pt; border-collapse: collapse; width: auto; table-layout: auto;"` | Table Styling           | `.hero-table-compact`         |
| 17    | `style="background-color: rgba(255, 255, 255, 0);"`                                   | Transparent Background  | `.hero-table-row-transparent` |
| 24    | `style="width: 4em; text-align: center;"`                                             | Input Width + Alignment | `.hero-input-compact`         |

#### `held/tabs/fertigkeiten.hbs` 🟡 **MITTLERE PRIORITÄT**

| Zeile | Style                                                                                 | Verwendungszweck            | Neue Klasse                     |
| ----- | ------------------------------------------------------------------------------------- | --------------------------- | ------------------------------- |
| 7     | `style="margin-left: 1em;"`                                                           | Button Spacing              | `.hero-button-spacing`          |
| 19    | `style="flex-basis: 40px; width: 40px;"`                                              | Fixed Width Column Header   | `.hero-table-col-fixed-40`      |
| 36    | `style="flex-basis: 40px;"`                                                           | Fixed Width Column Data     | `.hero-table-col-fixed-40`      |
| 74    | `style="display:none;"`                                                               | Hidden Expandable Row       | `.hero-expandable-row-hidden`   |
| 77    | `style="padding: 0.5em 1em; background: #f9f9f9;"`                                    | Expandable Row Cell Styling | `.hero-expandable-row-cell`     |
| 80    | `style="display: flex; gap: 1em; font-weight: bold; margin-bottom: 0.2em;"`           | Expandable Content Header   | `.hero-expandable-header`       |
| 86    | `style="display: flex; gap: 1em; margin-bottom: 0.8em;"`                              | Expandable Content Values   | `.hero-expandable-values`       |
| 91    | `style="white-space: pre-line;"`                                                      | Text Formatting             | `.hero-text-preformatted`       |
| 97    | `style="margin-top: 1em;"`                                                            | Spacing vor Talents Section | `.hero-section-spacing`         |
| 102   | `style="margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em;"` | Talent Item Separator       | `.hero-talent-item`             |
| 106   | `style="float: right; margin-left: 0.3em;"`                                           | Edit Button Float           | `.hero-action-float-right`      |
| 109   | `style="float: right;"`                                                               | Delete Button Float         | `.hero-action-float-left`       |
| 142   | `style="font-size:10pt; width: 100%; border-collapse: collapse; margin-top: 0.5em;"`  | Freie Fertigkeiten Table    | `.hero-table-free-fertigkeiten` |

#### `held/tabs/kampf.hbs` 🟡 **MITTLERE PRIORITÄT**

| Zeile | Style                                                                                                                              | Verwendungszweck                 | Neue Klasse                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| 4     | `style="float: right"`                                                                                                             | Nahkampfmod Float                | `.hero-kampf-mod-float-right`    |
| 10    | `style="display: flex; align-items: center; gap: 10px;"`                                                                           | Combat Style Selection Container | `.hero-kampf-style-container`    |
| 14    | `style="display: flex; align-items: center; gap: 5px;"`                                                                            | Beritten Checkbox Container      | `.hero-kampf-checkbox-container` |
| 19    | `style="margin-top: 8px; padding: 8px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;"` | Combat Style Alert / Warning Box | `.hero-kampf-alert-warning`      |
| 20    | `style="color: #dc3545; margin-right: 5px;"`                                                                                       | Alert Icon Color                 | `.hero-kampf-alert-icon`         |
| 167   | `style="width: 100%; border-collapse: collapse;"`                                                                                  | Fernkampf Table Full Width       | `.hero-table-full-width`         |
| 218   | `style="width: 100%; border-collapse: collapse;"`                                                                                  | Rüstung Table Full Width         | `.hero-table-full-width`         |
| 254+  | (weitere spreads)                                                                                                                  | Hidden Expandable Rows           | `.hero-expandable-row-hidden`    |

#### `held/tabs/*` (weitere Tabs)

- `inventar.hbs`: Keine Inline Styles gefunden
- `uebernatuerlich.hbs`: Müssen einzeln geprüft werden
- `notes.hbs`: Müssen einzeln geprüft werden
- `effekte.hbs`: Müssen einzeln geprüft werden
- `auslagerung.hbs`: Müssen einzeln geprüft werden

---

## Phase 2: CSS-Refactoring - Neue Klassen mit Scoping

### 2.1 Neue CSS-Struktur

**Bestandsdateien zusammenführen**:

- `scripts/actors/styles/actors.css` + `scripts/actors/styles/sidebar.css` → `scripts/actors/styles/actor-sheet.css`

### 2.2 CSS Sections nach Funktionalität

```css
/* ========================================== */
/*  Actor Sheet Styles - Ilaris System       */
/* ========================================== */

/* --- Heros: Header Styles --- */
.ilaris.sheet.actor.helden ...

/* --- Heros: Sidebar Styles --- */
.ilaris.sheet.actor.helden .window-content .herosidebar ...

/* --- Heros: Energy Modifiers (AsP, KaP, GuP) --- */
.ilaris.sheet.actor.helden .energy-modifiers ...
.ilaris.sheet.actor.helden .hero-energy-font-small ...
.ilaris.sheet.actor.helden .hero-energy-input ...
.ilaris.sheet.actor.helden .hero-energy-expandable ...
.ilaris.sheet.actor.helden .hero-energy-section-spacing ...
.ilaris.sheet.actor.helden .hero-sync-button-wrapper ...

/* --- Heros: Tab Styles --- */
.ilaris.sheet.actor.helden .sheet-tabs ...
.ilaris.sheet.actor.helden .hero-tab-container-flex ...
.ilaris.sheet.actor.helden .hero-table-compact ...
.ilaris.sheet.actor.helden .hero-input-compact ...

/* --- Heros: Kampf Tab --- */
.ilaris.sheet.actor.helden .hero-kampf-mod-float-right ...
.ilaris.sheet.actor.helden .hero-kampf-style-container ...
.ilaris.sheet.actor.helden .hero-kampf-checkbox-container ...
.ilaris.sheet.actor.helden .hero-kampf-alert-warning ...
.ilaris.sheet.actor.helden .hero-kampf-alert-icon ...

/* --- Kreaturen: Header Styles --- */
.ilaris.sheet.actor.kreaturen .sheet-header ...

/* --- Kreaturen: Status / Stat Block --- */
.ilaris.sheet.actor.kreaturen .kreatur-header-layout ...
.ilaris.sheet.actor.kreaturen .kreatur-divider-red ...
.ilaris.sheet.actor.kreaturen .kreatur-section-disabled ...
.ilaris.sheet.actor.kreaturen .kreatur-input-narrow ...
.ilaris.sheet.actor.kreaturen .kreatur-kampfwerte-float-right ...
.ilaris.sheet.actor.kreaturen .kreatur-select-narrow ...

/* --- Both Actor Types: Shared Utilities --- */
.ilaris.sheet.actor .flexrow ...
.ilaris.sheet.actor .flexcol ...
.ilaris.sheet.actor .flex1 ...
.ilaris.sheet.actor .flex0 ...
.ilaris.sheet.actor .onhover ...
.ilaris.sheet.actor .icon-small ...
.ilaris.sheet.actor .table ...

/* --- [UNUSED] Legacy Classes (marked for review) --- */
/* Folgende Klassen in CSS definiert aber nicht in HBS verwendet:
   - .attribute-grid
   - .attribute-wrapper
   - .attribute-number
   - .onhover:hover (aber :hover verwendet)
*/

```

### 2.3 Liste neuer Klassen (detailliert)

#### Hero Energy Modifiers Klassen

```css
.ilaris.sheet.actor.helden .hero-energy-font-small {
    font-size: 12px;
}

.ilaris.sheet.actor.helden .hero-energy-label-spacing {
    margin-right: 0.5em;
}

.ilaris.sheet.actor.helden .hero-energy-label-compact {
    margin-right: 0.1em;
}

.ilaris.sheet.actor.helden .hero-energy-input {
    color: #efe6d8;
    background-color: transparent;
    width: 3em;
    margin-right: 0.5em;
    padding: 0;
    padding-left: 4px;
}

.ilaris.sheet.actor.helden .hero-energy-expandable {
    display: none;
    margin-left: 0.5em;
}

.ilaris.sheet.actor.helden .hero-energy-expandable.expanded {
    display: inline;
}

.ilaris.sheet.actor.helden .hero-energy-section-spacing {
    margin-top: 0.5em;
    font-size: 12px;
}

.ilaris.sheet.actor.helden .hero-sync-button-wrapper {
    margin-top: 0.5em;
    text-align: center;
}
```

#### Kampf Tab Klassen (held)

```css
.ilaris.sheet.actor.helden .hero-kampf-mod-float-right {
    float: right;
}

.ilaris.sheet.actor.helden .hero-kampf-style-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.ilaris.sheet.actor.helden .hero-kampf-checkbox-container {
    display: flex;
    align-items: center;
    gap: 5px;
}

.ilaris.sheet.actor.helden .hero-kampf-alert-warning {
    margin-top: 8px;
    padding: 8px;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
}

.ilaris.sheet.actor.helden .hero-kampf-alert-icon {
    color: #dc3545;
    margin-right: 5px;
}
```

#### Kreatur-spezifische Klassen

```css
.ilaris.sheet.actor.kreaturen .kreatur-header-layout {
    display: flex;
    justify-content: space-between;
}

.ilaris.sheet.actor.kreaturen .kreatur-divider-red {
    width: 100%;
    padding-top: 1px;
    padding-bottom: 1px;
    margin-top: 1px;
    margin-bottom: 1px;
    border-top: 1px solid darkred;
    border-bottom: 0px;
}

.ilaris.sheet.actor.kreaturen .kreatur-section-disabled {
    opacity: 0.4;
}

.ilaris.sheet.actor.kreaturen .kreatur-input-narrow {
    width: 30px;
}

.ilaris.sheet.actor.kreaturen .kreatur-kampfwerte-float-right {
    float: right;
}

.ilaris.sheet.actor.kreaturen .kreatur-select-narrow {
    max-width: 150px;
}
```

#### Freigegeben für beide Typen

```css
.ilaris.sheet.actor .hero-tab-container-flex {
    display: flex;
    gap: 1em;
    align-items: flex-start;
}

.ilaris.sheet.actor .hero-table-compact {
    font-size: 10pt;
    border-collapse: collapse;
    width: auto;
    table-layout: auto;
}

.ilaris.sheet.actor .hero-table-row-transparent {
    background-color: rgba(255, 255, 255, 0);
}

.ilaris.sheet.actor .hero-input-compact {
    width: 4em;
    text-align: center;
}

.ilaris.sheet.actor .hero-table-col-fixed-40 {
    flex-basis: 40px;
    width: 40px;
}

.ilaris.sheet.actor .hero-expandable-row-hidden {
    display: none;
}

.ilaris.sheet.actor .hero-expandable-row-cell {
    padding: 0.5em 1em;
    background: #f9f9f9;
}

.ilaris.sheet.actor .hero-expandable-header {
    display: flex;
    gap: 1em;
    font-weight: bold;
    margin-bottom: 0.2em;
}

.ilaris.sheet.actor .hero-expandable-values {
    display: flex;
    gap: 1em;
    margin-bottom: 0.8em;
}

.ilaris.sheet.actor .hero-text-preformatted {
    white-space: pre-line;
}

.ilaris.sheet.actor .hero-section-spacing {
    margin-top: 1em;
}

.ilaris.sheet.actor .hero-talent-item {
    margin-bottom: 0.5em;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3em;
}

.ilaris.sheet.actor .hero-action-float-right {
    float: right;
    margin-left: 0.3em;
}

.ilaris.sheet.actor .hero-action-float-left {
    float: right;
}

.ilaris.sheet.actor .hero-table-full-width {
    width: 100%;
    border-collapse: collapse;
}

.ilaris.sheet.actor .hero-button-spacing {
    margin-left: 1em;
}
```

---

## Phase 3: HBS-Updates - Schrittweise Inline Styles entfernen

### 3.1 Prioritäts-Reihenfolge

1. **Kritisch** (viele Styles, häufig genutzt):
    - `held-sidebar.hbs`
    - `kreatur.hbs`

2. **Hoch** (Tab-spezifisch):
    - `held/tabs/attribute.hbs`
    - `held/tabs/fertigkeiten.hbs`
    - `held/tabs/kampf.hbs`

3. **Mittel** (weitere Tabs):
    - `held/tabs/inventar.hbs`
    - `held/tabs/notes.hbs`
    - `held/tabs/uebernatuerlich.hbs`
    - `held/tabs/effekte.hbs`

### 3.2 Beispiel-Refactoring: `held-sidebar.hbs`

**VORHER**:

```handlebars
<div style='font-size: 12px'>
    {{#if actor.system.abgeleitete.zauberer}}
        <label class='onhover' style='margin-right: 0.5em;'><b>AsP:</b></label>
        <input
            style='color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;'
        />
    {{/if}}
</div>
```

**NACHHER**:

```handlebars
<div class='hero-energy-font-small'>
    {{#if actor.system.abgeleitete.zauberer}}
        <label class='onhover hero-energy-label-spacing'><b>AsP:</b></label>
        <input class='hero-energy-input' />
    {{/if}}
</div>
```

### 3.3 Conditional Styling (spezielle Behandlung)

**Problem**: Styles mit Handlebars-Conditionals

**VORHER**:

```handlebars
<label style="{{#if actor.system.gesundheit.wundenignorieren }}text-decoration:line-through;{{/if}}">
  {{actor.system.gesundheit.display}}
</label>
```

**NACHHER** (CSS-Lösung via Attribute):

```handlebars
<label class="kreatur-wounds-display {{#if actor.system.gesundheit.wundenignorieren}}strikethrough{{/if}}">
  {{actor.system.gesundheit.display}}
</label>
```

```css
.ilaris.sheet.actor.kreaturen .kreatur-wounds-display.strikethrough {
    text-decoration: line-through;
}
```

---

## Phase 4: CSS Cleanup - Ungenutzten Code markieren

### 4.1 Prozess

Nach jedem HBS-Update:

1. Alle CSS-Klassen überprüfen, die NICHT in den HBS-Files vorkommen
2. Mit Kommentar markieren: `/* [UNUSED] - Review candidate */`
3. Am Ende eine dedizierte Section mit Kandidaten für Deletion

### 4.2 Beispiel einer UNUSED Markierung

**IN`: `actor-sheet.css`**

```css
/* [UNUSED] - Review candidate: .attribute-grid not found in HBS files.
   If custom sheets depend on this class, move to theme-specific CSS. */
.attribute-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.05rem;
}
```

---

## Phase 5: Testing & Validierung

### 5.1 Visuelle Tests

- [ ] Helden-Sheet: Alle Tabs laden korrekt
- [ ] Kreaturen-Sheet: Alle Sections angezeigt
- [ ] Sidebar: Energy-Modifikatoren richtig gestylt
- [ ] Kampf-Tab: Alerts & Styles korrekt
- [ ] Freie Fertigkeiten: Table-Layout intakt
- [ ] Expandable Rows: Show/Hide funktioniert
- [ ] Colors: Mod-Colors (gold/rot) werden angezeigt
- [ ] Fonts: Alle Font-Größen korrekt

### 5.2 Code Review

- [ ] Keine `style=` Attribute mehr in HBS-Files
- [ ] Alle verwendeten Klassen mit `.ilaris.sheet.actor.*` gescopped
- [ ] CSS ist gut strukturiert nach HBS-Sections
- [ ] Keine doppelten CSS-Definitionen
- [ ] Alle [UNUSED] Klassen dokumentiert

---

## Deliverables

1. **`scripts/actors/styles/actor-sheet.css`**
    - Zusammengeführt aus actors.css + sidebar.css
    - Mit neuem Scoping
    - Alle neuen Klassen
    - [UNUSED] Markierungen

2. **HBS-Files aktualisiert** (alle in `scripts/actors/templates/`):
    - `held-header.hbs`
    - `held-navigation.hbs`
    - `held-sidebar.hbs` ⭐
    - `kreatur.hbs` ⭐
    - `held/tabs/attribute.hbs`
    - `held/tabs/fertigkeiten.hbs`
    - `held/tabs/kampf.hbs`
    - `held/tabs/inventar.hbs`
    - `held/tabs/notes.hbs`
    - `held/tabs/uebernatuerlich.hbs`
    - `held/tabs/effekte.hbs`
    - `held/tabs/auslagerung.hbs`

3. **Dokumentation**:
    - Diese Plan-Datei aktualisiert mit _Completion Status_
    - Liste aller refaktorierten Styles
    - Migration-Guide falls nötig

---

## Zeitschätzung

| Phase                           | Aufwand        | Status |
| ------------------------------- | -------------- | ------ |
| Phase 1: Analyse                | ✅ Done        | ✅     |
| Phase 2: CSS-Refactoring        | ~2-3 Std.      | ⏳     |
| Phase 3: HBS-Updates (kritisch) | ~2-3 Std.      | ⏳     |
| Phase 3: HBS-Updates (rest)     | ~1-2 Std.      | ⏳     |
| Phase 4: Cleanup                | ~1 Std.        | ⏳     |
| Phase 5: Testing                | ~1 Std.        | ⏳     |
| **Gesamt**                      | **~8-10 Std.** |        |

---

## Notes

- **Conditional Styling**: Wo möglich JavaScript/Handlebars-Conditionals durch CSS-Klassen ersetzen
- **Flexbox**: `float: right` wo möglich durch `flex` ersetzen (bessere Crossbrowser-Kompatibilität)
- **Color Modifiers**: `{{modColor}}` Handlebars-Helper bleibt, aber wird in klassische CSS-Selektoren überführt
- **Breakpoints**: Responsive Design nicht in Scope - nur Desktop-First Ansatz

---

**🎯 Ziel nach Completion**:

- ✅ 0 Inline Styles in HBS
- ✅ Alle Klassen mit `.ilaris.sheet.actor.*` Scoping
- ✅ Zentrale CSS-Datei mit klarer Struktur
- ✅ Dokumentierte Candidates für weitere Optimierungen
