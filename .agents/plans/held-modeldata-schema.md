## Implementation Plan: TypeDataModel-Schema für Actor-Typ „Held"

### Objective

Implement a Foundry VTT `TypeDataModel` subclass (`HeldModel`) for the `held` actor type that formally declares all fields from `template.json` and the computed fields used in `scripts/actors/data/actor.js`, replacing the untyped `system` object with a validated, self-documenting data model.

---

### Assumptions

- The project targets Foundry VTT v12/v13 where `foundry.abstract.TypeDataModel` is the correct base class for actor system data.
- The `template.json` is the source of truth for stored fields; computed fields (e.g. `abgeleitete.ws_stern`) are derived at runtime and **need not** be persisted — they are `prepareDerivedData()` outputs and can be declared as non-schema helper fields if needed.
- The existing `HeldActor` class (`scripts/actors/data/held.js`) keeps its role as the `Actor` document subclass; `HeldModel` is a separate **data model** that describes `this.system` only.
- The `fertigkeiten` template referenced in `template.json` under `held.templates` has no corresponding definition block in `template.json`. **Confirmed**: `fertigkeiten` are embedded Items assigned to the actor — they are **not** `system` data fields and must **not** appear in `HeldModel.defineSchema()`. They are accessed at runtime via `actor.items` (e.g. `actor.profan.fertigkeiten`).
- The field `abgeleitete.asp_zugekauft`, `abgeleitete.gasp`, `abgeleitete.kap_zugekauft`, `abgeleitete.gkap` appear in `scripts/actors/data/actor.js` but are absent from `template.json`. These must be added to both `template.json` and `HeldModel`. `[NEEDS INPUT]` — confirm default values.
- Existing compendium data (`comp_packs/beispiel-helden/_source/`) must remain forward-compatible; no migration is needed if new fields have sensible defaults.
- Tests must use the existing Jest infrastructure (`jest.config.mjs`, `jest.setup.js`).

---

### Field Inventory

The following table maps every `system.*` field for the `held` actor type as resolved from `template.json` templates plus runtime usage in `actor.js`.

> **Note**: `fertigkeiten` (profan and übernatürlich) are **not** system data fields. They are embedded Items (`type: "fertigkeit"`, `type: "uebernatuerliche_fertigkeit"`, etc.) stored in `actor.items` and accessed at runtime via helper getters (e.g. `actor.profan.fertigkeiten`). They must **not** appear in `HeldModel.defineSchema()`.

#### Template: `gesundheit` → `system.gesundheit`

| Field                            | Type    | Default           | Source        |
| -------------------------------- | ------- | ----------------- | ------------- |
| `gesundheit.erschoepfung`        | Number  | `0`               | template.json |
| `gesundheit.wunden`              | Number  | `0`               | template.json |
| `gesundheit.wundabzuege`         | Number  | `0`               | template.json |
| `gesundheit.wundenignorieren`    | Boolean | `false`           | template.json |
| `gesundheit.display`             | String  | `"Volle Gesundheit"` | template.json |
| `gesundheit.hp.max`              | Number  | `9`               | template.json |
| `gesundheit.hp.value`            | Number  | `9`               | template.json |
| `gesundheit.hp.threshold`        | Number  | `0`               | template.json |

#### Template: `attribute` → `system.attribute`

Each of the 8 attributes (`CH`, `FF`, `GE`, `IN`, `KK`, `KL`, `KO`, `MU`):

| Field                    | Type   | Default | Source        |
| ------------------------ | ------ | ------- | ------------- |
| `attribute.<ATTR>.wert`  | Number | `0`     | template.json |
| `attribute.<ATTR>.pw`    | Number | `0`     | template.json (computed by `_calculatePWAttribute`) |

#### Template: `abgeleitete` → `system.abgeleitete`

| Field                            | Type   | Default | Source              |
| -------------------------------- | ------ | ------- | ------------------- |
| `abgeleitete.globalermod`        | Number | `0`     | template.json       |
| `abgeleitete.ws`                 | Number | `0`     | template.json       |
| `abgeleitete.ws_stern`           | Number | `0`     | template.json       |
| `abgeleitete.be`                 | Number | `0`     | template.json       |
| `abgeleitete.be_traglast`        | Number | `0`     | template.json       |
| `abgeleitete.ws_beine`           | Number | `0`     | template.json       |
| `abgeleitete.ws_larm`            | Number | `0`     | template.json       |
| `abgeleitete.ws_rarm`            | Number | `0`     | template.json       |
| `abgeleitete.ws_bauch`           | Number | `0`     | template.json       |
| `abgeleitete.ws_brust`           | Number | `0`     | template.json       |
| `abgeleitete.ws_kopf`            | Number | `0`     | template.json       |
| `abgeleitete.mr`                 | Number | `0`     | template.json       |
| `abgeleitete.gs`                 | Number | `0`     | template.json       |
| `abgeleitete.ini`                | Number | `0`     | template.json       |
| `abgeleitete.baseIni`            | Number | `0`     | template.json       |
| `abgeleitete.dh`                 | Number | `0`     | template.json       |
| `abgeleitete.traglast_intervall` | Number | `0`     | template.json       |
| `abgeleitete.traglast`           | Number | `0`     | template.json       |
| `abgeleitete.asp`                | Number | `0`     | actor.js runtime    |
| `abgeleitete.asp_stern`          | Number | `0`     | actor.js runtime    |
| `abgeleitete.asp_zugekauft`      | Number | `0`     | actor.js `[NEEDS INPUT]` |
| `abgeleitete.gasp`               | Number | `0`     | actor.js `[NEEDS INPUT]` |
| `abgeleitete.kap`                | Number | `0`     | actor.js runtime    |
| `abgeleitete.kap_stern`          | Number | `0`     | actor.js runtime    |
| `abgeleitete.kap_zugekauft`      | Number | `0`     | actor.js `[NEEDS INPUT]` |
| `abgeleitete.gkap`               | Number | `0`     | actor.js `[NEEDS INPUT]` |

#### Template: `schips` → `system.schips`

| Field                   | Type   | Default | Source        |
| ----------------------- | ------ | ------- | ------------- |
| `schips.schips`         | Number | `4`     | template.json |
| `schips.schips_stern`   | Number | `4`     | template.json |

#### Template: `initiative` → `system.initiative`

| Field        | Type   | Default | Source        |
| ------------ | ------ | ------- | ------------- |
| `initiative` | Number | `0`     | template.json |

#### Template: `furcht` → `system.furcht`

| Field                   | Type   | Default | Source        |
| ----------------------- | ------ | ------- | ------------- |
| `furcht.furchtstufe`    | Number | `0`     | template.json |
| `furcht.furchtabzuege`  | Number | `0`     | template.json |
| `furcht.display`        | String | `""`    | template.json |

#### Template: `modifikatoren` → `system.modifikatoren`

| Field                          | Type   | Default | Source        |
| ------------------------------ | ------ | ------- | ------------- |
| `modifikatoren.manuellermod`   | Number | `0`     | template.json |
| `modifikatoren.nahkampfmod`    | Number | `0`     | template.json |
| `modifikatoren.verteidigungmod`| Number | `0`     | template.json |

#### Template: `misc` → `system.misc`

| Field                                  | Type    | Default  | Source        |
| -------------------------------------- | ------- | -------- | ------------- |
| `misc.selected_kampfstil`              | String  | `"ohne"` | template.json |
| `misc.selected_uebernatuerlicher_stil` | String  | `"ohne"` | template.json |
| `misc.ist_beritten`                    | Boolean | `false`  | template.json |

#### Template: `geld` → `system.geld`

| Field               | Type   | Default | Source        |
| ------------------- | ------ | ------- | ------------- |
| `geld.dukaten`      | Number | `0`     | template.json |
| `geld.silbertaler`  | Number | `0`     | template.json |
| `geld.heller`       | Number | `0`     | template.json |
| `geld.kreuzer`      | Number | `0`     | template.json |

#### Held-eigene Felder

| Field      | Type   | Default | Source        |
| ---------- | ------ | ------- | ------------- |
| `getragen` | Number | `0`     | template.json |
| `notes`    | String | `""`    | template.json |

---

### Steps

1. **Inventarisierung abschließen** — Fehlende Felder aus `actor.js` klären
    - **What**: Confirm values and defaults for `asp_zugekauft`, `gasp`, `kap_zugekauft`, `gkap` by tracing all read/write access in `scripts/actors/data/actor.js` and `scripts/actors/data/hardcodedvorteile.js`.
    - **Where**: `scripts/actors/data/actor.js`, `scripts/actors/data/hardcodedvorteile.js`
    - **Who**: code specialist
    - **Depends on**: none

2. **`template.json` ergänzen** — Fehlende Felder (ASP/KAP-Hilfswerte) unter `abgeleitete` nachtragen
    - **What**: Add `asp_zugekauft`, `gasp`, `kap_zugekauft`, `gkap` with default `0` to the `abgeleitete` template block in `template.json`.
    - **Where**: `template.json` — `Actor.templates.abgeleitete.abgeleitete`
    - **Who**: code specialist
    - **Depends on**: Step 1

3. **`HeldModel` TypeDataModel-Klasse erstellen** — Neue Datei `scripts/actors/data/held-model.js`
    - **What**: Create `HeldModel extends foundry.abstract.TypeDataModel` with a `static defineSchema()` method that declares all fields from the Field Inventory table above using `foundry.data.fields.*` classes (e.g. `NumberField`, `StringField`, `BooleanField`, `SchemaField`). No migration logic — only schema definition and `prepareDerivedData()` override that delegates to the parent `HeldActor` computation pipeline.
    - **Where**: `scripts/actors/data/held-model.js` _(new file)_
    - **Who**: code specialist
    - **Depends on**: Step 2
    - **Reference schema pattern**:
      ```js
      // scripts/actors/data/held-model.js
      const { TypeDataModel } = foundry.abstract
      const fields = foundry.data.fields

      export class HeldModel extends TypeDataModel {
          static defineSchema() {
              return {
                  gesundheit: new fields.SchemaField({
                      erschoepfung: new fields.NumberField({ required: true, initial: 0 }),
                      wunden: new fields.NumberField({ required: true, initial: 0 }),
                      // ...
                      hp: new fields.SchemaField({
                          max: new fields.NumberField({ required: true, initial: 9 }),
                          value: new fields.NumberField({ required: true, initial: 9 }),
                          threshold: new fields.NumberField({ required: true, initial: 0 }),
                      }),
                  }),
                  attribute: new fields.SchemaField({
                      CH: new fields.SchemaField({ wert: new fields.NumberField({ initial: 0 }), pw: new fields.NumberField({ initial: 0 }) }),
                      // ... FF, GE, IN, KK, KL, KO, MU
                  }),
                  // ... all templates
                  getragen: new fields.NumberField({ required: true, initial: 0 }),
                  notes: new fields.StringField({ required: true, initial: '' }),
              }
          }
      }
      ```

4. **Modell in Foundry registrieren** — `HeldModel` als `dataModels.Actor` registrieren
    - **What**: In `scripts/core/init.js` inside the `Hooks.once('init', ...)` block, add `CONFIG.Actor.dataModels.held = HeldModel`.
    - **Where**: `scripts/core/init.js`
    - **Who**: code specialist
    - **Depends on**: Step 3

5. **Proxy anpassen (optional)** — Prüfen, ob `IlarisActorProxy` weiterhin korrekt funktioniert
    - **What**: Verify that the `IlarisActorProxy` in `scripts/actors/data/proxy.js` still correctly routes `held` type actors after the model registration. If `TypeDataModel` registration causes the proxy constructor to conflict, investigate and resolve.
    - **Where**: `scripts/actors/data/proxy.js`
    - **Who**: code specialist
    - **Depends on**: Step 4

6. **Tests schreiben** — Jest-Tests für `HeldModel.defineSchema()` hinzufügen
    - **What**: Create `scripts/actors/_spec/held-model.spec.js` with tests that:
      - Instantiate `HeldModel` with empty data and verify all defaults are applied
      - Verify numeric fields reject non-numeric input
      - Verify all 8 attributes are present with `wert` and `pw`
      - Verify `getragen` and `notes` default values
    - **Where**: `scripts/actors/_spec/held-model.spec.js` _(new file)_
    - **Who**: code specialist
    - **Depends on**: Step 3

7. **Dokumentation** — Mapping alt → neu dokumentieren
    - **What**: Add a section to `docs/develop/` (or extend `CONTRIBUTING.md`) that documents the old `template.json`-based untyped model vs. the new `TypeDataModel`-based approach for `held`, including the field inventory table from this plan.
    - **Where**: `docs/develop/held-modeldata.md` _(new file)_
    - **Who**: docs specialist
    - **Depends on**: Step 3

---

### Validation Plan

| Step | Validation                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------- |
| 1    | All `asp_zugekauft`, `gasp`, `kap_zugekauft`, `gkap` usages confirmed with defaults documented    |
| 2    | `npm run lint` passes; `template.json` valid JSON; no existing compendium data broken              |
| 3    | `npm run lint` passes on new file; `HeldModel.defineSchema()` returns an object with all expected keys |
| 4    | Foundry `init` hook runs without errors; `CONFIG.Actor.dataModels.held` is set                    |
| 5    | Proxy still dispatches `held` → `HeldActor`; no constructor errors in browser console             |
| 6    | `npm test` passes; all new `held-model.spec.js` tests green                                       |
| 7    | Documentation renders via MkDocs; `npm run lint` passes                                           |

**Global checks:**

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Example hero from `comp_packs/beispiel-helden/_source/` loads without errors in Foundry
- [ ] HeldenSheet renders all tabs without console errors

---

### Delegation Map

| Step | Specialist | Input                                                                              | Expected Output                                              |
| ---- | ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | code       | `actor.js`, `hardcodedvorteile.js`                                                | List of missing fields with confirmed defaults               |
| 2    | code       | `template.json`, Step 1 findings                                                  | Updated `template.json` with missing `abgeleitete` fields    |
| 3    | code       | Field Inventory table (this doc), `template.json`, Foundry TypeDataModel API docs | `scripts/actors/data/held-model.js` with full `defineSchema()` |
| 4    | code       | `scripts/core/init.js`, Step 3 artifact                                           | Updated `init.js` registering `HeldModel`                    |
| 5    | code       | `scripts/actors/data/proxy.js`, Step 4 artifact                                   | Verified/updated proxy                                       |
| 6    | code       | Step 3 artifact, existing test patterns in `_spec/`                               | `scripts/actors/_spec/held-model.spec.js`                    |
| 7    | docs       | Field Inventory table, Step 3 artifact                                            | `docs/develop/held-modeldata.md`                             |
