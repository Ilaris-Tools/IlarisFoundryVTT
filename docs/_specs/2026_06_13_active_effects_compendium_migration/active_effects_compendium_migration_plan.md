# DRAFT: Active Effects Compendium Migration Plan

## 1. Objective

Effekt-Container als eigene Item-Typen (effectItem/effect-item) aus Ilaris entfernen und stattdessen native Foundry V14 ActiveEffect-Kompendien einführen, inklusive kompatibler Migrations- und Teststrategie.

## 2. Assumptions

- Foundry V14 bleibt Zielplattform (minimum 14 / verified 14.360).
- Die Entfernung von effectItem/effect-item erfolgt als Big-Bang ohne Deprecation-Phase.
- In diesem Vorhaben wird kein neues systemeigenes ActiveEffect-Pack angelegt.
- ActiveEffects sollen aus bestehenden Foundry-Kompendien (World/Module/System) nutzbar sein, auch ohne mitgeliefertes Ilaris-Pack.
- Bestehende transfer-Effekte in Vorteil-Items bleiben funktional erhalten und werden nicht im selben Schritt entfernt.
- Es existieren keine effectItem/effect-item Dokumente in comp_packs/\*/\_source, daher ist keine große \_source-Datenmigration für diese Typen nötig.
- Die DnD-/Apply-Pfade werden Ilaris-spezifisch angepasst, nicht nur auf Core-Default belassen.

## 3. Steps

1. What: Big-Bang-Scope fixieren und betroffene Legacy-Flows als Breaking Change markieren.
   Where: docs/\_specs/2026_06_13_active_effects_compendium_migration/active_effects_compendium_migration_plan.md
   Who: docs
   Depends on: none

2. What: Legacy-Itemtypen effectItem/effect-item in einem Schritt aus Manifest und Registrierung entfernen.
   Where: system.json
   Who: code
   Depends on: 1

3. What: Ilaris-spezifische DnD- und Apply-Logik für ActiveEffect-Dokumente implementieren (Compendium -> Actor/Token) inklusive Fallbacks und Guardrails.
   Where: scripts/actors/sheets/actor.js, scripts/core/hooks.js, ggf. zusätzliche Handler unter scripts/core/ und scripts/effects/
   Who: code
   Depends on: 2

4. What: Legacy-Effekt-Item-Implementierung vollständig abbauen (Model, Proxy, Data-Klasse, Sheet, Template).
   Where: scripts/core/init.js, scripts/items/model-data/models.js, scripts/items/data/proxy.js, scripts/items/data/effect-item.js, scripts/items/sheets/effect-item.js, scripts/items/templates/effect-item.hbs
   Who: code
   Depends on: 2, 3

5. What: Migrations- und Importpfade auf Big-Bang-Verhalten anpassen, damit alte Welten/XML-Daten robust normalisiert werden.
   Where: scripts/core/migrations/migrate-modeldata-normalization.js, scripts/importer/xml_character_importer.js, ggf. scripts/importer/xml_rule_importer/utils/compendium-updater.js
   Who: code
   Depends on: 4

6. What: Tests und E2E-Fälle auf ActiveEffect-First-Realität und Ilaris-spezifische DnD-Logik umstellen.
   Where: scripts/core/\_spec/migrate-modeldata-normalization.spec.js, e2e/cases/e2e-016-xml-import/e2e-016-xml-import.spec.ts, e2e/cases/e2e-015-effekte-tab/e2e-015-effekte-tab.spec.ts
   Who: code
   Depends on: 3, 5

7. What: Release-Kommunikation für Breaking Change erstellen (kein effectItem/effect-item mehr, neue Nutzung über ActiveEffects) und QA abschließen.
   Where: CHANGELOG.md, ggf. docs/develop/release.md
   Who: setup
   Depends on: 6

## 4. Validation Plan

- Für Step 2-5: npm test
  Expected outcome: Keine Regressionen in Actor-/Effekt-/Importer-Logik.
- Für Step 2-6: npm run lint
  Expected outcome: Keine neuen Lint-/Formatfehler in angepassten Dateien.
- Für Step 6: gezielte E2E-Ausführung für Effekte/XML-Import
  Expected outcome: Effekte lassen sich direkt als ActiveEffect anwenden; keine Abhängigkeit mehr von effectItem/effect-item.
- Manuelle Prüfung in Foundry V14:
  Expected outcome: ActiveEffect aus Kompendium ist drag-and-drop-fähig auf Token/Actor mit Ilaris-spezifischer Behandlung; Effekt erscheint korrekt am Actor und läuft mit Dauer-/Icon-Darstellung wie erwartet.
- Gesamtvalidierung:
  Expected outcome: system.json enthält keine effectItem/effect-item Item-Typen mehr, und vorhandene Weltdaten mit Legacy-Referenzen werden robust behandelt (Migration/Importer).

## 5. Delegation Map

| Step | Specialist | Input                                                                                   | Expected Output                                           |
| ---- | ---------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1    | docs       | Research-Befunde + Produktentscheidungen (Big-Bang, kein neues Pack, Ilaris-spezifisch) | Finaler Scope und Breaking-Change-Rahmen                  |
| 2    | code       | Manifest mit Legacy-Itemtypen                                                           | Entfernte effectItem/effect-item Dokumenttyp-Definition   |
| 3    | code       | Foundry v14 DnD-Hooks + bestehende Actor-Flow-Implementierung                           | Ilaris-spezifische ActiveEffect-DnD/Apply-Implementierung |
| 4    | code       | Liste aller Legacy-Verkabelungen                                                        | Entfernte effectItem/effect-item Runtime-/UI-Komponenten  |
| 5    | code       | Legacy-Weltdaten und XML-Importerpfade                                                  | Kompatible Normalisierung/Import ohne Weltbruch           |
| 6    | code       | Bestehende Unit-/E2E-Tests mit Legacy-Annahmen                                          | Aktualisierte Tests für ActiveEffect-First                |
| 7    | setup      | Implementierte Änderungen + QA-Ergebnisse                                               | Abnahmefähige Release-Notizen und abgeschlossene QA       |
