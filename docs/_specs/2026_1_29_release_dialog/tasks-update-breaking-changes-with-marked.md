# Task-Liste: Update Breaking Changes System mit `marked` Library

**Ziel:** Aktualisiere das bestehende Breaking Changes System, um die `marked` Library für zuverlässiges Markdown-zu-HTML-Rendering im Build-Prozess zu nutzen. Die Client-Seite bleibt bei `.hbs`-Dateien, das HTML wird aber nun serverseitig mit `marked` generiert.

**Context:** Das System nutzt bereits `.hbs`-Templates mit HTML-Inhalten. Die bisherige `markdownToHtml()`-Funktion im Skript ist jedoch limitiert und unterstützt keine komplexen Listen oder Formatierungen zuverlässig. Durch den Einsatz von `marked` wird das Rendering robuster.

---

## Task 1: Installiere `marked` als Dev-Dependency

**Beschreibung:**
Installiere die `marked` Library als Development Dependency im Projekt.

**Akzeptanzkriterien:**

-   ✅ `marked` ist in `package.json` unter `devDependencies` eingetragen
-   ✅ `package-lock.json` wurde aktualisiert
-   ✅ Die Installation funktioniert mit `npm install`

**Command:**

```bash
npm install --save-dev marked
```

**Status:** ✅ Bereits erledigt (laut Terminal History)

---

## Task 2: Importiere `marked` in `generate-breaking-changes.js`

**Beschreibung:**
Füge den Import der `marked` Library am Anfang des Skripts hinzu.

**Akzeptanzkriterien:**

-   ✅ Import erfolgt als ES Module: `import { marked } from 'marked';`
-   ✅ Import steht zusammen mit den anderen Imports am Dateianfang
-   ✅ Keine Syntax-Fehler beim Ausführen des Skripts

**Zu ändernde Datei:**

-   `utils/generate-breaking-changes.js`

**Implementierungs-Hinweise:**

```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked' // <-- Neu hinzufügen
```

---

## Task 3: Ersetze `markdownToHtml()` durch `marked.parse()`

**Beschreibung:**
Vereinfache die `markdownToHtml()`-Funktion, um `marked.parse()` zu nutzen. Dies sorgt für zuverlässiges Rendering von Listen, Fettdruck, Links, etc.

**Akzeptanzkriterien:**

-   ✅ Funktion `markdownToHtml()` nutzt `marked.parse()` intern
-   ✅ Option `headerIds: false` wird gesetzt (verhindert automatische ID-Generierung für Überschriften)
-   ✅ Input wird vor dem Parsen getrimmt (`.trim()`)
-   ✅ Alle vorhandenen Markdown-Features funktionieren: Listen, Fettdruck, Links, Code-Blöcke

**Zu ändernde Datei:**

-   `utils/generate-breaking-changes.js` - Funktion `markdownToHtml()`

**Alte Implementierung:**

```javascript
function markdownToHtml(markdown) {
    return markdown
        .trim()
        .split('\n')
        .map((line) => {
            // Manuelle Konvertierung von Markdown zu HTML
            if (line.startsWith('- ')) {
                return `<li>${line.substring(2)}</li>`
            }
            // ... weitere manuelle Regeln
        })
        .join('\n')
}
```

**Neue Implementierung:**

```javascript
function markdownToHtml(markdown) {
    // 'marked' parst zuverlässig Listen, Fettdruck, Links, etc.
    // Die Option 'headerIds: false' verhindert automatisch generierte IDs für Überschriften
    return marked.parse(markdown.trim(), { headerIds: false })
}
```

---

## Task 4: Erweitere Regex für flexible Breaking Changes Überschriften

**Beschreibung:**
Passe die `parseBreakingChanges()`-Funktion an, um verschiedene Schreibweisen von "Breaking Changes" zu erkennen.

**Akzeptanzkriterien:**

-   ✅ Regex erkennt folgende Varianten (case-insensitive):
    -   `#### Breaking Change` (Singular)
    -   `#### Breaking Changes` (Plural)
    -   `#### ⚠️ Breaking Changes` (mit Emoji)
    -   `#### BREAKING CHANGE:` (Großbuchstaben, mit/ohne Doppelpunkt)
    -   Beliebige Kombinationen der obigen
-   ✅ Regex extrahiert nur den Inhalt nach der Überschrift (bis zur nächsten `####`, `###` oder EOF)
-   ✅ Whitespace wird korrekt bereinigt

**Zu ändernde Datei:**

-   `utils/generate-breaking-changes.js` - Funktion `parseBreakingChanges()`

**Implementierungs-Hinweise:**

```javascript
function parseBreakingChanges(changelogContent, version) {
    // Flexible Regex für Breaking Changes Überschriften
    // Unterstützt: Emoji, Singular/Plural, Groß-/Kleinschreibung, optionaler Doppelpunkt
    const breakingChangesRegex = new RegExp(
        `^###\\s+\\[?${version}\\]?.*?\\n` + // Version Header
            `[\\s\\S]*?` + // Beliebiger Inhalt bis...
            `^####\\s*(?:⚠️\\s*)?breaking\\s+changes?\\s*:?\\s*$` + // Breaking Changes Überschrift (case-insensitive, flexibel)
            `([\\s\\S]*?)` + // Capture: Inhalt
            `(?=^####|^###|$)`, // Lookahead: Bis nächste Überschrift oder EOF
        'im', // i = case-insensitive, m = multiline
    )

    const match = changelogContent.match(breakingChangesRegex)
    if (!match || !match[1]) {
        return null
    }

    return match[1].trim()
}
```

---

## Task 5: Stelle sicher, dass Exit Code korrekt gesetzt wird

**Beschreibung:**
Verifiziere, dass das Skript mit Exit Code 0 beendet wird, wenn keine Breaking Changes gefunden werden (kein Fehler), und mit Exit Code 1 nur bei echten Fehlern (z.B. CHANGELOG.md nicht gefunden).

**Akzeptanzkriterien:**

-   ✅ Exit Code 0: Erfolgreiche Ausführung (mit oder ohne Breaking Changes)
-   ✅ Exit Code 1: Nur bei echten Fehlern (Datei nicht gefunden, Parsing-Fehler, etc.)
-   ✅ Console-Output ist aussagekräftig:
    -   `ℹ️ No breaking changes found for version X.Y` (bei keinen Breaking Changes)
    -   `✅ Breaking changes template generated successfully!` (bei Erfolg)
    -   `❌ Error: ...` (bei Fehler)

**Zu ändernde Datei:**

-   `utils/generate-breaking-changes.js` - Funktion `main()`

**Implementierungs-Hinweise:**

```javascript
async function main() {
    try {
        // ... Logik ...

        if (!breakingChanges) {
            console.log(`ℹ️ No breaking changes found for version ${majorMinor}`)
            process.exit(0) // Erfolg, auch ohne Breaking Changes
        }

        // ... Template generieren ...

        console.log('✅ Breaking changes template generated successfully!')
        process.exit(0) // Erfolg
    } catch (error) {
        console.error('❌ Error generating breaking changes:', error.message)
        process.exit(1) // Echter Fehler
    }
}
```

---

## Task 6: Bereinige alte `.hbs`-Dateien im Output-Verzeichnis

**Beschreibung:**
Stelle sicher, dass die `cleanupOldBreakingChanges()`-Funktion alte `.hbs`-Dateien korrekt bereinigt und nur die aktuelle Version behält.

**Akzeptanzkriterien:**

-   ✅ Funktion sucht nach Dateien mit Pattern `breaking-changes-*.hbs` (nicht `.md`)
-   ✅ Nur die Datei der aktuellen Version bleibt bestehen
-   ✅ Alle anderen `.hbs`-Dateien werden gelöscht
-   ✅ Console-Output zeigt gelöschte Dateien an

**Zu ändernde Datei:**

-   `utils/generate-breaking-changes.js` - Funktion `cleanupOldBreakingChanges()`

**Hinweis:** Diese Funktion sollte bereits korrekt funktionieren, muss aber verifiziert werden.

---

## Task 7: Teste das Skript lokal

**Beschreibung:**
Führe manuelle Tests durch, um sicherzustellen, dass das Skript korrekt funktioniert.

**Akzeptanzkriterien:**

-   ✅ Skript läuft fehlerfrei: `node utils/generate-breaking-changes.js`
-   ✅ Generierte `.hbs`-Datei enthält valides HTML (keine Raw-Markdown-Syntax mehr)
-   ✅ Listen werden als `<ul><li>...</li></ul>` gerendert
-   ✅ Fettdruck wird als `<strong>...</strong>` gerendert
-   ✅ Links werden als `<a href="...">...</a>` gerendert
-   ✅ Überschriften haben keine automatischen IDs (wegen `headerIds: false`)
-   ✅ Bei fehlenden Breaking Changes: Exit Code 0, keine Datei generiert
-   ✅ Alte `.hbs`-Dateien werden gelöscht

**Test-Schritte:**

1. Führe aus: `node utils/generate-breaking-changes.js`
2. Prüfe Console-Output
3. Öffne generierte Datei in `templates/changes/breaking-changes-X.Y.hbs`
4. Verifiziere HTML-Struktur
5. Teste mit verschiedenen CHANGELOG.md-Inhalten

---

## Task 8: GitHub Action anpassen (falls nötig)

**Beschreibung:**
Prüfe, ob der bestehende GitHub Action Step für das Skript noch funktioniert, oder ob Anpassungen nötig sind.

**Akzeptanzkriterien:**

-   ✅ GitHub Action läuft in `build-packs.yml` fehlerfrei
-   ✅ Step führt `node utils/generate-breaking-changes.js` aus
-   ✅ Workflow setzt sich fort, auch wenn keine Breaking Changes gefunden werden (Exit Code 0)
-   ✅ Workflow bricht mit Fehler ab bei Exit Code 1

**Zu prüfende Datei:**

-   `.github/workflows/build-packs.yml`

**Erwarteter Step (sollte bereits vorhanden sein):**

```yaml
- name: 🔄 Generate breaking changes template
  run: node utils/generate-breaking-changes.js
```

**Hinweis:** Falls dieser Step noch nicht existiert, muss er hinzugefügt werden (siehe Task 5 aus dem alten Task-Breakdown).

---

## Task 9: Client-Seite verifizieren (kein Code-Update nötig)

**Beschreibung:**
Verifiziere, dass die Client-Seite die neuen `.hbs`-Dateien korrekt lädt und rendert.

**Akzeptanzkriterien:**

-   ✅ `fetchBreakingChangesTemplate()` lädt `.hbs`-Dateien (nicht `.md`)
-   ✅ `TextEditor.enrichHTML()` wird auf den HTML-Inhalt angewendet
-   ✅ Dialog zeigt korrekt gerenderten HTML-Inhalt an
-   ✅ Listen, Fettdruck, Links werden korrekt dargestellt
-   ✅ Dialog ist read-only (nicht editierbar)

**Zu prüfende Datei:**

-   `scripts/hooks/changelog-notification.js`

**Hinweis:** Es sollten keine Code-Änderungen nötig sein, da die Client-Seite bereits `.hbs`-Dateien lädt. Das HTML ist nun einfach besser gerendert (durch `marked`).

---

## Task 10: Dokumentation aktualisieren

**Beschreibung:**
Aktualisiere die Dokumentation in `utils/README.md`, um die Verwendung von `marked` zu erwähnen.

**Akzeptanzkriterien:**

-   ✅ Erwähne `marked` Library für Markdown-zu-HTML-Konvertierung
-   ✅ Beschreibe die Vorteile: Zuverlässigeres Rendering von Listen, Links, etc.
-   ✅ Aktualisiere Beispiele, falls nötig
-   ✅ Flexible Überschriften werden dokumentiert

**Zu ändernde Datei:**

-   `utils/README.md`

**Beispiel-Ergänzung:**

```markdown
### Markdown-zu-HTML-Konvertierung

Das Skript nutzt die `marked` Library für zuverlässiges Rendering von Markdown zu HTML:

-   Unterstützt Listen, Fettdruck, Links, Code-Blöcke, etc.
-   Option `headerIds: false` verhindert automatische ID-Generierung
-   Robuster als manuelle String-Manipulation

### Unterstützte Breaking Changes Überschriften

Das Skript erkennt folgende Varianten (case-insensitive):

-   `#### Breaking Change` (Singular)
-   `#### Breaking Changes` (Plural)
-   `#### ⚠️ Breaking Changes` (mit Emoji)
-   `#### BREAKING CHANGE:` (Großbuchstaben, mit/ohne Doppelpunkt)
```

---

## Zusammenfassung der Änderungen

| Task | Datei                                     | Änderung                         | Status      |
| ---- | ----------------------------------------- | -------------------------------- | ----------- |
| 1    | `package.json`                            | `marked` hinzufügen              | ✅ Erledigt |
| 2    | `utils/generate-breaking-changes.js`      | `marked` importieren             | ⏳ Zu tun   |
| 3    | `utils/generate-breaking-changes.js`      | `markdownToHtml()` vereinfachen  | ⏳ Zu tun   |
| 4    | `utils/generate-breaking-changes.js`      | Regex für flexible Überschriften | ⏳ Zu tun   |
| 5    | `utils/generate-breaking-changes.js`      | Exit Codes verifizieren          | ⏳ Zu tun   |
| 6    | `utils/generate-breaking-changes.js`      | Cleanup-Funktion prüfen          | ⏳ Zu tun   |
| 7    | -                                         | Lokale Tests                     | ⏳ Zu tun   |
| 8    | `.github/workflows/build-packs.yml`       | GitHub Action prüfen/anpassen    | ⏳ Zu tun   |
| 9    | `scripts/hooks/changelog-notification.js` | Client-Seite verifizieren        | ⏳ Zu tun   |
| 10   | `utils/README.md`                         | Dokumentation aktualisieren      | ⏳ Zu tun   |

---

## Ablauf für den Coding Agent

1. **Task 2-6**: Skript aktualisieren (`generate-breaking-changes.js`)
2. **Task 7**: Lokale Tests durchführen
3. **Task 8-9**: Integration (GitHub Action, Client-Seite) prüfen
4. **Task 10**: Dokumentation aktualisieren

**Wichtig:** Nach jedem Task sollte das Skript getestet werden, um sicherzustellen, dass es noch funktioniert.

---

## Vorteile der Lösung

✅ **Robustes Rendering:** `marked` ist eine bewährte Library mit umfassender Markdown-Unterstützung
✅ **Performance:** HTML wird im Build-Prozess generiert, nicht zur Laufzeit im Client
✅ **Wartbarkeit:** Weniger Custom-Code, mehr Standard-Libraries
✅ **Flexibilität:** Unterstützt verschiedene Schreibweisen von "Breaking Changes"
✅ **Keine Breaking Changes:** Client-Code bleibt unverändert (`.hbs`-Dateien)
