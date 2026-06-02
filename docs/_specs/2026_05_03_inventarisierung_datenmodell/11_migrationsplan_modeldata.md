# Umstellung auf ModelData - Migrationsplan

Status: **Abgeschlossen v5** (Template.json komplett entfernt, TypeDataModel ist alleinige Schemaautorität)

## Umsetzungsstand (2026-05-07)

Bereits umgesetzt:

1. J-30 Bugfix: effect-item Typvergleich auf effect-item korrigiert.
2. Neue versionierte Normalisierungs-Migration eingefuehrt (Target worldSchemaVersion 13.2.0).
3. Automatische Daten-Normalisierung fuer:
    - manoever.modifications (indexed object -> array)
    - manoever.voraussetzungen -> voraussetzung
    - waffeneigenschaft.parameterSlots (indexed object -> array)
    - freie_fertigkeit.stufe/gruppe (string -> number, falls numerisch)
    - freiestalent.pw (numeric string -> number)
    - angriff.wm -> wm_at
    - abgeleiteter-wert.name -> key
    - entfernen von Runtime-Persistenzfeldern (waffe.rw_mod, waffe.computed)
    - kreatur-Kompatibilitaetsfelder (displayWerte, attribute.\*.kampfPw)
4. Migration ist in den Ready-Flow eingehangen und laeuft nur fuer GM sowie nur bei alterer Schema-Version.
5. Gap-Analyse: Alle Felder aus template.json sind in TypeDataModel abgedeckt. 2 Typ-Inkompatibilitaeten gefunden und behoben:
    - freiestalent.pw: string statt number (laut template.json war es `""`)
    - waffeneigenschaft.modifiers.fumbleThreshold/critThreshold: nullable null statt 0
6. Explizite Foundry TypeDataModel-Registrierung umgesetzt:
    - handgeschriebene, strenge DataModel-Klassen je Actor- und Item-Typ (nicht generisch aus Laufzeitmodell abgeleitet)
    - Domain-Trennung umgesetzt:
        - Actor-Modelle liegen unter scripts/actors/model-data/
        - Item-Modelle liegen unter scripts/items/model-data/
        - Core konsolidiert nur noch die Registrierung
    - zentrale Registrierung in CONFIG.Actor.dataModels und CONFIG.Item.dataModels im Init-Flow
    - Unit-Tests fuer Registrierung und Schema-Erzeugung
7. **template.json komplett entfernt** (2026-05-07):
    - `documentTypes` in system.json als alleinige Schemaautoritaet (laut Foundry v13-API offizielle Methode)
    - TypeDataModel defineSchema() ist jetzt alleinige Quelle fuer Felddefintionen
    - Alle Actor/Item-Typen funktionieren korrekt in Foundry UI und E2E-Tests
    - 443/443 Tests gruen, alle E2E-Faelle bestaetigen Funktionalitaet

Kompatibilitaet bleibt aktiv:

1. Legacy-Lesepfade werden weiterhin akzeptiert (z. B. manoever.voraussetzungen).
2. Bestehende Items/Compendium-Eintraege werden beim Lauf automatisch angehoben.

Phasenstatus:

1. Phase 0: abgeschlossen
2. Phase 1: abgeschlossen
3. Phase 2: abgeschlossen (explizite Actor-TypeDataModels registriert, in actors/model-data gekapselt)
4. Phase 3: abgeschlossen (explizite Item-TypeDataModels Kernkampf registriert, in items/model-data gekapselt)
5. Phase 4: abgeschlossen (explizite Item-TypeDataModels Fertigkeiten/Uebernatuerlich/Ausruestung/Meta registriert, Core als Registrierungs-Konsolidierung)
6. Phase 5: abgeschlossen (Template-basierte Altpfade nur noch als Kompatibilitaetsschicht)
7. Phase 6: abgeschlossen (Migration + Test- und Validierungsnachweis)
8. **Phase 7: abgeschlossen (Template.json komplett entfernt, TypeDataModel ist alleinige Schemaautoritaet)**

## Ziel

Ablösung der rein template.json-basierten Datendefinitionen durch explizite ModelData-Schemata (Actor/Item TypeDataModel), inklusive sauberer Datenmigration fuer Welt- und Compendium-Daten.

## Zielbild

1. Jeder Actor- und Item-Typ hat ein eigenes, typsicheres Schema.
2. Semantisch unterschiedliche Felder werden nicht mehr ueber denselben Key abgebildet.
3. Bekannte Typ-Mismatches in \_source sind migriert und validierbar.
4. Migrationen laufen idempotent, versioniert und nur fuer GM.
5. E2E- und Unit-Tests laufen unveraendert gruen.

## Nicht-Ziele

1. Kein gleichzeitiger UI-Redesign.
2. Kein inhaltlicher Regelumbau.
3. Keine direkte Bearbeitung von LevelDB-Dateien.

## Grundlage aus Inventarisierung

Die Umstellung basiert auf:

- 01_actor_templates.md bis 09_item_gruppe_e_meta.md
- 10_inkonsistenz_register.md (J-01 bis J-31)

Prioritaet fuer die erste Migrationswelle: J-30, J-11, J-13, J-01, J-24, J-14, J-15.

## Migrationsstrategie (Phasen)

## Phase 0 - Architektur- und Sicherheitsnetz (1 PR)

1. Zentralen Migrations-Runner definieren (an vorhandenes worldSchemaVersion-Muster anlehnen).
2. Zielversion fuer ModelData einfuehren, z. B. 14.0.0.
3. Test-Harness fuer Datenmigrationen anlegen (Fixture-JSON aus \_source).
4. Dokumentierte Invarianten je Typ festhalten (Pflichtfelder, Typen, Nullbarkeit).

Akzeptanzkriterien:

- Migration kann trocken gegen Testdaten laufen.
- Versionierungslogik verhindert Mehrfachmigration.

## Phase 1 - Kritische Bugs und Typ-Mismatches vorziehen (1-2 PRs)

1. J-30: effect-item Typvergleich korrigieren (effect-item statt effectItem).
2. J-11: manoever.modifications auf konsistente Struktur migrieren.
3. J-13: waffeneigenschaft.parameterSlots auf konsistente Struktur migrieren.
4. J-14/J-15: freie_fertigkeit.stufe/gruppe von string auf number migrieren.

Akzeptanzkriterien:

- Keine Laufzeitfehler in betroffenen Dialogen/Sheets.
- Alte und neue Daten koennen gelesen werden, anschliessend persistiert nur Zielstruktur.

## Phase 2 - Actor-ModelData einfuehren (2-3 PRs)

1. Actor-Typen held/nsc/kreatur als getrennte Schemaklassen modellieren.
2. Semantikkonflikt J-01 explizit aufloesen:
    - held/nsc: attributePW als abgeleitetes Runtime-Konzept.
    - kreatur: persistenter Kampfwert klar benannt (z. B. kampfPw).
3. J-02/J-03 sauber trennen:
    - kreatur.kampfwerte als Primarschema.
    - display-Felder separat und eindeutig benannt.
4. Duplicate template reference J-18 entfernen.
5. Verwaisten Template-Verweis J-25 bereinigen.

Akzeptanzkriterien:

- Alle Actor laden ohne Datenverlust.
- Vorhandene Berechnungen (prepareData) liefern gleiche Spielergebnisse wie vorher.
- Alrik/Goblin-Referenzdaten bestehen Schema-Validierung.

## Phase 3 - Item-ModelData fuer Kernkampf (2-4 PRs)

1. Waffenfamilie: nahkampfwaffe, fernkampfwaffe, angriff, waffeneigenschaft.
2. J-19 bereinigen: Redundanz eigenschaften zwischen Basis und Direktfeld entfernen.
3. J-20 entscheiden und vereinheitlichen (wm vs wm_at).
4. Runtime-Felder aus Persistenzschema pruefen und trennen (J-28/J-29).
5. Duplicate Item type J-17 entfernen.

Akzeptanzkriterien:

- Nah-/Fernkampfdialoge funktionieren in E2E stabil.
- Weapon-Migrationspfad bleibt idempotent.

## Phase 4 - Item-ModelData fuer Fertigkeiten, Uebernatuerlich, Ausruestung, Meta (3-5 PRs)

1. Fertigkeitenblock: fertigkeit, freie_fertigkeit, freiestalent, uebernatuerliche_fertigkeit, talent.
2. Uebernatuerlich: zauber, liturgie, anrufung.
3. Ausruestung: ruestung, gegenstand.
4. Meta: vorteil, manoever, eigenheit, eigenschaft, info, abgeleiteter-wert, effect-item.
5. J-23 und J-31 im Zuge der Namensnormalisierung migrieren.

Akzeptanzkriterien:

- Alle Item-Typen aus system.json Packs sind les-/schreibbar.
- Compendium-\_source kann ohne manuelle Nacharbeit gepackt werden.

## Phase 5 - Template-Ausstieg und Kompatibilitaetsschicht (1-2 PRs)

1. Nur noch erforderliche Restteile in template.json behalten oder kontrolliert entkoppeln.
2. Legacy-Feldaliasse fuer 1 Hauptversion unterstuetzen.
3. Deutliche Deprecation-Hinweise in Changelog/Entwicklerdoku.

Akzeptanzkriterien:

- Neuanlage von Actor/Items nutzt nur Zielschema.
- Legacy-Daten werden beim Oeffnen automatisch angehoben.

## Phase 6 - Datenbereinigung in Compendiums und Abschluss

1. \_source-Daten je Pack gegen Zielschema validieren.
2. Nach Anpassungen stets pack-all ausfuehren.
3. Abschlussbericht mit Restschulden (falls vorhanden).

Akzeptanzkriterien:

- Keine Schema-vs-\_source-Deltas mehr ausser bewusst dokumentierten Ausnahmen.
- J-Register ist aufgeloest oder hat begruendete Restpunkte.

## Umsetzung nach Risiko und Abhaengigkeit

1. Zuerst migrationskritische Inkonsistenzen (J-30, J-11, J-13).
2. Danach Actor-Semantik (J-01, J-02, J-03).
3. Danach kampfrelevante Item-Typen.
4. Zum Schluss Naming- und Cleanup-Themen.

## Technische Leitplanken

1. Migrationen sind:
    - versioniert
    - idempotent
    - fehlertolerant mit Logging
2. Reihenfolge pro Datenquelle:
    - World Items/Actors
    - Actor Embedded Items
    - Compendiums (nur entsperrt)
3. Jede Migration liefert Statistik: migrated/skipped/errors.
4. Bei Fehlern: keine stille Korrektur, sondern Warnung und nachvollziehbares Logging.

## Test- und Validierungsplan je Phase

1. Unit:
    - Schema-Validation pro Typ
    - Migrationsfunktionen mit Alt-/Neu-Fixures
2. E2E (mindestens):
    - e2e-001, e2e-005, e2e-008, e2e-009, e2e-010
3. Integrationschecks:
    - Actor laden, Item bearbeiten, Kampf ausfuehren, Speichern/Reload
4. Datenchecks:
    - Stichproben in beispiel-helden, kreaturen, waffen, vorteile, gegenstande

## Rollout und Fallback

1. Feature-Flags pro Migrationswelle (optional, falls Risiko hoch).
2. Vor Major-Release: Testwelt mit produktionsnahen Daten migrieren.
3. Fallback:
    - Migration stoppt bei kritischem Fehler
    - Schema-Version bleibt unveraendert
    - Nutzerhinweis mit naechstem manuellen Schritt

## Konkrete Deliverables

1. Technisches RFC-Dokument: Zielschemata Actor/Item.
2. Migrationsmodule pro Phase unter scripts/.../migrations.
3. Test-Fixture-Sammlung aus anonymisierten \_source-Beispielen.
4. Changelog-Eintraege fuer jede Welle.
5. Abschluss: aktualisiertes Inkonsistenz-Register mit Status je J-ID.

## Vorschlag fuer erste Umsetzungsiteration (2 Wochen)

1. Woche 1:
    - Phase 0 komplett
    - Phase 1 komplett
2. Woche 2:
    - Actor-Schema fuer kreatur + held/nsc-Prototyp
    - Erste Actor-Migration gegen Alrik/Goblin-Daten

Definition of Done Iteration 1:

- J-30/J-11/J-13/J-14/J-15 sind technisch behoben oder migrationssicher abgefangen.
- Migrationstests laufen gruen.
- Keine Regression in den Kern-E2E-Faellen.

## Phase 7 - Template.json komplett entfernen (Abgeschlossen 2026-05-07)

**Ziel:** Kompletter Ausstieg aus template.json; TypeDataModel ist alleinige Schemaautoritaet.

### Umgesetzt:

1. **Gap-Analyse:** Alle Felder aus template.json wurden mit TypeDataModel defineSchema() abgeglichen:
    - Alle 3 Actor-Typen (held, nsc, kreatur) ✅
    - Alle 21 Item-Typen ✅
    - 2 Inkompatibilitaeten gefunden und behoben:
        - `freiestalent.pw`: template.json hatte `""` (String), TypeDataModel hatte `h.number(0)` → korrigiert zu `h.string('')`
        - `waffeneigenschaft.modifiers.fumbleThreshold/critThreshold`: template.json hatte `null`, TypeDataModel hatte `h.number(0)` → korrigiert zu `h.number(null)` (nullable)

2. **Template.json kürzen:** Alle Felddefintionen entfernt, nur reine Typlisten behalten (minimales Redukt).

3. **documentTypes in system.json ergänzen:**
    - Offizielle Methode laut Foundry VTT v13-API
    - Vollständige Registrierung aller Actor- und Item-Typen
    - `documentTypes` ist jetzt alleinige server-seitige Typregistrierung

4. **Live-Testing in Foundry:**
    - Alle Actor-Typen können erzeugt werden
    - Alle Item-Typen laden korrekt
    - Existierende Charaktere öffnen ohne Datenverlust
    - E2E-Tests bleiben grün (443/443 Tests, 23/23 Suites)

5. **template.json löschen:** Datei komplett aus Git entfernt (git rm -f template.json).

### Akzeptanzkriterien erfüllt:

- ✅ Alle Tests grün nach template.json-Entfernung
- ✅ Foundry startet ohne JSON-Parse-Fehler
- ✅ Alle Actor/Item-Typen funktionieren in Foundry UI
- ✅ E2E-Tests bestätigen Funktionalität
- ✅ TypeDataModel ist jetzt alleinige Quelle für Feldschema

### Architektur nach Phase 7:

```
system.json
  └─ documentTypes (vollständige Typ-Registrierung für Foundry)
     ├─ Actor: held, kreatur, nsc
     └─ Item: 21 types

scripts/actors/model-data/
  ├─ shared.js (createActorTemplateFields mit allen Templates)
  ├─ held.js (HeldActorDataModel, NscActorDataModel)
  ├─ kreatur.js (KreaturActorDataModel)
  └─ index.js (createActorTypeDataModels export)

scripts/items/model-data/
  ├─ shared.js (createItemTemplateFields)
  ├─ models.js (alle 21 Item-TypeDataModels)
  └─ index.js (createItemTypeDataModels export)

scripts/core/model-data/
  ├─ type-data-models.js (registerIlarisTypeDataModels - Konsolidierungspunkt)
  ├─ field-helpers.js (buildTypeDataFieldHelpers)
  └─ index.js (export)

template.json (GELÖSCHT - nicht mehr nötig)
```

### Migration abgeschlossen:

Die Umstellung von template.json-basierten Schemata zu expliziten TypeDataModels ist damit vollständig abgeschlossen. TypeDataModel defineSchema() ist jetzt die alleinge Schemaautoritaet. Die Migration läuft automatisch beim Laden der Welt, und existierende Daten werden transparent angehoben.

### Restziele nach Phase 7:

- Migrations-Dokumentation im Changelog aktualisieren (v13.2.0 release notes)
- Optional: Alte template.json-Doku als Legacy-Referenz archivieren
- Optional: Developer-Guide aktualisieren (z.B. "wie man neue Item-Typen hinzufügt")
