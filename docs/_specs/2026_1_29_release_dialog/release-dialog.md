## **Detaillierte Anforderungen & Akzeptanzkriterien**

### **A) Build-Prozess & Datei-Generierung**

-   **AC1 (Skript-Logik):** Das modifizierte `generate-breaking-changes.js`-Skript...

    -   ...extrahiert Breaking Changes aus dem `CHANGELOG.md` für die im `system.json` angegebene `major.minor`-Version.
    -   ...**unterstützt flexible Überschriften** (z.B. `#### Breaking Change`, `#### ⚠️ Breaking Changes`, `#### BREAKING`).
    -   ...schreibt bei Erfolg **nur den puren Markdown-Text** in eine Datei `templates/changes/breaking-changes-<major.minor>.md`.
    -   ...**beendet sich ohne Fehler und ohne Dateierstellung**, wenn für die aktuelle Version _keine_ Breaking Changes gefunden werden.
    -   ...bereinigt veraltete `breaking-changes-*.md`-Dateien im Zielordner.

-   **AC2 (GitHub Action):** Der `pack`-Job in `build-packs.yml` wird um einen Schritt erweitert, der...

    -   ...**vor** dem `📦 Package database files`-Schritt ausgeführt wird.
    -   ...das Skript `node utils/generate-breaking-changes.js` aufruft.
    -   ...den Workflow **fehlerfrei und ohne leere Dateien fortsetzt**, wenn das Skript keine Breaking Changes findet (Exit Code 0).

-   **AC3 (Release-Asset):** Die generierte `.md`-Datei muss im finalen System-ZIP im Verzeichnis `templates/changes/` enthalten sein.

### **B) Clientseitige Darstellung & Logik**

-   **AC4 (Dialog-Inhalt):** Die clientseitige Logik...

    -   ...lädt die MD-Datei asynchron.
    -   ...rendert ihren Inhalt mit `TextEditor._markdownToHTML()` und `TextEditor.enrichHTML()` (Lösung #2).
    -   ...betten das generierte HTML in das bestehende, gestylte Dialog-Template ein.
    -   ...stellt sicher, dass der Dialog-Inhalt **nicht editierbar** ist.

-   **AC5 (Anzeigelogik):** Der Dialog wird nur angezeigt, wenn...

    -   ...eine neue `major.minor`-Version erkannt wird (gespeichert in einer `client setting`).
    -   ...für diese Version eine entsprechende `breaking-changes-*.md`-Datei existiert.

-   **AC6 (Performance):** Das Laden und Parsen der MD-Datei darf den Systemstart nicht spürbar verlangsamen.

---

## **Zu implementierende Änderungen im Überblick**

1.  **Skript-Refaktor (`generate-breaking-changes.js`)**:

    -   Entferne die `markdownToHtml()`-Funktion und die HBS-Template-Generierung.
    -   Ersetze `generateHbsFile()` durch `generateMdFile()`, die nur den puren Markdown schreibt.
    -   Passe die Regex in `parseBreakingChanges()` an, um flexible Überschriften zu unterstützen.
    -   Stelle sicher, dass bei fehlenden Breaking Changes **keine Datei erzeugt** und mit Exit Code 0 beendet wird.

2.  **GitHub Action-Integration (`build-packs.yml`)**:

    -   Füge einen neuen Step nach `🚀 Install Dependencies` und vor `📦 Package database files` ein.
    -   Dieser Step soll das Skript ausführen und dessen erfolgreichen Abschluss auch im "Skip"-Fall gewährleisten.

3.  **Clientseitige Logik (bereits existent)**:
    -   Muss ggf. angepasst werden, um von `.hbs` auf `.md`-Dateien umzusteigen und `TextEditor` für das Rendering zu nutzen.

---

**Version**: 1.0
