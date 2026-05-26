# Feature 375 — Ilaris System Settings Dialog

**Branch:** `feature/375-ilaris-system-settings-in-dialog`

## Ziel

Alle einzelnen Kompendien-Einstellungsmenüs in einen einzigen, zentralen `IlarisSettingsDialog` (AppV2) zusammenführen, anstatt sie als separate Menüeinträge in den Foundry-Systemeinstellungen zu registrieren.

---

## Commits

### `6f130908` — "375-init ilaris settings dialog"

Der eigentliche Feature-Commit (Autor: Hannibal_X, 25.05.2026).

**Neue Dateien:**

| Datei                                                       | Beschreibung                                       |
| ----------------------------------------------------------- | -------------------------------------------------- |
| `scripts/settings/ilaris-settings.dialog.js`                | Neue `IlarisSettingsDialog`-Klasse (AppV2, 3 Tabs) |
| `scripts/settings/templates/ilaris-settings_navigation.hbs` | Tab-Navigation                                     |
| `scripts/settings/templates/ilaris-settings_compendien.hbs` | Tab: Benutzte Kompendien                           |
| `scripts/settings/templates/ilaris-settings_automation.hbs` | Tab: Automatisierung (Placeholder)                 |
| `scripts/settings/templates/ilaris-settings_general.hbs`    | Tab: Allgemein (Placeholder)                       |

**Geänderte Dateien:**

- `scripts/settings/configure-game-settings.js`: Die 5 bisherigen Einzel-Menüs (Waffen, Talente, Manöver, Vorteile, Waffeneigenschaften Kompendien) wurden **entfernt** und durch zwei temporäre Platzhalter-Einträge namens `"Test"` ersetzt, die auf `IlarisSettingsDialog` zeigen.
- `scripts/settings/styles/settings.css`: Grid-Layout für den neuen Dialog hinzugefügt.

**Implementiertes:**

- `IlarisSettingsDialog` als `HandlebarsApplicationMixin(ApplicationV2)` mit 3 Tabs:
    - `USED_COMPENDIEN` — Benutzte Kompendien
    - `GENERAL` — Allgemein
    - `AUTOMATION` — Automatisierung
- `generatePacks()`: Lädt aktuell nur Fertigkeiten-Kompendien (Typ `fertigkeit` / `uebernatuerliche_fertigkeit`) aus allen verfügbaren Packs und zeigt die aktuelle Auswahl an.

---

### `a2358798` — Merge `origin/develop` → Branch

Merge-Commit (Autor: patq, 26.05.2026). Keine Feature-Änderungen, enthält:

- Agent-Dokumentation (`.agents/`, `.github/agents/`)
- GitHub-Workflow-Updates
- Kompendium-Quelldaten (viele Kreaturen- und Helden-JSON-Updates)
- CHANGELOG, CONTRIBUTING, Tutorial-Bilder, `.gitignore`

---

## Aktueller Stand (WIP)

Das Grundgerüst ist aufgesetzt. Die eigentliche Migration der restlichen Kompendien-Einstellungen in den Dialog steht noch aus.

### Offene Punkte / Bekannte Probleme

| Problem                                                                                                               | Datei                            | Zeile |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----- |
| `debugger`-Statement aktiv                                                                                            | `ilaris-settings.dialog.js`      | ~90   |
| Placeholder-Labels `"Test"` / `"ATest"` statt echter Bezeichnungen                                                    | `configure-game-settings.js`     | —     |
| Typo: `data-tab="USED_COMPENDIAN"` statt `USED_COMPENDIEN`                                                            | `ilaris-settings_compendien.hbs` | —     |
| Doppelter `"Test"`-Eintrag in `registerIlarisGameSettings`                                                            | `configure-game-settings.js`     | —     |
| Viel auskommentierter Code (alte Fertigkeitsdialog-Logik)                                                             | `ilaris-settings.dialog.js`      | —     |
| `generatePacks()` implementiert nur Fertigkeiten; Waffen, Talente, Manöver, Vorteile, Waffeneigenschaften fehlen noch | `ilaris-settings.dialog.js`      | —     |
| Submit/Reset-Buttons auskommentiert, kein Speichern implementiert                                                     | `ilaris-settings_compendien.hbs` | —     |

### Nächste Schritte

1. Platzhalter-Einträge in `configure-game-settings.js` durch echten Eintrag ersetzen
2. `generatePacks()` auf alle Kompendien-Typen erweitern (Waffen, Talente, Manöver, Vorteile, Waffeneigenschaften)
3. Speicher-Logik implementieren (Submit-Handler, `game.settings.set`)
4. Automation- und Allgemein-Tabs mit echten Einstellungen befüllen
5. `debugger`-Statement entfernen
6. Typo in Template korrigieren
7. Auskommentierten Code aufräumen
