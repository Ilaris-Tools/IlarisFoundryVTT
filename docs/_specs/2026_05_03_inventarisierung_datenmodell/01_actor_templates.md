# Actor-Templates (expandiert)

Alle wiederverwendeten Templates aus `template.json` § `Actor.templates`.  
Quellen: [template.json](../../../../template.json), [scripts/actors/data/actor.js](../../../../scripts/actors/data/actor.js)

---

## Template: `gesundheit`

Verwendet von: `held`, `nsc`, `kreatur`

| Feld               | Typ     | Default              | `system.X`-Pfad                      | Alrik `_source/` | Goblin `_source/` |
| ------------------ | ------- | -------------------- | ------------------------------------ | ---------------- | ----------------- |
| `erschoepfung`     | number  | 0                    | `system.gesundheit.erschoepfung`     | ✅ 0             | ✅ 0              |
| `wunden`           | number  | 0                    | `system.gesundheit.wunden`           | ✅ 0             | ✅ 0              |
| `wundabzuege`      | number  | 0                    | `system.gesundheit.wundabzuege`      | ✅ 0             | ✅ 0              |
| `wundenignorieren` | boolean | false                | `system.gesundheit.wundenignorieren` | ✅ false         | ✅ false          |
| `display`          | string  | `"Volle Gesundheit"` | `system.gesundheit.display`          | ✅               | ✅                |
| `hp.max`           | number  | 9                    | `system.gesundheit.hp.max`           | ✅ 9             | ✅ 9              |
| `hp.value`         | number  | 9                    | `system.gesundheit.hp.value`         | ✅ 9             | ✅ 9              |
| `hp.threshold`     | number  | 0                    | `system.gesundheit.hp.threshold`     | ✅ 0             | ✅ 0              |

**Code-Querverweise:** `actor.js:prepareBaseData()` (hp.max bei LEP-System), `held.js:_calculateAbgeleitete()`

---

## Template: `energien`

Verwendet von: `kreatur` (held/nsc haben kein energien-Template)

| Feld                     | Typ    | Default | `system.X`-Pfad                 | Goblin `_source/` |
| ------------------------ | ------ | ------- | ------------------------------- | ----------------- |
| `energien.asp.max`       | number | 0       | `system.energien.asp.max`       | ⚠️ null           |
| `energien.asp.value`     | number | 0       | `system.energien.asp.value`     | ⚠️ null           |
| `energien.asp.threshold` | number | 0       | `system.energien.asp.threshold` | ✅ 0              |
| `energien.gup.max`       | number | 0       | `system.energien.gup.max`       | ⚠️ null           |
| `energien.gup.value`     | number | 0       | `system.energien.gup.value`     | ⚠️ null           |
| `energien.gup.threshold` | number | 0       | `system.energien.gup.threshold` | ✅ 0              |
| `energien.kap.max`       | number | 0       | `system.energien.kap.max`       | ⚠️ null           |
| `energien.kap.value`     | number | 0       | `system.energien.kap.value`     | ⚠️ null           |
| `energien.kap.threshold` | number | 0       | `system.energien.kap.threshold` | ✅ 0              |

> ⚠️ **Delta**: max/value sind in Compendium-Quellen `null` statt `0`.

---

## Template: `furcht`

Verwendet von: `held`, `nsc`, `kreatur`

| Feld            | Typ    | Default | `system.X`-Pfad               | Alrik | Goblin |
| --------------- | ------ | ------- | ----------------------------- | ----- | ------ |
| `furchtstufe`   | number | 0       | `system.furcht.furchtstufe`   | ✅ 0  | ✅ 0   |
| `furchtabzuege` | number | 0       | `system.furcht.furchtabzuege` | ✅ 0  | ✅ 0   |
| `display`       | string | `""`    | `system.furcht.display`       | ✅    | ✅     |

---

## Template: `modifikatoren`

Verwendet von: `held`, `nsc`, `kreatur`

| Feld              | Typ    | Default | `system.X`-Pfad                        | Alrik    | Goblin   |
| ----------------- | ------ | ------- | -------------------------------------- | -------- | -------- |
| `manuellermod`    | number | 0       | `system.modifikatoren.manuellermod`    | ✅ 0     | ✅ 0     |
| `nahkampfmod`     | number | 0       | `system.modifikatoren.nahkampfmod`     | ✅ 0     | ✅ 0     |
| `verteidigungmod` | number | 0       | `system.modifikatoren.verteidigungmod` | ❌ fehlt | ❌ fehlt |

> ⚠️ **Delta J-04**: `verteidigungmod` ist in `template.json` definiert, fehlt aber in allen `_source/`-JSONs.

**Code-Querverweise:** `held.js`, `kreatur.js` → `system.modifikatoren.verteidigungmod`

---

## Template: `misc`

Verwendet von: `held`, `nsc` (kreatur hat kein `misc`)

| Feld                              | Typ     | Default  | `system.X`-Pfad                               | Alrik    |
| --------------------------------- | ------- | -------- | --------------------------------------------- | -------- |
| `selected_kampfstil`              | string  | `"ohne"` | `system.misc.selected_kampfstil`              | ✅       |
| `selected_uebernatuerlicher_stil` | string  | `"ohne"` | `system.misc.selected_uebernatuerlicher_stil` | ✅       |
| `ist_beritten`                    | boolean | false    | `system.misc.ist_beritten`                    | ✅ false |

**Code-Querverweise:** `held.js` → Kampfstil-Auswahl, `actor.js` → berittener Kampf

---

## Template: `initiative`

Verwendet von: `held`, `nsc`, `kreatur` (kreatur hat `initiative` zweimal — Duplikat J-18)

| Feld         | Typ    | Default | `system.X`-Pfad     | Alrik | Goblin |
| ------------ | ------ | ------- | ------------------- | ----- | ------ |
| `initiative` | number | 0       | `system.initiative` | ✅ 0  | ✅ 0   |

> Das Feld `initiative` auf dem Actor ist das Foundry-Initiative-Feld für den Combat Tracker. Es wird runtime-gesetzt aus `abgeleitete.ini` (held) bzw. `kampfwerte.ini` (kreatur).

---

## Template: `abgeleitete`

Verwendet von: `held`, `nsc` (kreatur hat eigenes vereinfachtes `abgeleitete`)

| Feld                 | Typ    | Default | `system.X`-Pfad                         | Alrik    | Berechnung                           |
| -------------------- | ------ | ------- | --------------------------------------- | -------- | ------------------------------------ |
| `globalermod`        | number | 0       | `system.abgeleitete.globalermod`        | ✅ 0     | Manuell                              |
| `ws`                 | number | 0       | `system.abgeleitete.ws`                 | ✅ 0     | `4 + floor(KO/4)`                    |
| `ws_stern`           | number | 0       | `system.abgeleitete.ws_stern`           | ✅ 0     | `ws + Σ(Rüstung.rs)`                 |
| `be`                 | number | 0       | `system.abgeleitete.be`                 | ✅ 0     | `Σ(aktive Rüstung.be) + be_traglast` |
| `be_traglast`        | number | 0       | `system.abgeleitete.be_traglast`        | ✅ 0     | `hardcoded.beTraglast()`             |
| `ws_beine`           | number | 0       | `system.abgeleitete.ws_beine`           | ✅ 0     | `ws + Rüstung.rs_beine`              |
| `ws_larm`            | number | 0       | `system.abgeleitete.ws_larm`            | ✅ 0     |                                      |
| `ws_rarm`            | number | 0       | `system.abgeleitete.ws_rarm`            | ✅ 0     |                                      |
| `ws_bauch`           | number | 0       | `system.abgeleitete.ws_bauch`           | ✅ 0     |                                      |
| `ws_brust`           | number | 0       | `system.abgeleitete.ws_brust`           | ✅ 0     |                                      |
| `ws_kopf`            | number | 0       | `system.abgeleitete.ws_kopf`            | ✅ 0     |                                      |
| `mr`                 | number | 0       | `system.abgeleitete.mr`                 | ✅ 0     | `4 + floor(MU/4)`                    |
| `gs`                 | number | 0       | `system.abgeleitete.gs`                 | ✅ 0     | `4 + floor(GE/4) - be`               |
| `ini`                | number | 0       | `system.abgeleitete.ini`                | ✅ 0     | `IN.wert` (custom script möglich)    |
| `baseIni`            | number | 0       | `system.abgeleitete.baseIni`            | ❌ fehlt | Wie `ini`                            |
| `dh`                 | number | 0       | `system.abgeleitete.dh`                 | ✅ 0     | `KO.wert - 2*(be - be_traglast)`     |
| `traglast_intervall` | number | 0       | `system.abgeleitete.traglast_intervall` | ✅ 0     | `KK.wert`                            |
| `traglast`           | number | 0       | `system.abgeleitete.traglast`           | ✅ 0     | `2 * KK.wert`                        |

> ⚠️ **Delta J-05**: `baseIni` fehlt in Alrik-Source.

**Nicht in template.json, aber persistent gespeichert (🆕):**

| Feld            | `system.X`-Pfad                    | Alrik   | Herkunft            |
| --------------- | ---------------------------------- | ------- | ------------------- |
| `asp_zugekauft` | `system.abgeleitete.asp_zugekauft` | 🆕 null | Manuell eingetragen |
| `gasp`          | `system.abgeleitete.gasp`          | 🆕 null | Verbrauchte AsP     |
| `asp_stern`     | `system.abgeleitete.asp_stern`     | 🆕 8    | Max-AsP (Anzeige)   |
| `kap_zugekauft` | `system.abgeleitete.kap_zugekauft` | —       | Analog zu asp       |
| `gkap`          | `system.abgeleitete.gkap`          | —       |                     |
| `kap_stern`     | `system.abgeleitete.kap_stern`     | —       |                     |

**Runtime-only (nicht persistiert):**

- `system.abgeleitete.asp` — berechnet: `asp_zugekauft - gasp`
- `system.abgeleitete.kap` — berechnet: `kap_zugekauft - gkap`
- `system.abgeleitete.zauberer` — boolean: `asp > 0`
- `system.abgeleitete.geweihter` — boolean: `kap > 0`

---

## Template: `schips`

Verwendet von: `held`, `nsc`, `kreatur`

| Feld           | Typ    | Default | `system.X`-Pfad              | Alrik | Goblin |
| -------------- | ------ | ------- | ---------------------------- | ----- | ------ |
| `schips`       | number | 4       | `system.schips.schips`       | ✅ 4  | ✅ 4   |
| `schips_stern` | number | 4       | `system.schips.schips_stern` | ✅ 4  | ✅ 4   |

> `schips` wird runtime-berechnet via `calculateValue('SchiP', 4)` (custom script möglich), `schips_stern` ist der persistierte Maximalwert.

---

## Template: `attribute`

Verwendet von: `held`, `nsc`, `kreatur`

> ⚠️ **Semantik-Konflikt J-01**: `pw` hat bei Held und Kreatur entgegengesetzte Bedeutung — siehe [02_actor_held_nsc.md](02_actor_held_nsc.md) und [03_actor_kreatur.md](03_actor_kreatur.md).

Attribute: CH, FF, GE, IN, KK, KL, KO, MU

| Feld                | Typ    | Default | `system.X`-Pfad            | Alrik `.wert` | Alrik `.pw` | Goblin `.wert` | Goblin `.pw` |
| ------------------- | ------ | ------- | -------------------------- | ------------- | ----------- | -------------- | ------------ |
| `attribute.CH.wert` | number | 0       | `system.attribute.CH.wert` | 2             | 0           | 0              | 4            |
| `attribute.CH.pw`   | number | 0       | `system.attribute.CH.pw`   | 0             | —           | —              | 4            |
| `attribute.FF.wert` | number | 0       | `system.attribute.FF.wert` | 3             | 0           | 0              | 10           |
| `attribute.GE.wert` | number | 0       | `system.attribute.GE.wert` | 3             | 0           | 0              | 8            |
| `attribute.IN.wert` | number | 0       | `system.attribute.IN.wert` | 3             | 0           | 0              | 6            |
| `attribute.KK.wert` | number | 0       | `system.attribute.KK.wert` | 5             | 0           | 0              | 4            |
| `attribute.KL.wert` | number | 0       | `system.attribute.KL.wert` | 0             | 0           | 0              | 4            |
| `attribute.KO.wert` | number | 0       | `system.attribute.KO.wert` | 6             | 0           | 0              | 4            |
| `attribute.MU.wert` | number | 0       | `system.attribute.MU.wert` | 3             | 0           | 0              | 4            |

---

## Template: `geld`

Verwendet von: `held`, `nsc` (kreatur hat kein `geld`)

| Feld          | Typ    | Default | `system.X`-Pfad           | Alrik |
| ------------- | ------ | ------- | ------------------------- | ----- |
| `dukaten`     | number | 0       | `system.geld.dukaten`     | ✅ 0  |
| `silbertaler` | number | 0       | `system.geld.silbertaler` | ✅ 12 |
| `heller`      | number | 0       | `system.geld.heller`      | ✅ 40 |
| `kreuzer`     | number | 0       | `system.geld.kreuzer`     | ✅ 11 |
