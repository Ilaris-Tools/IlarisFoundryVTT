## VS Code

#### Empfohlene Plugins

-   [Unit Tests: Jest Runner](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
-   [Code Formatting: Prettier](https://marketplace.visualstudio.com/items/?itemName=esbenp.prettier-vscode)

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

### GH Actions (CI/CD)
