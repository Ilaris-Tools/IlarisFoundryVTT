# Item-Gruppe E: Meta-Items

Item-Typen: `vorteil`, `manoever`, `eigenheit`, `eigenschaft`, `info`, `abgeleiteter-wert`, `effect-item`

Quellen: [template.json](../../../../template.json), [scripts/items/data/effect-item.js](../../../../scripts/items/data/effect-item.js), [scripts/items/data/manoever.js](../../../../scripts/items/data/manoever.js), [comp_packs/vorteile/\_source/Standfest_LDCTHPWFQYkPLYN9.json](../../../../comp_packs/vorteile/_source/Standfest_LDCTHPWFQYkPLYN9.json), [comp_packs/manover/\_source/Wuchtschlag_eEp6Pn0dLpm5HUgp.json](../../../../comp_packs/manover/_source/Wuchtschlag_eEp6Pn0dLpm5HUgp.json)

---

## Typ: `vorteil`

**Templates:** keine

**Alle Felder:**

| Feld              | Typ    | Default | `system.X`-Pfad          | Standfest `_source/` | Anmerkung              |
| ----------------- | ------ | ------- | ------------------------ | -------------------- | ---------------------- |
| `voraussetzung`   | string | `""`    | `system.voraussetzung`   | ✅ `""`              | Anforderung zum Erwerb |
| `gruppe`          | number | 0       | `system.gruppe`          | ✅ 2                 | Kategorie-ID (s.u.)    |
| `text`            | string | `""`    | `system.text`            | ✅                   | Beschreibung           |
| `sephrastoScript` | string | `""`    | `system.sephrastoScript` | ❌ fehlt             | **Delta J-10**         |
| `stilBedingungen` | string | `""`    | `system.stilBedingungen` | ❌ fehlt             | **Delta J-10**         |
| `foundryScript`   | string | `""`    | `system.foundryScript`   | ❌ fehlt             | **Delta J-10**         |

**Vorteil-Gruppen (aus Code-Kommentaren):**

| ID  | Bedeutung                   |
| --- | --------------------------- |
| 0   | Allgemein                   |
| 2   | Profan (weltliche Vorteile) |
| 3   | Kampfstil                   |
| 5   | Zaubertradition             |
| 7   | Geweihter                   |

---

## Typ: `manoever`

**Templates:** keine

**Alle Felder:**

| Feld              | Typ     | Default               | `system.X`-Pfad          | Wuchtschlag `_source/` | Anmerkung                       |
| ----------------- | ------- | --------------------- | ------------------------ | ---------------------- | ------------------------------- |
| `voraussetzungen` | string  | `""`                  | `system.voraussetzungen` | ✅ `""`                | Voraussetzungs-String (geparst) |
| `input.label`     | string  | `"Checkbox"`          | `system.input.label`     | ✅ `""`                | Eingabebeschriftung             |
| `input.field`     | string  | `"CHECKBOX"`          | `system.input.field`     | ✅ `"NUMBER"`          | Eingabetyp                      |
| `input.min`       | —       | **nicht im Template** | `system.input.min`       | 🆕 `0`                 | **Extra J-12**                  |
| `input.max`       | —       | **nicht im Template** | `system.input.max`       | 🆕 `8`                 | **Extra J-12**                  |
| `modifications`   | array   | `[]`                  | `system.modifications`   | ⚠️ `{0:{…},1:{…}}`     | **Typ-Mismatch J-11**           |
| `gruppe`          | number  | 0                     | `system.gruppe`          | ⚠️ `"0"` string        | Typ-Mismatch                    |
| `probe`           | string  | `""`                  | `system.probe`           | ✅ `"AT -X"`           | Probenformel                    |
| `gegenprobe`      | string  | `""`                  | `system.gegenprobe`      | ✅ `""`                | Gegenprobenformel               |
| `text`            | string  | `""`                  | `system.text`            | ✅                     | Beschreibung                    |
| `isBaseManoever`  | boolean | false                 | `system.isBaseManoever`  | ✅ `true`              | Basis-Manöver-Flag              |

> ⚠️ **Typ-Mismatch J-11**: `modifications` ist im Template `[]` (Array), in `_source/` aber ein nummeriertes Object `{0: {...}}`.  
> ⚠️ **Extra J-12**: `input.min`/`input.max` sind in `_source/` vorhanden, aber nicht in `template.json` definiert.

**Voraussetzungs-Syntax** (geparst in `manoever.js`):

```
"Waffeneigenschaft Wucht"   → erfordert Waffeneigenschaft mit Name "Wucht"
"Vorteil Klingentanz"       → erfordert Vorteil mit Name "Klingentanz"
"X OR Y"                    → logische ODER-Verknüpfung
```

**Code-Querverweise:**

- `scripts/items/data/manoever.js:parseVoraussetzungen()` — Voraussetzungs-Parser
- `scripts/items/data/angriff.js` — liest `system.angriffmanover` (cross-Item-Referenz, Manöver-IDs auf Angriff, nicht umgekehrt)

---

## Typ: `eigenheit`

**Templates:** keine

**Alle Felder:**

| Feld   | Typ    | Default | `system.X`-Pfad |
| ------ | ------ | ------- | --------------- |
| `text` | string | `""`    | `system.text`   |

> Semantik: Charakter-Eigenschaften / Persönlichkeitsmerkmale des Helden.

---

## Typ: `eigenschaft`

**Templates:** keine

**Alle Felder:**

| Feld   | Typ    | Default | `system.X`-Pfad |
| ------ | ------ | ------- | --------------- |
| `text` | string | `""`    | `system.text`   |

> Semantik: Kreatur-Eigenschaften (z.B. "Resistenz (Feuer)", "Angepasst (Kälte)"). Trotz identischem Schema zu `eigenheit` semantisch unterschiedlich — `eigenheit` für Helden, `eigenschaft` für Kreaturen.

---

## Typ: `info`

**Templates:** keine

**Alle Felder:**

| Feld   | Typ    | Default | `system.X`-Pfad |
| ------ | ------ | ------- | --------------- |
| `text` | string | `""`    | `system.text`   |

> Reines Notiz-/Informationsfeld ohne Spielmechanik.

---

## Typ: `abgeleiteter-wert`

**Templates:** keine

**Alle Felder:**

| Feld          | Typ    | Default | `system.X`-Pfad      | Anmerkung                                           |
| ------------- | ------ | ------- | -------------------- | --------------------------------------------------- |
| `name`        | string | `""`    | `system.name`        | **Konflikt J-31** mit Foundry `Document.name`       |
| `formel`      | string | `""`    | `system.formel`      | Anzeigeformel (Label für UI)                        |
| `script`      | string | `""`    | `system.script`      | JS-Berechnungsscript (wird per `eval()` ausgeführt) |
| `finalscript` | string | `""`    | `system.finalscript` | Post-processing-Script                              |
| `text`        | string | `""`    | `system.text`        | Beschreibung                                        |

> ⚠️ **Feld-Kollision J-31**: `system.name` kollidiert mit `Item.name` (Foundry Document-Feld). Im System wird `system.name` für den technischen Key verwendet (z.B. `"INI"`, `"WS"`), während `Item.name` den angezeigten Itemnamen enthält. Beide existieren gleichzeitig, aber können verwirren.

**Script-Kontext-Variablen** (verfügbar in `script`/`finalscript`):

| Variable            | Typ      | Beschreibung                                    |
| ------------------- | -------- | ----------------------------------------------- |
| `getAttribut(attr)` | function | Gibt `actor.system.attribute[attr].wert` zurück |
| `roundDown`         | function | `Math.floor`                                    |
| `getWS()`           | function | Gibt `actor.system.abgeleitete.ws` zurück       |
| `getRS()`           | function | Gibt `actor.system.abgeleitete.ws_stern` zurück |

**Wert-Berechnungsfluss:**

```
abgeleiteter-wert Item im Compendium "abgeleitete-werte-definitionen"
  → actor.js:_getAbgeleiteteWerteDefinitions() (gecacht)
  → actor.js:calculateValue(name, defaultValue)
  → eval(customDef.script)
  → system.abgeleitete.ws, .ini, .mr, .gs, .SchiP usw.
```

---

## Typ: `effect-item`

**Templates:** keine

**Alle Felder:**

| Feld          | Typ    | Default | `system.X`-Pfad      | Anmerkung                |
| ------------- | ------ | ------- | -------------------- | ------------------------ |
| `description` | string | `""`    | `system.description` | Beschreibung des Effekts |

> Zusätzlich: eingebettete `ActiveEffect`-Einträge via `item.effects`.

**Code-Querverweise:**

- `scripts/items/data/effect-item.js:applyEffectsToActor(targetActor)` — kopiert eingebettete ActiveEffects auf einen Actor
- `scripts/items/data/effect-item.js:isEffectContainer` (getter)

> ⚠️ **Bug J-30**: `isEffectContainer` prüft `this.type === 'effectItem'` (camelCase), aber der registrierte Foundry-Typ ist `effect-item` (Bindestrich-Schreibweise). Der Check gibt **immer `false`** zurück.

```js
// Aktueller Code (fehlerhaft):
get isEffectContainer() {
  return this.type === 'effectItem'; // Immer false — registrierter Typ ist 'effect-item'
}

// Korrekt wäre:
get isEffectContainer() {
  return this.type === 'effect-item';
}
```
