# Item-Gruppe D: Ausrüstung

Item-Typen: `ruestung`, `gegenstand`

Quellen: [template.json](../../../../template.json), [comp_packs/gegenstande/\_source/Sturmlaterne_LuMntjPbQFqqCgOb.json](../../../../comp_packs/gegenstande/_source/Sturmlaterne_LuMntjPbQFqqCgOb.json)

---

## Typ: `ruestung`

**Templates:** `gesundheit` (Item) + `gegenstand`

**Direkte Felder:**

| Feld       | Typ     | Default | `system.X`-Pfad   | Anmerkung                     |
| ---------- | ------- | ------- | ----------------- | ----------------------------- |
| `rs`       | number  | 0       | `system.rs`       | Gesamt-Rüstungsschutz         |
| `be`       | number  | 0       | `system.be`       | Behinderungswert              |
| `rs_beine` | number  | 0       | `system.rs_beine` | RS für Beine                  |
| `rs_larm`  | number  | 0       | `system.rs_larm`  | RS für linken Arm             |
| `rs_rarm`  | number  | 0       | `system.rs_rarm`  | RS für rechten Arm            |
| `rs_bauch` | number  | 0       | `system.rs_bauch` | RS für Bauch                  |
| `rs_brust` | number  | 0       | `system.rs_brust` | RS für Brust                  |
| `rs_kopf`  | number  | 0       | `system.rs_kopf`  | RS für Kopf                   |
| `aktiv`    | boolean | false   | `system.aktiv`    | Rüstung wird getragen (aktiv) |
| `text`     | string  | `""`    | `system.text`     | Beschreibung                  |

**Aus `gegenstand`-Template:** `quantity`, `gewicht`, `gewicht_summe`, `preis`, `beschreibung`, `fundort`  
**Aus `gesundheit`-Template (Item):** `haerte`, `beschaedigung`

**Code-Querverweise:**

- `scripts/actors/data/held.js:_calculateAbgeleitete()` — `system.aktiv` (filtert aktive Rüstungen), `system.rs`, `system.be`, `system.rs_[körperteil]`
- Feld `ws_stern` auf Actor = `ws + Σ(ruestung.rs)` aller aktiven Rüstungen

---

## Typ: `gegenstand`

**Templates:** `gesundheit` (Item) + `gegenstand`

**Direkte Felder:**

| Feld   | Typ    | Default | `system.X`-Pfad | Sturmlaterne `_source/` | Anmerkung             |
| ------ | ------ | ------- | --------------- | ----------------------- | --------------------- |
| `text` | string | `""`    | `system.text`   | ✅                      | Freitext-Beschreibung |

**Aus `gegenstand`-Template:**

| Feld                | Typ    | Default        | `system.X`-Pfad                       | Sturmlaterne `_source/` | Anmerkung                     |
| ------------------- | ------ | -------------- | ------------------------------------- | ----------------------- | ----------------------------- |
| `aufbewahrungs_ort` | string | `"mitführend"` | `system.gegenstand.aufbewahrungs_ort` | ✅                      | Lagerort                      |
| `bewahrt_auf`       | array  | `[]`           | `system.gegenstand.bewahrt_auf`       | ✅                      | Container-Liste               |
| `gewicht_summe`     | number | 0              | `system.gegenstand.gewicht_summe`     | ❌ fehlt                | Runtime: `quantity * gewicht` |
| `gewicht`           | number | 0              | `system.gegenstand.gewicht`           | ✅ 0.5                  | Stückgewicht                  |
| `preis`             | number | 0              | `system.gegenstand.preis`             | ✅                      | Preis als Zahl                |
| `quantity`          | number | 1              | `system.gegenstand.quantity`          | ❌ fehlt                | **Delta J-09**                |

**Aus `gesundheit`-Template (Item):** `haerte`, `beschaedigung`

---

## Compendium-Delta

| #     | Feld                       | Status   | Details                                      |
| ----- | -------------------------- | -------- | -------------------------------------------- |
| J-09a | `gegenstand.quantity`      | ❌ fehlt | Sturmlaterne `_source/` — Template-Default 1 |
| J-09b | `gegenstand.gewicht_summe` | ❌ fehlt | Runtime-Feld                                 |
