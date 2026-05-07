# ModelData und Migration

Diese Seite beschreibt den aktuellen ModelData-Ansatz im System, das Mapping von alt nach neu und den praktischen Migrationsablauf fuer Nutzer:innen und Entwickler:innen.

## Architektur nach der Umstellung

Seit der Umstellung gilt:

1. Typ-Registrierung erfolgt in `system.json` ueber `documentTypes`.
2. Feldschema kommt ausschliesslich aus `TypeDataModel.defineSchema()`.
3. `template.json` ist entfernt.

Zentrale Einstiegspunkte:

- `scripts/core/model-data/type-data-models.js`
- `scripts/actors/model-data/index.js`
- `scripts/items/model-data/models.js`
- `scripts/core/migrations/migrate-modeldata-normalization.js`

## Mapping alt zu neu: Actor-Typen

| Alt (template.json) | Neu (TypeDataModel)              | Datei                                  |
| ------------------- | -------------------------------- | -------------------------------------- |
| `Actor.held`        | `held`                           | `scripts/actors/model-data/held.js`    |
| `Actor.nsc`         | `nsc`                            | `scripts/actors/model-data/held.js`    |
| `Actor.kreatur`     | `kreatur`                        | `scripts/actors/model-data/kreatur.js` |
| `Actor.templates.*` | Basisschema fuer geteilte Felder | `scripts/actors/model-data/shared.js`  |

Hinweis: Die Laufzeit arbeitet weiterhin mit denselben `system.*`-Pfaden, aber die Struktur wird jetzt durch die DataModels validiert.

## Mapping alt zu neu: Item-Typen

| Alt (template.json)           | Neu (TypeDataModel)                       | Datei                                |
| ----------------------------- | ----------------------------------------- | ------------------------------------ |
| `nahkampfwaffe`               | `NahkampfwaffeItemDataModel`              | `scripts/items/model-data/models.js` |
| `fernkampfwaffe`              | `FernkampfwaffeItemDataModel`             | `scripts/items/model-data/models.js` |
| `ruestung`                    | `RuestungItemDataModel`                   | `scripts/items/model-data/models.js` |
| `gegenstand`                  | `GegenstandItemDataModel`                 | `scripts/items/model-data/models.js` |
| `fertigkeit`                  | `FertigkeitItemDataModel`                 | `scripts/items/model-data/models.js` |
| `talent`                      | `TalentItemDataModel`                     | `scripts/items/model-data/models.js` |
| `uebernatuerliche_fertigkeit` | `UebernatuerlicheFertigkeitItemDataModel` | `scripts/items/model-data/models.js` |
| `zauber`                      | `ZauberItemDataModel`                     | `scripts/items/model-data/models.js` |
| `liturgie`                    | `LiturgieItemDataModel`                   | `scripts/items/model-data/models.js` |
| `anrufung`                    | `AnrufungItemDataModel`                   | `scripts/items/model-data/models.js` |
| `freie_fertigkeit`            | `FreieFertigkeitItemDataModel`            | `scripts/items/model-data/models.js` |
| `vorteil`                     | `VorteilItemDataModel`                    | `scripts/items/model-data/models.js` |
| `manoever`                    | `ManoeverItemDataModel`                   | `scripts/items/model-data/models.js` |
| `eigenheit`                   | `EigenheitItemDataModel`                  | `scripts/items/model-data/models.js` |
| `eigenschaft`                 | `EigenschaftItemDataModel`                | `scripts/items/model-data/models.js` |
| `waffeneigenschaft`           | `WaffeneigenschaftItemDataModel`          | `scripts/items/model-data/models.js` |
| `angriff`                     | `AngriffItemDataModel`                    | `scripts/items/model-data/models.js` |
| `info`                        | `InfoItemDataModel`                       | `scripts/items/model-data/models.js` |
| `freiestalent`                | `FreiesTalentItemDataModel`               | `scripts/items/model-data/models.js` |
| `abgeleiteter-wert`           | `AbgeleiteterWertItemDataModel`           | `scripts/items/model-data/models.js` |
| `effect-item`                 | `EffectItemDataModel`                     | `scripts/items/model-data/models.js` |
| `Item.templates.*`            | Basisschema fuer geteilte Felder          | `scripts/items/model-data/shared.js` |

## Migrationsleitfaden fuer Nutzer:innen

Empfohlener Ablauf bei Updates auf neue Systemversionen:

1. Vor Update ein World-Backup erstellen.
2. System aktualisieren und World einmal als GM starten.
3. Migration durchlaufen lassen, bis die Info-Logs abgeschlossen sind.
4. Stichprobe machen:
    - 1 Held oeffnen
    - 1 Kreatur oeffnen
    - 1 Zauber/Manoever/waffeneigenschaft pruefen
5. Optional: `npm run test:e2e` in einer lokalen Entwicklungsumgebung ausfuehren.

Wenn Daten ungewoehnlich aussehen, zuerst die Browser-Konsole und die Foundry-Logs pruefen und dann ein Issue mit Beispieldaten melden.

## Migrationsleitfaden fuer Entwickler:innen

### Neue Felder hinzufuegen

1. Feld im passenden TypeDataModel anlegen (`scripts/actors/model-data/*` oder `scripts/items/model-data/*`).
2. Wenn Alt-Daten existieren koennen: Normalisierung in `scripts/core/migrations/migrate-modeldata-normalization.js` ergaenzen.
3. Tests erweitern (`scripts/core/_spec/type-data-models.spec.js` und betroffene Fachtests).
4. Relevante Compendium-Quellen pruefen und danach `npm run pack-all` ausfuehren.

### Neue Typen hinzufuegen

1. Typ in `system.json` unter `documentTypes` registrieren.
2. TypeDataModel-Klasse anlegen und in der Domain-Factory exportieren.
3. Sheet-Registrierung in `scripts/core/init.js` ergaenzen.
4. Importer/Migrationspfade pruefen, falls der Typ aus XML oder Compendiums gespeist wird.

## Migrations-Schnittstellen

### Weltmigration beim Start

- Datei: `scripts/core/migrations/migrate-modeldata-normalization.js`
- Aufgabe: Altformate in aktuelle Zielform bringen (z. B. Alias-Felder, Strukturangleichungen, Runtime-Felder entfernen).
- Trigger: beim World-Start, versioniert ueber `worldSchemaVersion`.

### Kreaturen-Quellenabgleich (Offline-Utility)

- Datei: `utils/update-creature-items.js`
- Aufgabe: `system`-Bloecke in Kreaturen-Embedded-Items aus Referenz-Compendien aktualisieren.
- Nutzung: manuell als Node-Skript.
- Hinweis: Das Skript erwartet aktuell ein `packs/`-Verzeichnislayout und sollte vor Nutzung auf das tatsaechliche lokale Layout geprueft werden.

### XML-Charakterimport

- Dateien:
    - `scripts/importer/xml_character_importer.js`
    - `scripts/importer/xml-character-import-dialogs.js`
- Aufgabe: XML nach Foundry-Actor/Item-Struktur ueberfuehren und bestehende Charaktere synchronisieren.
- Wichtig: Diese Schnittstelle ist schema-sensitiv; Typ- oder Feldumbenennungen muessen hier immer mitgezogen werden.

### XML-Regelimport

- Einstieg: `scripts/importer/xml_rule_importer/index.js`
- Dialog: `scripts/importer/xml_rule_importer/dialog-handler.js`
- Extraktion/Konvertierung: `scripts/importer/xml_rule_importer/extractors/` und `scripts/importer/xml_rule_importer/converters/`
- Aufgabe: Regel-XML in Kompendiums-Daten ueberfuehren.

## Kommunikation bei Aenderungen

Bei ModelData-aendernden PRs sollte immer mitgeliefert werden:

1. Kurzbeschreibung der Feld- oder Typaenderung.
2. Alt-zu-neu-Mapping (Betroffene Keys).
3. Migrationspfad (automatisch/manuell) inklusive Risiko.
4. Testnachweis (Unit + E2E oder begruendeter Teilumfang).
5. Hinweis fuer Nutzer:innen, ob Nacharbeiten notwendig sind.

So bleiben Releases fuer Spielleitungen, Maintainer und Beitragende nachvollziehbar und frustarm.

## Breaking Changes fuer Entwickler:innen

Dieser Abschnitt dokumentiert Felder, die umbenannt oder strukturell geaendert wurden und Anpassungen in Modulen, Makros oder externen Skripten erfordern koennen.

### `voraussetzungen` → `voraussetzung` (Singular)

**Betrifft:** Alle Item-Typen, die Voraussetzungen tragen (z. B. `vorteil`, `talent`, `manoever`, `waffeneigenschaft`).

| Alt                           | Neu                         |
| ----------------------------- | --------------------------- |
| `item.system.voraussetzungen` | `item.system.voraussetzung` |

**Hintergrund:** Das Feld hielt keine Liste, sondern einen einzelnen String. Der Alias `voraussetzungen` wurde entfernt; schreibende Zugriffe muessen auf `voraussetzung` umgestellt werden.

**Migration:** Lesender Zugriff auf `voraussetzungen` liefert weiterhin den Wert (Foundry-Alias-Kompatibilitaet), wird aber in einer kuenftigen Version vollstaendig entfernt. Aktiv schreibende Stellen (Makros, Module, externe Importer) muessen jetzt den neuen Key verwenden.

---

### `wm` → `wm_at` (Nahkampf- und Fernkampfwaffen)

**Betrifft:** `nahkampfwaffe`, `fernkampfwaffe`.

| Alt              | Neu                 |
| ---------------- | ------------------- |
| `item.system.wm` | `item.system.wm_at` |

**Hintergrund:** `wm` war ein veralteter Alias fuer den Waffenmodifikator auf Attacke/Parade. Das Feld heisst nun `wm_at`, analog zu den anderen `wm_*`-Feldern. Der Alias `wm` wurde aus dem TypeDataModel entfernt.

**Migration:** Lesende Zugriffe ueber den alten Key `wm` werden nicht mehr aufgeloest. Alle schreibenden und lesenden Stellen in Makros, Modulen oder externen Importern muessen auf `wm_at` umgestellt werden.

**Importers:** Die eingebauten Importer (`sephrasto_importer.js`, `xml_rule_importer`) schreiben bereits `wm_at` — kein Handlungsbedarf dort.
