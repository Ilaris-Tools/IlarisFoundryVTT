# Inventarisierung & Modellierung — Datenfelder, Typen, Namenskonventionen

> **Status**: FINAL

---

## Objective

Alle Datenfelder, Typen und Namenskonventionen des Ilaris-Systems vollständig inventarisieren und als strukturiertes Mapping dokumentieren — getrennt je Actor-Typ und Item-Gruppe, mit Compendium-Delta und Code-Querverweisen.

---

## Assumptions

- Reine Dokumentation — kein Code wird geändert.
- „Alt/neues Modell" = `template.json`-Schema ↔ `system.X` im Code ↔ tatsächliche `_source/`-Daten (Drei-Spalten-Mapping).
- `abgeleiteter-wert` bleibt in Item-Gruppe E, bekommt aber einen eigenen Unterabschnitt „Verbindung zu Actor-abgeleitete".
- **Compendium-Abdeckung**: Delta zwischen `template.json`-Schema und tatsächlichen `_source/`-JSON-Keys wird geprüft; fehlende Felder in gespeicherten Einträgen werden dokumentiert und als Ergänzungsbedarf markiert.
- **Code-Belege**: Vollständig — alle `system.X`-Zugriffe in Sheet-/Hook-Code werden als Querverweise aufgeführt.
- `nsc` teilt das gleiche Template wie `held` — Unterschiede werden explizit geprüft und dokumentiert.
- `waffeneigenschaft` ist zweimal in `Item.types` eingetragen — Duplikat wird dokumentiert, nicht bereinigt.

---

## Bekannte Strukturunterschiede: Held vs. Kreatur

Recherchiert anhand von `comp_packs/beispiel-helden/_source/Alrik_der_Bauer_*.json` und `comp_packs/kreaturen/_source/Goblin_*.json`:

| Feld                              | Held (Alrik)                                                                                                           | Kreatur (Goblin)                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `system.attribute.[X].wert`       | Ausgefüllt (z. B. KK=5, KO=6)                                                                                          | Immer `0` — nicht für Berechnungen genutzt                                                |
| `system.attribute.[X].pw`         | `0`                                                                                                                    | Ausgefüllt (z. B. FF=10, GE=8) — effektiver Kampfwert                                     |
| `system.abgeleitete`              | Vollständig (ws, ini, mr, gs, dh, traglast, asp, kap, …) — alle `0` im JSON, runtime-berechnet via `prepareBaseData()` | Nur 3 Felder: `globalermod`, `nahkampfmoddisplay`, `globalermoddisplay`                   |
| `system.kampfwerte`               | **Nicht vorhanden**                                                                                                    | Direktwerte: `ws=4`, `ini=3`, `gs=5`, `mr=4`, `koloss`, `gs_schwimmend` — direkt authored |
| `system.energien`                 | **Nicht vorhanden** (asp/kap über `abgeleitete`)                                                                       | Vorhanden: `asp`, `gup`, `kap` je mit `max`/`value`                                       |
| `system.geld`                     | Vorhanden                                                                                                              | **Nicht vorhanden**                                                                       |
| `system.getragen`                 | Vorhanden                                                                                                              | **Nicht vorhanden**                                                                       |
| `system.notes`                    | Vorhanden                                                                                                              | **Nicht vorhanden**                                                                       |
| `system.kreaturentyp`             | **Nicht vorhanden**                                                                                                    | Vorhanden (z. B. `"humanoid"`)                                                            |
| `system.kurzbeschreibung`         | **Nicht vorhanden**                                                                                                    | Vorhanden                                                                                 |
| `system.talente` / `freietalente` | Als eingebettete Items auf dem Actor                                                                                   | Als JSON-Arrays direkt auf `system`                                                       |
| `system.modifikatoren`            | `manuellermod`, `nahkampfmod`                                                                                          | `manuellermod`, `nahkampfmod`                                                             |

**Kritischer Sonderfall**: `attribute.pw` hat für Held und Kreatur entgegengesetzte semantische Rollen. Bei Kreaturen enthält `pw` die effektiven Kampfwerte; bei Helden steht dort immer `0`.

---

## Steps

### Schritt 1 — Actor-Templates expandieren

**Was**: Alle Actor-Templates (`gesundheit`, `attribute`, `abgeleitete`, `schips`, `initiative`, `furcht`, `modifikatoren`, `misc`, `geld`, `energien`) als flache Feldtabellen aufbereiten. Jedes Feld: Name | Typ | Default (template.json) | Vorkommen in `_source/` (Delta: fehlt/abweicht?) | Runtime-Zugriff in `actor.js`. Fehlende Felder in `_source/` werden als Ergänzungsbedarf markiert.

**Wo**: `template.json` § Actor.templates, `scripts/actors/data/actor.js`, `comp_packs/beispiel-helden/_source/Alrik_der_Bauer_*.json`

**Wer**: Researcher

**Depends on**: none

---

### Schritt 2 — Actor-Typ `held` / `nsc` dokumentieren

**Was**: Template-Komposition auflösen. Felder die `held` und `nsc` direkt hinzufügen (`getragen`, `notes`). Semantische Rolle von `attribute.pw` (immer 0 bei Helden) und `abgeleitete.*` (immer 0 im JSON, runtime-befüllt via `prepareBaseData()`). Vollständiges Delta zwischen Template und `_source/Alrik`; fehlende Felder als Ergänzungsbedarf markieren. Alle `system.X`-Zugriffe in `held.js`, `scripts/actors/sheets/held.js` und zugehörigen Hooks als Querverweise aufführen.

**Wo**: `template.json`, `scripts/actors/data/actor.js`, `scripts/actors/data/held.js`, `comp_packs/beispiel-helden/_source/`

**Wer**: Researcher

**Depends on**: 1

---

### Schritt 3 — Actor-Typ `kreatur` dokumentieren

**Was**: Strukturabweichungen zu `held` (s. o. Tabelle). Sonderrolle von `system.kampfwerte` (direkt authored) vs. `system.abgeleitete` (nur Display-Helfer). Semantik von `attribute.pw` für Kreaturen. `system.talente`/`freietalente` als JSON-Arrays statt eingebetteter Items. Vollständiges Compendium-Delta anhand Goblin-Beispiel; fehlende Felder als Ergänzungsbedarf markieren. Alle `system.X`-Zugriffe in `kreatur.js` und `scripts/actors/sheets/kreatur.js` als Querverweise.

**Wo**: `template.json`, `scripts/actors/data/kreatur.js`, `comp_packs/kreaturen/_source/Goblin_*.json`

**Wer**: Researcher

**Depends on**: 1

---

### Schritt 4 — Item-Gruppe A: Waffen

**Was**: `nahkampfwaffe`, `fernkampfwaffe`, `angriff`, `waffeneigenschaft`. Template `waffe` expandieren (tp, fertigkeit, talent, rw, computed.\*). `waffeneigenschaft` mit vollständigem Schema: `modifiers`, `wieldingRequirements`, `targetEffect`, `actorModifiers`, `parameterSlots`. Duplikat `waffeneigenschaft` in `Item.types` dokumentieren. Compendium-Delta anhand je eines Beispiels aus `comp_packs/waffen/_source/` und `comp_packs/waffeneigenschaften/_source/`. Alle `system.X`-Zugriffe in `scripts/waffe/` und `scripts/items/data/angriff.js` als Querverweise.

**Wo**: `template.json`, `scripts/waffe/data/`, `scripts/items/data/angriff.js`, `comp_packs/waffen/_source/`

**Wer**: Researcher

**Depends on**: none (parallel zu 2, 3, 5–8)

---

### Schritt 5 — Item-Gruppe B: Fertigkeiten

**Was**: `fertigkeit`, `uebernatuerliche_fertigkeit`, `freie_fertigkeit`, `talent`, `freiestalent`. Template `fertigkeit` expandieren (basis, fw, pw, attribut_0/1/2, gruppe). Unterschied `fertigkeit.pwt` vs. `uebernatuerliche_fertigkeit` (kein pwt). Semantische Abgrenzung `freiestalent` vs. `freie_fertigkeit`. Compendium-Delta anhand Beispielen aus `comp_packs/fertigkeiten-und-talente/_source/`. Alle `system.X`-Zugriffe in `scripts/items/data/item.js` und `scripts/items/sheets/fertigkeit.js` als Querverweise.

**Wo**: `template.json`, `scripts/items/data/item.js`, `comp_packs/fertigkeiten-und-talente/_source/`

**Wer**: Researcher

**Depends on**: none

---

### Schritt 6 — Item-Gruppe C: Übernatürliches

**Was**: `zauber`, `liturgie`, `anrufung` — alle über Template `uebernatuerlich_talent`. Felder: fertigkeiten, maechtig, schwierigkeit, modifikationen, vorbereitung, ziel, reichweite, wirkungsdauer, kosten, erlernen, pw, gruppe. Compendium-Delta anhand Beispielen aus `comp_packs/zauberspruche-und-rituale/_source/` und `comp_packs/liturgien-und-mirakel/_source/`. Alle `system.X`-Zugriffe in `scripts/skills/` und `scripts/items/sheets/` als Querverweise.

**Wo**: `template.json`, `scripts/skills/`, `comp_packs/zauberspruche-und-rituale/_source/`

**Wer**: Researcher

**Depends on**: none

---

### Schritt 7 — Item-Gruppe D: Ausrüstung

**Was**: `ruestung`, `gegenstand`. Template `gesundheit` (haerte, beschaedigung) und Template `gegenstand` (aufbewahrungs*ort, bewahrt_auf, gewicht_summe, gewicht, preis, quantity). Rüstung: rs, be, rs*[körperteil], aktiv, text. Compendium-Delta anhand Beispielen aus `comp_packs/gegenstande/_source/`. Alle `system.X`-Zugriffe in `scripts/items/sheets/` als Querverweise.

**Wo**: `template.json`, `comp_packs/gegenstande/_source/`

**Wer**: Researcher

**Depends on**: none

---

### Schritt 8 — Item-Gruppe E: Meta-Items

**Was**: `vorteil`, `manoever`, `eigenheit`, `eigenschaft`, `info`, `abgeleiteter-wert`, `effect-item`. Für `manoever`: `input.field`, `modifications[]`, `gruppe`, `probe`, `gegenprobe`. Für `abgeleiteter-wert`: formel/script/finalscript und Verbindung zu Actor-`abgeleitete` (eigener Unterabschnitt). Für `vorteil`: `sephrastoScript`, `foundryScript`, `stilBedingungen`. Compendium-Delta anhand Beispielen aus `comp_packs/vorteile/_source/` und `comp_packs/manover/_source/`. Alle `system.X`-Zugriffe in `scripts/items/data/manoever.js`, `effect-item.js` und `scripts/effects/` als Querverweise.

**Wo**: `template.json`, `scripts/items/data/manoever.js`, `scripts/items/data/effect-item.js`, `comp_packs/vorteile/_source/`

**Wer**: Researcher

**Depends on**: none

---

### Schritt 9 — Shared Templates Referenztabelle

**Was**: Alle 8 wiederverwendeten Templates tabellarisch: welche Actor/Item-Typen nutzen sie, vollständige Feldliste mit Typ und Default.

Actor-Templates: `gesundheit`, `energien`, `furcht`, `modifikatoren`, `misc`, `initiative`, `abgeleitete`, `schips`, `attribute`, `geld`

Item-Templates: `gesundheit` (Item-Variante), `gegenstand`, `waffe`, `fertigkeit`, `uebernatuerlich_talent`, `schadenstypen`, `munition`

**Wo**: `template.json` § Item.templates + Actor.templates

**Wer**: Researcher

**Depends on**: none

---

### Schritt 10 — Namenskonventions-Mapping & Inkonsistenz-Register

**Was**: Querschnittsdokument mit:

- (a) Semantik-Konflikte: `attribute.pw` Held vs. Kreatur
- (b) Schema-vs-`_source`-Deltas: z. B. `verteidigungmod` fehlt in Alriks JSON
- (c) `template.json`-Duplikat: `waffeneigenschaft` zweimal in `Item.types`
- (d) Namensabweichungen: `freiestalent` vs. `freie_fertigkeit`, `abgeleiteter-wert` (Bindestrich) vs. Rest
- (e) Template-Namenskollision: `gesundheit` existiert als Actor-Template und als Item-Template mit unterschiedlichen Feldern

**Wo**: Querverweis auf alle Schritte 1–9

**Wer**: Docs-Spezialist

**Depends on**: 1–9

---

### Schritt 11 — Ausgabe-Dokumente schreiben

**Was**: Markdown-Dateien je Actor-Typ und Item-Gruppe + ein Übersichtsdokument mit Querverweisen. Format je Dokument: Feldtabelle (Name | Typ | Default | Template-Herkunft | `system.X`-Pfad | Code-Querverweise | Compendium-Delta / Ergänzungsbedarf).

**Wo**: `docs/_specs/2026_05_03_inventarisierung_datenmodell/` (Unterordner je Gruppe)

**Wer**: Docs-Spezialist

**Depends on**: 10

---

## Validation Plan

| Check                                                                                       | Erwartetes Ergebnis                                                     |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Alle 21 `Item.types` aus `template.json` abgedeckt (inkl. Duplikat dokumentiert)            | ✓                                                                       |
| Alle 3 Actor-Typen mit vollständig expandierten Templates                                   | ✓                                                                       |
| Jedes `system.X` gegen tatsächliche Code-Fundstelle in Sheet-/Hook-Code belegt              | ✓                                                                       |
| Compendium-Delta für je ein Beispiel pro Typ, fehlende Felder als Ergänzungsbedarf markiert | ✓ (Alrik für held, Goblin für kreatur, je ein Beispiel pro Item-Gruppe) |
| `npm test` unverändert grün                                                                 | Keine Code-Änderungen → keine Regression möglich                        |

---

## Delegation Map

| Schritt | Spezialist            | Input                                                             | Expected Output                                   |
| ------- | --------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| 1       | Researcher            | `template.json` § Actor.templates, `actor.js`                     | Expandierte Template-Feldtabellen                 |
| 2       | Researcher            | Schritt 1 + `held.js` + Alrik-JSON                                | Held/NSC-Feldtabelle + Schema-Delta               |
| 3       | Researcher            | Schritt 1 + `kreatur.js` + Goblin-JSON                            | Kreatur-Feldtabelle + Schema-Delta                |
| 4       | Researcher (parallel) | `template.json` + `comp_packs/waffen/_source/`                    | Item-Gruppe A: Waffen                             |
| 5       | Researcher (parallel) | `template.json` + `comp_packs/fertigkeiten-und-talente/_source/`  | Item-Gruppe B: Fertigkeiten                       |
| 6       | Researcher (parallel) | `template.json` + `comp_packs/zauberspruche-und-rituale/_source/` | Item-Gruppe C: Übernatürliches                    |
| 7       | Researcher (parallel) | `template.json` + `comp_packs/gegenstande/_source/`               | Item-Gruppe D: Ausrüstung                         |
| 8       | Researcher (parallel) | `template.json` + `comp_packs/vorteile/_source/`                  | Item-Gruppe E: Meta-Items                         |
| 9       | Researcher (parallel) | `template.json`                                                   | Shared-Template-Referenztabelle                   |
| 10      | Docs-Spezialist       | Alle Schritte 1–9                                                 | Inkonsistenz-Register + Namenskonventions-Mapping |
| 11      | Docs-Spezialist       | Alle Schritte 1–10                                                | Markdown-Dokumente in `docs/_specs/`              |
