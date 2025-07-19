## Check-Liste

Hier ist eine Liste von Dingen, die beim Release zu einer neuen minor version auf jeden Fall beachtet werden sollten.
Vieles davon gilt auch schon für kleinere Fixes im main-Branch. Wenn du im PR das passende Template wählst, bekommst du diese Liste zum abhaken direkt im PR:

-   Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
-   Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
-   Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
-   Falls nötig werden Spielwelten automatisch migriert?
-   Sind die migrations getested und gut dokumentiert? Hinweise/Anleitungen?
-   Sind sonstige Anpassungen der Dokumentation nötig?
-   Ist das Update eine Erwähnung im Forum wert?
-   Branch `foundryvtt-v*` vom letzten kompatiblen stand anlegen wenn eine ältere FoundryVTT version nicht mehr supported wird.
-   -   In der system.json, die alte Versionsnummer verwenden und die download url anpassen
-   -   In der Readme die manifest url anpassen und ggf. ein spoiler nach ganz oben setzen, das dies nicht die neuste version ist.

## Testcases

## Packs

Die Binaries für die Kompendien müssen in den `/packs/`-Ordnern bei Änderungen neu aus den `_source/*`-Dateien gepackt werden.
Wir benutzen dafür das Tool [foundryvtt-cli](https://github.com/foundryvtt/foundryvtt-cli).
Installiert (und konfiguriert) werden kann es mit den Befehlen:

```bash
npm install -g @foundryvtt/foundryvtt-cli
fvtt configure set dataPath "path/to/data/folder/"
fvtt package workon Ilaris
```

Das `-g` installiert das tool global ohne den Zusatz ist das Tool nur im jeweiligen Projekt verwendbar.
Danach steht der Befehl `fvtt` zur Verfügung (falls nicht: `npx @foundryvtt/foundryvtt-cli`) mit dem unter anderem packs gepackt und entpackt werden können.

### Binaries Packen

Wenn zB die json files von Vorteilen geändert wurden, kann das pack so neu gepackt werden:

```bash
fvtt package pack "vorteile"
```

Um die binaries für Alle verfügbar zu machen, push sie ins Repository
(`-f` da sie sonst von git ignoriert werden):

```bash
git add -f packs/vorteile/**
```

### Jsons Entpackten

Neue json-Dateien kannst du auch aus dem aktuellen Stand der DB generieren:

```bash
fvtt package unpack "vorteile"
```

Beachte, wenn du die DB direkt änderst (in der laufenden Foundry-Instanz), dass die Änderungen auch entpackt und ins repository committed werden, sonst werden sie von der nächsten Person ggf. überschrieben.
