# Item-Gruppe B: Fertigkeiten

Item-Typen: `fertigkeit`, `uebernatuerliche_fertigkeit`, `talent`, `freie_fertigkeit`, `freiestalent`

Quellen: [template.json](../../../../template.json), [scripts/items/data/](../../../../scripts/items/data/), [comp_packs/fertigkeiten-und-talente/\_source/Klingenwaffen_e8EhAuDcBD5SmCoq.json](../../../../comp_packs/fertigkeiten-und-talente/_source/Klingenwaffen_e8EhAuDcBD5SmCoq.json)

---

## Typ: `fertigkeit`

**Templates:** `fertigkeit`

**Direkte Felder:**

| Feld  | Typ    | Default | `system.X`-Pfad | Klingenwaffen `_source/` | Anmerkung                                   |
| ----- | ------ | ------- | --------------- | ------------------------ | ------------------------------------------- |
| `pwt` | number | 0       | `system.pwt`    | ✅ 0                     | PW-Tabellen-Wert (Steigerungskosten-Stufen) |

**Aus `fertigkeit`-Template (alle Felder):**

| Feld         | Typ    | Default | `system.X`-Pfad     | Klingenwaffen | Anmerkung                                  |
| ------------ | ------ | ------- | ------------------- | ------------- | ------------------------------------------ |
| `basis`      | number | 0       | `system.basis`      | ✅ 0          | Runtime: Σ der Attribut-pw-Werte           |
| `fw`         | number | 0       | `system.fw`         | ✅ 0          | Fertigkeitswert (gelernte Steigerungen)    |
| `pw`         | number | 0       | `system.pw`         | ✅ 0          | Praxiswert                                 |
| `attribut_0` | string | `"KO"`  | `system.attribut_0` | ✅ `"KK"`     | Primärattribut (Template-Default `"KO"`)   |
| `attribut_1` | string | `"KO"`  | `system.attribut_1` | ✅ `"GE"`     | Sekundärattribut (Template-Default `"KO"`) |
| `attribut_2` | string | `"KO"`  | `system.attribut_2` | ✅ `"KO"`     | Tertiärattribut                            |
| `gruppe`     | number | -1      | `system.gruppe`     | ✅ 2          | Kategorie-ID (Template-Default -1)         |
| `text`       | string | `""`    | `system.text`       | ✅            | Beschreibung                               |

**Code-Querverweise:**

- `actor.js:prepareBaseData()` — berechnet `system.basis` aus `attribute.attribut_0/1/2.pw`
- `held.js:_calculateAbgeleitete()` — Fertigkeitsliste für Charakter

---

## Typ: `uebernatuerliche_fertigkeit`

**Templates:** `fertigkeit`

**Direkte Felder:**

| Feld            | Typ    | Default | `system.X`-Pfad        | Anmerkung                 |
| --------------- | ------ | ------- | ---------------------- | ------------------------- |
| `voraussetzung` | string | `""`    | `system.voraussetzung` | Aktivierungsvoraussetzung |

> Keine `pwt`-Feld (Übernatürliche Fertigkeiten haben eine andere PW-Berechnung ohne feste Tabelle).

**Alle Felder aus `fertigkeit`-Template** wie bei `fertigkeit`, aber ohne `pwt`.

---

## Typ: `talent`

**Templates:** keine

**Alle Felder:**

| Feld         | Typ    | Default | `system.X`-Pfad     | Anmerkung                            |
| ------------ | ------ | ------- | ------------------- | ------------------------------------ |
| `text`       | string | `""`    | `system.text`       | Beschreibung                         |
| `fertigkeit` | string | `""`    | `system.fertigkeit` | Zugehörige Fertigkeits-ID oder -Name |

---

## Typ: `freie_fertigkeit`

**Templates:** keine

> Freie Fertigkeiten sind einfache Stufen-basierte Fähigkeiten ohne komplexe Attribut-Bindung.

**Alle Felder:**

| Feld     | Typ    | Default | `system.X`-Pfad | Alrik `_source/` (embedded) | Anmerkung             |
| -------- | ------ | ------- | --------------- | --------------------------- | --------------------- |
| `stufe`  | number | 1       | `system.stufe`  | ⚠️ `"3"` (string)           | **Typ-Mismatch J-14** |
| `text`   | string | `""`    | `system.text`   | ✅                          | Beschreibung          |
| `gruppe` | number | 0       | `system.gruppe` | ⚠️ `"0"` (string)           | **Typ-Mismatch J-15** |

---

## Typ: `freiestalent`

**Templates:** keine

> Verwendet primär bei Kreaturen. `pw` ist ein **string**, nicht number — Typ-Konflikt zu `fertigkeit.pw` (J-22).

**Alle Felder:**

| Feld     | Typ     | Default | `system.X`-Pfad | Anmerkung                                                 |
| -------- | ------- | ------- | --------------- | --------------------------------------------------------- |
| `text`   | string  | `""`    | `system.text`   | Beschreibung                                              |
| `pw`     | string  | `""`    | `system.pw`     | PW-Wert als Freitext (z.B. `"10"`, `"AT 12"`)             |
| `profan` | boolean | true    | `system.profan` | Ob "profaner" Wert (nicht-magisch) — Default ist **true** |

> ⚠️ **Typ-Konflikt J-22**: `freiestalent.pw` ist `string`, `fertigkeit.pw` ist `number` — semantisch äquivalentes Konzept.

**Code-Querverweise:**

- `scripts/actors/sheets/kreatur.js:_onDropItemCreate()` — konvertiert `fertigkeit`/`uebernatuerliche_fertigkeit` zu `freiestalent` beim Drop auf Kreatur

---

## Typvergleich-Tabelle

| Feld             | `fertigkeit`  | `üntürl.F.`   | `talent` | `freie_fertigkeit` | `freiestalent`   |
| ---------------- | ------------- | ------------- | -------- | ------------------ | ---------------- |
| `basis`          | ✅ (template) | ✅ (template) | —        | —                  | —                |
| `fw`             | ✅ (template) | ✅ (template) | —        | —                  | —                |
| `pw`             | ✅ number     | ✅ number     | —        | —                  | ✅ **string** ⚠️ |
| `attribut_0/1/2` | ✅            | ✅            | —        | —                  | —                |
| `gruppe`         | ✅ number     | ✅ number     | —        | ✅ **⚠️ string**   | —                |
| `text`           | ✅            | ✅            | ✅       | ✅                 | ✅               |
| `pwt`            | ✅            | —             | —        | —                  | —                |
| `voraussetzung`  | —             | ✅            | —        | —                  | —                |
| `fertigkeit`     | —             | —             | ✅       | —                  | —                |
| `stufe`          | —             | —             | —        | ✅ **⚠️ string**   | —                |
| `profan`         | —             | —             | —        | —                  | ✅               |
