# Item-Gruppe A: Waffen

Item-Typen: `nahkampfwaffe`, `fernkampfwaffe`, `angriff`, `waffeneigenschaft`

Quellen: [template.json](../../../../template.json), [scripts/waffe/data/waffe.js](../../../../scripts/waffe/data/waffe.js), [scripts/items/data/angriff.js](../../../../scripts/items/data/angriff.js), [comp_packs/waffen/\_source/Schwert_QFuXFfsGkzF2ZGWI.json](../../../../comp_packs/waffen/_source/Schwert_QFuXFfsGkzF2ZGWI.json), [comp_packs/waffeneigenschaften/\_source/Schwer_XBeNRMIhcOIKtCKQ.json](../../../../comp_packs/waffeneigenschaften/_source/Schwer_XBeNRMIhcOIKtCKQ.json)

---

## Typ: `nahkampfwaffe`

**Templates:** `gesundheit` (Item) + `waffe` + `gegenstand`

**Direkte Felder:**

| Feld            | Typ    | Default | `system.X`-Pfad        | Schwert `_source/` | Anmerkung                                    |
| --------------- | ------ | ------- | ---------------------- | ------------------ | -------------------------------------------- |
| `wm_at`         | number | 0       | `system.wm_at`         | ✅ 0               | Waffenmodifikator Angriff                    |
| `wm_vt`         | number | 0       | `system.wm_vt`         | ✅ 0               | Waffenmodifikator Verteidigung               |
| `eigenschaften` | array  | `[]`    | `system.eigenschaften` | ✅                 | **Duplikat zu `waffe.eigenschaften`** (J-19) |

> ⚠️ Die direkten `wm_at`, `wm_vt`, `eigenschaften` Felder sind Duplikate der gleichnamigen Template-Felder aus `waffe`. Der Code nutzt primär die Template-Felder.

**Alle (Template + Direkt) Felder auf `nahkampfwaffe`:**

Aus `waffe`-Template: `tp`, `tpmod`, `eigenschaften`, `type`, `at`, `vt`, `rw`, `rw_mod`, `wm_at`, `wm_vt`, `kampftechnik`, `computed`  
Aus `gegenstand`-Template: `quantity`, `gewicht`, `gewicht_summe`, `preis`, `beschreibung`, `fundort`  
Aus `gesundheit`-Template: `haerte`, `beschaedigung`  
Direkt: `wm_at`, `wm_vt`, `eigenschaften` (redundant)

---

## Typ: `fernkampfwaffe`

**Templates:** `gesundheit` (Item) + `waffe` + `gegenstand`

**Direkte Felder:** identisch zu `nahkampfwaffe` + zwei weitere:

| Feld            | Typ    | Default | `system.X`-Pfad        | Anmerkung                                       |
| --------------- | ------ | ------- | ---------------------- | ----------------------------------------------- |
| `wm_at`         | —      | —       | —                      | Nicht in `fernkampfwaffe` (nur `nahkampfwaffe`) |
| `wm_fk`         | number | 0       | `system.wm_fk`         | FK-spezifischer WM                              |
| `lz`            | number | 0       | `system.lz`            | Ladezeit in Aktionen                            |
| `eigenschaften` | array  | `[]`    | `system.eigenschaften` | Waffeneigenschaften (Duplikat J-19)             |

---

## Typ: `angriff`

**Templates:** keine

> Angriff-Items sind **Kreatur-spezifisch** (embedded in Kreatur) oder werden direkt im Sheet als Angriff hinzugefügt. Keine Templates — alle Felder direkt.

**Alle Felder:**

| Feld             | Typ    | Default | `system.X`-Pfad         | Code-Querverweise    | Anmerkung                                     |
| ---------------- | ------ | ------- | ----------------------- | -------------------- | --------------------------------------------- |
| `eigenschaften`  | array  | `[]`    | `system.eigenschaften`  | `angriff.js:getTp()` |                                               |
| `tp`             | string | `""`    | `system.tp`             | `angriff.js:getTp()` | Schadensformel                                |
| `haerte`         | number | 0       | `system.haerte`         | —                    | Angriffs-Härtewert                            |
| `rw`             | number | 0       | `system.rw`             | `angriff.js`         | Reichweite                                    |
| `lz`             | number | 0       | `system.lz`             | —                    | Ladezeit                                      |
| `wm`             | number | 0       | `system.wm`             | —                    | Waffenmodifikator (**J-20**: ≠ `waffe.wm_at`) |
| `typ`            | string | `"Nah"` | `system.typ`            | `angriff.js`         | Schadenstyp ("Nah", "Fern" etc.)              |
| `at`             | number | 0       | `system.at`             | `angriff.js`         | Angriffswert                                  |
| `vt`             | number | 0       | `system.vt`             | `angriff.js`         | Verteidigungswert                             |
| `angriffmanover` | array  | `[]`    | `system.angriffmanover` | `angriff.js`         | Zugehörige Manöver-IDs                        |

> ⚠️ **Inkonsistenz J-20**: `angriff.wm` vs. `nahkampfwaffe.wm_at`/`wm_vt` — semantisch äquivalent, unterschiedliche Namen.

**Code-Querverweise:**

- `scripts/items/data/angriff.js:getTp()` — berechnet Trefferpunkte aus `system.tp`
- `scripts/items/data/manoever.js` — liest `system.angriffmanover` zur Manöver-Voraussetzungsprüfung

---

## Typ: `waffeneigenschaft`

**Templates:** keine

> ⚠️ **Duplikat J-17**: `waffeneigenschaft` erscheint zweimal in `Item.types` (Positionen 16 und 19).

**Alle Felder:**

| Feld                   | Typ    | Default                         | `system.X`-Pfad               | Schwer `_source/`         | Anmerkung                      |
| ---------------------- | ------ | ------------------------------- | ----------------------------- | ------------------------- | ------------------------------ |
| `sephrastoScript`      | string | `""`                            | `system.sephrastoScript`      | ✅                        | Sephrasto-Import-Script        |
| `foundryScript`        | string | `""`                            | `system.foundryScript`        | ✅                        | Foundry-Effekt-Script          |
| `text`                 | string | `""`                            | `system.text`                 | ✅                        | Beschreibung                   |
| `kategorie`            | string | `"modifier"`                    | `system.kategorie`            | ✅                        | Eigenschaftskategorie          |
| `parameterSlots`       | array  | `[]`                            | `system.parameterSlots`       | ⚠️ als Object `{0:{...}}` | **Typ-Mismatch J-13**          |
| `modifiers`            | object | (s.u.)                          | `system.modifiers`            | ✅                        | Modifikator-Objekt             |
| `wieldingRequirements` | object | (s.u.)                          | `system.wieldingRequirements` | ✅                        | Führungsvoraussetzungen        |
| `targetEffect`         | object | (s.u.)                          | `system.targetEffect`         | ✅                        | Effekt auf Ziel                |
| `actorModifiers`       | object | `{modifiers:[], conditions:[]}` | `system.actorModifiers`       | ✅                        | Modifikatoren auf träger Actor |
| `customScript`         | string | `""`                            | `system.customScript`         | ✅                        | Benutzerdefiniertes Script     |

**Unterstruktur `modifiers` (vollständig):**

| Unterfeld                        | Typ     | Default | Beschreibung            |
| -------------------------------- | ------- | ------- | ----------------------- |
| `modifiers.at`                   | number  | 0       | AT-Modifikator          |
| `modifiers.vt`                   | number  | 0       | VT-Modifikator          |
| `modifiers.schaden`              | number  | 0       | Schadens-Modifikator    |
| `modifiers.schadenFormula`       | string  | `""`    | Schadens-Formel         |
| `modifiers.rw`                   | number  | 0       | Reichweiten-Modifikator |
| `modifiers.fumbleThreshold`      | null    | null    | Patzer-Grenze           |
| `modifiers.critThreshold`        | null    | null    | Krit-Grenze             |
| `modifiers.ignoreCover`          | boolean | false   | Deckung ignorieren      |
| `modifiers.ignoreArmor`          | boolean | false   | Rüstung ignorieren      |
| `modifiers.additionalDice`       | number  | 0       | Zusätzliche Würfel      |
| `modifiers.conditionalModifiers` | array   | `[]`    | Bedingte Modifikatoren  |

**Unterstruktur `wieldingRequirements` (vollständig):**

| Unterfeld                                              | Typ     | Default             |
| ------------------------------------------------------ | ------- | ------------------- |
| `wieldingRequirements.hands`                           | number  | 1                   |
| `wieldingRequirements.ignoreNebenMalus`                | boolean | false               |
| `wieldingRequirements.noRider`                         | boolean | false               |
| `wieldingRequirements.requiresRider`                   | boolean | false               |
| `wieldingRequirements.penalties.hauptOnly`             | object  | `{}`                |
| `wieldingRequirements.penalties.nebenOnly`             | object  | `{}`                |
| `wieldingRequirements.penalties.nebenWithoutExemption` | object  | `{}`                |
| `wieldingRequirements.condition.type`                  | string  | `"attribute_check"` |
| `wieldingRequirements.condition.attribute`             | string  | `"KK"`              |
| `wieldingRequirements.condition.operator`              | string  | `"<"`               |
| `wieldingRequirements.condition.value`                 | number  | 0                   |
| `wieldingRequirements.condition.onFailure.at`          | number  | 0                   |
| `wieldingRequirements.condition.onFailure.vt`          | number  | 0                   |
| `wieldingRequirements.condition.onFailure.schaden`     | number  | 0                   |

**Unterstruktur `targetEffect`:**

| Unterfeld                                    | Typ    | Default    |
| -------------------------------------------- | ------ | ---------- |
| `targetEffect.trigger`                       | string | `"on_hit"` |
| `targetEffect.resistCheck.type`              | string | `"none"`   |
| `targetEffect.resistCheck.attackerAttribute` | string | `""`       |
| `targetEffect.resistCheck.defenderAttribute` | string | `""`       |
| `targetEffect.resistCheck.attackerModifier`  | number | 0          |
| `targetEffect.resistCheck.defenderModifier`  | number | 0          |
| `targetEffect.effect.type`                   | string | `"status"` |
| `targetEffect.effect.statusName`             | string | `""`       |
| `targetEffect.effect.duration`               | string | `""`       |
| `targetEffect.effect.icon`                   | string | `""`       |

**Code-Querverweise:**

- `scripts/waffe/data/waffe.js:_applyModifiers()` — liest `system.modifiers`, `system.parameterSlots`
- `scripts/waffe/data/waffe.js:_calculateWeaponStats()` — iteriert über `system.eigenschaften` auf Waffen-Items und verknüpft mit `waffeneigenschaft`-Compendium-Einträgen
