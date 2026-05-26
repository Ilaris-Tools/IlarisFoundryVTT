# Plan: IlarisSettingsDialog — Vollständiger Einstellungen-Dialog (Feature #375)

_Erstellt: 2026-05-26_

---

## Vorgeschichte / Geleistete Vorarbeit

Commit `6f130908` hat das folgende Grundgerüst bereits auf dem Branch `feature/375-ilaris-system-settings-in-dialog` eingecheckt:

| Datei                                                       | Zustand                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `scripts/settings/ilaris-settings.dialog.js`                | Klasse `IlarisSettingsDialog` (AppV2), 3 Tabs, `generatePacks()` nur für Fertigkeiten             |
| `scripts/settings/templates/ilaris-settings_navigation.hbs` | Tab-Nav vorhanden, aber falsche `cssClass`-Bindings und Bilder-Platzhalter                        |
| `scripts/settings/templates/ilaris-settings_compendien.hbs` | Minimale Checkbox-Liste für Fertigkeiten, Submit/Reset auskommentiert                             |
| `scripts/settings/templates/ilaris-settings_automation.hbs` | Leergerüst mit Platzhalter-Text                                                                   |
| `scripts/settings/templates/ilaris-settings_general.hbs`    | Leergerüst mit Platzhalter-Text                                                                   |
| `scripts/settings/configure-game-settings.js`               | Enthält doppelten Platzhalter-Eintrag `"Test"`, altes `FertigkeitenPacksSettings`-Menü noch aktiv |
| `scripts/settings/styles/settings.css`                      | Grid-Layout für den Dialog, Pack-Styling vorhanden                                                |

**Bekannte Probleme aus dem Branch:**

| Problem                                                                                               | Datei                                   |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `debugger`-Statement aktiv                                                                            | `ilaris-settings.dialog.js` (~Zeile 90) |
| Platzhalter-Labels `"Test"` / `"ATest"`                                                               | `configure-game-settings.js`            |
| Typo: `data-tab="USED_COMPENDIAN"`                                                                    | `ilaris-settings_compendien.hbs`        |
| Doppelter `"Test"`-Eintrag in `registerIlarisGameSettings`                                            | `configure-game-settings.js`            |
| Falsches `cssClass`-Binding (`tabs.attribute`, `tabs.fertigkeiten` statt `tabs.USED_COMPENDIEN` etc.) | `ilaris-settings_navigation.hbs`        |
| Viel auskommentierter Code (alte Fertigkeitsdialog-Logik)                                             | `ilaris-settings.dialog.js`             |
| `generatePacks()` implementiert nur Fertigkeiten                                                      | `ilaris-settings.dialog.js`             |
| Submit/Reset-Buttons auskommentiert, kein Speichern implementiert                                     | `ilaris-settings_compendien.hbs`        |

---

## 1. Objective

Den `IlarisSettingsDialog` (AppV2) vollständig implementieren: alle System-Einstellungen geordnet in Tabs darstellen, mit Beschriftungen und Hinweistexten versehen, via einen einzelnen "Einstellungen Speichern"-Button speichern und den Nutzer bei reload-pflichtigen Änderungen zu einem Neustart auffordern.

Zusätzlich: Alle im Dialog verwalteten Einstellungen im Foundry-Standardmenü ausblenden (`config: false`) und den Dialog visuell weiter verfeinern (bessere Lesbarkeit, klarere Hierarchie, responsive Verhalten).

---

## 2. Assumptions

- **[BESTÄTIGT]** Das Grundgerüst (`IlarisSettingsDialog`, Templates, CSS) ist bereits auf dem Branch vorhanden.
- **[BESTÄTIGT]** Es gibt 3 Tabs: `USED_COMPENDIEN`, `AUTOMATION`, `GENERAL`.
- **[BESTÄTIGT]** Alle Kompendien-Einstellungen haben `config: false` und werden ausschließlich über den neuen Dialog verwaltet.
- **[BESTÄTIGT]** Die alten Einzel-Dialoge (`FertigkeitenPacksSettings`, `WaffenPacksSettings` etc.) sollen durch den zentralen Dialog ersetzt werden.
- **[BESTÄTIGT]** Einstellungen mit `requiresReload: true` müssen nach dem Speichern einen Neustart-Dialog auslösen.
- **[ANNAHME]** Die AppV2 Submit-Logik wird über einen `data-action="saveSettings"` Button gesteuert, der `game.settings.set()` aufruft und danach ggf. `SettingsConfig.reloadConfirm()` aufruft.
- **[ANNAHME]** Der `Allgemein`-Tab zeigt ausschließlich World-/Client-Einstellungen (Boolean + String), die bisher als `config: true` im Standard-Einstellungsmenü erschienen sind; `lastSeenBreakingChangesVersion` wird **nicht** angezeigt (interne Einstellung).
- **[BESTÄTIGT]** Alle alten Einzel-Menü-Einträge und `*PacksSettings.js`-Klassen werden vollständig entfernt — am Ende öffnet sich für die System-Einstellungen nur noch ein einziger Dialog.
- **[BESTÄTIGT]** Der `Allgemein`-Tab zeigt alle vorhandenen `config: true` Boolean-Settings sowie `defaultRangedDodgeTalent` (String).
- **[BESTÄTIGT]** Der Submit-Button befindet sich in einem gemeinsamen Footer, der in allen Tabs sichtbar ist.

---

## 3. Einstellungs-Inventar

### Tab: Benutzte Kompendien (`USED_COMPENDIEN`)

| Setting-Name               | Label                          | Item-Typ-Filter                             | requiresReload |
| -------------------------- | ------------------------------ | ------------------------------------------- | -------------- |
| `fertigkeitenPacks`        | Fertigkeiten Kompendien        | `fertigkeit`, `uebernatuerliche_fertigkeit` | ✓              |
| `waffenPacks`              | Waffen Kompendien              | `fernkampfwaffe`, `nahkampfwaffe`           | ✓              |
| `talentePacks`             | Talente Kompendien             | `talent` (diverse)                          | ✓              |
| `manoeverPacks`            | Manöver Kompendien             | `manoever`                                  | ✓              |
| `vorteilePacks`            | Vorteile Kompendien            | `vorteil`                                   | ✓              |
| `waffeneigenschaftenPacks` | Waffeneigenschaften Kompendien | `waffeneigenschaft`                         | ✓              |
| `abgeleiteteWertePacks`    | Abgeleitete Werte Kompendien   | `abgeleiteterWert`                          | ✓              |

### Tab: Automatisierung (`AUTOMATION`)

| Setting-Name          | Label                                  | Typ     | requiresReload |
| --------------------- | -------------------------------------- | ------- | -------------- |
| `useSceneEnvironment` | Scene-Umgebungseinstellungen verwenden | Boolean | —              |
| `useTargetSelection`  | Zielauswahl-System verwenden           | Boolean | —              |

### Tab: Allgemein (`GENERAL`)

| Setting-Name                  | Label                                       | Typ     | requiresReload |
| ----------------------------- | ------------------------------------------- | ------- | -------------- |
| `weaponSpaceRequirement`      | Platzbedarf berücksichtigen                 | Boolean | ✓              |
| `realFumbleCrits`             | Echte Patzer und Krits                      | Boolean | —              |
| `renameTriumphWithCrit`       | Umbenennen von Triumph in Crit              | Boolean | —              |
| `restrictEnergyCostSetting`   | Energiekosten-Einstellung einschränken      | Boolean | —              |
| `hideSyncKampfstileButton`    | Charakter-Synchronisation Button ausblenden | Boolean | —              |
| `enableTabbingCharacterSheet` | Heldensheet Reiter Rotation mit Tab         | Boolean | ✓              |
| `hexTokenShapes`              | Hexagonale Token-Bilder                     | Boolean | —              |
| `defaultRangedDodgeTalent`    | Alternativ Fernkampf-Ausweichen Talent      | String  | —              |
| `lepSystem`                   | LEP-System verwenden                        | Boolean | ✓              |

---

## 4. Steps

### Step 1 — Aufräumen und Bugfixes (Cleanup)

**What:** Alle bekannten Bugs und toten Code aus dem Branch-Commit bereinigen:

1. `debugger`-Statement entfernen
2. Typo `USED_COMPENDIAN` → `USED_COMPENDIEN` in `ilaris-settings_compendien.hbs`
3. Gesamten auskommentierten Code in `ilaris-settings.dialog.js` entfernen
4. Doppelten `"Test"`-Eintrag aus `configure-game-settings.js` entfernen (beide `"Test"`-Einträge — einen aus `registerMenu`, einen aus dem settings-Array)

**Where:**

- `scripts/settings/ilaris-settings.dialog.js`
- `scripts/settings/templates/ilaris-settings_compendien.hbs`
- `scripts/settings/configure-game-settings.js`

**Who:** code  
**Depends on:** none

---

### Step 2 — Navigation-Template reparieren

**What:** Die falschen `cssClass`-Bindings und `data-tab`-Attribute in der Tab-Navigation korrigieren. Die korrekten Template-Variablen für AppV2-Tabs lauten `tabs.USED_COMPENDIEN.cssClass`, `tabs.AUTOMATION.cssClass`, `tabs.GENERAL.cssClass`. Außerdem die Platzhalter-Bilder durch sinnvolle Icons ersetzen (oder Icon-Font `fas fa-*` verwenden).

**Where:** `scripts/settings/templates/ilaris-settings_navigation.hbs`

**Who:** code  
**Depends on:** Step 1

---

### Step 3 — `generatePacks()` auf alle Kompendien-Typen erweitern

**What:** Die Methode `generatePacks()` zu `_generateAllPacksContext()` umschreiben. Sie gibt ein strukturiertes Objekt zurück mit einem Array für jeden der 7 Kompendien-Typen. Die Item-Typ-Filter stammen aus den bestehenden `*PacksSettings.js`-Dateien (z. B. `WaffenPacksSettings.js`, `TalentePacksSettings.js`):

```js
// Rückgabestruktur
{
  fertigkeiten: [{ id, name, selected, isSystemPack }],
  waffen: [...],
  talente: [...],
  manoever: [...],
  vorteile: [...],
  waffeneigenschaften: [...],
  abgeleiteteWerte: [...]
}
```

System-Packs (mit Prefix `Ilaris.`) werden mit `isSystemPack: true` markiert, damit das Template sie optisch hervorheben kann.

**Where:** `scripts/settings/ilaris-settings.dialog.js`

**Who:** code  
**Depends on:** Step 1

---

### Step 4 — `_prepareContext()` erweitern

**What:** `_prepareContext()` mit den vollständigen Daten für alle Tabs befüllen:

- Kompendien-Packs-Objekt (aus Step 3)
- Alle Boolean-Settings für Allgemein- und Automatisierung-Tabs als `currentValues`-Objekt
- Hilfsflag `anyRequiresReload` (kann zur Anzeige einer Hinweiszeile genutzt werden)
- **`isGM`-Flag**: `context.isGM = game.user.isGM` — wird in allen Templates für die Sichtbarkeitssteuerung verwendet

```js
context.compendienPacks = this._generateAllPacksContext()
context.settings = {
    useSceneEnvironment: game.settings.get('Ilaris', 'useSceneEnvironment'),
    useTargetSelection: game.settings.get('Ilaris', 'useTargetSelection'),
    weaponSpaceRequirement: game.settings.get('Ilaris', 'weaponSpaceRequirement'),
    // ... alle weiteren Settings
}
```

**Where:** `scripts/settings/ilaris-settings.dialog.js`

**Who:** code  
**Depends on:** Step 3

---

### Step 5 — Template `ilaris-settings_compendien.hbs` ausbauen

**What:** Das Template vollständig überarbeiten. Layout-Vorbild ist das Reference-Bild (Item Piles-Dialog):

- Für jeden der 7 Kompendien-Gruppen ein Sektion-Header mit Label und Hint-Text
- Checkbox-Liste der verfügbaren Packs; System-Packs optisch hervorgehoben (`system-pack`-Klasse vorhanden)
- `name`-Attribute der Checkboxen folgen dem Schema `compendien.fertigkeiten.PACK_ID` für strukturierten Zugriff im Submit-Handler
- **Sichtbarkeit:** Kompendien-Einstellungen sind World-Settings → gesamter Tab-Inhalt mit `{{#if isGM}}...{{/if}}` umschließen; für Nicht-GMs eine Hinweismeldung anzeigen ("Diese Einstellungen können nur vom Spielleiter geändert werden.")

Kein Submit-Button im Tab selbst — der wird im gemeinsamen Footer (Step 8) platziert.

**Where:** `scripts/settings/templates/ilaris-settings_compendien.hbs`

**Who:** code  
**Depends on:** Step 4

---

### Step 6 — Template `ilaris-settings_automation.hbs` ausbauen

**What:** Settings-Rows im Stil des Reference-Bildes:

```
[Einstellungsname (fett)]     [Checkbox]
  Hinweistext darunter
```

Für jede Einstellung in `IlarisAutomatisierungSettingNames` eine Row mit `name="automation.SETTING_NAME"`.
**Sichtbarkeit:** Automatisierung-Settings sind World-Settings → gesamter Tab-Inhalt mit `{{#if isGM}}`-Guard, analog zu Step 5.

**Where:** `scripts/settings/templates/ilaris-settings_automation.hbs`

**Who:** code  
**Depends on:** Step 4

---

### Step 7 — Template `ilaris-settings_general.hbs` ausbauen

**What:** Gleiche Settings-Row-Struktur wie Step 6, für alle 9 Einstellungen des Allgemein-Tabs. Einstellungen mit `requiresReload: true` erhalten einen kleinen Hinweis-Badge (z. B. Icon `fas fa-rotate-right` + Text "Erfordert Neustart"). `defaultRangedDodgeTalent` erhält ein `<input type="text">` statt Checkbox.

**Sichtbarkeits-Regeln:**

- World-Settings (z. B. `weaponSpaceRequirement`, `realFumbleCrits`, `lepSystem` etc.) → nur für GMs sichtbar
- Client-Settings (`hideSyncKampfstileButton`, `enableTabbingCharacterSheet`) → für alle Nutzer sichtbar
- Jede Settings-Gruppe bekommt einen Scope-Badge: `fas fa-globe` + "Welt" (World) bzw. `fas fa-user` + "Lokal" (Client)
- World-Settings werden für Nicht-GMs komplett ausgeblendet (nicht nur `disabled`), damit Spieler die UI nicht sehen

**Where:** `scripts/settings/templates/ilaris-settings_general.hbs`

**Who:** code  
**Depends on:** Step 4

---

### Step 8 — Gemeinsamen Footer mit Submit- und Reset-Button hinzufügen

**What:** Einen neuen PART `footer` in `IlarisSettingsDialog.PARTS` anlegen mit einem eigenen Template `ilaris-settings_footer.hbs`. Der Footer enthält:

- Button "Einstellungen Speichern" (`data-action="saveSettings"`)
- Button "Zurücksetzen" (`data-action="resetSettings"`) — setzt alle Einstellungen auf ihre `default`-Werte zurück und re-rendert den Dialog

Das Template:

```hbs
<footer class='ilaris-settings-footer'>
    <button type='button' data-action='resetSettings'>
        <i class='fas fa-undo'></i>
        Zurücksetzen
    </button>
    <button type='button' data-action='saveSettings'>
        <i class='far fa-save'></i>
        Einstellungen Speichern
    </button>
</footer>
```

**Where:**

- `scripts/settings/ilaris-settings.dialog.js` (PARTS erweitern)
- `scripts/settings/templates/ilaris-settings_footer.hbs` (neu)

**Who:** code  
**Depends on:** Step 2

---

### Step 9 — Save- und Reset-Logik implementieren

**What:** Zwei Action-Handler implementieren:

**`#onSaveSettings`:**

1. Nur World-Settings verarbeiten wenn `game.user.isGM` (oder Assistant-GM-Rechte) — Sicherheitscheck serverseitig
2. Alle Formular-Felder aus `this.element` lesen (Checkboxen + Textfelder)
3. Kompendien-Arrays aus den Checkbox-Gruppen zusammenstellen
4. Für jede Einstellung `game.settings.set(...)` aufrufen — Client-Settings immer, World-Settings nur wenn GM
5. Prüfen, ob **irgendeine** berechtigte Einstellung tatsächlich geändert wurde (Vergleich alter vs. neuer Wert)
6. Dialog schließen
7. Falls ja: `SettingsConfig.reloadConfirm()` aufrufen (Foundry-Standard für Neustart-Prompt, unabhängig von `requiresReload`)

**`#onResetSettings`:**

1. Alle Settings (im Rahmen der jeweiligen Rechte) auf `default`-Wert zurücksetzen via `game.settings.set()`
2. Dialog neu rendern: `this.render()`

```js
static async #onSaveSettings(event, target) {
  const isGM = game.user.isGM
  // ... Formdata lesen
  // World-Settings nur speichern wenn GM
  const needsReload = /* mindestens eine reload-pflichtige Einstellung tatsächlich geändert */
  await this.close()
  if (needsReload) SettingsConfig.reloadConfirm()
}

static async #onResetSettings(event, target) {
  // ... defaults setzen, dann
  this.render()
}
```

**Where:** `scripts/settings/ilaris-settings.dialog.js`

**Who:** code  
**Depends on:** Step 5, Step 6, Step 7, Step 8

---

### Step 10 — `configure-game-settings.js` bereinigen

**What:**

- Alle alten Einzel-Menü-Einträge (`FertigkeitenPacksSettings`, `WaffenPacksSettings`, `TalentePacksSettings`, `ManeuverPacksSettings`, `VorteilePacksSettings`, `WaffeneigenschaftenPacksSettings`, `AbgeleiteteWertePacksSettings`) aus dem `registerMenu`-Block entfernen
- Den zweiten Platzhalter-`"Test"`-Eintrag aus dem `registerMenu`-Block entfernen (der erste wurde in Step 1 aus dem Settings-Array entfernt)
- Einen einzigen Eintrag für `IlarisSettingsDialog` mit echter Bezeichnung registrieren:
    ```js
    {
      settingsName: IlarisGameSettingsMenuNames.ilarisSettingsMenu,
      name: 'Ilaris Einstellungen',
      label: 'Ilaris Einstellungen öffnen',
      hint: 'Konfiguriere alle Ilaris-Systemeinstellungen.',
      icon: 'fas fa-cog',
      type: IlarisSettingsDialog,
      restricted: false, // Spieler können öffnen, World-Settings werden intern ausgeblendet
    }
    ```
- `IlarisGameSettingsMenuNames` in `configure-game-settings.model.js`: alle alten Einzel-Menu-Namen entfernen, `ilarisSettingsMenu` hinzufügen

**Where:**

- `scripts/settings/configure-game-settings.js`
- `scripts/settings/configure-game-settings.model.js`

**Who:** code  
**Depends on:** Step 9

---

### Step 11 — CSS-Feinschliff

**What:** Die `settings.css` um Stile für die Settings-Rows ergänzen (Vorbild: Reference-Bild):

```css
/* Settings-Row: Label links, Control rechts */
.ilaris.settings-dialog .setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.ilaris.settings-dialog .setting-row .setting-label { font-weight: bold; }
.ilaris.settings-dialog .setting-row .setting-hint { font-size: 0.85em; color: #555; }
.ilaris.settings-dialog .setting-row .requires-reload { color: #782e22; font-size: 0.8em; }

/* Footer */
.ilaris.settings-dialog footer { ... }
```

**Where:** `scripts/settings/styles/settings.css`

**Who:** code  
**Depends on:** Step 5, Step 6, Step 7

---

### Step 12 — (Optional) Alte `*PacksSettings.js`-Dateien entfernen

**What:** Nach vollständiger Implementierung die veralteten Klassen entfernen:

- `FertigkeitenPacksSettings.js`
- `WaffenPacksSettings.js`
- `TalentePacksSettings.js`
- `ManeuverPacksSettings.js`
- `VorteilePacksSettings.js`
- `WaffeneigenschaftenPacksSettings.js`
- `AbgeleiteteWertePacksSettings.js`
- Zugehörige Templates: `fertigkeiten-packs.hbs`, `waffen-packs.hbs`, `talente-packs.hbs`, `maneuver-packs.hbs`, `vorteile-packs.hbs`, `waffeneigenschaften-packs.hbs`, `abgeleitete-werte-packs.hbs`

**[BESTÄTIGT]** Wird durchgeführt. Die Typ-Filter-Logik wird zuvor in Step 3 in `_generateAllPacksContext()` überführt.

**Where:** `scripts/settings/` — alle oben genannten Dateien  
**Who:** code  
**Depends on:** Step 10

---

### Step 13 — Doppelte Einstellungsoberflächen vermeiden (`config: false`)

**What:** Alle Einstellungen, die im zentralen `IlarisSettingsDialog` bearbeitet werden (Allgemein, Automatisierung, Kompendien), im Foundry-Standardmenü ausblenden, indem `config: false` gesetzt wird. Dadurch gibt es keine doppelte Bedienoberfläche mehr.

**Where:** `scripts/settings/configure-game-settings.js`

**Who:** code  
**Depends on:** Step 10

---

### Step 14 — CSS-Styling des Dialogs verbessern

**What:** Visuelles Feintuning für bessere UX:

- stärkere visuelle Hierarchie für Gruppen/Zeilen
- bessere Checkbox- und Textfeld-Usability
- konsistenter Footer (inkl. Sticky-Verhalten bei langen Inhalten)
- responsive Anpassungen für kleinere Breiten
- klarere Zustände für Hover/Focus

**Where:** `scripts/settings/styles/settings.css`

**Who:** code  
**Depends on:** Step 11

---

### Step 15 — GM-only Tabs in der Navigation ausblenden

**What:** Die Tabs `Benutzte Kompendien` und `Automatisierung` in der Navigation nur für GMs anzeigen. Für Nicht-GMs soll ausschließlich der Tab `Sonstige` sichtbar sein und als aktiver Start-Tab gesetzt werden, um leere/inkonsistente Navigation zu vermeiden.

**Where:**

- `scripts/settings/templates/ilaris-settings_navigation.hbs`
- `scripts/settings/ilaris-settings.dialog.js`

**Who:** code  
**Depends on:** Step 7

---

### Step 16 — `defaultRangedDodgeTalent` wieder als Dropdown (Talente + Attribute)

**What:** Die Einstellung `defaultRangedDodgeTalent` im Allgemein-Tab nicht als Freitext, sondern wieder als Dropdown rendern. Die Optionen enthalten:

- alle verfügbaren Talente aus den Item-Kompendien (als UUID-Wert)
- alle System-Attribute (z. B. `KO`, `MU`, `GE`, ...)
- eine leere Option für "kein Alternativ-Talent"

Zusätzlich muss die Save-Logik den Select-Wert korrekt persistieren und die Verteidigungslogik sowohl Talent-UUIDs als auch Attribut-Werte verarbeiten.

**Where:**

- `scripts/settings/ilaris-settings.dialog.js`
- `scripts/settings/templates/ilaris-settings_general.hbs`
- `scripts/combat/combat-api.js`

**Who:** code  
**Depends on:** Step 7

---

## 5. Validation Plan

| Step   | Validierung                                                                                       | Befehl / Prüfung                 |
| ------ | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1      | Keine `debugger`-Statements mehr, keine `"Test"`-Einträge                                         | `npm run lint`                   |
| 2      | Tab-Navigation rendert korrekt, aktiver Tab ist hervorgehoben                                     | Manuell in Foundry               |
| 3      | Alle 7 Pack-Gruppen im Kontext vorhanden                                                          | `npm test` (Unit-Test schreiben) |
| 4      | Kontext enthält alle Settings-Werte                                                               | `npm test`                       |
| 5–7    | Templates rendern ohne Handlebars-Fehler, Einstellungen korrekt vorbelegt                         | Manuell in Foundry               |
| 8      | Footer mit Save-Button sichtbar in allen Tabs                                                     | Manuell in Foundry               |
| 9      | Settings werden korrekt gespeichert; Reload-Prompt erscheint bei jeder tatsächlichen Änderung     | Manuell in Foundry               |
| 10     | Nur noch ein Menu-Eintrag für Ilaris-Einstellungen in den Foundry-Settings                        | Manuell in Foundry               |
| 11     | Dialog sieht aus wie Reference-Bild (Spacing, Hinweistexte, Trennlinien)                          | Manuell in Foundry               |
| 13     | Dialog-Settings erscheinen nicht mehr doppelt im Standard-Einstellungsmenü                        | Manuell in Foundry               |
| 14     | Verbessertes Layout auf Desktop und bei schmalen Dialogbreiten                                    | Manuell in Foundry               |
| 15     | Nicht-GMs sehen in der Navigation nur `Sonstige`; GM sieht alle Tabs                              | Manuell in Foundry               |
| 16     | Dropdown für Alternativ-Ausweichen zeigt Talente+Attribute und wird korrekt gespeichert/verwendet | Manuell in Foundry               |
| Gesamt | Keine Lint-Fehler, alle Tests grün                                                                | `npm run lint` ; `npm test`      |

---

## 6. Delegation Map

| Step | Specialist | Input                                                                           | Expected Output                                       |
| ---- | ---------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1    | code       | Branch-Stand laut Dokument, konkrete Zeilennummern                              | Sauberer Code ohne Bugs/Todos                         |
| 2    | code       | `ilaris-settings_navigation.hbs`, TAB_IDS aus Dialog                            | Repariertes HBS-Template                              |
| 3    | code       | `*PacksSettings.js`-Dateien als Referenz, `IlarisGameSettingNames`              | Methode `_generateAllPacksContext()`                  |
| 4    | code       | Alle Setting-Namen aus `configure-game-settings.model.js`                       | Vollständiges Kontext-Objekt                          |
| 5    | code       | Kontext-Objekt, Reference-Bild                                                  | Überarbeitetes `_compendien.hbs`                      |
| 6    | code       | `IlarisAutomatisierungSettingNames`, Reference-Bild                             | Ausgebautes `_automation.hbs`                         |
| 7    | code       | `IlarisGameSettingNames`, requiresReload-Flags, Reference-Bild                  | Ausgebautes `_general.hbs`                            |
| 8    | code       | AppV2 PARTS-Konzept                                                             | Footer-Template + PARTS-Eintrag                       |
| 9    | code       | Alle Form-Felder-Namen, `game.settings.set()`, `SettingsConfig.reloadConfirm()` | Save-Handler mit Neustart-Prompt bei jeder Änderung   |
| 10   | code       | Bestehende `registerMenu`-Blöcke, neues `ilarisSettingsMenu`                    | Bereinigtes `configure-game-settings.js`              |
| 11   | code       | Reference-Bild, bestehende CSS-Klassen                                          | Ergänztes `settings.css`                              |
| 12   | code       | `[NEEDS INPUT]` Bestätigung                                                     | Entfernte Altdateien                                  |
| 13   | code       | Dialog-verwaltete Settings-Liste                                                | `config: false` für alle Dialog-Settings              |
| 14   | code       | Bestehendes Dialog-Markup und CSS                                               | Verbessertes, responsives Dialog-Styling              |
| 15   | code       | Bestehende Tab-Navigation + `isGM`-Kontext                                      | Rollenabhängige Tab-Sichtbarkeit                      |
| 16   | code       | Vorherige Dropdown-Anforderung + Combat-Auswertung                              | Talent-/Attribut-Dropdown inkl. Runtime-Unterstützung |

---

## 7. Entschiedene Fragen

1. **Alte Einzel-Dialoge entfernen?** ✓ Ja — alle `*PacksSettings.js`-Klassen und zugehörige Templates werden in Step 12 vollständig entfernt.
2. **Reset-Button?** ✓ Ja — Footer enthält "Zurücksetzen" (setzt alle Werte auf Default) und "Einstellungen Speichern".
3. **Einstellungs-Scope-Trennung?** ✓ Ja — World-Settings werden für Nicht-GMs komplett ausgeblendet. Client-Settings sind für alle sichtbar. Scope-Badge ("Welt" / "Lokal") wird angezeigt.
4. **Restricted?** ✓ Nein — `restricted: false`. Spieler öffnen den Dialog und sehen/bearbeiten nur Client-Settings.
5. **Doppelte Anzeige in Foundry-Settings?** ✓ Nein — alle im Dialog verwalteten Settings sind `config: false`.
6. **Tab-Sichtbarkeit für Nicht-GMs?** ✓ Nicht-GMs sehen nur den Tab `Sonstige`; GM-only Tabs sind ausgeblendet.
7. **Wann Neustart-Prompt?** ✓ Bei jeder tatsächlich geänderten Einstellung im Dialog (nicht nur `requiresReload`).
8. **Alternativ-Ausweichen Feldtyp?** ✓ Dropdown mit Talenten und Attributen statt Freitext.
