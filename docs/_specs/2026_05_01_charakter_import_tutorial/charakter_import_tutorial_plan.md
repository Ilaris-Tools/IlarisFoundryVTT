# Plan: Charakter Import Tutorial (Kurzübersicht Kompendium)

**Date:** 2026-05-01
**Status:** Ready for Implementation

---

## Objective

Create a new "Charakter Import" quick-reference journal entry in the `kurzuebersichten` compendium, covering all three character import/update methods.

---

## Assumptions

- The tutorial follows the exact format of the existing `kurzuebersichten` entries (styled HTML, emoji headings, `<div>` tip boxes).
- Screenshots **will be embedded** as images. The three reference images must be saved to `assets/images/tutorial/` with the following names before Step 1 is implemented:
    - `assets/images/tutorial/charakter-import-xml.jpg`
    - `assets/images/tutorial/charakter-update-button.jpg`
    - `assets/images/tutorial/kompendium-synchronisieren.jpg`
    - They will be referenced via `systems/Ilaris/assets/images/tutorial/<filename>` in the HTML.
- The new entry gets ID `kurzimport001` / page ID `kurzimpage001`, consistent with naming conventions.
- `npm run pack-all` must be run after files are created.
- The **Kompendium Synchronisieren** 5 steps are as shown in the third screenshot (numbered circles in the Foundry UI):
    1. Rechtklick auf den Charakter im Actors-Tab → „Duplicate" (Backup erstellen)
    2. Charakterbogen des Charakters öffnen
    3. Den Button „Charakter mit Kompendium-Vorteilen Synchronisieren" auf dem Charakterbogen anklicken
    4. Im sich öffnenden Dialog die Kompendiumsquelle prüfen/bestätigen
    5. „Synchronisieren" bestätigen

---

## Steps

### Step 0 — Add screenshot assets

- **What**: Save the three reference screenshots as files into the repository:
    - `assets/images/tutorial/charakter-import-xml.jpg`
    - `assets/images/tutorial/charakter-update-button.jpg`
    - `assets/images/tutorial/kompendium-synchronisieren.jpg`
- **Where**: `assets/images/tutorial/` (create directory if needed)
- **Who**: Setup specialist
- **Depends on**: none

### Step 1 — Create JSON source file

- **What**: Create `Charakter_Import_Quick_Reference_charimport001.json` with a `JournalEntry` of type `text`, one page, HTML covering all three import methods:
    - **Option 1**: `Import Charakter XML` — full fresh import via the button in the Actor sidebar (cleanest, loses Foundry-only data). Include screenshot `charakter-import-xml.jpg`.
    - **Option 2**: Update Button im Actortab — the circular-arrows sync icon next to the actor in the list. Preserves weapons, armor, inventory, notes; updates everything else from Sephrasto. Shows the confirmation dialog with Wird ERSETZT / Bleibt ERHALTEN sections. Include screenshot `charakter-update-button.jpg`.
    - **Option 3**: Kompendium Synchronisieren — for characters without Sephrasto access. Step-by-step 5 steps (see Assumptions). Include warning to duplicate first. Include screenshot `kompendium-synchronisieren.jpg`.
- **Where**: `comp_packs/kurzuebersichten/_source/`
- **Who**: Compendium specialist
- **Depends on**: none

### Step 2 — Create HTML template file

- **What**: Create `kurzimpage001.html` with the same HTML content as the page's `text.content` value (used as editing reference, consistent with the other template files in that folder).
- **Where**: `comp_packs/kurzuebersichten/_source/templates/`
- **Who**: Compendium specialist
- **Depends on**: Step 1

### Step 3 — Rebuild LevelDB packs

- **What**: Run `npm run pack-all` to compile the `_source/` JSON into the LevelDB binary.
- **Where**: Repository root
- **Who**: Setup specialist
- **Depends on**: Step 1, Step 2

---

## Validation Plan

| Check                           | Command / Action                              | Expected Result                                                 |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| JSON is valid and packs succeed | `npm run pack-all`                            | No errors, exits 0                                              |
| Entry appears in Foundry        | Launch Foundry → Compendium → Kurzübersichten | "Übersicht: Charakter Import" visible                           |
| Content renders correctly       | Open the journal entry in Foundry             | All three sections display with correct styling and screenshots |
| Lint passes                     | `npm run lint`                                | No errors                                                       |

---

## Delegation Map

| Step | Specialist | Input                                                                                 | Expected Output                                   |
| ---- | ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 0    | Setup      | Three `.jpg` files from user                                                          | Files at `assets/images/tutorial/`                |
| 1    | Compendium | Existing JSON format from `kurzuebersichten/_source/`, user's 3 methods + screenshots | New `.json` file in `_source/`                    |
| 2    | Compendium | HTML content from Step 1                                                              | New `.html` template file in `_source/templates/` |
| 3    | Setup      | Repository root                                                                       | `pack-all` succeeds, LevelDB updated              |

---

## Points Needing Input

All inputs resolved. Ready for implementation.

> **Note for implementer:** The three screenshot `.jpg` files must be placed in `assets/images/tutorial/` before the HTML references to them will work in Foundry. The user confirmed they have the files.
