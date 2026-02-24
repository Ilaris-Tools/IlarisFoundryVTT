Ein technischer Überblick und Hinweise zur Mitarbeit am Projekt.
Die Dokumentation der FoundryVTT-API alleine macht es nicht gerade einfach direkt in den chaotischen Code dieses Projekts einzusteigen.
Diese Hinweise und Anleitungen sollen etwas Hilfestellung geben.
Wenn du noch nicht mit Foundry gearbeitet hast lohnt sich vielleicht ein Blick auf die Zusammenfassung von Konzepten und Begriffen in [Foundry Basics](docs/foundry-basics.md).

## Installation für Entwickler

- [Foundry für node.js installieren (dedicated server)](https://foundryvtt.com/article/installation/)
- `foundrydata`-Ordner ausserhalb des Installationsordners anlegen
- Einmal foundry starten `node resources/app/main.js --dataPath=../foundrydata`, Token eingeben, Adminpasswort setzen etc.
- Dieses Repository in den `foundrydata/Data/systems` Ordner clonen. (ggf. in "Ilaris" umbenennen?)
- `develop` oder Feature-Branch auschecken und foundry neu starten

In der Dokumentation finden sich weitere Schritte zum
[Einrichten von VS Code](./docs/develop/tools.md#vs-code)
und einiger [Entwicklertools](./docs/deveolop/tools.md#husky-pre-commit).

## Versionen und Workflow

Das System bekommt keine regelmäßigen Releases, sondern kann über foundry direkt aus dem Repository installiert und upgedated werden.
Dabei ist es wichtig, dass mehr oder weniger sichergestellt ist, dass der code im main branch möglichst immer funktioniert und die metadaten in system.json korrekt sind.
Um das zu erreichen, werden neue features und bugfixes zuerst im develop branch gesammelt und getestet bevor sie mit einer neuen Version in den main branch kommen (automatische Updates bei Nutzern in Foundry).

### Feature oder Bugfix

Idealerweise wird zuerst ein neues Issue erstellt, wo Ideen noch vor der Umsetzung diskutiert und koordiniert werden können.
Assigne dich selbst dem Issue, wenn du anderen zeigen willst, dass du daran arbeitest oder es noch vor hast.
Wenn du deinem Issue ein Milestone zuordnest, steigen die Chancen, dass die nächste Version auf die Änderungen wartet und sie im Changelog erwähnt wird.
Ausgehend von der obenstehenden Entwicklerinstallation, erstelle einen feature-branch mit PR auf `develop`.
Tipp: den PR schon am Anfang als Draft zu erstellen erlaubt anderen zu sehen woran du arbeitest.
Es ist gut wenn wenigstens ein zweites Augenpaar über die Änderungen geschaut hat um
a) vielleicht Probleme zu sehen, die du übersehen hast und
b) damit sich in jedem Teil des Codes mehrere Leute zurechtfinden.

### Update im Main

Damit die Features zeitnah mit Infos zum Update für Nutzer verfügbar sind muss der develop branch regelmäßig in den main branch gemerged werden.
Als Faustregel bekommt ein PR develop->main eine neue Version und entspricht einem Meilenstein.

Für PRs in den main-Branch stehen verschiedene Templates zur Verfügung:

- **Minor Release**: Grundlegende manuelle Tests und technische Checkliste
- **Major Release**: Umfangreiche manuelle Tests und erweiterte technische Checkliste
- **Versionsupdate**: Reine technische Checkliste ohne manuelle Tests

Die Templates enthalten manuelle Testfälle für Charaktererstellung, Kampfsystem, Browser-Kompatibilität und andere kritische Funktionen um Bugs vor Releases zu vermeiden.

Checklist für ein größeres Versionsupdate:

- Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
- Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
- Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
- Sind Anpassungen der Dokumentation nötig?
- Ist das Update eine Erwähnung im Forum wert?

Als Merge Strategie nach main steht nur squash and rebase zur Verfügung, dadruch gibt es auf main eine cleane History. Nach erfolgreichem Release ist folgendes zu tun, damit develop und main nicht auseinander laufen:

```
git checkout develop
git reset --hard main
git push origin develop --force-with-lease
```

### Automatisierte Foundry VTT Package-Veröffentlichung

Der Build-Workflow (`build-packs.yml`) veröffentlicht das Package nach erfolgreichem GitHub-Release automatisch auch auf der offiziellen Foundry VTT Website über die Package Release API.

#### Setup des FOUNDRY_RELEASE_TOKEN

Der Token muss einmalig als GitHub Repository Secret eingerichtet werden:

1. Gehe zur Foundry VTT Package-Seite im Package-Builder (https://foundryvtt.com/packages/)
2. Öffne das Ilaris-Package und generiere/kopiere den Release Token
3. In GitHub: Gehe zu Repository → Settings → Secrets and variables → Actions
4. Erstelle ein neues Secret mit:
    - Name: `FOUNDRY_RELEASE_TOKEN`
    - Value: Der kopierte Token

Der Token wird ausschließlich über die verschlüsselte GitHub-Variable eingebunden und erscheint niemals im Klartext in Logs.

#### Workflow-Parameter

Der Workflow kann mit folgenden Parametern gesteuert werden:

- **`pre_release`** (boolean, Standard: `true`):
    - `true`: Pre-Release mit SHA-Hash im Tag-Namen, führt Dry-Run durch (keine echte Veröffentlichung auf Foundry)
    - `false`: Normales Release, wird tatsächlich auf Foundry veröffentlicht
- **`skip_foundry_release`** (boolean, Standard: `false`):
    - `true`: Überspringt den Foundry-Release-Schritt komplett
    - `false`: Foundry-Release wird durchgeführt

#### Normaler Release-Prozess

Bei einem normalen Release (PR develop→main mit `pre_release: false`):

1. Der `pack` Job erstellt das GitHub-Release mit ZIP und system.json
2. Der `release-foundry` Job liest automatisch die Metadaten aus system.json
3. Package wird über die Foundry Package API veröffentlicht mit:
    - Version aus system.json
    - Manifest-URL zum system.json im GitHub-Release
    - Notes-URL zu den GitHub Release Notes
    - Compatibility-Werte (minimum, verified)

#### Pre-Releases und Testing

Pre-Releases (Standard bei workflow_dispatch):

- Verwenden Tag-Format: `{version}-{git-sha}` (z.B. `12.3.0-abc123`)
- Führen nur einen Dry-Run auf der Foundry-API durch
- Validieren die Daten ohne tatsächliche Veröffentlichung

#### Fehlerbehandlung

**Versionskollision:** Wenn die Version bereits auf Foundry existiert, schlägt der Job mit HTTP 400 fehl.

**Rate Limiting:** Bei HTTP 429 (Rate Limit) wartet der Workflow automatisch 60 Sekunden und versucht es ein zweites Mal.

**Manueller Retry:** Bei Fehlern kann der Workflow manuell über GitHub Actions gestartet werden:

1. Gehe zu Actions → Build DB for Ilaris in Foundry VTT
2. Klicke auf "Run workflow"
3. Wähle den Branch und setze Parameter entsprechend

**Manueller Fallback:** Falls der automatisierte Prozess fehlschlägt, kann das Package immer noch manuell über den Foundry Package-Builder veröffentlicht werden.

## Code Struktur

In der template.json steht die grobe Datenstruktur für Actors und Items. Es können darin auch templates zum wiederverwenden erstellt werden um zB Nahkampfwaffen, Fernkampfwaffen und Rüstungen alle Eigenschaften eines Gegenstandes zu geben (gewicht, platz, härte, wert ...)

Actor: (types: Held, Kreatur) haben jeweils eigene html Templates zum ansehen und bearbeiten (ActorSheets). In den (zwei) actor.js files stehen hooks und methoden für die actors und das UI

Items: Zauber, Fertigkeiten, Gegenstände, Eigenheiten, Waffen, Vorteile usw.. sind Items mit jeweiligem type. Auch hier gibt es einzelne html snippets als formular um individuelle Items zu bearbeiten.

`/packs/`: Im packs ordner befinden sich die Daten fuer die im Spiel verfuegbaren Kompendien. Letztendlich befinden
sich hier alle möglichen Ilaris-Inhalte (items, actors, effects...) wie zB Vorteile, Waffen, kreaturen.
Foundry behandelt jeden Ordner als Datenbanktabelle mit binary Files, die sich häufig ändern. Um das ganze als Entwickler
einfacher zu verwalten können, werden alle Einträge als .json-files in den jeweiligen \_source unterordner entpackt.
Sie müssen um live verwendet werden zu können erst wieder gepackt werden. [Mehr dazu in den docs](./docs/packs.md).

TODO: Dateistruktur und wichtige Dateien erklären

### Anmerkungen:

- Dateipfade sind fest. Die in einer configdatei abzulegen wäre wohl deutlich klüger (falls man die Dateien umbenennt, etc.)
- Root-directory ist blöd. Sollten in ein einzelnes Verzeichnes, das nicht in die zip für Foundry gepackt wird. Mache ich später sobald:
- package.json updaten und sinnvoll nutzen. Statt per Hand gibt es dann einen update_db Befehl oder so. Und meine persönlichen Pythonskripts zum starten können auch gleich integriert werden.
- Eigenes Pack für freie Fertigkeiten und/oder Sprachen, oder mit in fertigkeiten-und-talente.db?

## Nützliche Links

Existierende CSS Helper
https://foundryvtt.wiki/en/development/guides/builtin-css
und HTML Vorlagen benutzen:
https://foundryvtt.wiki/en/development/guides/SD-tutorial/SD08-Creating-HTML-templates-for-your-actor-sheets
(feel free to edit)

Weitere Open-Source Foundry-Module als Beispiele:
https://github.com/foundryvtt/dnd5e/
https://git.f3l.de/dungeonslayers/ds4/
