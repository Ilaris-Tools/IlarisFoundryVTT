# VS Code

## Einrichtung

Die Einrichtung der IDE kann mit dem VS Code [Task](#task): [_Setup IDE_](#vs-code-task-setup-ide) erleichtert werden.

### Empfohlene Plugins

- [Unit Tests: Jest Runner](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Code Formatting: Prettier](https://marketplace.visualstudio.com/items/?itemName=esbenp.prettier-vscode)
- [Darstellung von Github Emojis](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-emoji)

## Task

Mit einem VS Code Task können definierte Aufgaben erledigt werden, z.b. ein Skript ausführen, einen Prozess starten. Das passiert alles innerhalb von VS Code ohne jedesmal den entsprechenden Befehl im Terminel etc einzugeben.

### Ausführen von Tasks

Ein Task kann via _Terminal -> Run Task_ und dort den entsprechenden Task auswählen und somit ausführen.

### Definition von Tasks

In der Datei _.vscode/tasks.json_ werden die Tasks definiert. Hier wird für einen Task angegeben was gemacht werden soll. Ein Skript ausgeführt werden, ein npm Befehl...

Wird ein Skript benötigt werden diese unterhalb des _.vscode_ Ordners unter _tasks-scripts/\<skriptname>_ abgelegt.

:warning: Falls Linux und Windows unterschiedliche Befehle/Syntax benötigen müssen verschiedene Skripte erstellt werden.

### Verfügbare Tasks

#### IDE einrichten<a id="vs-code-task-setup-ide"></a>

- Taskname: Setup IDE
- Konfiguration: --
- Verwendung: Einrichten der IDE

#### Foundry starten

- Taskname: _Start foundry_
- Konfiguration: Damit der Task ausgeführt werden kann muss eine _developer.env_ basierend auf dem Template _developer.template.env_ und dem Betriebssystem neben der _developer.template.env_ im Ordner _tasks-scripts/start-foundry_ erstellt werden. Den Inhalt für das nicht benötigte Betriebssystem entfernen. Je nach Betriebssystem kann der Eintrag folgendermaßen aussehen (<span style="color:green">Muss angepasst werden in den Beispielen</span>):
  <details>
    <summary>Windows</summary>
    REM FoundryVTT Configuration  
      set PATH_TO_FOUNDRY=<span style="color:green">C:\Program Files\Foundry Virtual Tabletop\\</span>  
      set FILE_TO_START_FOUNDRY=<span style="color:green">Foundry Virtual Tabletop.exe</span>
  </details>

<details>
  <summary>Linux</summary>
  PATH_TO_FOUNDRY="<span style="color:green">Downloads/FoundryVTT-12.331/</span>"
  FILE_TO_START_FOUNDRY="<span style="color:green">./foundryvtt</span>"
</details>

- Verwendung: Starten von Foundry direkt aus VS Code heraus.

## Entwicklertools

### Foundry cli

### Jest (Testing)

### Husky/Lint-Staged (pre-commit)

Wir nutzen Husky als pre-commit Tool, um bearbeitete (staged) Dateien automatisch zu überprüfen
und zu verbessern, bevor sie als Commit im Repository verewigt werden. Dieser Schritt
optional und kann im Einzelfall mit `-n` (`git commit -n`) umgangen werden.
Die ausgeführten Befehle stehen in `.husky/pre-commit` und können auch ohne ein Commit zu machen
manuell ausgeführt werden (zB `npx lint-staged`). Die lokale Ausführung erspart hoffentlich
die meisten Fehler, die sonst später im PR auftauchen würden.

```bash
npx eslint myfile.js
npx eslint --fix myfile.js
npx prettier --check myfile.css
npx prettier --write myfile.css
```

Während `eslint` als linter auch Fehler oder Probleme im eigentlichen Code finden und korrigieren
kann, prüft `prettier` nur die Formatierung unterstützt dabei aber auch andere Dateitypen wie yaml,
json, markdown, html und css. Eine konkrete Datei oder Verzeichnis, kann man zum Beispiel mit
folgenden Befehlen checken oder direkt korrigieren:

### SVG Optimization

Das System enthält ein Skript zur Optimierung von SVG-Dateien, das unnötige Metadaten, Inkscape/Sodipodi-spezifische Attribute und aufgeblähte Inline-Styles entfernt.

**Verwendung:**

```bash
npm run optimize-svgs
```

**Was wird optimiert:**

- Entfernung von Inkscape/Sodipodi Metadaten
- Bereinigung unnötiger Namespaces
- Minimierung von Inline-Styles
- Entfernung von Kommentaren und ungenutzten Definitionen
- Komprimierung der SVG-Struktur

Das Skript verarbeitet alle SVG-Dateien im `assets/` Verzeichnis und reduziert typischerweise die Dateigröße um 50-70% ohne Qualitätsverlust.

### GH Actions (CI/CD)
