# Actor-Typ: `kreatur`

Quellen: [template.json](../../../../template.json), [scripts/actors/data/kreatur.js](../../../../scripts/actors/data/kreatur.js), [comp_packs/kreaturen/\_source/Goblin_w22w8CJFB3NUNfIM.json](../../../../comp_packs/kreaturen/_source/Goblin_w22w8CJFB3NUNfIM.json)

---

## Template-Komposition

```
gesundheit, energien, initiative, furcht, modifikatoren, schips, attribute, initiative*
```

> ⚠️ **Inkonsistenz J-18**: `initiative` erscheint **zweimal** in der Templates-Liste — Copy-Paste-Fehler.

---

## Direkte Felder

| Feld               | Typ     | Default      | `system.X`-Pfad           | Goblin `_source/`              | Anmerkung                           |
| ------------------ | ------- | ------------ | ------------------------- | ------------------------------ | ----------------------------------- |
| `additemtype`      | string  | `"angriff"`  | `system.additemtype`      | ✅                             | Standard-Typ beim Item-Drop         |
| `edit`             | boolean | false        | `system.edit`             | ✅ false                       | UI-Bearbeitungsmodus-Toggle         |
| `kreaturentyp`     | string  | `"humanoid"` | `system.kreaturentyp`     | ✅ `"humanoid"`                | Kategorie-Bezeichnung               |
| `kurzbeschreibung` | string  | `""`         | `system.kurzbeschreibung` | ✅ `"rotpelzige Landplage..."` | Kurz-Flavour-Text                   |
| `kampfunfaehig`    | string  | `""`         | `system.kampfunfaehig`    | ✅ `""`                        | Bedingung für Kampfunfähigkeit      |
| `text`             | string  | `""`         | `system.text`             | ✅ `""`                        | Freitext / Statblock                |
| `talente`          | array   | `[]`         | `system.talente`          | ✅ `[]`                        | Inline-Talente als Freitext-Strings |
| `freietalente`     | array   | `[]`         | `system.freietalente`     | ✅ `[]`                        | Inline freie Talente                |

---

## `system.kampfwerte` — Vollständig

Direkt authored, nicht aus Template. Kreatur-Werte werden **manuell editiert**, nicht berechnet.

| Feld            | Typ    | Default                    | `system.X`-Pfad                   | Goblin   | Anmerkung                            |
| --------------- | ------ | -------------------------- | --------------------------------- | -------- | ------------------------------------ |
| `ws`            | number | 0                          | `system.kampfwerte.ws`            | ✅ 4     | Wundschwelle                         |
| `ws_stern`      | number | 0                          | `system.kampfwerte.ws_stern`      | ⚠️ null  | WS mit Rüstung; null = nicht gesetzt |
| `ini`           | number | 0                          | `system.kampfwerte.ini`           | ✅ 3     | Initiative                           |
| `baseIni`       | number | 0                          | `system.kampfwerte.baseIni`       | ❌ fehlt | **Delta J-06**                       |
| `gs`            | number | 1                          | `system.kampfwerte.gs`            | ✅ 5     | Geschwindigkeit                      |
| `koloss`        | number | 0                          | `system.kampfwerte.koloss`        | ⚠️ null  | null = kein Koloss-Status            |
| `mr`            | number | 0                          | `system.kampfwerte.mr`            | ✅ 4     | Magieresistenz                       |
| `gs_schwimmend` | —      | **nicht in template.json** | `system.kampfwerte.gs_schwimmend` | 🆕 null  | **Delta J-07**                       |

---

## `system.abgeleitete` — Kreatur (vereinfacht)

Kreatur hat ein stark vereinfachtes `abgeleitete`-Objekt — nur 3 Felder (gegenüber 17 beim Held).

| Feld                 | Typ    | Default | `system.X`-Pfad                         | Goblin   | Anmerkung            |
| -------------------- | ------ | ------- | --------------------------------------- | -------- | -------------------- |
| `globalermod`        | number | 0       | `system.abgeleitete.globalermod`        | ✅ 0     | Globaler Modifikator |
| `nahkampfmoddisplay` | string | `"-"`   | `system.abgeleitete.nahkampfmoddisplay` | ✅ `"-"` | Anzeigetext, runtime |
| `globalermoddisplay` | string | `"-"`   | `system.abgeleitete.globalermoddisplay` | ✅ `"-"` | Anzeigetext, runtime |

---

## Semantik: `attribute.pw` bei Kreatur

Bei Kreaturen hat `attribute.pw` eine **andere Bedeutung** als bei Helden:

| Aspekt            | Held                                            | Kreatur                                         |
| ----------------- | ----------------------------------------------- | ----------------------------------------------- |
| `wert`            | Editiert, Basis für Berechnungen                | Immer 0, ungenutzt                              |
| `pw`              | Runtime-berechnet (`2 * wert`), immer 0 im JSON | **Persistent gespeicherter absoluter Kampf-PW** |
| Beispiel (Goblin) | n/a                                             | `FF.pw = 10`, `GE.pw = 8`, `IN.pw = 6`          |

> ⚠️ **Semantik-Konflikt J-01**: Identisches Feld, völlig unterschiedliche Semantik je Actor-Typ.

---

## `system.talente` / `freietalente`

- `talente: []` — Array mit Freitext-Strings (kein Item-Embedding)
- `freietalente: []` — Array mit Freitext-Strings
- Zusätzlich können embedded Items vom Typ `freiestalent` existieren — diese entstehen durch `kreatur.js:_onDropItemCreate()` (Konvertierung beim Drop)

---

## Compendium-Delta: Goblin

Vergleich `template.json`-Schema vs. [`Goblin_w22w8CJFB3NUNfIM.json`](../../../../comp_packs/kreaturen/_source/Goblin_w22w8CJFB3NUNfIM.json):

| #   | Feld                                      | Status      | Details                                             |
| --- | ----------------------------------------- | ----------- | --------------------------------------------------- |
| 1   | `kampfwerte.baseIni`                      | ❌ fehlt    | In Template (default 0), nicht im JSON              |
| 2   | `kampfwerte.gs_schwimmend`                | 🆕 null     | Nicht in template.json, aber im JSON                |
| 3   | `modifikatoren.verteidigungmod`           | ❌ fehlt    | In Template definiert                               |
| 4   | `energien.*.max` / `energien.*.value`     | ⚠️ null     | Template: default 0, Source: null                   |
| 5   | `attribute.*.wert` alle 0                 | ✅ korrekt  | Kreaturen nutzen nur `.pw`                          |
| 6   | `kreatur.templates["initiative"]` doppelt | ⚠️ Duplikat | Kein praktischer Schaden, aber struktureller Fehler |

---

## Code-Querverweise (vollständig)

### `scripts/actors/data/kreatur.js`

- `system.modifikatoren.manuellermod`, `.nahkampfmod`, `.verteidigungmod`
- `system.gesundheit.hp.max`, `.hp.value`
- `system.kampfwerte.ws`, `.ini`, `.gs`, `.mr`
- `system.initiative`
- `system.kreaturentyp`
- `system.talente`, `system.freietalente`

### `scripts/actors/sheets/kreatur.js`

- Kontext wird via `super._prepareContext()` bereitgestellt
- `system.edit` (Bearbeitungsmodus-Toggle in der UI)
- `_onDropItemCreate()` → Konvertierung von `fertigkeit`/`uebernatuerliche_fertigkeit` zu `freiestalent`

### `scripts/actors/data/actor.js`

- `system.attribute.[attr].pw` (alle 8, für Kreatur-Kampfwertberechnung)
- `system.kampfwerte.ws`, `.ini`, `.mr`, `.gs`
