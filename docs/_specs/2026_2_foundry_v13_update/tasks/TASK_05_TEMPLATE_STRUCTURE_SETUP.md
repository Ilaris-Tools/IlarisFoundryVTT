# TASK 05: Template Structure - Setup PARTS

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 5 hours  
**Dependencies:** TASK 04 (Tab System)  
**Files Affected:** `templates/sheets/helden.hbs`, `templates/sheets/kreatur.hbs` + neue Dateien

---

## Objective

Teile die monolithischen HBS-Dateien in PARTS-Struktur auf und erstelle die notwendigen neuen Template-Dateien.

---

## Requirements Covered

- REQ-TEMPLATE-001: Template in PARTS aufteilen
- REQ-TEMPLATE-002: Form Tag Struktur
- REQ-TEMPLATE-003: Keine jQuery Selektoren in Templates
- REQ-TEMPLATE-004: data-action Attribute
- REQ-TEMPLATE-005: TextEditor Helpers

---

## Implementation Steps

### Step 1: Erstelle Verzeichnisstruktur

**Create new directories:**

```
templates/sheets/helden/
  header.hbs
  tabs.hbs
  parts/
    kampf.hbs
    inventar.hbs
    fertigkeiten.hbs
    uebernatuerlich.hbs
    notes.hbs
    effects.hbs

templates/sheets/kreatur/
  header.hbs
  tabs.hbs
  parts/
    profan.hbs
    uebernatuerlich.hbs
```

### Step 2: Extrahiere helden.hbs Header Content

**From current helden.hbs (Lines 1-50 approx) → `templates/sheets/helden/header.hbs`:**

Kopiere die Header-Section:

```handlebars
<div class="heroheader">
  <div>
    <h1><input name="name" type="text" value="{{actor.name}}" /></h1>
  </div>

  {{! Schips Punkte }}
  <div class="flexrow">
    {{#each (range 1 (add actor.system.schips.schips 1)) as |index|}}
    {{#if (lte index ../actor.system.schips.schips_stern)}}
    <span class="schips-button filled" name="system.schips.schips_stern" data-action="schipsClick" title="Schicksalspunkt"></span>
    {{else}}
    <span class="schips-button" data-action="schipsClick" title="verbrauchter Schicksalspunkt"></span>
    {{/if}}
    {{/each}}
  </div>
</div>

<div class="herosidebar">
  {{! Profile Image und Attribute }}
  <div>
    <img class="profile-img" src="{{actor.img}}" data-edit="img" title="{{actor.name}}" height="100" width="100" />
  </div>
  {{! Rest des Sidebar Content }}
</div>
```

**WICHTIG:**

- Ändere alle jQuery-basierten Selektoren zu `data-action`
- `.schips-button` → `data-action="schipsClick"`
- `.triStateBtn` → `data-action="triStateClick"`
- Entferne alle `class="clickable"` → nutze `data-action` stattdessen

### Step 3: Extrahiere Tab Navigation → `templates/sheets/helden/tabs.hbs`

**Create `templates/sheets/helden/tabs.hbs`:**

```handlebars
<hr />
<div class='sheet-tabs tabs' data-group='primary'>
    {{#each tabs as |tab|}}
        <b
            class='tab-item {{tab.cssClass}}'
            data-action='changeTab'
            data-tab='{{tab.id}}'
            data-group='{{tab.group}}'
            title='{{tab.label}}'
        >
            {{#if tab.icon}}<img
                    class='round-icon'
                    src='/systems/Ilaris/assets/images/Ilaris/{{tab.icon}}.webp'
                    height='20'
                    width='20'
                />{{/if}}
            {{game.i18n.localize tab.label}}
        </b>
    {{/each}}
</div>
```

### Step 4: Teile Tab-Content in separate PARTS

**From helden.hbs → `templates/sheets/helden/parts/`**

Extrahiere jeden Tab in eigene Datei:

- `kampf.hbs` - Kampf Tab Content
- `inventar.hbs` - Inventar Tab Content
- `fertigkeiten.hbs` - Fertigkeiten Tab Content
- `uebernatuerlich.hbs` - Übernatürlich Tab Content
- `notes.hbs` - Notes Tab Content
- `effects.hbs` - Effects Tab Content

**Jede Datei sollte mit `<section>` Tag starten:**

```handlebars
<section class='tab {{tabs.TABNAME.cssClass}}' data-group='primary' data-tab='TABNAME'>
    {{! Tab-specific content }}
</section>
```

### Step 5: Ersetze jQuery-Selektoren durch data-action

**Überall in Templates:**

| ALT                          | NEU                           |
| ---------------------------- | ----------------------------- |
| `class="ausklappen-trigger"` | `data-action="ausklappView"`  |
| `class="rollable"`           | `data-action="rollable"`      |
| `class="clickable"`          | `data-action="clickable"`     |
| `class="item-create"`        | `data-action="itemCreate"`    |
| `class="item-edit"`          | `data-action="itemEdit"`      |
| `class="item-delete"`        | `data-action="itemDelete"`    |
| `class="item-toggle"`        | `data-action="toggleItem"`    |
| `class="toggle-bool"`        | `data-action="toggleBool"`    |
| `class="sync-items"`         | `data-action="syncItems"`     |
| `class="schips-button"`      | `data-action="schipsClick"`   |
| `class="triStateBtn"`        | `data-action="triStateClick"` |

**Beispiel-Transformation:**

```handlebars
<!-- ALT -->
<span class='schips-button filled' name='system.schips.schips_stern' title='Schicksalspunkt'></span>

<!-- NEU -->
<span
    class='schips-button filled'
    name='system.schips.schips_stern'
    data-action='schipsClick'
    title='Schicksalspunkt'
></span>
```

### Step 6: Konvertiere helden.hbs zu PARTS-Struktur

**Create `templates/sheets/helden.hbs` (new monolithic wrapper):**

```handlebars
<form class="herosheet" autocomplete="off">
  {{> systems/Ilaris/templates/sheets/helden/header.hbs}}
  {{> systems/Ilaris/templates/sheets/helden/tabs.hbs}}

  <div class="herotab sheet-body">
    {{> systems/Ilaris/templates/sheets/helden/parts/kampf.hbs}}
    {{> systems/Ilaris/templates/sheets/helden/parts/inventar.hbs}}
    {{> systems/Ilaris/templates/sheets/helden/parts/fertigkeiten.hbs}}
    {{> systems/Ilaris/templates/sheets/helden/parts/uebernatuerlich.hbs}}
    {{> systems/Ilaris/templates/sheets/helden/parts/notes.hbs}}
    {{> systems/Ilaris/templates/sheets/helden/parts/effects.hbs}}
  </div>
</form>
```

**WICHTIG:**

- Root Element MUSS `<form>` sein (nicht `<div>`)
- `autocomplete="off"` erforderlich
- Partials bleiben erhalten für Übergangphase

### Step 7: Konvertiere kreatur.hbs zu PARTS-Struktur

**Gleiches Muster für kreatur.hbs:**

- `header.hbs` mit Name + Kurzbeschreibung + Image
- `tabs.hbs` mit Tab-Navigation
- `parts/profan.hbs` mit Profan-Inhalten
- `parts/uebernatuerlich.hbs` mit Übernatürlich-Inhalten

### Step 8: TextEditor Helpers vorbereiten

**In Templates für Enriched Text:**

```handlebars
<!-- Displayed enriched text (read-only) -->
{{{enrichedBiography}}}

<!-- Editable enriched text (if needed) -->
{{editor
    enrichedBiography
    target='system.notes'
    editable=editable
    button=true
    engine='prosemirror'
    collaborate=false
}}
```

---

## Key Points

✅ **Template Struktur:**

- Root `<form>` Tag erforderlich
- PARTS sind separate Dateien
- Partials (`{{> path}}`) für Übergangphase OK

✅ **Event Handling:**

- `data-action="actionName"` auf allen clickable Elements
- Keine jQuery-Selektoren
- Alle Daten in `data-*` Attributes

❌ **MUST NOT:**

- Monolithische HBS-Dateien verbleiben
- jQuery-Selektoren
- `data-toggle` oder `data-trigger` ohne Action

---

## Validation Checklist

**Verzeichnisstruktur:**

- [ ] `templates/sheets/helden/` Directory existiert
- [ ] `templates/sheets/helden/header.hbs` existiert
- [ ] `templates/sheets/helden/tabs.hbs` existiert
- [ ] `templates/sheets/helden/parts/` Directory mit 6 Dateien existiert
- [ ] `templates/sheets/kreatur/` Directory existiert mit gleichem Schema

**helden.hbs:**

- [ ] Root Element ist `<form class="herosheet">`
- [ ] `autocomplete="off"` vorhanden
- [ ] Partials verweisen auf neue Dateien
- [ ] Keine jQuery-Selektoren
- [ ] Alle Buttons haben `data-action`

**kreatur.hbs:**

- [ ] Root Element ist `<form>`
- [ ] Gleiche Struktur wie helden.hbs

**Tab Content:**

- [ ] Jede Datei hat genau EINEN root `<section>` Tag
- [ ] `data-action` Attributes auf allen Buttons/Links
- [ ] Keine `class="clickable"` Klasse mehr verwendet
- [ ] Triple braces `{{{enrichedText}}}` für HTML-Rendering

---

## Next Task

→ **TASK 06: SubClass Actions - HeldenSheet** (nach Template-Setup)
