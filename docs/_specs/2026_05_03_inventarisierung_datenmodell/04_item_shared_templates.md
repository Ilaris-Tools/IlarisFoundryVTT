# Shared Item-Templates

Wiederverwendbare Templates aus `template.json` § `Item.templates`.  
Quellen: [template.json](../../../../template.json), [scripts/waffe/data/waffe.js](../../../../scripts/waffe/data/waffe.js), [scripts/items/data/combat-item.js](../../../../scripts/items/data/combat-item.js)

---

## Übersicht: Welcher Item-Typ nutzt welches Template?

| Template                 | nahkampf­waffe | fern­kampf­waffe | ruestung | gegenstand | angriff | fertigkeit | üntürl.F. | zauber | liturgie | anrufung | vorteil | manoever |
| ------------------------ | :------------: | :--------------: | :------: | :--------: | :-----: | :--------: | :-------: | :----: | :------: | :------: | :-----: | :------: |
| `gesundheit`             |       ✅       |        ✅        |    ✅    |     ✅     |    —    |     —      |     —     |   —    |    —     |    —     |    —    |    —     |
| `gegenstand`             |       ✅       |        ✅        |    ✅    |     ✅     |    —    |     —      |     —     |   —    |    —     |    —     |    —    |    —     |
| `waffe`                  |       ✅       |        ✅        |    —     |     —      |    —    |     —      |     —     |   —    |    —     |    —     |    —    |    —     |
| `fertigkeit`             |       —        |        —         |    —     |     —      |    —    |     ✅     |    ✅     |   —    |    —     |    —     |    —    |    —     |
| `uebernatuerlich_talent` |       —        |        —         |    —     |     —      |    —    |     —      |     —     |   ✅   |    ✅    |    ✅    |    —    |    —     |
| `schadenstypen`          |       —        |        —         |    —     |     —      |    —    |     —      |     —     |   —    |    —     |    —     |    —    |    —     |
| `munition`               |       —        |        —         |    —     |     —      |    —    |     —      |     —     |   —    |    —     |    —     |    —    |    —     |

> ⚠️ **Orphaned Templates (J-26, J-27)**: `schadenstypen` und `munition` werden von keinem Item-Typ verwendet.

---

## Template: `gesundheit` (Item-Version)

> ⚠️ **Namenskollision J-24**: Actor hat ebenfalls ein Template namens `gesundheit` mit völlig anderen Feldern!  
> Actor `gesundheit` = Lebenskraft (hp, erschoepfung, wunden).  
> Item `gesundheit` = Gegenstandszustand (haerte, beschaedigung).

| Feld            | Typ    | Default | `system.X`-Pfad                   | Code-Querverweise                   |
| --------------- | ------ | ------- | --------------------------------- | ----------------------------------- |
| `haerte`        | number | 0       | `system.gesundheit.haerte`        | `waffe.js` — Waffenbruch-Berechnung |
| `beschaedigung` | number | 0       | `system.gesundheit.beschaedigung` | `waffe.js` — Zustandsabzüge         |

---

## Template: `gegenstand`

| Feld                | Typ    | Default        | `system.X`-Pfad                       | Sturmlaterne `_source/` | Anmerkung                     |
| ------------------- | ------ | -------------- | ------------------------------------- | ----------------------- | ----------------------------- |
| `aufbewahrungs_ort` | string | `"mitführend"` | `system.gegenstand.aufbewahrungs_ort` | ✅                      | Lagerort                      |
| `bewahrt_auf`       | array  | `[]`           | `system.gegenstand.bewahrt_auf`       | ✅                      | Container-Liste               |
| `gewicht_summe`     | number | 0              | `system.gegenstand.gewicht_summe`     | ❌ fehlt                | Runtime: `quantity * gewicht` |
| `gewicht`           | number | 0              | `system.gegenstand.gewicht`           | ✅ 0.5                  | Stückgewicht in kg            |
| `preis`             | number | 0              | `system.gegenstand.preis`             | ✅                      | Preis als Zahl                |
| `quantity`          | number | 1              | `system.gegenstand.quantity`          | ❌ fehlt                | **Delta J-09**                |

---

## Template: `waffe`

> ⚠️ **Runtime-Felder im Schema J-28, J-29**: `computed` und `rw_mod` sind rein transient, sollten nicht in `template.json` stehen.

| Feld                               | Typ     | Default | `system.X`-Pfad                           | Schwert `_source/`   | Anmerkung                                                    |
| ---------------------------------- | ------- | ------- | ----------------------------------------- | -------------------- | ------------------------------------------------------------ |
| `tp`                               | string  | `""`    | `system.tp`                               | ✅ `"1W6+4"`         | Trefferpunkte-Formel                                         |
| `fertigkeit`                       | string  | `""`    | `system.fertigkeit`                       | ✅ `"Klingenwaffen"` | Zugehörige Kampftechnik                                      |
| `talent`                           | string  | `""`    | `system.talent`                           | ✅ `""`              | Spezialisierungstalent                                       |
| `rw`                               | number  | 0       | `system.rw`                               | ✅ 1                 | Reichweite                                                   |
| `rw_mod`                           | number  | 0       | `system.rw_mod`                           | ✅ 0                 | **Runtime J-29**: Modifikator der Reichweite                 |
| `hauptwaffe`                       | boolean | false   | `system.hauptwaffe`                       | ✅ false             | Als Hauptwaffe geführt                                       |
| `nebenwaffe`                       | boolean | false   | `system.nebenwaffe`                       | ✅ false             | Als Nebenwaffe geführt                                       |
| `eigenschaften`                    | array   | `[]`    | `system.eigenschaften`                    | ✅                   | Waffeneigenschaften-Array                                    |
| `text`                             | string  | `""`    | `system.text`                             | ✅                   | Beschreibung                                                 |
| `manoverausgleich.value`           | number  | 0       | `system.manoverausgleich.value`           | ✅ 0                 | Manöverausgleichs-Wert                                       |
| `manoverausgleich.overcomplicated` | boolean | true    | `system.manoverausgleich.overcomplicated` | ✅                   |                                                              |
| `computed`                         | object  | (s.u.)  | `system.computed`                         | ✅ `{}`              | **Runtime J-28**: berechnete Werte (nie persistent sinnvoll) |

**Unterstruktur `computed` (runtime, vollständig):**

| Feld                            | Typ     | Beschreibung                                |
| ------------------------------- | ------- | ------------------------------------------- |
| `computed.at`                   | number  | AT inklusive Kampftechnik-FW, Modifikatoren |
| `computed.vt`                   | number  | VT inklusive Modifikatoren                  |
| `computed.fk`                   | number  | FK-Wert                                     |
| `computed.schadenBonus`         | number  | Schadensbonus                               |
| `computed.rw`                   | number  | RW nach rw_mod                              |
| `computed.handsRequired`        | number  | Benötigte Hände                             |
| `computed.ignoreNebenMalus`     | boolean |                                             |
| `computed.noRider`              | boolean |                                             |
| `computed.modifiers.at`         | array   | AT-Modifier-Liste                           |
| `computed.modifiers.vt`         | array   | VT-Modifier-Liste                           |
| `computed.modifiers.dmg`        | array   | DMG-Modifier-Liste                          |
| `computed.targetEffects`        | array   | Ziel-Effekte                                |
| `computed.combatMechanics`      | object  | Kampfmechanik-Daten                         |
| `computed.conditionalModifiers` | array   | Bedingte Modifikatoren                      |
| `computed.hasActorModifiers`    | boolean |                                             |

**Code-Querverweise:**

- `scripts/waffe/data/waffe.js:_calculateWeaponStats()` — befüllt `computed.*`
- `scripts/waffe/data/waffe.js:_applyModifiers()` — Eigenschaften-Modifikatoren
- `scripts/items/waffe.js:getTp()` — liest `system.schaden` (legacy format?)

---

## Template: `fertigkeit`

Verwendet von: `fertigkeit`, `uebernatuerliche_fertigkeit`

| Feld         | Typ    | Default | `system.X`-Pfad     | Klingenwaffen `_source/` | Anmerkung                                                   |
| ------------ | ------ | ------- | ------------------- | ------------------------ | ----------------------------------------------------------- |
| `basis`      | number | 0       | `system.basis`      | ✅ 0                     | Runtime: Σ der Attribut-pw-Werte                            |
| `fw`         | number | 0       | `system.fw`         | ✅ 0                     | Fertigkeitswert (gelernte Steigerungen)                     |
| `pw`         | number | 0       | `system.pw`         | ✅ 0                     | Praxiswert                                                  |
| `attribut_0` | string | `"KO"`  | `system.attribut_0` | ✅ `"KK"`                | Primärattribut (Template-Default `"KO"`, Compendium `"KK"`) |
| `attribut_1` | string | `"KO"`  | `system.attribut_1` | ✅ `"GE"`                | Sekundärattribut (Template-Default `"KO"`)                  |
| `attribut_2` | string | `"KO"`  | `system.attribut_2` | ✅ `"KO"`                | Tertiärattribut                                             |
| `gruppe`     | number | -1      | `system.gruppe`     | ✅ 2                     | Kategorie-ID (Template-Default -1)                          |
| `text`       | string | `""`    | `system.text`       | ✅                       | Beschreibung                                                |

**Code-Querverweise:** `actor.js:prepareBaseData()` — berechnet `system.basis` aus `attribute.attribut_0/1/2.pw`

---

## Template: `uebernatuerlich_talent`

Verwendet von: `zauber`, `liturgie`, `anrufung`

| Feld                     | Typ    | Default  | `system.X`-Pfad                 | Anmerkung                                            |
| ------------------------ | ------ | -------- | ------------------------------- | ---------------------------------------------------- |
| `fertigkeiten`           | string | `""`     | `system.fertigkeiten`           | Komma-getrennte Fertigkeits-Namen                    |
| `fertigkeit_ausgewaehlt` | string | `"auto"` | `system.fertigkeit_ausgewaehlt` | Ausgewählte Fertigkeit (Dropdown)                    |
| `text`                   | string | `""`     | `system.text`                   | Beschreibungstext                                    |
| `maechtig`               | string | `""`     | `system.maechtig`               | Mächtig-Variante-Text                                |
| `schwierigkeit`          | string | `""`     | `system.schwierigkeit`          | Schwierigkeitsgrad als Formel-String                 |
| `modifikationen`         | string | `""`     | `system.modifikationen`         | Modifikationen-Text                                  |
| `vorbereitung`           | string | `""`     | `system.vorbereitung`           | Vorbereitungs-Text                                   |
| `ziel`                   | string | `""`     | `system.ziel`                   | Wirkungsziel                                         |
| `reichweite`             | string | `""`     | `system.reichweite`             | Reichweite                                           |
| `wirkungsdauer`          | string | `""`     | `system.wirkungsdauer`          | Wirkungsdauer                                        |
| `kosten`                 | string | `""`     | `system.kosten`                 | Aktivierungskosten (z.B. `"4 AsP"`)                  |
| `erlernen`               | string | `""`     | `system.erlernen`               | Wie erlernbar                                        |
| `pw`                     | number | 0        | `system.pw`                     | Praxiswert                                           |
| `gruppe`                 | number | -1       | `system.gruppe`                 | Gruppe/Kategorie (default -1 nie in Daten verwendet) |

---

## Template: `schadenstypen` (orphaned)

> ⚠️ **Inkonsistenz J-26**: Template definiert, aber kein Item-Typ referenziert es.

`schadenstypen`-Objekt mit folgenden boolean-Feldern:

| Feld                    | Typ     | Default |
| ----------------------- | ------- | ------- |
| `schadenstypen.profan`  | boolean | true    |
| `schadenstypen.stumpf`  | boolean | false   |
| `schadenstypen.stich`   | boolean | false   |
| `schadenstypen.scharf`  | boolean | false   |
| `schadenstypen.magisch` | boolean | false   |
| `schadenstypen.geweiht` | boolean | false   |
| `schadenstypen.eis`     | boolean | false   |
| `schadenstypen.erz`     | boolean | false   |
| `schadenstypen.feuer`   | boolean | false   |
| `schadenstypen.humus`   | boolean | false   |
| `schadenstypen.luft`    | boolean | false   |
| `schadenstypen.wasser`  | boolean | false   |

---

## Template: `munition` (orphaned)

> ⚠️ **Inkonsistenz J-27**: Template definiert, aber kein Item-Typ referenziert es.

| Feld              | Typ     | Default |
| ----------------- | ------- | ------- |
| `hat_munition`    | boolean | false   |
| `bolzen_pfeile`   | boolean | false   |
| `anzahl_munition` | number  | 0       |
| `anzahl_ruestung` | number  | 0       |
| `anzahl_stumpf`   | number  | 0       |
| `anzahl_krieg`    | number  | 0       |
