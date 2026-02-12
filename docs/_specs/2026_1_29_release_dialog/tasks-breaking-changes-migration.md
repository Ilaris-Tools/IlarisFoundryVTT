# Task-Liste: Migration Breaking Changes HBS → Markdown

**Ziel:** Migriere das Breaking Changes System von Handlebars-Templates (`.hbs`) zu reinem Markdown (`.md`). Der Build-Prozess generiert künftig nur noch Markdown-Dateien, und die Client-Seite rendert diese mit `TextEditor` APIs.

---

## Task 1: Regex in `generate-breaking-changes.js` für flexible Überschriften erweitern

**Beschreibung:**
Passe die `parseBreakingChanges()`-Funktion an, um flexible Überschrifts-Varianten zu unterstützen.

**Akzeptanzkriterien:**

- ✅ Regex erkennt folgende Varianten (case-insensitive):
    - `#### Breaking Change`
    - `#### Breaking Changes` (Plural)
    - `#### ⚠️ Breaking Changes` (mit Emoji vor oder nach dem Text)
    - `#### BREAKING CHANGE:` (Großbuchstaben mit optionalem Doppelpunkt)
    - Beliebige Kombinationen: Emoji, Großbuchstaben, Singular/Plural, Doppelpunkt
- ✅ Die Regex extrahiert nur den Inhalt nach der Überschrift (bis zur nächsten `####`, `###` oder EOF)
- ✅ Whitespace und Leerzeilen am Anfang/Ende werden korrekt bereinigt

**Zu ändernde Datei:**

- [utils/generate-breaking-changes.js](utils/generate-breaking-changes.js) - Funktion `parseBreakingChanges()`

**Implementierungs-Hinweise:**

```javascript
// Neue Regex-Pattern für flexible Überschriften:
// - Optional: Emoji am Anfang
// - Das Wort "Breaking" oder "BREAKING"
// - Optional: "Change" oder "Changes" oder nichts
// - Optional: Doppelpunkt am Ende
// - Case-insensitive
```

---

## Task 2: `markdownToHtml()` und `generateHbsFile()` ersetzen durch `generateMdFile()`

**Beschreibung:**
Ersetze die HTML-Generierung durch reine Markdown-Ausgabe. Entferne die `markdownToHtml()`-Funktion und den HBS-Template-Wrapper.

**Akzeptanzkriterien:**

- ✅ Funktion `generateHbsFile()` wird durch `generateMdFile()` ersetzt
- ✅ `generateMdFile()` schreibt nur den puren Markdown-Text (ohne HTML, ohne HBS-Template)
- ✅ Die generierten Dateien heißen `templates/changes/breaking-changes-<major.minor>.md` (nicht `.hbs`)
- ✅ Die `markdownToHtml()`-Funktion wird vollständig entfernt
- ✅ Das Verzeichnis `templates/changes/` wird ggf. erstellt (falls nicht vorhanden)

**Zu ändernde Datei:**

- [utils/generate-breaking-changes.js](utils/generate-breaking-changes.js)

**Beispiel-Output:**

```markdown
- Breaking Change 1: ...
- Breaking Change 2: ...
```

---

## Task 3: `cleanupOldBreakingChanges()` auf `.md`-Dateien anpassen

**Beschreibung:**
Passe die Bereinigung veralteter Breaking Changes Dateien an die neue `.md`-Extension an.

**Akzeptanzkriterien:**

- ✅ Funktion sucht nach Dateien mit Pattern `breaking-changes-*.md` (nicht `.hbs`)
- ✅ Alle alten `.hbs`-Dateien werden gelöscht (falls vorhanden)
- ✅ Nur die aktuelle Version bleibt bestehen
- ✅ Console-Outputs bleiben aussagekräftig

**Zu ändernde Datei:**

- [utils/generate-breaking-changes.js](utils/generate-breaking-changes.js) - Funktion `cleanupOldBreakingChanges()`

---

## Task 4: `main()`-Funktion in `generate-breaking-changes.js` anpassen

**Beschreibung:**
Aktualisiere die `main()`-Funktion, um die neuen Funktionen zu verwenden.

**Akzeptanzkriterien:**

- ✅ `markdownToHtml()` wird NICHT aufgerufen (Markdown bleibt unverändert)
- ✅ `generateMdFile()` wird statt `generateHbsFile()` aufgerufen
- ✅ Exit Code ist 0, wenn keine Breaking Changes gefunden werden
- ✅ Exit Code ist 0 (erfolg) oder 1 (fehler), siehe Übergabe an GitHub Action
- ✅ Console-Output bleibt aussagekräftig:
    - `📖 Processing version: 12.2 (full: 12.2.8)`
    - `ℹ️ No breaking changes found for version 12.2`
    - `✅ Breaking changes template generated successfully!`

**Zu ändernde Datei:**

- [utils/generate-breaking-changes.js](utils/generate-breaking-changes.js) - Funktion `main()`

---

## Task 5: GitHub Action `build-packs.yml` aktualisieren

**Beschreibung:**
Füge einen neuen Step in den `pack`-Job ein, der das Breaking Changes Skript aufruft.

**Akzeptanzkriterien:**

- ✅ Neuer Step wird **nach** `🚀 Install Dependencies` eingefügt
- ✅ Neuer Step wird **vor** `📦 Package database files` eingefügt
- ✅ Step lädt das Skript aus: `node utils/generate-breaking-changes.js`
- ✅ Workflow setzt nicht ab, wenn das Skript Exit Code 0 zurückgibt (auch bei "Keine Breaking Changes")
- ✅ Workflow bricht mit Fehler ab, wenn das Skript Exit Code 1 zurückgibt (z.B. CHANGELOG.md nicht gefunden)
- ✅ Step-Name beschreibt kurz, was getan wird (z.B. `🔄 Generate breaking changes template`)

**Zu ändernde Datei:**

- [.github/workflows/build-packs.yml](.github/workflows/build-packs.yml)

**Beispiel:**

```yaml
- name: 🔄 Generate breaking changes template
  run: node utils/generate-breaking-changes.js
```

---

## Task 6: Client-Seite: `fetchBreakingChangesTemplate()` auf `.md` umstellen

**Beschreibung:**
Passe die `fetchBreakingChangesTemplate()`-Funktion an, um `.md`-Dateien statt `.hbs` zu laden.

**Akzeptanzkriterien:**

- ✅ Ändert den Pfad von `.hbs` zu `.md`:
    - Alt: `systems/${game.system.id}/templates/changes/breaking-changes-${version}.hbs`
    - Neu: `systems/${game.system.id}/templates/changes/breaking-changes-${version}.md`
- ✅ Gibt die raw Markdown-Datei zurück (keine HTML)
- ✅ Error-Handling bleibt erhalten

**Zu ändernde Datei:**

- [scripts/hooks/changelog-notification.js](scripts/hooks/changelog-notification.js) - Funktion `fetchBreakingChangesTemplate()`

---

## Task 7: Client-Seite: Markdown → HTML Rendering mit `TextEditor` APIs

**Beschreibung:**
Implementiere Markdown-zu-HTML-Rendering mit Foundry's `TextEditor` APIs in der `checkAndShowChangelogNotification()`-Funktion.

**Akzeptanzkriterien:**

- ✅ Die `checkAndShowChangelogNotification()`-Funktion rendert das geladene Markdown mit:
    - `TextEditor._markdownToHTML(markdownContent)` → HTML
    - `TextEditor.enrichHTML(htmlContent)` → mit Foundry-Features angereichert (Links, etc.)
- ✅ Das generierte HTML wird an `showChangelogNotification()` übergeben
- ✅ Die Dialog-Inhalte sind **nicht editierbar** (read-only)
- ✅ Performance: Das Laden und Rendern verzögert den Systemstart nicht spürbar
- ✅ Error-Handling: Falls `.md`-Datei nicht existiert oder Fehler beim Rendering, wird Dialog nicht angezeigt

**Zu ändernde Datei:**

- [scripts/hooks/changelog-notification.js](scripts/hooks/changelog-notification.js) - Funktionen `checkAndShowChangelogNotification()` und ggf. `showChangelogNotification()`

**Beispiel-Ablauf:**

1. Lade `breaking-changes-12.2.md` als Text
2. Konvertiere Markdown → HTML: `const html = await TextEditor._markdownToHTML(markdownText)`
3. Bereichere HTML: `const enriched = await TextEditor.enrichHTML(html)`
4. Übergebe an Dialog: `showChangelogNotification(version, enriched)`

---

## Task 8: `.gitignore` prüfen und ggf. anpassen

**Beschreibung:**
Stelle sicher, dass die neuen `.md`-Dateien in `templates/changes/` nicht `.gitignore`-d sind.

**Akzeptanzkriterien:**

- ✅ `.md`-Dateien in `templates/changes/` sind NOT in `.gitignore`
- ✅ Das Verzeichnis `templates/changes/` wird tracked (ggf. `.gitkeep` einfügen)
- ✅ Alte `.hbs`-Dateien können gelöscht werden

**Zu überprüfende Datei:**

- [.gitignore](.gitignore)

---

## Task 9: Dokumentation in `utils/README.md` aktualisieren

**Beschreibung:**
Aktualisiere die Dokumentation des Skripts, um die neuen `.md`-Dateien statt `.hbs` zu erwähnen.

**Akzeptanzkriterien:**

- ✅ Output-Abschnitt erwähnt `.md` statt `.hbs`
- ✅ CHANGELOG.md Format bleibt gleich (Breaking Change Abschnitt)
- ✅ Integration with FoundryVTT erklärt, dass `.md`-Dateien mit `TextEditor` APIs gerendert werden
- ✅ Flexible Überschriften werden dokumentiert

**Zu ändernde Datei:**

- [utils/README.md](utils/README.md)

---

## Task 10: Tests/Validierung

**Beschreibung:**
Validiere die Implementierung mit manuellen Tests.

**Akzeptanzkriterien:**

- ✅ Skript läuft fehlerfrei mit `node utils/generate-breaking-changes.js`
- ✅ Für Version 12.2 wird `templates/changes/breaking-changes-12.2.md` generiert
- ✅ Inhalt der `.md`-Datei ist purer Markdown (keine HTML, kein HBS-Template)
- ✅ Alte `.hbs`-Dateien werden gelöscht
- ✅ Wenn CHANGELOG.md keine Breaking Changes für aktuelle Version hat: Kein Exit-Code-Fehler, keine Datei generiert
- ✅ GitHub Action läuft fehlerfrei in `build-packs.yml`
- ✅ Dialog wird im Client angezeigt und rendert Markdown korrekt
- ✅ Dialog ist read-only (nicht editierbar)

---

## Zusammenfassung der Dateien-Änderungen

| Datei                                     | Änderungen                                           |
| ----------------------------------------- | ---------------------------------------------------- |
| `utils/generate-breaking-changes.js`      | Regex erweitern, HTML-Generierung entfernen, HBS→MD  |
| `.github/workflows/build-packs.yml`       | Neuer Step hinzufügen                                |
| `scripts/hooks/changelog-notification.js` | Pfad `.hbs`→`.md`, TextEditor Rendering              |
| `utils/README.md`                         | Dokumentation aktualisieren                          |
| `.gitignore`                              | Prüfen, ggf. `templates/changes/` explizit freigeben |

---

## Ablauf für den Coding Agent

1. **Starten Sie mit Task 1-4** (Skript-Refaktor): Das ist die Basis für alles
2. **Dann Task 5**: GitHub Action anpassen
3. **Dann Task 6-7**: Client-Seite anpassen
4. **Task 8-9**: Dokumentation und .gitignore
5. **Task 10**: Validierung und Testing

**Wichtig:** Jede Task sollte einzeln getestet werden, bevor die nächste gestartet wird.
