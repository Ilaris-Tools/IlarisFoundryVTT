# Item-Gruppe C: Übernatürliches

Item-Typen: `zauber`, `liturgie`, `anrufung`

Quellen: [template.json](../../../../template.json), [scripts/items/data/combat-item.js](../../../../scripts/items/data/combat-item.js), [comp_packs/zauberspruche-und-rituale/\_source/Ignifaxius_Flammenstrahl_MnFJNJi1yZSxCSGt.json](../../../../comp_packs/zauberspruche-und-rituale/_source/Ignifaxius_Flammenstrahl_MnFJNJi1yZSxCSGt.json), [comp_packs/liturgien-und-mirakel/\_source/Wundsegen_0vi00qaguNcphsXS.json](../../../../comp_packs/liturgien-und-mirakel/_source/Wundsegen_0vi00qaguNcphsXS.json)

---

## Gemeinsame Basis: Template `uebernatuerlich_talent`

Alle drei Typen (`zauber`, `liturgie`, `anrufung`) haben:

**Templates:** `uebernatuerlich_talent`  
**Direkte Felder:** keine

Alle Felder kommen vollständig aus dem Template. Keine typspezifischen Erweiterungen.

---

## Alle Felder (identisch für zauber / liturgie / anrufung)

| Feld                     | Typ    | Default  | `system.X`-Pfad                 | Ignifaxius       | Wundsegen       | Anmerkung                         |
| ------------------------ | ------ | -------- | ------------------------------- | ---------------- | --------------- | --------------------------------- |
| `fertigkeiten`           | string | `""`     | `system.fertigkeiten`           | ✅               | ✅              | Komma-getrennte Fertigkeits-Namen |
| `fertigkeit_ausgewaehlt` | string | `"auto"` | `system.fertigkeit_ausgewaehlt` | ✅ `"auto"`      | ✅ `"auto"`     | Dropdown-Auswahl                  |
| `text`                   | string | `""`     | `system.text`                   | ✅               | ✅              | Beschreibungstext                 |
| `maechtig`               | string | `""`     | `system.maechtig`               | ✅               | ✅              | Mächtig-Variante-Beschreibung     |
| `schwierigkeit`          | string | `""`     | `system.schwierigkeit`          | ✅               | ✅              | Schwierigkeitsgrad                |
| `modifikationen`         | string | `""`     | `system.modifikationen`         | ✅               | ✅              | Modifikationen-Text               |
| `vorbereitung`           | string | `""`     | `system.vorbereitung`           | ✅               | ✅              | Vorbereitungs-Text                |
| `ziel`                   | string | `""`     | `system.ziel`                   | ✅ `"Ziel"`      | ✅ `"Berühren"` | Wirkungsziel                      |
| `reichweite`             | string | `""`     | `system.reichweite`             | ✅ `"3 Schritt"` | ✅ `"Berühren"` |                                   |
| `wirkungsdauer`          | string | `""`     | `system.wirkungsdauer`          | ✅ `"sofort"`    | ✅ `"1 Stunde"` |                                   |
| `kosten`                 | string | `""`     | `system.kosten`                 | ✅ `"4 AsP"`     | ✅ `"4 KaP"`    |                                   |
| `erlernen`               | string | `""`     | `system.erlernen`               | ✅               | ✅              | Wie erlernbar                     |
| `pw`                     | number | 0        | `system.pw`                     | ✅ 0             | ✅ 0            | Praxiswert                        |
| `gruppe`                 | number | -1       | `system.gruppe`                 | ✅ 3             | ✅ 1            | Default `-1` wird nie benutzt     |

---

## Semantische Unterschiede zwischen den Typen

| Aspekt          | `zauber`                     | `liturgie`              | `anrufung`                    |
| --------------- | ---------------------------- | ----------------------- | ----------------------------- |
| Energiekosten   | AsP (`kosten` enthält "AsP") | KaP                     | AsP oder speziell             |
| Tradition       | Magier-Tradition             | Gottheit/Kirche         | Schamanenruf etc.             |
| `hauszauber`    | relevant                     | —                       | —                             |
| Compendium-Pack | `zauberspruche-und-rituale`  | `liturgien-und-mirakel` | `ubernaturliche-fertigkeiten` |

---

## Code-Querverweise

- `scripts/items/data/combat-item.js` — gemeinsamer Proxy-Typ für übernatürliche Kampf-Items (aktive Zauber/Liturgien)
- `scripts/actors/data/held.js:_calculateAbgeleitete()` — berechnet `asp_stern` (Σ Zauber.kosten), `kap_stern`
- `scripts/actors/data/actor.js` — `zauberer` boolean (asp > 0), `geweihter` boolean (kap > 0)
- `scripts/skills/` — Fertigkeitswürfe für Zaubern/Liturgieanwendung

---

## Compendium-Pakete (übernatürliches)

| Pack                                | Typen                            | Sonderfälle                    |
| ----------------------------------- | -------------------------------- | ------------------------------ |
| `zauberspruche-und-rituale`         | `zauber`                         | Rituale als separate Kategorie |
| `liturgien-und-mirakel`             | `liturgie`                       | Mirakel als separate Kategorie |
| `ubernaturliche-fertigkeiten`       | `uebernatuerliche_fertigkeit`    | Skills, nicht direkte Wirker   |
| `fertigkeiten-und-talente-advanced` | `zauber`, `liturgie`, `anrufung` | Advanced-Versionen             |
| `zaubertricks-advanced`             | `zauber`                         | Kleine Effekte, günstiger      |
