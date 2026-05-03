# Inkonsistenz-Register & Namenskonventions-Mapping

Alle dokumentierten Inkonsistenzen aus dem Ilaris FoundryVTT Datenmodell-Inventar (Schritt 10).

---

## 1. Semantik-Konflikte

Felder mit gleichem Namen aber unterschiedlicher Bedeutung je nach Actor/Item-Typ.

| Nr.      | Feld                       | Typ A                                                                                      | Typ B                                                              | Konflikt                                                                       | Empfehlung                                                |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **J-01** | `attribute.pw`             | `held`/`nsc`: Runtime-berechnet (`2 * wert`), immer 0 im JSON, keine persistente Bedeutung | `kreatur`: Persistenter absoluter Kampf-PW-Wert (z.B. `FF.pw=10`)  | Gleicher Feldname, entgegengesetzte Semantik — gefährlich bei generischem Code | Dokumentieren; bei Refactoring explizit trennen           |
| **J-02** | `abgeleitete`              | `held`/`nsc`: 17 Felder, vollständiges Berechnungssystem                                   | `kreatur`: Nur 3 Display-Felder; alle echten Werte in `kampfwerte` | Gleiches Key-Objekt, völlig unterschiedliche Schemen                           | Kreatur `abgeleitete` → umbenennen zu `displayWerte` o.ä. |
| **J-03** | `initiative` (system-Feld) | `held`/`nsc`: Float (`ini + 0.5` für Tie-Breaking)                                         | `kreatur`: Integer aus `kampfwerte.ini`                            | Typunterschied                                                                 | Dokumentieren                                             |

---

## 2. Schema-vs-\_source-Deltas

Felder die im `template.json` vorhanden sind aber in `_source/`-JSONs fehlen (oder umgekehrt).

| Nr.      | Feld                                                    | template.json      | \_source JSON         | Betroffene                   | Schwere                                                 |
| -------- | ------------------------------------------------------- | ------------------ | --------------------- | ---------------------------- | ------------------------------------------------------- |
| **J-04** | `modifikatoren.verteidigungmod`                         | Default 0          | ❌ fehlt              | Alrik, Goblin                | Gering — Foundry füllt mit Default                      |
| **J-05** | `abgeleitete.baseIni`                                   | Default 0          | ❌ fehlt              | Alrik (`held`)               | Gering                                                  |
| **J-06** | `kampfwerte.baseIni`                                    | Default 0          | ❌ fehlt              | Goblin (`kreatur`)           | Gering                                                  |
| **J-07** | `kampfwerte.gs_schwimmend`                              | ❌ nicht definiert | 🆕 null               | Goblin (`kreatur`)           | Mittel — unbekanntes Schema-Feld                        |
| **J-08** | `abgeleitete.gasp/asp_stern/asp_zugekauft`              | ❌ nicht definiert | 🆕 vorhanden          | Alrik (`held`)               | Mittel — persistierte Daten ohne Schema                 |
| **J-09** | `gegenstand.quantity`                                   | Default 1          | ❌ fehlt              | Sturmlaterne (`gegenstand`)  | Gering                                                  |
| **J-10** | `vorteil.sephrastoScript/stilBedingungen/foundryScript` | Vorhanden          | ❌ fehlt              | Standfest (`vorteil`)        | Gering                                                  |
| **J-11** | `manoever.modifications`                                | `[]` (Array)       | ⚠️ `{0:{…}}` (Object) | Wuchtschlag (`manoever`)     | **Hoch** — Typ-Mismatch bricht Code der Arrays erwartet |
| **J-12** | `manoever.input.min/max`                                | ❌ nicht definiert | 🆕 vorhanden          | Wuchtschlag (`manoever`)     | Mittel                                                  |
| **J-13** | `waffeneigenschaft.parameterSlots`                      | `[]` (Array)       | ⚠️ `{0:{…}}` (Object) | Schwer (`waffeneigenschaft`) | **Hoch** — Typ-Mismatch                                 |
| **J-14** | `freie_fertigkeit.stufe`                                | `number 1`         | ⚠️ `"3"` (string)     | Alrik Items                  | Mittel — Rechenoperationen schlagen fehl                |
| **J-15** | `freie_fertigkeit.gruppe`                               | `number 0`         | ⚠️ `"0"` (string)     | Alrik Items                  | Gering                                                  |
| **J-16** | `energien.*.max/value`                                  | `number 0`         | ⚠️ `null`             | Goblin (`kreatur`)           | Mittel — Division durch null o.ä.                       |

---

## 3. Duplikate in template.json

| Nr.      | Eintrag                             | Position                                        | Auswirkung                                                                           | Empfehlung                                                  |
| -------- | ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **J-17** | `Item.types["waffeneigenschaft"]`   | Zweimal (Index 16 + 19)                         | Foundry ignoriert Duplikate; Migrations-/Generierungs-Scripts könnten Probleme haben | Eintrag an Position 19 entfernen                            |
| **J-18** | `kreatur.templates["initiative"]`   | Zweimal aufgeführt                              | Kein praktischer Schaden; signalisiert Copy-Paste-Fehler                             | Duplikat entfernen                                          |
| **J-19** | `eigenschaften` in `waffe`-Template | Auch direkt in `nahkampfwaffe`/`fernkampfwaffe` | Code nutzt primär Template-Feld; Duplikat-Feld redundant                             | Direktfelder aus `nahkampfwaffe`/`fernkampfwaffe` entfernen |

---

## 4. Namensabweichungen zwischen Typen

| Nr.      | Typ A          | Feld A                   | Typ B           | Feld B                 | Semantik                            | Empfehlung                                                                                |
| -------- | -------------- | ------------------------ | --------------- | ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **J-20** | `angriff`      | `system.wm`              | `nahkampfwaffe` | `system.wm_at`         | Waffenmodifikator (AT) — äquivalent | Für `angriff` umbenennen zu `wm_at`; oder `waffe` zu `wm` — entscheiden, vereinheitlichen |
| **J-21** | `angriff`      | `system.tp`              | `waffe`         | `system.tp`            | Schadensformel                      | ✅ Konsistent                                                                             |
| **J-22** | `freiestalent` | `system.pw` (string)     | `fertigkeit`    | `system.pw` (number)   | Praxiswert                          | `freiestalent.pw` → zu number migrieren oder Feld umbenennen                              |
| **J-23** | `manoever`     | `system.voraussetzungen` | `vorteil`       | `system.voraussetzung` | Voraussetzung zum Erwerb            | Pluralform vereinheitlichen (→ `voraussetzung` ohne s)                                    |

---

## 5. Template-Namenskollisionen

| Nr.      | Template-Name | Als Actor-Template                                            | Als Item-Template                                    | Kollision                                                                                                  |
| -------- | ------------- | ------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **J-24** | `gesundheit`  | Felder: `erschoepfung, wunden, hp, …` (Charakter-Lebenskraft) | Felder: `haerte, beschaedigung` (Gegenstandszustand) | Völlig unterschiedliche Felder hinter demselben Namen — verwirrt Entwickler, kann generischen Code brechen |

**Empfehlung J-24**: Item-Template umbenennen zu `item_zustand` oder `gegenstandszustand`.

---

## 6. Strukturelle Probleme

| Nr.      | Problem                                   | Details                                                                                                               | Schwere                                                      | Empfehlung                                                      |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| **J-25** | Verwaister Template-Verweis               | `fertigkeiten` in `held.templates`/`nsc.templates` aufgeführt, aber nicht als Template in `Actor.templates` definiert | Mittel — könnte Foundry bei Template-Erweiterungen verwirren | Eintrag aus `held.templates`/`nsc.templates` entfernen          |
| **J-26** | Orphaned Template `schadenstypen`         | Definiert in `Item.templates`, aber kein Item-Typ referenziert es                                                     | Gering                                                       | Löschen oder in relevante Item-Typen einbinden                  |
| **J-27** | Orphaned Template `munition`              | Definiert in `Item.templates`, aber kein Item-Typ referenziert es                                                     | Gering                                                       | Löschen oder in `fernkampfwaffe` einbinden                      |
| **J-28** | Runtime-Daten in Schema: `waffe.computed` | `computed`-Objekt in `template.json` — rein transient, wird runtime befüllt                                           | Mittel — Verwirrung über Persistenz-Semantik                 | Aus `template.json` entfernen                                   |
| **J-29** | Runtime-Feld als Schema: `waffe.rw_mod`   | `rw_mod` wird runtime gesetzt (Modifier der Reichweite), ist aber in `template.json`                                  | Gering                                                       | Aus `template.json` entfernen oder persistieren-Semantik klären |
| **J-30** | Bug: `isEffectContainer` immer false      | `effect-item.js`: prüft `this.type === 'effectItem'` (camelCase) statt `'effect-item'` (Bindestrich)                  | **Kritisch** — Funktion ist komplett nicht-funktional        | `'effectItem'` → `'effect-item'` ändern                         |
| **J-31** | Feld-Kollision: `abgeleiteter-wert.name`  | `system.name` für technischen Key, `Item.name` (Foundry) für Anzeigenamen — zwei `name`-Konzepte                      | Gering — aktuell kein Bug, aber Verwirrungspotential         | Umbenennen zu `system.key` oder `system.identifier`             |

---

## Namenskonventions-Mapping

### Einheitliche Namenskonventionen im Codebase

| Muster                 | Verwendung                      | Beispiele                                               |
| ---------------------- | ------------------------------- | ------------------------------------------------------- |
| `camelCase`            | JS-Felder in code               | `isEffectContainer`, `kampfunfaehig`                    |
| `snake_case` (Deutsch) | `system.*`-Felder               | `kampftechnik`, `wm_at`, `freiestalent`, `kreaturentyp` |
| `PascalCase`           | Actor-Attribute (Abkürzungen)   | `KK`, `GE`, `IN`, `MU`, `CH`, `FF`, `KL`, `KO`          |
| `kebab-case`           | Item-Typen mit Bindestrich      | `effect-item`, `abgeleiteter-wert`, `freie_fertigkeit`  |
| Deutsch                | Alle Domain-Begriffe, UI-Labels | Fertigkeiten, Zauber, Manöver, Vorteile, Waffe          |
| Englisch               | Strukturcode, Klassen, Module   | `ActorSheet`, `prepareBaseData`, `scripts/actors/`      |

### Bekannte Abweichungen von Konventionen

| Feld                                          | Aktuell            | Erwartet (nach Konvention)                |
| --------------------------------------------- | ------------------ | ----------------------------------------- |
| `system.voraussetzungen` (manoever)           | plural             | `voraussetzung` (singular, wie `vorteil`) |
| `system.pw` auf `freiestalent`                | string             | number (wie `fertigkeit.pw`)              |
| `Item.types["waffeneigenschaft"]`             | doppelt in array   | einmal                                    |
| `effect-item.isEffectContainer`               | prüft `effectItem` | prüft `effect-item`                       |
| `freie_fertigkeit.stufe/gruppe` in `_source/` | string `"3"`       | number `3`                                |

### Feld-Namens-Mapping (äquivalente Felder in verschiedenen Typen)

| Konzept              | `held`/`nsc`                | `kreatur`                  | `fertigkeit`    | `angriff`   | `waffe`                                              |
| -------------------- | --------------------------- | -------------------------- | --------------- | ----------- | ---------------------------------------------------- |
| Primärwert           | `attribute.X.wert`          | `attribute.X.pw` (!)       | `system.fw`     | `system.at` | `system.at`                                          |
| Praxiswert           | `attribute.X.pw` = `2*wert` | `attribute.X.pw` = absolut | `system.pw`     | —           | —                                                    |
| Waffenmod            | —                           | —                          | —               | `system.wm` | `system.wm_at` / `system.wm_vt`                      |
| Voraussetzung        | —                           | —                          | —               | —           | —                                                    |
| Voraussetzung (Item) | —                           | —                          | —               | —           | `vorteil.voraussetzung` / `manoever.voraussetzungen` |
| Lebenskraft          | `gesundheit.hp`             | `gesundheit.hp`            | —               | —           | `gesundheit.haerte` (Item!)                          |
| Gruppe               | —                           | —                          | `system.gruppe` | —           | `system.gruppe` (verschiedene Semantiken!)           |

---

## Priorisierte Handlungsempfehlungen

### Kritisch (Bugs / Datenverlust)

| Nr.      | Maßnahme                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **J-30** | `effect-item.js`: `'effectItem'` → `'effect-item'`                                                                                |
| **J-11** | `manoever.modifications` Typ-Mismatch: Template Array → Source Object — entweder Source migrieren oder Template auf Object ändern |
| **J-13** | `waffeneigenschaft.parameterSlots` Typ-Mismatch: analog J-11                                                                      |

### Hoch (Semantik-Klarheit)

| Nr.           | Maßnahme                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| **J-01**      | `attribute.pw`-Semantik dokumentieren, generischen Code absichern        |
| **J-24**      | Item `gesundheit`-Template umbenennen zu `gegenstandszustand`            |
| **J-14/J-15** | `freie_fertigkeit.stufe/gruppe` in `_source/`-JSONs zu numbers migrieren |

### Mittel (Schema-Sauberkeit)

| Nr.           | Maßnahme                                                  |
| ------------- | --------------------------------------------------------- |
| **J-17/J-18** | Duplikate aus `template.json` entfernen                   |
| **J-25**      | Verwaisten `fertigkeiten`-Verweis entfernen               |
| **J-26/J-27** | Orphaned Templates löschen oder einbinden                 |
| **J-28/J-29** | Runtime-Felder aus `template.json` entfernen              |
| **J-07/J-08** | `_source/`-Daten mit tatsächlichem Schema synchronisieren |

### Gering (Konsistenz)

| Nr.      | Maßnahme                                           |
| -------- | -------------------------------------------------- |
| **J-20** | `angriff.wm` → `wm_at`                             |
| **J-22** | `freiestalent.pw` → number                         |
| **J-23** | `manoever.voraussetzungen` → `voraussetzung`       |
| **J-31** | `abgeleiteter-wert.name` → `key` oder `identifier` |
