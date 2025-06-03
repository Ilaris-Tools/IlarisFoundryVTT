## VS Code

#### Empfohlene Plugins

- [Unit Tests: Jest Runner](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Code Formatting: Prettier](https://marketplace.visualstudio.com/items/?itemName=esbenp.prettier-vscode)

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
Während `eslint` als linter auch Fehler oder Probleme im eigentlichen Code finden und korrigieren
kann, prüft `prettier` nur die Formatierung unterstützt dabei aber auch andere Dateitypen wie yaml,
json, markdown, html und css. Eine konkrete Datei oder Verzeichnis, kann man zum Beispiel mit
folgenden Befehlen checken oder direkt korrigieren:

```bash
npx eslint myfile.js
npx eslint --fix myfile.js
npx prettier --check myfile.css
npx prettier --write myfile.css
```

### GH Actions (CI/CD)
