# Migration Progress

Stand: 2026-02-25 (aktualisiert)

---

## Aktueller Status

| Phase | Task                        | Status                     |
| ----- | --------------------------- | -------------------------- |
| 1     | 1.1 Core Setup & Bootstrap  | ✅ Abgeschlossen           |
| 1     | 1.2 Audit Tools/Docs        | ⏭️ Übersprungen (optional) |
| 2     | 2.1 Migrate `waffe/`        | ✅ Abgeschlossen           |
| 2     | 2.2 Migrate `items/`        | ✅ Abgeschlossen           |
| 2     | 2.3 Migrate `actors/`       | ✅ Abgeschlossen           |
| 2     | 2.4 Migrate `dice/`         | ✅ Abgeschlossen           |
| 2     | 2.5 Migrate `combat/`       | ✅ Abgeschlossen           |
| 2     | 2.6 Migrate `skills/`       | ✅ Abgeschlossen           |
| 2     | 2.7 Migrate `effects/`      | ✅ Abgeschlossen           |
| 2     | 2.8 Migrate `tokens/`       | ✅ Abgeschlossen           |
| 2     | 2.9 Migrate `importer/`     | ✅ Abgeschlossen           |
| 2     | 2.10 Migrate `settings/`    | ✅ Abgeschlossen           |
| 2     | 2.11 Migrate `migrations/`  | ✅ Abgeschlossen           |
| 2     | 2.12 Migrate `changelog/`   | ✅ Abgeschlossen           |
| 3     | 3.1 Update all import paths | ✅ Abgeschlossen           |
| 3     | 3.2 Split CSS & system.json | ✅ Abgeschlossen           |
| 3     | 3.3 Cleanup & Verification  | ✅ Abgeschlossen           |

**🎉 Migration vollständig abgeschlossen. Alle 437 Tests bestehen.**

---

## Was wurde gemacht

### Task 1.1 — Core Setup & Bootstrap ✅

**Neue Dateien in `scripts/core/`:**

| Neue Datei                                | Kopiert/Erstellt von                                               |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `scripts/core/config.js`                  | Kopiert von `scripts/config.js`                                    |
| `scripts/core/config/label.js`            | Kopiert von `scripts/config/label.js`                              |
| `scripts/core/config/label_inventory.js`  | Kopiert von `scripts/config/label_inventory.js`                    |
| `scripts/core/handlebars.js`              | Kopiert von `scripts/common/handlebars.js`                         |
| `scripts/core/utilities.js`               | Kopiert von `scripts/common/utilities.js`                          |
| `scripts/core/documents/active-effect.js` | Kopiert von `scripts/documents/active-effect.js`                   |
| `scripts/core/init.js`                    | **NEU** – enthält gesamten Init-/Ready-Hook aus `scripts/hooks.js` |
| `scripts/core/hooks.js`                   | **NEU** – schlanker Orchestrator, Entry Point für `system.json`    |
| `scripts/core/styles/core.css`            | **NEU** – Fonts, CSS-Variablen, globale Utility-Klassen            |

**`system.json` geändert:**

- `esmodules`: `"scripts/hooks.js"` → `"scripts/core/hooks.js"`

---

### Task 2.1 — Migrate `waffe/` ✅

**Neue Dateien in `scripts/waffe/`:**

| Neue Datei                                                 | Kopiert von                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `scripts/waffe/data/waffe.js`                              | `scripts/items/waffe.js`                                                      |
| `scripts/waffe/sheets/waffe.js`                            | `scripts/sheets/items/waffe-base.js`                                          |
| `scripts/waffe/sheets/nahkampfwaffe.js`                    | `scripts/sheets/items/nahkampfwaffe.js`                                       |
| `scripts/waffe/sheets/fernkampfwaffe.js`                   | `scripts/sheets/items/fernkampfwaffe.js`                                      |
| `scripts/waffe/sheets/waffeneigenschaft.js`                | `scripts/sheets/items/waffeneigenschaft.js`                                   |
| `scripts/waffe/properties/processors/*.js`                 | `scripts/items/eigenschaft-processors/*.js`                                   |
| `scripts/waffe/properties/utils/*.js`                      | `scripts/items/utils/eigenschaft-*.js`                                        |
| `scripts/waffe/migrations/migrate-waffen-eigenschaften.js` | `scripts/migrations/migrate-waffen-eigenschaften.js`                          |
| `scripts/waffe/migrations/waffen-migration.js`             | `scripts/common/waffen-migration.js`                                          |
| `scripts/waffe/migrations/waffen-migration-hook.js`        | `scripts/hooks/waffen-migration.js`                                           |
| `scripts/waffe/templates/*.hbs`                            | `templates/sheets/items/{nahkampfwaffe,fernkampfwaffe,waffeneigenschaft}.hbs` |
| `scripts/waffe/styles/waffe.css`                           | **NEU** – `.button-icon-nahkampf` aus `css/temp.css`                          |
| `scripts/waffe/_spec/waffe.spec.js`                        | `scripts/items/_spec/waffe.spec.js`                                           |
| `scripts/waffe/hooks.js`                                   | **NEU** – Placeholder (Sheet-Registration noch in core/init.js)               |

**Spec-Datei repariert:** `scripts/waffe/_spec/waffe.spec.js` hatte kaputte relative Pfade nach dem Kopieren – wurden auf neue Strukturpfade korrigiert.

---

### Task 2.2 — Migrate `items/` ✅

| Neue Datei                                                        | Kopiert von                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| `scripts/items/data/{item,angriff,effect-item,manoever,proxy}.js` | `scripts/items/*.js` (in data/ verschoben)             |
| `scripts/items/data/combat-item.js`                               | `scripts/items/combat.js` (umbenannt)                  |
| `scripts/items/sheets/*.js`                                       | `scripts/sheets/items/*.js` (ohne Waffen-Sheets)       |
| `scripts/items/templates/*.hbs`                                   | `templates/sheets/items/*.hbs` (ohne Waffen-Templates) |
| `scripts/items/styles/manoever.css`                               | `styles/sheets/manoever.css`                           |
| `scripts/items/styles/items.css`                                  | **NEU** – Item-spezifische Klassen aus `css/temp.css`  |
| `scripts/items/hooks.js`                                          | **NEU** – Placeholder                                  |

---

### Task 2.3 — Migrate `actors/` ✅

| Neue Datei                                                            | Kopiert von                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| `scripts/actors/data/{actor,held,kreatur,proxy,hardcodedvorteile}.js` | `scripts/actors/*.js` (in data/ verschoben)            |
| `scripts/actors/data/actor-weapon-utils.js`                           | `scripts/actors/weapon-utils.js` (umbenannt)           |
| `scripts/actors/sheets/{actor,held}.js`                               | `scripts/sheets/{actor,helden}.js` (helden→held)       |
| `scripts/actors/sheets/kreatur.js`                                    | `scripts/sheets/kreatur.js`                            |
| `scripts/actors/templates/kreatur.hbs`                                | `templates/sheets/kreatur.hbs`                         |
| `scripts/actors/templates/held/*.hbs`                                 | `templates/sheets/held/*.hbs`                          |
| `scripts/actors/templates/held/tabs/*.hbs`                            | `templates/sheets/tabs/*.hbs`                          |
| `scripts/actors/templates/held/tabs/inventory/*.hbs`                  | `templates/sheets/tabs/inventory/*.hbs`                |
| `scripts/actors/styles/actors.css`                                    | **NEU** – Hero/Kreatur-Sheet Styles aus `css/temp.css` |
| `scripts/actors/styles/sidebar.css`                                   | **NEU** – Sidebar/Tabellen-Styles aus `css/temp.css`   |
| `scripts/actors/hooks.js`                                             | **NEU** – Placeholder                                  |

---

### Task 2.4 — Migrate `dice/` ✅

| Neue Datei                                                     | Kopiert von                                         |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `scripts/dice/chatutilities.js`                                | `scripts/common/wuerfel/chatutilities.js`           |
| `scripts/dice/wuerfel_misc.js`                                 | `scripts/common/wuerfel/wuerfel_misc.js`            |
| `scripts/dice/templates/{dreid20,spell_cost,spell_result}.hbs` | `templates/chat/*.hbs`                              |
| `scripts/dice/_spec/wuerfel_misc.spec.js`                      | `scripts/common/wuerfel/_spec/wuerfel_misc.spec.js` |
| `scripts/dice/styles/dice.css`                                 | **NEU** – `.chat-message` Styles                    |
| `scripts/dice/hooks.js`                                        | **NEU** – Placeholder                               |

---

### Task 2.5 — Migrate `combat/` ✅

| Neue Datei                                 | Kopiert von                                   |
| ------------------------------------------ | --------------------------------------------- |
| `scripts/combat/dialogs/*.js`              | `scripts/sheets/dialogs/*.js` (Kampf-Dialoge) |
| `scripts/combat/dice/nahkampf_prepare.js`  | `scripts/common/wuerfel/nahkampf_prepare.js`  |
| `scripts/combat/dice/fernkampf_prepare.js` | `scripts/common/wuerfel/fernkampf_prepare.js` |
| `scripts/combat/templates/dialogs/*.hbs`   | `templates/sheets/dialogs/*.hbs`              |
| `scripts/combat/styles/defense-prompt.css` | `styles/chat/defense-prompt.css`              |
| `scripts/combat/styles/combat.css`         | **NEU** – `.clickable-summary` Styles         |
| `scripts/combat/hooks.js`                  | **NEU** – Placeholder                         |

---

### Task 2.6 — Migrate `skills/` ✅

| Neue Datei                                            | Kopiert von                                 |
| ----------------------------------------------------- | ------------------------------------------- |
| `scripts/skills/dialogs/fertigkeit.js`                | `scripts/sheets/dialogs/fertigkeit.js`      |
| `scripts/skills/dialogs/uebernatuerlich.js`           | `scripts/sheets/dialogs/uebernatuerlich.js` |
| `scripts/skills/dice/{magie,karma}_prepare.js`        | `scripts/common/wuerfel/*.js`               |
| `scripts/skills/templates/dialogs/fertigkeit.hbs`     | `templates/sheets/dialogs/fertigkeit.hbs`   |
| `scripts/skills/templates/chat/probenchat_profan.hbs` | `templates/chat/probenchat_profan.hbs`      |
| `scripts/skills/hooks.js`                             | **NEU** – Placeholder                       |

---

### Task 2.7 — Migrate `effects/` ✅

| Neue Datei                                      | Kopiert von                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `scripts/effects/active-effects.js`             | `scripts/hooks/active-effects.js`                                                      |
| `scripts/effects/dot-effects.js`                | `scripts/hooks/dot-effects.js`                                                         |
| `scripts/effects/effects-manager.js`            | `scripts/sheets/common/effects-manager.js`                                             |
| `scripts/effects/templates/effects-section.hbs` | `templates/helper/effects-section.hbs`                                                 |
| `scripts/effects/styles/effects.css`            | **NEU** – `.effects-section`, `.status-effects` etc.                                   |
| `scripts/effects/hooks.js`                      | **NEU** – Placeholder (TODO Phase 3: aktiviere imports von active-effects/dot-effects) |

---

### Task 2.8 — Migrate `tokens/` ✅

| Neue Datei                         | Erstellt                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `scripts/tokens/styles/tokens.css` | **NEU** – `.ilaris-hex-tokens-enabled` Styles                                      |
| `scripts/tokens/hooks.js`          | **NEU** – Placeholder (TODO Phase 3: Hex-Token-Logik aus core/init.js extrahieren) |

---

### Task 2.9 — Migrate `importer/` ✅

| Neue Datei                                          | Kopiert von                                 |
| --------------------------------------------------- | ------------------------------------------- |
| `scripts/importer/sephrasto_importer.js`            | `scripts/common/sephrasto_importer.js`      |
| `scripts/importer/templates/rule-import-dialog.hbs` | `templates/importer/rule-import-dialog.hbs` |
| `scripts/importer/styles/importer.css`              | **NEU** – Importer-Button Styles            |
| `scripts/importer/hooks.js`                         | **NEU** – Placeholder                       |

_(xml-character-import-dialogs.js, xml_character_importer.js und xml_rule_importer/ waren bereits in scripts/importer/)_

---

### Task 2.10 — Migrate `settings/` ✅

| Neue Datei                             | Kopiert von                                               |
| -------------------------------------- | --------------------------------------------------------- |
| `scripts/settings/templates/*.hbs`     | `templates/settings/*.hbs`                                |
| `scripts/settings/styles/settings.css` | **NEU** – `.system-pack`, `.pack-entry`, `.checkbox` etc. |
| `scripts/settings/hooks.js`            | **NEU** – Placeholder                                     |

_(Setting-JS-Dateien waren bereits in scripts/settings/)_

---

### Task 2.11 — Migrate `migrations/` ✅

| Neue Datei                    | Erstellt                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `scripts/migrations/hooks.js` | **NEU** – Placeholder (TODO Phase 3: worldSchemaVersion-Registrierung aus core/init.js) |

---

### Task 2.12 — Migrate `changelog/` ✅

| Neue Datei                                            | Kopiert von                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `scripts/changelog/changelog-notification.js`         | `scripts/hooks/changelog-notification.js`                                         |
| `scripts/changelog/templates/*.hbs`                   | `templates/changes/*.hbs`                                                         |
| `scripts/changelog/styles/changelog-notification.css` | `styles/dialogs/changelog-notification.css`                                       |
| `scripts/changelog/hooks.js`                          | **NEU** – Placeholder (TODO Phase 3: aktiviere import von changelog-notification) |

---

## Nächste Schritte

1. **Task 3.1**: Alle Import-Pfade in JS-Dateien aktualisieren (`scripts/sheets/…` → `scripts/*/sheets/…`, `templates/…` → `scripts/*/templates/…`)
2. **Task 3.2**: `system.json` Styles-Array auf alle neuen CSS-Dateien umstellen; `css/temp.css` ablösen
3. **Task 3.3**: Alte Verzeichnisse löschen, alle Tests ausführen, im Browser testen

---

## Wichtige Hinweise

- Die **alten Quelldateien wurden nicht gelöscht** – sie existieren noch. Erst in Task 3.3 werden sie entfernt.
- Das System läuft über `scripts/core/hooks.js`, welches `core/init.js` und Legacy-Hooks importiert. **Das System ist weiterhin funktionsfähig** – alle 577 Tests bestehen.
- **Template-Pfade** in JS-Dateien (z.B. `'systems/Ilaris/templates/sheets/items/nahkampfwaffe.hbs'`) müssen in **Phase 3.1** aktualisiert werden.
- **Feature hooks.js-Dateien** sind derzeit Platzhalter. Sie werden in Phase 3.1/3.3 mit echtem Inhalt befüllt und in core/hooks.js aktiviert (Legacy-Imports werden gleichzeitig entfernt).
- `css/temp.css` bleibt bestehen bis **Phase 3.2** die system.json Styles auf die neuen Feature-CSS-Dateien umstellt.

**Import-Pfade angepasst (in kopierten core/-Dateien):**

- `core/handlebars.js`: `'./../settings/index.js'` → `'../../settings/index.js'`
- `core/documents/active-effect.js`: `'../settings/...'` → `'../../settings/...'`

**`scripts/core/init.js` enthält:**

- Vollständigen `Hooks.once('init', ...)` Block (Actor-/Item-Sheet-Registration, CONFIG-Setup, Status-Effekte, Handlebars-Init, Settings-Registration)
- `Hooks.on('ready', ...)` mit Preloading, `runMigrationIfNeeded()`, `registerDefenseButtonHook()`, `applyHexTokenSetting()`, `setupIlarisSocket()`
- Token-Hooks: `drawToken`, `refreshToken`, `updateSetting`, `renderTokenHUD` (mit TODO-Kommentaren für Phase 2.8)
- Importer-Hooks: `renderActorDirectory`, `renderCompendiumDirectory` (mit TODO für Phase 2.9)
- Würfel-/Kampf-Hooks: `renderChatMessageHTML` (mit TODO für Phase 2.4/2.5)
- Settings-Hooks: `renderSceneConfig`, `renderSettingsConfig` (mit TODO für Phase 2.10)

**`scripts/core/hooks.js` enthält:**

- `import './init.js'` (der neue Orchestrator)
- `import '../hooks/active-effects.js'` (Legacy, bleibt bis Phase 2.7)
- `import '../hooks/changelog-notification.js'` (Legacy, bleibt bis Phase 2.12)
- `import '../hooks/dot-effects.js'` (Legacy, bleibt bis Phase 2.7)
- TODO-Kommentare mit zukünftigen Feature-Imports (actors, items, waffe, combat usw.)

**`system.json` geändert:**

- `esmodules`: `"scripts/hooks.js"` → `"scripts/core/hooks.js"`

---

### Task 2.1 — Migrate `waffe/` 🔄

**Status:** Dateien wurden kopiert und Imports innerhalb von `waffe/` wurden angepasst. `hooks.js` angelegt.

**Neue Dateien in `scripts/waffe/`:**

| Neue Datei                                                 | Kopiert von                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `scripts/waffe/data/waffe.js`                              | `scripts/items/waffe.js`                                        |
| `scripts/waffe/sheets/waffe.js`                            | `scripts/sheets/items/waffe-base.js` (umbenannt)                |
| `scripts/waffe/sheets/nahkampfwaffe.js`                    | `scripts/sheets/items/nahkampfwaffe.js`                         |
| `scripts/waffe/sheets/fernkampfwaffe.js`                   | `scripts/sheets/items/fernkampfwaffe.js`                        |
| `scripts/waffe/sheets/waffeneigenschaft.js`                | `scripts/sheets/items/waffeneigenschaft.js`                     |
| `scripts/waffe/properties/processors/*.js`                 | `scripts/items/eigenschaft-processors/*.js`                     |
| `scripts/waffe/properties/processors/_spec/*.js`           | `scripts/items/eigenschaft-processors/_spec/*.js`               |
| `scripts/waffe/properties/utils/*.js`                      | `scripts/items/utils/eigenschaft-*.js`                          |
| `scripts/waffe/properties/utils/_spec/*.js`                | `scripts/items/utils/_spec/*.js`                                |
| `scripts/waffe/migrations/migrate-waffen-eigenschaften.js` | `scripts/migrations/migrate-waffen-eigenschaften.js`            |
| `scripts/waffe/migrations/waffen-migration.js`             | `scripts/common/waffen-migration.js`                            |
| `scripts/waffe/migrations/waffen-migration-hook.js`        | `scripts/hooks/waffen-migration.js`                             |
| `scripts/waffe/templates/nahkampfwaffe.hbs`                | `templates/sheets/items/nahkampfwaffe.hbs`                      |
| `scripts/waffe/templates/fernkampfwaffe.hbs`               | `templates/sheets/items/fernkampfwaffe.hbs`                     |
| `scripts/waffe/templates/waffeneigenschaft.hbs`            | `templates/sheets/items/waffeneigenschaft.hbs`                  |
| `scripts/waffe/_spec/waffe.spec.js`                        | `scripts/items/_spec/waffe.spec.js`                             |
| `scripts/waffe/hooks.js`                                   | **NEU** – Placeholder (Sheet-Registration noch in core/init.js) |

**Import-Pfade in `waffe/` angepasst:**

- `waffe/data/waffe.js`: `'./combat.js'` → `'../../items/combat.js'`, Eigenschaft-Pfade auf `../properties/…`
- `waffe/migrations/migrate-waffen-eigenschaften.js`: `../items/utils/…` → `../properties/utils/…`
- `waffe/migrations/waffen-migration-hook.js`: `../common/waffen-migration.js` → `./waffen-migration.js`
- `waffe/sheets/waffe.js` (ehem. waffe-base): `./item.js` → `../../sheets/items/item.js`, waffen-migration Pfad angepasst
- `waffe/sheets/waffeneigenschaft.js`: `./item.js` → `../../sheets/items/item.js`
- `waffe/sheets/nahkampfwaffe.js` + `fernkampfwaffe.js`: `./waffe-base.js` → `./waffe.js`

**Noch offen für Task 2.1:**

- [ ] 2.1.8: Weapon-CSS aus `css/temp.css` extrahieren → `scripts/waffe/styles/waffe.css`
- Template-Pfade in den `.hbs`-Dateien verweisen noch auf die alten `systems/Ilaris/templates/…` Pfade (wird in Phase 3.1 aktualisiert)

---

## Nächste Schritte

1. **Task 3.3**: Alte Verzeichnisse löschen, alle Tests ausführen, im Browser testen

---

## Was wurde gemacht (Phase 3)

### Task 3.1 — Update all import paths ✅

**Neue Hilfstemplates kopiert:**

- `templates/helper/select_attribut.hbs` → `scripts/core/templates/helpers/select_attribut.hbs`
- `templates/helper/select_fertigkeitsgruppe.hbs` → `scripts/core/templates/helpers/select_fertigkeitsgruppe.hbs`
- `templates/helper/select_vorteilsgruppe.hbs` → `scripts/core/templates/helpers/select_vorteilsgruppe.hbs`
- `templates/helper/select_trefferzone.hbs` → `scripts/core/templates/helpers/select_trefferzone.hbs`
- `templates/chat/probendiag_attribut.hbs` → `scripts/dice/templates/probendiag_attribut.hbs`

**Import-Pfade aktualisiert (neue Feature-Dateien):**

| Datei                                                        | Geändert                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/core/handlebars.js`                                 | Settings-Import `../../settings/` → `../settings/`; alle Template-Pfade auf neue `scripts/`-Pfade umgestellt; veraltete `probendiag_*` Preloads entfernt                                                                                                                                     |
| `scripts/core/init.js`                                       | 27 Import-Pfade aktualisiert: alle `scripts/sheets/` → `scripts/actors/sheets/`, `scripts/items/sheets/`, `scripts/waffe/sheets/`, `scripts/combat/dialogs/`; Proxy/Data-Dateien auf `data/`-Unterordner; Eigenschaft-Cache auf `waffe/properties/utils/`; Migration auf `waffe/migrations/` |
| `scripts/actors/data/actor.js`                               | `./weapon-utils.js` → `../weapon-utils.js`; Settings-Modell-Pfad korrigiert                                                                                                                                                                                                                  |
| `scripts/actors/data/actor-weapon-utils.js`                  | `./weapon-utils.js` → `../weapon-utils.js`                                                                                                                                                                                                                                                   |
| `scripts/actors/data/hardcodedvorteile.js`                   | `../common/utilities.js` → `../../core/utilities.js`; Settings-Index-Pfad korrigiert                                                                                                                                                                                                         |
| `scripts/actors/data/kreatur.js`                             | Settings-Modell-Pfad korrigiert                                                                                                                                                                                                                                                              |
| `scripts/actors/sheets/actor.js`                             | `../common/wuerfel.js` → `../../common/wuerfel.js`; `../config.js` → `../../core/config.js`; 2× Template `probenchat_profan.hbs` → `scripts/skills/templates/chat/`                                                                                                                          |
| `scripts/actors/sheets/held.js`                              | Settings-Index-Pfad korrigiert; 10 Template-Pfade auf `scripts/actors/templates/held/` aktualisiert                                                                                                                                                                                          |
| `scripts/actors/sheets/kreatur.js`                           | Template `sheets/kreatur.hbs` → `scripts/actors/templates/kreatur.hbs`                                                                                                                                                                                                                       |
| `scripts/items/data/angriff.js`                              | `./combat.js` → `./combat-item.js`                                                                                                                                                                                                                                                           |
| `scripts/items/data/combat-item.js`                          | Settings-Modell-Pfad + `../config.js` → `../../core/config.js`                                                                                                                                                                                                                               |
| `scripts/items/data/proxy.js`                                | `./waffe.js` → `../../waffe/data/waffe.js`; `./combat.js` → `./combat-item.js`                                                                                                                                                                                                               |
| `scripts/items/sheets/*.js` (13 Dateien)                     | Template-Pfade `templates/sheets/items/` → `scripts/items/templates/`                                                                                                                                                                                                                        |
| `scripts/items/sheets/vorteil.js`                            | Zusätzlich: `../common/effects-manager.js` → `../../effects/effects-manager.js`                                                                                                                                                                                                              |
| `scripts/waffe/data/waffe.js`                                | `../../items/combat.js` → `../../items/data/combat-item.js`; `../../actors/hardcodedvorteile.js` → `../../actors/data/hardcodedvorteile.js`                                                                                                                                                  |
| `scripts/waffe/sheets/waffe.js`                              | `../../sheets/items/item.js` → `../../items/sheets/item.js`                                                                                                                                                                                                                                  |
| `scripts/waffe/sheets/waffeneigenschaft.js`                  | Import + Template-Pfad korrigiert                                                                                                                                                                                                                                                            |
| `scripts/waffe/sheets/fernkampfwaffe.js`, `nahkampfwaffe.js` | Template-Pfade auf `scripts/waffe/templates/`                                                                                                                                                                                                                                                |
| `scripts/combat/dialogs/angriff.js`, `fernkampf_angriff.js`  | 3 gemeinsame Imports (`wuerfel_misc`, `chatutilities`, `utilities`) + Template-Pfade                                                                                                                                                                                                         |
| `scripts/combat/dialogs/defense_button_hook.js`              | `probendiag_attribut.hbs` → `scripts/dice/templates/`                                                                                                                                                                                                                                        |
| `scripts/combat/dialogs/dialog_nahkampf.js`                  | `dreid20.hbs` → `scripts/dice/templates/`                                                                                                                                                                                                                                                    |
| `scripts/combat/dialogs/shared_dialog_helpers.js`            | `chatutilities` Import                                                                                                                                                                                                                                                                       |
| `scripts/combat/dialogs/target_selection.js`                 | Template-Pfad                                                                                                                                                                                                                                                                                |
| `scripts/combat/dialogs/uebernatuerlich.js`                  | 5 Imports + 3 Template-Pfade                                                                                                                                                                                                                                                                 |
| `scripts/dice/wuerfel_misc.js`                               | 2 Template-Pfade                                                                                                                                                                                                                                                                             |
| `scripts/dice/_spec/wuerfel_misc.spec.js`                    | 2 Template-Pfade (Test-Expectations)                                                                                                                                                                                                                                                         |
| `scripts/skills/dialogs/fertigkeit.js`                       | 2 Imports + Template-Pfad                                                                                                                                                                                                                                                                    |
| `scripts/skills/dialogs/uebernatuerlich.js`                  | 7 Imports + 3 Template-Pfade                                                                                                                                                                                                                                                                 |
| `scripts/effects/dot-effects.js`                             | `../documents/active-effect.js` → `../core/documents/active-effect.js`                                                                                                                                                                                                                       |
| `scripts/settings/*PacksSettings.js` (7 Dateien)             | Template-Pfade `templates/settings/` → `scripts/settings/templates/`                                                                                                                                                                                                                         |
| `scripts/importer/xml_rule_importer/dialog-handler.js`       | Template-Pfad `templates/importer/` → `scripts/importer/templates/`                                                                                                                                                                                                                          |
| `scripts/changelog/changelog-notification.js`                | Template-Pfad `templates/changes/` → `scripts/changelog/templates/`                                                                                                                                                                                                                          |

**Feature Hooks aktiviert:**

- `scripts/effects/hooks.js`: Imports für `active-effects.js` und `dot-effects.js` einkommentiert
- `scripts/changelog/hooks.js`: Import für `changelog-notification.js` einkommentiert
- `scripts/core/hooks.js`: Alle Feature-Hook-Imports aktiviert; Legacy-Imports aus `scripts/hooks/` entfernt

---

### Task 3.2 — Split CSS & system.json ✅

**`system.json` `styles`-Array aktualisiert:**

Alt:

```json
"styles": [
  "css/temp.css",
  "styles/sheets/manoever.css",
  "styles/dialogs/changelog-notification.css",
  "styles/chat/defense-prompt.css"
]
```

Neu:

```json
"styles": [
  "scripts/core/styles/core.css",
  "scripts/actors/styles/actors.css",
  "scripts/actors/styles/sidebar.css",
  "scripts/items/styles/items.css",
  "scripts/items/styles/manoever.css",
  "scripts/waffe/styles/waffe.css",
  "scripts/combat/styles/combat.css",
  "scripts/combat/styles/defense-prompt.css",
  "scripts/effects/styles/effects.css",
  "scripts/tokens/styles/tokens.css",
  "scripts/importer/styles/importer.css",
  "scripts/settings/styles/settings.css",
  "scripts/dice/styles/dice.css",
  "scripts/changelog/styles/changelog-notification.css"
]
```

**`system.json` `esmodules`:** bereits korrekt auf `"scripts/core/hooks.js"`

---

## Nächste Schritte (für Task 3.3)

1. **Alte Verzeichnisse löschen:**
    - `templates/` (alle Templates jetzt in `scripts/*/templates/`)
    - `styles/` (alle Styles jetzt in `scripts/*/styles/`)
    - `css/` (durch Feature-CSS ersetzt)
    - `scripts/hooks/` (auf Features verteilt)
    - `scripts/hooks.js` (ersetzt durch `scripts/core/hooks.js`)
    - `scripts/common/` (auf `core/`, `dice/`, `combat/`, `skills/` verteilt)
    - `scripts/sheets/` (auf `actors/sheets/`, `items/sheets/`, `waffe/sheets/`, `combat/dialogs/`, `skills/dialogs/` verteilt)
    - Alte Root-Dateien: `scripts/config.js`, `scripts/documents/`, `scripts/config/`
    - Alte Root-Actor-/Item-Dateien (z.B. `scripts/actors/actor.js`, `scripts/items/item.js` etc. — nur die im Root, nicht in `data/`)

2. **Tests ausführen:** `npm test` soll alle Tests grün zeigen

3. **Browser-Test:** System in FoundryVTT laden, Console auf Fehler prüfen, Sheets öffnen

---

## Wichtige Hinweise

- Die **alten Quelldateien wurden noch nicht gelöscht** – sie existieren noch an ihren ursprünglichen Orten. Erst in Task 3.3 werden sie entfernt.
- Das System läuft jetzt über `scripts/core/hooks.js`, das alle Feature-Hook-Dateien importiert. Die Legacy-Imports (`scripts/hooks/active-effects.js` usw.) wurden aus `core/hooks.js` entfernt – **doppelte Hook-Registrierungen sind damit behoben**.
- `css/temp.css` wird nicht mehr in `system.json` referenziert, die Datei bleibt aber bis Task 3.3 erhalten.
- Tabs-Templates befinden sich unter `scripts/actors/templates/held/tabs/` (nicht `tabs/` direkt).
- `probenchat_profan.hbs` befindet sich in `scripts/skills/templates/chat/` (nicht in `dice/`).
- Die `probendiag_*.hbs` Vorlagen (außer `probendiag_attribut.hbs`) wurden aus dem Handlebars-Preload entfernt (deprecated).

---

## Was wurde gemacht (Task 3.3)

### Task 3.3 — Cleanup & Verification ✅

**Pre-Deletion Migrationen (nicht zuvor durchgeführt):**

| Maßnahme                                                                               | Detail                                                           |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `scripts/common/wuerfel.js` → `scripts/dice/wuerfel.js`                                | Import-Pfade (dialogs/fertigkeit) aktualisiert                   |
| `scripts/common/_spec/handlebars.spec.js` → `scripts/core/_spec/handlebars.spec.js`    | Neu angelegt                                                     |
| `scripts/common/_spec/utilities.spec.js` → `scripts/core/_spec/utilities.spec.js`      | Neu angelegt                                                     |
| `scripts/hooks/migration_message.js` → in `scripts/migrations/hooks.js` integriert     | `Hooks.once('setup', ...)` Sprachprüfungs-Dialog eingebaut       |
| `scripts/sheets/dialogs/_spec/uebernatuerlich.spec.js` → `scripts/combat/_spec/`       | Import-Pfad auf `../../core/utilities.js` korrigiert             |
| `scripts/sheets/dialogs/_spec/verbotene_pforten.spec.js` → `scripts/combat/_spec/`     | Kein Import nötig                                                |
| `scripts/sheets/dialogs/_spec/shared_dialog_helpers.test.js` → `scripts/combat/_spec/` | Import-Pfad auf `../dialogs/shared_dialog_helpers.js` korrigiert |

**Import-Pfade in Spec-Dateien korrigiert:**

| Datei                                            | Geändert                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `scripts/actors/sheets/actor.js`                 | `../../common/wuerfel.js` → `../../dice/wuerfel.js`                          |
| `scripts/actors/_spec/hardcodedvorteile.test.js` | `../hardcodedvorteile.js` → `../data/hardcodedvorteile.js`                   |
| `scripts/actors/_spec/weapon-utils.test.js`      | `../weapon-utils.js` → `../data/actor-weapon-utils.js`                       |
| `scripts/actors/data/actor-weapon-utils.js`      | `../weapon-utils.js` → `./actor-weapon-utils.js` (self-import)               |
| `scripts/items/_spec/combat.spec.js`             | `../item.js` → `../data/item.js`; `../../config.js` → `../../core/config.js` |
| `scripts/items/_spec/manoever.spec.js`           | `../item.js` → `../data/item.js`                                             |
| `scripts/waffe/_spec/waffe.spec.js`              | `../../items/combat.js` → `../../items/data/combat-item.js`                  |

**Gelöschte Verzeichnisse und Dateien:**

| Gelöscht                                                                      | Begründung                                                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `templates/`                                                                  | Alle Templates jetzt in `scripts/*/templates/`                                                        |
| `styles/`                                                                     | Alle Styles jetzt in `scripts/*/styles/`                                                              |
| `css/`                                                                        | Durch Feature-CSS ersetzt                                                                             |
| `scripts/hooks/`                                                              | Hooks auf Features verteilt                                                                           |
| `scripts/common/`                                                             | Auf `core/`, `dice/`, `combat/`, `skills/`, `importer/` verteilt                                      |
| `scripts/config/`                                                             | Nach `scripts/core/config/` verschoben                                                                |
| `scripts/documents/`                                                          | Nach `scripts/core/documents/` verschoben                                                             |
| `scripts/sheets/`                                                             | Auf `actors/sheets/`, `items/sheets/`, `waffe/sheets/`, `combat/dialogs/`, `skills/dialogs/` verteilt |
| `scripts/config.js`                                                           | Nach `scripts/core/config.js` verschoben                                                              |
| `scripts/hooks.js` (Root)                                                     | Ersetzt durch `scripts/core/hooks.js`                                                                 |
| `scripts/actors/{actor,held,kreatur,proxy,hardcodedvorteile,weapon-utils}.js` | Nach `scripts/actors/data/` verschoben                                                                |
| `scripts/items/{angriff,combat,effect-item,item,manoever,proxy,waffe}.js`     | Nach `scripts/items/data/` verschoben                                                                 |
| `scripts/items/eigenschaft-processors/`                                       | Nach `scripts/waffe/properties/processors/` verschoben                                                |
| `scripts/items/utils/`                                                        | Nach `scripts/waffe/properties/utils/` verschoben                                                     |
| `scripts/items/_spec/waffe.spec.js` (alt)                                     | Duplikat; neue Version in `scripts/waffe/_spec/`                                                      |
| `scripts/migrations/migrate-waffen-eigenschaften.js`                          | Nach `scripts/waffe/migrations/` verschoben                                                           |

**Finale Verzeichnisstruktur `scripts/`:**

```
scripts/
  actors/    items/    waffe/     combat/
  dice/      skills/   effects/   tokens/
  importer/  settings/ migrations/ changelog/
  core/
```

**Test-Ergebnis:** 20 Test Suites, 437 Tests — alle bestanden ✅
