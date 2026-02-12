# 🚀 ApplicationV2 Migration - Task Overview

**Project:** Ilaris FVTT System v12 → v13  
**Approach:** Schrittweise Migration mit 8 Tasks  
**Total Estimated Time:** ~24 hours

---

## 📋 Task Sequence

### Phase 1: Core Infrastructure (5 hours)

1. **TASK 01: Base Class Migration** (2h)
    - Class Declaration → Mixin
    - DEFAULT_OPTIONS Setup
    - PARTS Definition
    - Form Handler
    - 📁 `scripts/sheets/actor.js`

2. **TASK 02: Context Preparation** (3h)
    - getData() → \_prepareContext()
    - Actor/Config in Context
    - Text Enrichment
    - 📁 `scripts/sheets/actor.js`, `helden.js`, `kreatur.js`

### Phase 2: Event System (7 hours)

3. **TASK 03: Event Handling Refactor** (4h)
    - activateListeners() → \_onRender()
    - jQuery Entfernung
    - Click-Events → Actions
    - Non-Click Listeners
    - 📁 `scripts/sheets/actor.js`

4. **TASK 04: Tab System Migration** (3h)
    - PARTS-basierte Tabs
    - changeTab Action
    - Tab Context Setup
    - 📁 `scripts/sheets/helden.js`, `kreatur.js`

### Phase 3: Templates (5 hours)

5. **TASK 05: Template Structure Setup** (5h)
    - Verzeichnisstruktur
    - PARTS Aufteilen
    - data-action Attributes
    - Form Tags
    - 📁 `templates/sheets/`

### Phase 4: SubClasses (5 hours)

6. **TASK 06: HeldenSheet Actions** (2h)
    - schipsClick → Action
    - triStateClick → Action
    - 📁 `scripts/sheets/helden.js`

7. **TASK 07: KreaturSheet Migration** (3h)
    - clickable Actions
    - Dialog Handling
    - DragDrop Implementation
    - 📁 `scripts/sheets/kreatur.js`

### Phase 5: Polish & Validation (2 hours)

8. **TASK 08: Cross-File Requirements** (4h)
    - Action Naming Konvention
    - Error Handling
    - i18n Setup
    - DragDrop Validierung
    - Code Quality
    - 📁 Alle Files

---

## 🎯 Key Principles

✅ **MUST Follow:**

1. **No jQuery** in Actions/Events (except Exceptions)
2. **Static Actions** für alle Click-Events
3. **\_onRender()** für Non-Click Listeners
4. **PARTS** für alle Templates
5. **data-action** auf allen Buttons/Links
6. **<form>** als Root Element in Templates

❌ **MUST NOT Do:**

- Keine `static get defaultOptions()`
- Keine `getData()`
- Keine `activateListeners()`
- Keine jQuery `html.find()` Selektoren
- Keine `scrollY` Configuration
- Keine Element-ID Duplikate

---

## 📊 Task Dependencies

```
TASK 01 (Base Class)
  ↓
TASK 02 (Context)
  ├→ TASK 03 (Events) → TASK 05 (Templates)
  │
TASK 04 (Tabs) → TASK 05 (Templates)
  ↓
TASK 06 (HeldenSheet)
TASK 07 (KreaturSheet)
  ↓
TASK 08 (Final Polish)
```

**Parallel möglich:**

- TASK 03 & TASK 04 können gleichzeitig starten nach TASK 02
- TASK 06 & TASK 07 können parallel nach TASK 05

---

## ✅ Success Criteria

**Nach allen 8 Tasks sollte:**

1. ✅ Alle Sheets rendern ohne Fehler
2. ✅ Tabs funktionieren und wechseln
3. ✅ Form-Daten speichern korrekt
4. ✅ Alle Actions reagieren auf Klicks
5. ✅ Keine jQuery Warnings/Errors
6. ✅ Event Listener funktionieren
7. ✅ DragDrop funktioniert (KreaturSheet)
8. ✅ Dialoge funktionieren
9. ✅ Keine Browser Console Errors
10. ✅ Lokalisierung funktioniert

---

## 📝 Important Notes

### Before Starting

- [ ] Backup des Systems erstellen
- [ ] Migrations-Branch in Git erstellen
- [ ] Diese Task-Dateien konsultieren während Implementierung

### During Migration

- [ ] Einen Task nach dem anderen abschließen
- [ ] Code testen nach jedem Task
- [ ] Dependencies beachten
- [ ] Keine großen Schritte machen

### After Completion

- [ ] Vollständiger Test in Foundry VTT
- [ ] Performance Benchmark
- [ ] Debugging in Browser DevTools
- [ ] PR/MR für Code Review

---

## 🔗 Reference Links

- **Official API Docs:** https://foundryvtt.com/api/v13/
- **Migration Guide:** https://foundryvtt.wiki/en/development/guides/converting-to-appv2
- **AppV2 Wiki:** https://foundryvtt.wiki/en/development/api/applicationv2
- **Findings:** See `MIGRATION_FINDINGS_APPV2.md`
- **Requirements:** See `MIGRATION_REQUIREMENTS_APPV2.md`

---

## 🚦 When to Use Each Task

| Situation         | Task                          |
| ----------------- | ----------------------------- |
| Starting fresh    | Start TASK 01                 |
| Base Class done   | Move to TASK 02               |
| Context ready     | Move to TASK 03 & 04 parallel |
| Events done       | Start TASK 05                 |
| Templates ready   | Move to TASK 06 & 07          |
| All code migrated | Final TASK 08                 |

---

## 💡 Tips & Tricks

1. **Test frequently:** Nach jedem größeren Change in Browser testen
2. **Search for patterns:** Viele jQuery-Patterns wiederholen sich
3. **Use DevTools:** Application Tab zeigt AppV2 Structure
4. **Keep context:** Jeder Task hat Dependencies - befolgen!
5. **Document changes:** JSDoc Comments für neue Methoden
6. **Check Templates:** Viele Fehler sind Template-bezogen

---

## 🐛 Debugging Guide

**Wenn Sheets nicht rendern:**

- Überprüfe Browser Console für Errors
- Prüfe PARTS Definition in Sheets
- Überprüfe Template-Pfade

**Wenn Actions nicht funktionieren:**

- Überprüfe `data-action` Attribute in Templates
- Überprüfe Action-Namen in DEFAULT_OPTIONS
- Prüfe ob Methode `static` ist

**Wenn Tabs nicht funktionieren:**

- Überprüfe `this.tabGroups` wird gesetzt
- Prüfe `context.tabs` in \_prepareContext()
- Überprüfe Tab Template Struktur

**Wenn Form nicht speichert:**

- Überprüfe `tag: "form"` in DEFAULT_OPTIONS
- Prüfe Form Handler wird aufgerufen
- Überprüfe `name` Attributes auf Inputs

---

## 📞 Support

Falls Fragen während Migration:

1. Konsultiere `MIGRATION_FINDINGS_APPV2.md` für technische Details
2. Konsultiere `MIGRATION_REQUIREMENTS_APPV2.md` für spezifische Anforderungen
3. Überprüfe offizielle Foundry Doku
4. Überprüfe Task-Dokumentation nochmal

---

## 🎉 After Completion

Nach erfolgreichem Abschluss aller Tasks:

- System ist auf ApplicationV2 migriert
- Ready für Foundry VTT v13+
- Performance möglicherweise verbessert
- Wartbarer Code-Struktur
- Besser für zukünftige Updates

**Nächster Schritt:** Optional - andere v1 Applications migrieren
