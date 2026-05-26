# Actor-Typ: `held` und `nsc`

Quellen: [template.json](../../../../template.json), [scripts/actors/data/held.js](../../../../scripts/actors/data/held.js), [scripts/actors/data/actor.js](../../../../scripts/actors/data/actor.js), [comp_packs/beispiel-helden/\_source/Alrik_der_Bauer_1JoyGcLfAZTtdX52.json](../../../../comp_packs/beispiel-helden/_source/Alrik_der_Bauer_1JoyGcLfAZTtdX52.json)

---

## Template-Komposition

`held` und `nsc` verwenden identische Templates:

```
gesundheit, attribute, fertigkeiten*, abgeleitete, schips, initiative, furcht, modifikatoren, misc, geld
```

> ⚠️ **Inkonsistenz J-25**: `fertigkeiten` ist in `held.templates` und `nsc.templates` aufgeführt, existiert aber **nicht** als Template in `Actor.templates`. Fertigkeiten werden als embedded Items (Typ `fertigkeit`) auf dem Actor gespeichert — nicht als Felder.

---

## Direkte Felder (nicht aus Templates)

| Feld       | Typ    | Default | `system.X`-Pfad   | Alrik `_source/` | Anmerkung                             |
| ---------- | ------ | ------- | ----------------- | ---------------- | ------------------------------------- |
| `getragen` | number | 0       | `system.getragen` | ✅ 0             | Runtime: Σ Gewicht mitgeführter Items |
| `notes`    | string | `""`    | `system.notes`    | ✅ `"Hallo"`     | Freitext-Notizfeld                    |

---

## Semantik: `attribute.pw` bei Held/NSC

- Wird **nicht** persistent editiert — in `_source/`-JSONs immer `0`
- Runtime-berechnet in `_calculatePWAttribute()`: `pw = 2 * wert`
- Dient als Basiswert für Fertigkeits-`basis`-Berechnung
- Zugriff: `this.system.attribute.IN.pw`, etc.

---

## Semantik: `abgeleitete.*` bei Held/NSC

Alle `abgeleitete`-Felder sind im `_source/`-JSON auf `0` gesetzt.  
Sie werden vollständig in `actor.js:prepareBaseData()` und `held.js:_calculateAbgeleitete()` befüllt.

| Feld                 | Berechnung (Kurzform)                  | Datei                             |
| -------------------- | -------------------------------------- | --------------------------------- |
| `ini` / `baseIni`    | `IN.wert` (custom script möglich)      | `actor.js:prepareBaseData()`      |
| `mr`                 | `4 + floor(MU.wert / 4)`               | `actor.js:prepareBaseData()`      |
| `gs`                 | `4 + floor(GE.wert / 4) - be`          | `actor.js:prepareBaseData()`      |
| `ws`                 | `4 + floor(KO.wert / 4)`               | `actor.js:prepareBaseData()`      |
| `ws_stern`           | `ws + Σ(aktive Rüstungen.rs)`          | `held.js:_calculateAbgeleitete()` |
| `ws_[körperteil]`    | `ws + Rüstung.rs_[körperteil]`         | `held.js:_calculateAbgeleitete()` |
| `be`                 | `Σ(aktive Rüstungen.be) + be_traglast` | `held.js:_calculateAbgeleitete()` |
| `be_traglast`        | `hardcoded.beTraglast(system)`         | `held.js:_calculateAbgeleitete()` |
| `dh`                 | `KO.wert - 2*(be - be_traglast)`       | `held.js:_calculateAbgeleitete()` |
| `traglast`           | `2 * KK.wert`                          | `actor.js:prepareBaseData()`      |
| `traglast_intervall` | `KK.wert`                              | `actor.js:prepareBaseData()`      |
| `asp`                | `asp_zugekauft - gasp`                 | `actor.js:prepareBaseData()`      |
| `kap`                | `kap_zugekauft - gkap`                 | `actor.js:prepareBaseData()`      |
| `zauberer`           | `asp > 0`                              | `held.js:_calculateAbgeleitete()` |
| `geweihter`          | `kap > 0`                              | `held.js:_calculateAbgeleitete()` |
| `schips`             | `calculateValue('SchiP', 4)`           | `actor.js:prepareBaseData()`      |

---

## Compendium-Delta: Alrik der Bauer

Vergleich `template.json`-Schema vs. [`Alrik_der_Bauer_1JoyGcLfAZTtdX52.json`](../../../../comp_packs/beispiel-helden/_source/Alrik_der_Bauer_1JoyGcLfAZTtdX52.json):

| #   | Feld                              | Status            | Details                                      |
| --- | --------------------------------- | ----------------- | -------------------------------------------- |
| 1   | `modifikatoren.verteidigungmod`   | ❌ fehlt          | In Template (default 0), nicht im JSON       |
| 2   | `abgeleitete.baseIni`             | ❌ fehlt          | In Template (default 0), nicht im JSON       |
| 3   | `abgeleitete.asp_zugekauft`       | 🆕 null           | Nicht in template.json, aber persistiert     |
| 4   | `abgeleitete.gasp`                | 🆕 null           | Nicht in template.json, aber persistiert     |
| 5   | `abgeleitete.asp_stern`           | 🆕 8              | Nicht in template.json, aber persistiert     |
| 6   | `attribute.*.pw` alle 0           | ✅ korrekt        | Runtime-berechnet, korrekt nicht persistiert |
| 7   | `items[].freie_fertigkeit.stufe`  | ⚠️ `"3"` (string) | Template: `number 1` — Typ-Mismatch          |
| 8   | `items[].freie_fertigkeit.gruppe` | ⚠️ `"0"` (string) | Template: `number 0` — Typ-Mismatch          |

---

## Unterschied `held` vs. `nsc`

In `template.json` sind `held` und `nsc` strukturell **identisch**. Kein Unterschied in Templates, Feldern oder Defaults. Die Unterscheidung ist rein semantisch (Spielerfigur vs. Nicht-Spieler-Charakter) und wird im Code über Rollenpflichten unterschieden.

---

## Code-Querverweise (vollständig)

### `scripts/actors/data/actor.js`

- `system.attribute.IN.wert` → ini
- `system.attribute.MU.wert` → mr
- `system.attribute.GE.wert` → gs
- `system.attribute.KK.wert` → traglast
- `system.attribute.KO.wert` → ws, dh
- `system.abgeleitete.ini`, `.baseIni`, `.mr`, `.gs`, `.ws`, `.be`, `.dh`, `.traglast`, `.traglast_intervall`
- `system.abgeleitete.asp`, `.asp_zugekauft`, `.gasp`, `.asp_stern`
- `system.abgeleitete.kap`, `.kap_zugekauft`, `.gkap`, `.kap_stern`
- `system.gesundheit.hp.max`, `.hp.value`
- `system.schips.schips`

### `scripts/actors/data/held.js`

- `system.attribute.[X].wert`, `.pw` (alle 8 Attribute)
- `system.abgeleitete.ws_stern`, `.ws_beine`, `.ws_larm`, `.ws_rarm`, `.ws_bauch`, `.ws_brust`, `.ws_kopf`
- `system.abgeleitete.be`, `.be_traglast`, `.zauberer`, `.geweihter`
- `system.modifikatoren.verteidigungmod`, `.manuellermod`, `.nahkampfmod`
- `system.misc.ist_beritten`, `.selected_kampfstil`, `.selected_uebernatuerlicher_stil`
- `system.schips.schips`, `.schips_stern`
- `system.getragen`
- `system.notes`

### `scripts/actors/sheets/held.js`

- `system.schips.schips_stern` (schipsClick Action-Update)
- `system.notes` (enrichHTML für Foundry-Formatierung)
