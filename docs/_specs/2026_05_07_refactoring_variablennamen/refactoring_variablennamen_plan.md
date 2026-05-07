# Refactoring Variablennamen/Inkonsistenzen — Implementierungsplan

> **Issue**: [#31 — Refactoring Variablennamen/Inkonsistenzen](https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues/31)
> **Milestone**: v13.1
> **Datum**: 2026-05-07
> **Status**: FINAL

---

## 1. Objective

Behebe alle identifizierten Namens- und Struktur-Inkonsistenzen im Ilaris FoundryVTT-Codebase, um die Wartbarkeit zu verbessern, Verwirrung durch gemischte Konventionen zu beseitigen, und eine saubere Basis für künftige Entwicklungen zu schaffen.

---

## 2. Assumptions

- Die Sprachkonvention „Englische Verben + deutsche Substantive" (z.B. `addFertigkeit`) wird **beibehalten** — dies ist eine etablierte Projektkonvention, kein Bug.
- Änderungen an Typ-Strings (z.B. `freiestalent` → `freies_talent`) sind **Breaking Changes** und erfordern eine Datenmigration. Diese werden deshalb separat als letztes angegangen.
- Die Umbenennung `system.typ`/`system.gruppe` → `system.category` ist **zu großer Umbau** für dieses Issue — wird als separates GitHub-Issue erfasst (siehe Abschnitt 7).
- Die Schritte PR-A bis PR-E (risikoarm/mittel) können unabhängig voneinander in kleinen PRs umgesetzt werden.
- `scripts/common/utilities.js` ist orphaned (bestätigt: nur `scripts/core/` wird importiert).

---

## 3. PR-Schnitt (7 kleine PRs)

| PR   | Titel                                                                                                                                        | Risiko          | Depends on |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| PR-0 | `test: E2E-Tests für Notizen-Tab und Freie Fertigkeiten als Refactoring-Baseline`                                                            | niedrig         | —          |
| PR-A | `fix: Tab-IDs notes/effects → notizen/effekte im HeldenSheet`                                                                                | niedrig         | PR-0       |
| PR-B | `chore: Orphaned Dateien scripts/common/ entfernen`                                                                                          | niedrig         | —          |
| PR-C | `fix: Fehlende CSS-Dateien in system.json registrieren`                                                                                      | niedrig         | —          |
| PR-D | `chore: Duplizierten Migrations-Code in actor.js entfernen`                                                                                  | niedrig         | —          |
| PR-E | `refactor: Dateinamen snake_case → kebab-case`                                                                                               | mittel          | —          |
| PR-F | `refactor!: Typ-Strings auf camelCase (freiesTalent, freieFertigkeit, uebernatuerlicheFertigkeit, effectItem, abgeleiteterWert) + Migration` | hoch (Breaking) | PR-E       |

PR-0 liefert die Test-Baseline; PR-A wartet auf PR-0. PRs B–E sind unabhängig. PR-F nach PR-E.

---

## 4. Steps

### PR-0 — E2E-Test-Baseline für das Refactoring

**Was**: Neue E2E-Tests schreiben, die die vom Refactoring betroffenen UI-Bereiche **vor** den Änderungen absichern. Die Tests müssen nach dem jeweiligen PR weiter grün sein (Tab-IDs und Typ-Strings werden in den Tests per Discovery ermittelt, nicht hardcoded).

**Neue Tests**:

1. **`e2e-018-notizen-tab`** — Sichert PR-A ab:
    - Notizen-Tab im HeldenSheet öffnen (`data-tab="notizen"` nach PR-A, vorher `data-tab="notes"`)
    - Text ins Notizen-Feld schreiben, Tab verlassen, zurückkehren → Persistenz prüfen
    - Tab-ID wird nach PR-A aktualisiert

2. **`e2e-019-freie-fertigkeit-dialog`** — Sichert PR-F (`freieFertigkeit`) ab:
    - `freieFertigkeit`-Item aus `HatAlles` per Laufzeit-Discovery ermitteln
    - Fertigkeiten-Tab öffnen, Würfel-Icon der freien Fertigkeit klicken
    - Würfeldialog öffnet sich → schließen

**Hinweis zu bestehenden Tests**: E2E-014 und E2E-015 enthalten hardcodierte alte Typ-Strings/Tab-IDs und müssen in denselben PRs wie PR-A bzw. PR-F aktualisiert werden (nicht in PR-0).

**Wer**: E2E-Testfall-Specialist

**Depends on**: none

**Validation**: `npx playwright test e2e-018 e2e-019` — beide Tests grün gegen aktuellen Stand.

---

### PR-A — Tab-IDs im HeldenSheet korrigieren

**Was**: Benenne `notes` → `notizen` und `effects` → `effekte` als Tab-IDs im HeldenSheet um.

**Wo**:

- `scripts/actors/sheets/held.js` — PARTS-Definition, TABS-Definition, switch-case in `_prepareContext`
- Alle `.hbs`-Templates die `data-tab="notes"` oder `data-tab="effects"` referenzieren (z.B. `scripts/actors/templates/held/held.hbs`)

**Wer**: Code-Specialist

**Hinweis**: Ein PR (#436) für den `notes`-Teil wurde bereits erstellt und wieder geschlossen. Die Änderung selbst ist unkompliziert.

**Validation**: `npm test`; manuell: Notizen-Tab und Effekte-Tab im HeldenSheet öffnen.

---

### PR-B — Orphaned Dateien aufräumen

**Was**: Entferne nicht mehr benötigte Duplikat-Dateien aus `scripts/common/`.

**Wo**:

- `scripts/common/handlebars.js` — Duplikat von `scripts/core/handlebars.js`, nicht importiert
- `scripts/common/utilities.js` — orphaned, bestätigt nicht importiert
- `scripts/common/` — prüfen ob das Verzeichnis danach leer ist und ebenfalls entfernt werden kann

**Wer**: Code-Specialist

**Validation**: `npm test`; Volltextsuche nach `common/handlebars` und `common/utilities` liefert 0 Treffer.

---

### PR-C — CSS-Registrierung vervollständigen (potenzieller Bug)

**Was**: Registriere fehlende CSS-Dateien in `system.json`.

**Wo**:

- `system.json` → `styles`-Array: Einträge hinzufügen für:
    - `scripts/actors/styles/actors.css` — enthält `herosidebar`, Layout-Styles
    - `scripts/actors/styles/sidebar.css` — enthält TriState-Buttons, Lebensleiste

**Wer**: Code-Specialist

**Validation**: Browser: HeldenSheet laden, TriState-Buttons und Sidebar korrekt sichtbar.

---

### PR-D — Duplizierten Migrations-Code entfernen

**Was**: Entferne den doppelten Migration-Block für `dice_anzahl`/`dice_plus` in `scripts/actors/data/actor.js`.

**Wo**:

- `scripts/actors/data/actor.js` — Zeilen ~L577–584 (identisch mit ~L596–603): einen der beiden Blöcke entfernen

**Wer**: Code-Specialist

**Hinweis**: Der Migrations-Code selbst ist bereits abgeschlossen; es handelt sich nur um duplizierten Legacy-Cleanup-Code.

**Validation**: `npm test` — alle bestehenden Tests passen.

---

### PR-E — Dateinamen vereinheitlichen: snake_case → kebab-case

**Was**: Benenne alle Dateien mit snake_case-Namen auf kebab-case um, konsistent mit den bereits existierenden kebab-case Dateien.

**Wo**:

_`scripts/items/sheets/`_:

- `freies_talent.js` → `freies-talent.js`
- `freie_fertigkeit.js` → `freie-fertigkeit.js`
- `uebernatuerlich_fertigkeit.js` → `uebernatuerlich-fertigkeit.js`
- `uebernatuerlich_talent.js` → `uebernatuerlich-talent.js`

_`scripts/combat/dialogs/`_:

- `combat_dialog.js` → `combat-dialog.js`
- `defense_button_hook.js` → `defense-button-hook.js`
- `fernkampf_angriff.js` → `fernkampf-angriff.js`
- `shared_dialog_helpers.js` → `shared-dialog-helpers.js`
- `target_selection.js` → `target-selection.js`

**Wer**: Code-Specialist

**Wichtig**: Alle `import`-Statements in anderen Dateien müssen nach der Umbenennung aktualisiert werden. Vollständige Suche nach dem alten Dateinamen (ohne `.js`) im `scripts/`-Ordner ist Pflicht vor dem Commit.

**Validation**: `npm run lint && npm test`; alle `import`-Pfade auflösbar.

---

### PR-F — Typ-Strings auf camelCase normalisieren (Breaking Change)

**Was**: Normalisiere die 5 Typ-Strings mit Separator (snake_case/kebab-case) auf camelCase.

| Alt                           | Neu                          | Kompendium-Einträge       |
| ----------------------------- | ---------------------------- | ------------------------- |
| `freiestalent`                | `freiesTalent`               | 1054                      |
| `uebernatuerliche_fertigkeit` | `uebernatuerlicheFertigkeit` | 222                       |
| `freie_fertigkeit`            | `freieFertigkeit`            | 93                        |
| `effect-item`                 | `effectItem`                 | 0                         |
| `abgeleiteter-wert`           | `abgeleiteterWert`           | 0                         |
| **Gesamt**                    |                              | **~1369 JSON-Änderungen** |

> **Nicht in diesem PR**: `nahkampfwaffe`, `fernkampfwaffe`, `waffeneigenschaft` — sind intern konsistent und haben keine Separatoren; werden ggf. in separatem Issue behandelt.

**Wo (Code)**:

- `scripts/core/config.js` — alle 5 Typ-Strings + Config-Keys (`ILARIS.freie_fertigkeiten` → `ILARIS.freieFertigkeiten`, `uebernatfreiestalent` → `uebernatFreiesTalent`)
- `scripts/core/init.js` — Sheet-Registrierungen für alle 5 Typen
- `scripts/items/model-data/models.js` — DataModel-Mapping-Keys
- `scripts/items/data/proxy.js` — `case 'effect-item'` → `case 'effectItem'`
- `scripts/items/sheets/freies-talent.js`, `freie-fertigkeit.js`, `uebernatuerlich-fertigkeit.js`, `effect-item.js`, `abgeleiteter-wert.js` (Dateinamen nach PR-E) — interne Typ-Referenzen
- `scripts/actors/data/actor.js` — alle `item.type ==` Vergleiche für die 5 Typen
- `scripts/actors/sheets/actor.js`, `kreatur.js` — rolltype-Vergleiche
- `scripts/dice/wuerfel.js` — `probeType === 'freie_fertigkeit'`
- `scripts/skills/dialogs/fertigkeit.js` — switch-case
- `scripts/core/migrations/` — neue Datenmigration (s.u.)

**Wo (Kompendium)**: Alle `comp_packs/_source/`-Ordner — Volltextsuche auf alle 5 alten Typ-Strings, ca. 1369 JSON-Felder ändern.

**Wer**: Code-Specialist + Compendium-Specialist

**Depends on**: PR-E

**Pflicht — Automatische Datenmigration**: Die bestehende Migrations-Infrastruktur (`migrateWorldItems`, `migrateActorEmbeddedItems`, `migrateCompendiumItems`, `migrateCompendiumActors`) wird um eine neue Migrations-Funktion erweitert, die alle 5 Typ-Strings in einer Schleife umschreibt — sowohl standalone World-Items als auch embedded Items in Actors (Helden, Kreaturen) und Kompendien. **Ohne diese Migration brechen alle bestehenden Worlds.**

**Validation**: `npm run pack-all`; manuell: Test-World mit Items aller 5 Typen laden, Migration erfolgreich durchlaufen, Items korrekt angezeigt.

---

## 5. Validation Plan (Gesamt)

Nach allen PRs: `npm run lint && npm test && npm run pack-all` — sauber durchlaufen.

| PR   | Kernvalidierung                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------- |
| PR-A | `npm test`; manuell Tabs prüfen                                                                    |
| PR-B | `npm test`; Volltextsuche auf `common/handlebars` = 0 Treffer                                      |
| PR-C | Browser: Sidebar und TriState-Buttons sichtbar                                                     |
| PR-D | `npm test`                                                                                         |
| PR-E | `npm run lint && npm test`                                                                         |
| PR-F | `npm run pack-all`; manuell: Test-World mit Items aller 5 migrierten Typen laden, Migration prüfen |

---

## 6. Delegation Map

| PR   | Specialist        | Input                                                         | Expected Output                                |
| ---- | ----------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| PR-A | Code              | `scripts/actors/sheets/held.js`, Templates                    | Tab-IDs auf Deutsch                            |
| PR-B | Code              | `scripts/common/`                                             | Orphaned Files gelöscht                        |
| PR-C | Code              | `system.json`, `scripts/actors/styles/`                       | CSS vollständig registriert                    |
| PR-D | Code              | `scripts/actors/data/actor.js`                                | Duplikation entfernt                           |
| PR-E | Code              | `scripts/items/sheets/`, `scripts/combat/dialogs/`            | Kebab-case Dateinamen + Import-Updates         |
| PR-F | Code + Compendium | Config, Init, Actor-Data, Dice, Skills, `comp_packs/_source/` | Typ-Strings camelCase + automatische Migration |

---

## 7. Out of Scope — Neues GitHub-Issue erforderlich

**Titel des neuen Issues**: „Einheitliche Feld-Bezeichnung für Sub-Kategorien (`system.typ`/`system.gruppe` → `system.category`)"

Dieser Punkt wurde aus dem aktuellen Issue herausgenommen, da er einen größeren, eigenständigen Umbau erfordert:

- `system.gruppe` wird an 20+ Stellen für verschiedene Zwecke verwendet (Vorteils-Gruppe, Manöver-Gruppe, Fertigkeit-Gruppe)
- Semantische Analyse aller Verwendungen notwendig, bevor eine Umbenennung sicher ist
- Potenziell weiterer Breaking Change mit Datenmigration
- Ggf. Abstimmung mit lukruh wegen ilaris-online.de und Sephrasto-Exporter

**Aktion**: Neues GitHub-Issue anlegen und auf Issue #31 verweisen.
