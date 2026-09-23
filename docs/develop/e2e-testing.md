# E2E-Tests mit Playwright

Die E2E-Tests prüfen Ilaris in einer echten Foundry-VTT-Installation. Sie benötigen deshalb eine eigene, lizenzierte Foundry-VTT-Installation des Contributors. Das Repository startet Foundry **nicht** selbst und kopiert keine Lizenz- oder Konfigurationsdateien.

Für die Tests wird ausschließlich die dedizierte Welt `ilaris-e2e-world-v14363-r1` verwendet. Niemals eine persönliche Spielwelt als E2E-Ziel konfigurieren: Die Tests dürfen Chat-Nachrichten, Akteure und Einstellungen dieser Welt verändern.

## Voraussetzungen

- Foundry VTT `14.363` mit gültiger eigener Lizenz.
- Microsoft Edge unter Windows beziehungsweise Google Chrome unter macOS/Linux.
- Eine lokale Ilaris-Systemkopie, die zu diesem Repository-Stand passt.
- Node.js und die installierten Repository-Abhängigkeiten (`npm install`).

Die Baseline-Welt `r1` ist an Foundry VTT `14.363` und Ilaris `14.0.0` gebunden. Für eine andere Foundry-Version muss eine passend migrierte und geprüfte Baseline bereitgestellt werden.

## Konfigurations-Baseline

Die veröffentlichte E2E-Welt verwendet für konfigurierbare Ilaris-Welteinstellungen die System-Defaults. Insbesondere sind `useTargetSelection`, `lepSystem` und `renameTriumphWithCrit` deaktiviert. Tests, die eine abweichende Einstellung benötigen, setzen sie vor ihrem Ablauf selbst und stellen den vorherigen Wert anschließend wieder her.

Client-Einstellungen wie `hideSyncKampfstileButton` und Foundrys `core.messageMode` gehören nicht zum Weltarchiv. Auch `worldSchemaVersion` wird nicht auf einen Default zurückgesetzt, weil es von der Systemmigration verwaltet wird.

## Baseline-Welt einmalig installieren

1. Foundry beenden.
2. Das Archiv [`ilaris-e2e-world-v14363-r1.zip`](https://github.com/Ilaris-Tools/IlarisFoundryVTT/releases/download/e2e-world-v14363-r1/ilaris-e2e-world-v14363-r1.zip) herunterladen.
3. Optional die Integrität prüfen. Der erwartete SHA-256-Wert ist `DC13421A531B17667F4E077558923DD1FBF597ACBE2A9A428F74E52DF38A563D`:

    ```powershell
    Get-FileHash .\ilaris-e2e-world-v14363-r1.zip -Algorithm SHA256
    ```

4. Das Archiv in den Ordner `worlds` des **Foundry-Benutzerdatenordners** entpacken. Bei der Standardinstallation unter Windows ist das gewöhnlich:

    ```text
    C:\Users\<Benutzer>\AppData\Local\FoundryVTT\Data\worlds\
    ```

    Danach muss diese Datei existieren:

    ```text
    ...\Data\worlds\ilaris-e2e-world-v14363-r1\world.json
    ```

5. Sicherstellen, dass die Welt das Ilaris-System aus diesem Checkout verwendet. Ein Checkout außerhalb des Foundry-Systemordners muss dafür als System installiert oder verlinkt werden.

Die Metadaten zum Archiv (Version, Welt-ID und Prüfsumme) stehen zusätzlich in `e2e/fixtures/baselines/manifest.json`.

## Lokale Testkonfiguration

Im Repository `e2e/.env.example` nach `e2e/.env` kopieren und nur lokale Werte eintragen. Die Datei ist von Git ausgeschlossen.

```dotenv
E2E_FOUNDRY_URL=http://127.0.0.1:30000
E2E_FOUNDRY_USER=e2e-gm
E2E_PLAYER_USER=e2e-player

# Nur setzen, wenn die Baseline-Benutzer Passwörter besitzen.
# E2E_FOUNDRY_PASSWORD=
# E2E_PLAYER_PASSWORD=
```

`E2E_FOUNDRY_URL` muss auf den bereits gestarteten Foundry-Server zeigen. Der Runner startet und beendet Foundry nie. Optional kann `PLAYWRIGHT_CHROMIUM_CHANNEL` den Browserkanal überschreiben; ohne Angabe wird unter Windows `msedge`, sonst `chrome` verwendet. `E2E_CI_HEADLESS=true` schaltet den Browser in den Headless-Modus.

## Testlauf

1. Foundry normal starten und die Welt `ilaris-e2e-world-v14363-r1` laden.
2. Prüfen, dass die Benutzer `e2e-gm` und `e2e-player` sowie die Akteure `HatAlles`, `Testlauf-Held` und `Testlauf-Npc` vorhanden sind. `e2e-player` benötigt Besitzerrechte für `Testlauf-Held`; außerdem müssen die Kreaturen- und Zauberspruch-Kompendien sowie eine aktive Szene verfügbar sein. Der Runner prüft diese Voraussetzungen vor jedem Testlauf.
3. Im Repository die Abhängigkeiten installieren und zunächst einen fokussierten Test ausführen:

    ```powershell
    npm install
    npm run test:e2e -- e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts
    ```

4. Für die gesamte Suite ausführen:

    ```powershell
    npm run test:e2e
    ```

Die Tests laufen absichtlich seriell mit einem Worker. Bei einem Fehler bleiben Playwright-Video und Screenshot in `test-results/` erhalten.

### Pre-effect scenarios

E2E-025 uses `HatAlles` as both caster and selectable target. It imports `Fulminictus Donnerkeil` (a non-ballistic instant-damage spell) from the compendium per test, then clones and temporarily replaces its `preEffects` with the reviewed marker and Pandämonium-style one-time damage configurations before restoring the actor snapshot. E2E-026 uses `HatAlles` as both caster and selectable target with its existing `Ignifaxius Flammenstrahl` item and temporarily replaces its `preEffects` for the alternate-resistance configuration. The baseline therefore needs no additional spell items for these scenarios.

Before running them, ensure that `e2e-gm` is not already connected. The runner intentionally refuses an occupied account; use a free configured E2E user instead of a personal game client.

## Nicht unterstützte Altdaten

Verwaiste oder nicht mehr definierte Token-Status-Effekte werden nicht migriert und müssen nicht weiter bearbeitbar bleiben. Wenn eine alte Welt einen solchen Status enthält, das Token entfernen und neu anlegen. Die E2E-Baseline enthält nur aktuell unterstützte Status-Effekte.

## Welt zurücksetzen

Die E2E-Welt ist veränderlich. Vor einem vollständigen erneuten Lauf die Welt auf den Archivzustand zurücksetzen:

1. Foundry beenden.
2. Den Ordner `ilaris-e2e-world-v14363-r1` im Foundry-Ordner `worlds` löschen oder vorher sichern.
3. Das geprüfte Archiv erneut in `worlds` entpacken.
4. Foundry starten und die E2E-Welt erneut laden.

Andere Welten und die Foundry-Lizenz bleiben bei diesem Ablauf unberührt.

## Fehlerbehebung

| Meldung                         | Ursache und Lösung                                                                |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `Set E2E_FOUNDRY_URL ...`       | `e2e/.env` fehlt oder enthält keine gültige HTTP(S)-URL.                          |
| `Foundry user not found`        | Die E2E-Welt wurde nicht geladen oder der angegebene Benutzer fehlt.              |
| `E2E baseline r1 is incomplete` | Falsche oder unvollständig entpackte Welt; Archiv erneut prüfen und installieren. |
| Browser startet nicht           | Edge/Chrome installieren oder `PLAYWRIGHT_CHROMIUM_CHANNEL` passend setzen.       |

## Baseline aktualisieren (Maintainer)

Eine neue Baseline darf keine Lizenzdateien, Passwörter oder persönliche Daten enthalten. Nach einer Änderung müssen Maintainer die Welt über Foundry prüfen, eine neue Revisionsnummer vergeben, das ZIP als Release-Asset veröffentlichen, den SHA-256-Wert sowie die Metadaten in `e2e/fixtures/baselines/manifest.json` aktualisieren und den vollständigen E2E-Lauf gegen die neue Welt ausführen.
