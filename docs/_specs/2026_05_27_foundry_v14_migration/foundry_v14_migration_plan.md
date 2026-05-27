# Foundry VTT v13 → v14 Migration Plan

**Datum**: 2026-05-27  
**Status**: FINAL  
**Referenz**: [FOUNDRY_V14_MIGRATION.md](https://github.com/mordachai/vagabond/blob/main/FOUNDRY_V14_MIGRATION.md)

---

## 1. Objective

Das Ilaris FoundryVTT System auf Foundry VTT v14 kompatibel machen, indem alle breaking changes und shim-covered deprecations aus dem offiziellen Migrations-Guide behoben werden.

---

## 2. Assumptions

- Die Migration zielt auf Foundry VTT v14 (Build 14.360+) ab.
- v14 stellt Shims (Rückwärts-Kompatibilitäts-Getter/-Setter) für die meisten Active-Effect-API-Änderungen bereit, die bis v16 gültig sind — **eine frühe Migration vermeidet später größere Arbeit**.
- `Dialog` (AppV1) ist in v14 deprecated und wird in v16 entfernt. Die Migration zu `DialogV2` ist Teil des Plans.
- Node.js muss auf Version 24 aktualisiert werden (dev + prod).
- `compatibility.minimum: 14` und `compatibility.maximum: 14` — keine v13-Kompatibilität mehr.
- Die 7 `new Dialog(...)` Migrationen werden im gleichen PR wie Phase 1-3 durchgeführt.
- Node.js 24 ist bereits installiert.
- Der stale doppelte File `scripts/documents/active-effect.js` ist dead code und soll entfernt werden.

---

## 3. Findings — Codebase Scan

### 3.1 Breaking Changes (Sofortiger Handlungsbedarf für v14-Boot)

| #   | Priorität    | Datei                  | Zeile | Problem                                                                          |
| --- | ------------ | ---------------------- | ----- | -------------------------------------------------------------------------------- |
| B1  | **KRITISCH** | `scripts/core/init.js` | 63    | `CONFIG.ActiveEffect.legacyTransferral = false` — **in v14 entfernt, kein Shim** |
| B2  | **HOCH**     | `system.json`          | 7     | `compatibility.verified: 13` → muss `14` werden                                  |

### 3.2 Shim-covered Deprecations (Laufen in v14 mit Konsolen-Warnungen, brechen in v16)

| #   | Priorität | Datei(en)                                                                                                                                                                                                                       | Problem                                                                                |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| S1  | MITTEL    | `scripts/core/documents/active-effect.js:82`, `scripts/effects/dot-effects.js:57,59`                                                                                                                                            | `effect.changes` → `effect.system?.changes ?? []`                                      |
| S2  | MITTEL    | `scripts/core/documents/active-effect.js:85`, `scripts/effects/dot-effects.js:61`                                                                                                                                               | `change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM` → `change.type === "custom"`        |
| S3  | MITTEL    | `scripts/core/init.js` (~36 Zeilen: 138–352)                                                                                                                                                                                    | Numerische `mode:` Werte in `CONFIG.statusEffects` change-Objekten → `type:` Strings   |
| S4  | MITTEL    | `scripts/effects/effects-manager.js:46`                                                                                                                                                                                         | `mode: 2` → `type: "add"` in change-Objekt                                             |
| S5  | MITTEL    | `scripts/effects/effects-manager.js:46`                                                                                                                                                                                         | Top-level `changes: [...]` in `createEmbeddedDocuments` → `system: { changes: [...] }` |
| S6  | NIEDRIG   | `scripts/dice/wuerfel.js:98,159`, `scripts/waffe/sheets/waffe.js:132`, `scripts/combat/combat-api.js:160`, `scripts/importer/xml-character-import-dialogs.js:79,191`, `scripts/importer/xml_rule_importer/dialog-handler.js:15` | `new Dialog(...)` (7x) → `DialogV2`                                                    |

### 3.3 Dead Code

| #   | Datei                                | Problem                                                                                     |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| D1  | `scripts/documents/active-effect.js` | Stale Kopie von `scripts/core/documents/active-effect.js` — dead code, soll gelöscht werden |

### 3.4 Status: CLEAN (kein Handlungsbedarf)

- **MeasuredTemplate**: Nicht verwendet ✓
- **AppV1 Sheets** (`extends Application/FormApplication/DocumentSheet`): Nicht verwendet ✓
- **TinyMCE**: Nicht verwendet ✓
- **`CONST.CHAT_MESSAGE_TYPES`**: Nicht verwendet ✓
- **`CONST.MEASURED_TEMPLATE_TYPES`**: Nicht verwendet ✓
- **`foundry.prosemirror.defaultPlugins`**: Nicht verwendet ✓
- **`detectionModes` als Array**: Nicht verwendet ✓
- **`initializeEdges` Hook**: Nicht verwendet ✓
- **`_insertElement` Override**: Nicht vorhanden ✓
- **`prepareBaseData()` ohne `super`**: Ruft korrekt `super.prepareBaseData()` auf ✓
- **Manifest `minimumCoreVersion`/`compatibleCoreVersion`/`dependencies`**: Nicht vorhanden (modernes Format) ✓

---

## 4. Mode-Mapping: Numerische Werte → String-Schlüssel

Für die Migration von `mode: N` → `type: "string"`:

| Alter numerischer Wert | v13 Konstante | Neuer String-Wert |
| ---------------------- | ------------- | ----------------- |
| 0                      | `CUSTOM`      | `"custom"`        |
| 1                      | `MULTIPLY`    | `"multiply"`      |
| 2                      | `ADD`         | `"add"`           |
| 3                      | `DOWNGRADE`   | `"downgrade"`     |
| 4                      | `UPGRADE`     | `"upgrade"`       |
| 5                      | `OVERRIDE`    | `"override"`      |

Im Ilaris-Code verwendete Werte: **2 → `"add"`**, **4 → `"upgrade"`**, **5 → `"override"`**

---

## 5. Steps

### Phase 1: Breaking Changes (Pflicht für v14-Boot)

#### Schritt 1 — `system.json` Manifest aktualisieren

- **Was**: `compatibility.minimum: 14`, `compatibility.maximum: 14`, `compatibility.verified: "14.360"` setzen. Systemversion auf `14.0.0` bumpen.
- **Wo**: `system.json`
- **Wer**: code specialist
- **Depends on**: none

#### Schritt 2 — `CONFIG.ActiveEffect.legacyTransferral` entfernen

- **Was**: Die Zeile `CONFIG.ActiveEffect.legacyTransferral = false` aus `init.js` entfernen (in v14 entfernt, wirft Fehler).
- **Wo**: `scripts/core/init.js:63`
- **Wer**: code specialist
- **Depends on**: none

### Phase 2: Active Effects API Bereinigung (Shims → Clean Code)

#### Schritt 3 — `effect.changes` → `effect.system?.changes ?? []`

- **Was**: Alle Zugriffe auf `effect.changes` durch `effect.system?.changes ?? []` ersetzen.
- **Wo**:
    - `scripts/core/documents/active-effect.js:82`
    - `scripts/effects/dot-effects.js:57,59`
- **Wer**: code specialist
- **Depends on**: Schritt 2

#### Schritt 4 — `change.mode` → `change.type` in Lese-Logik

- **Was**: `change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM` → `change.type === "custom"` in Vergleichs-Logik.
- **Wo**:
    - `scripts/core/documents/active-effect.js:85`
    - `scripts/effects/dot-effects.js:61`
- **Wer**: code specialist
- **Depends on**: Schritt 3

#### Schritt 5 — Numerische `mode:` Werte in `CONFIG.statusEffects` → `type:` Strings

- **Was**: Alle ~36 Vorkommen von `mode: N` in change-Objekten in `CONFIG.statusEffects` durch `type: "string"` ersetzen (Mapping: 2→"add", 4→"upgrade", 5→"override"). Das `priority` Feld bleibt erhalten.
- **Wo**: `scripts/core/init.js` (Zeilen 138–352)
- **Wer**: code specialist
- **Depends on**: none (kann parallel zu Schritt 3/4 laufen)

#### Schritt 6 — `effects-manager.js` createEmbeddedDocuments aktualisieren

- **Was**: In `_createEffect()`:
    1. `mode: 2` → `type: "add"`
    2. Top-level `changes: [...]` → `system: { changes: [...] }`
- **Wo**: `scripts/effects/effects-manager.js:42-58`
- **Wer**: code specialist
- **Depends on**: none (kann parallel laufen)

### Phase 3: Dead Code Entfernen

#### Schritt 7 — Stale `active-effect.js` Kopie löschen

- **Was**: `scripts/documents/active-effect.js` löschen (dead code, aktive Imports zeigen auf `scripts/core/documents/active-effect.js`).
- **Wo**: `scripts/documents/active-effect.js`
- **Wer**: code specialist
- **Depends on**: Schritt 3+4 abgeschlossen (stale Datei referenziert die gleichen Pattern)

### Phase 4: Dialog AppV1 → DialogV2 Migration (v16-Preview)

#### Schritt 8 — `new Dialog(...)` → `DialogV2` (7 Vorkommen)

- **Was**: Alle 7 Vorkommen von `new Dialog({...}).render(true)` auf `foundry.applications.api.DialogV2` APIs migrieren. Muster-Vorlage: `scripts/items/sheets/effect-item.js:86` verwendet bereits `DialogV2.confirm()` korrekt.
- **Wo**:
    - `scripts/dice/wuerfel.js:98` — Roll-Formel-Dialog
    - `scripts/dice/wuerfel.js:159` — Attribut-Probe-Dialog
    - `scripts/waffe/sheets/waffe.js:132` — Waffen-Eigenschaft-Dialog
    - `scripts/combat/combat-api.js:160` — Ausweichen-Dialog
    - `scripts/importer/xml-character-import-dialogs.js:79` — Import-Bestätigungs-Dialog
    - `scripts/importer/xml-character-import-dialogs.js:191` — Sync-Bestätigungs-Dialog
    - `scripts/importer/xml_rule_importer/dialog-handler.js:15` — Regeln-Import-Dialog
- **Wer**: code specialist
- **Depends on**: Schritte 1-7 (separate Phase)

---

## 6. Validation Plan

### Nach Phase 1+2 (Breaking Changes + AE-Bereinigung)

```bash
# Node.js Version prüfen (muss 24+ sein)
node --version

# Lint und Tests
npm run lint
npm test

# Foundry V14 starten (separates Installationsverzeichnis)
# → System laden, keine Konsolen-Fehler zu CONFIG.ActiveEffect.legacyTransferral
# → Char-Sheet öffnen → Effekte anzeigen, Wunden-Status funktioniert
# → Status-Effekte (Furcht, Betäubung etc.) auf Token ziehen → prüfen ob Modifier korrekt angewendet werden
# → DOT-Effekte (Wunden-Änderung über Zeit) testen
```

### Nach Phase 3 (Dead Code)

```bash
npm test  # Keine Test-Regressions nach Löschung
```

### Nach Phase 4 (Dialog V2)

```bash
npm test
# Manuell: Jeden migrierten Dialog testen (Würfeln, Waffen-Eigenschaft hinzufügen, Ausweichen, Import)
```

### Erwartete Ergebnisse

- Keine Konsolen-Fehler zu `legacyTransferral`
- Keine Konsolen-Warnungen zu deprecated `effect.changes` / `change.mode`
- `compatibility.verified: 14` in system.json
- Alle bestehenden Tests bestehen

---

## 7. Delegation Map

| Schritt | Specialist | Input                                         | Expected Output                                                |
| ------- | ---------- | --------------------------------------------- | -------------------------------------------------------------- |
| 1       | code       | `system.json`                                 | `compatibility.verified: 14`, `version: "14.0.0"`              |
| 2       | code       | `scripts/core/init.js:63`                     | Zeile `CONFIG.ActiveEffect.legacyTransferral = false` entfernt |
| 3       | code       | `active-effect.js:82`, `dot-effects.js:57,59` | `effect.system?.changes ?? []`                                 |
| 4       | code       | `active-effect.js:85`, `dot-effects.js:61`    | `change.type === "custom"`                                     |
| 5       | code       | `scripts/core/init.js:138-352`                | ~36× `mode: N` → `type: "string"`                              |
| 6       | code       | `effects-manager.js:42-58`                    | `type: "add"`, `system: { changes: [...] }`                    |
| 7       | code       | `scripts/documents/active-effect.js`          | Datei gelöscht                                                 |
| 8       | code       | 7 Dialog-Dateien                              | `DialogV2` APIs                                                |

---

## 8. Entscheidungen (geklärt)

1. `compatibility.minimum: 14` und `compatibility.maximum: 14` — keine v13-Unterstützung mehr.
2. Die 7 `new Dialog(...)` Migrationen werden im gleichen PR durchgeführt.
3. Node.js 24 ist bereits installiert.

---

## 9. Ressourcen

- Migrations-Guide Referenz: https://github.com/mordachai/vagabond/blob/main/FOUNDRY_V14_MIGRATION.md
- Foundry API Docs: https://foundryvtt.com/api/
- ApplicationV2 Conversion Guide: https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide
- Active Effects Primer: https://foundryvtt.wiki/en/development/guides/active-effects
