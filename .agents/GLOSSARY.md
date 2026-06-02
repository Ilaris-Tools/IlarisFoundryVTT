# Glossary — Foundry VTT + Ilaris Domain Terms

## Foundry VTT Core Terms

| Term                  | German           | Definition                                                                                                                                                           |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actor**             | Akteur           | A Document representing a character or creature. Types in Ilaris: `held`, `kreatur`, `nsc`. Owns Items and can be represented by Tokens.                             |
| **Item**              | Item/Gegenstand  | A Document representing any game entity: weapons, skills, spells, advantages, etc. In Ilaris: 22 types including `nahkampfwaffe`, `fertigkeit`, `zauber`, `vorteil`. |
| **Token**             | Token/Spielfigur | Visual representation of an Actor on a Scene. Can be linked (synced with Actor) or unlinked (independent copy).                                                      |
| **Scene**             | Szene            | A map or location in the game world. Contains Tokens, Walls, Lights.                                                                                                 |
| **Sheet**             | Bogen/Sheet      | UI form for editing an Actor or Item. In Ilaris, sheets use the AppV2 pattern: `HandlebarsApplicationMixin(ActorSheetV2)`.                                           |
| **Hook**              | Hook             | Foundry event system. Functions registered via `Hooks.on()`, `Hooks.once()`, `Hooks.call()`. Each Ilaris feature registers hooks in its `hooks.js`.                  |
| **Document**          | Dokument         | Base class for all persistent data objects (Actors, Items, Scenes, etc.). Managed by Foundry's database layer.                                                       |
| **Pack / Compendium** | Kompendium       | Collection of Documents stored as LevelDB databases. Ilaris ships 15 packs (spells, skills, creatures, etc.).                                                        |
| **Module**            | Modul            | Optional plugin installable alongside a system. Not part of Ilaris core.                                                                                             |
| **System**            | System           | The game rules implementation. Only one loaded at a time. Ilaris is a system.                                                                                        |
| **World**             | Welt/Spielwelt   | A game world belonging to a system, containing scenes, actors, items, notes.                                                                                         |
| **Active Effect**     | Aktiver Effekt   | Modifier applied to an Actor, changing attributes/stats dynamically. Managed in `scripts/effects/`.                                                                  |
| **Migration**         | Migration        | Data model transformation to update stored data when schemas change. Ilaris uses migrations for weapon properties in `scripts/waffe/migrations/`.                    |
| **AppV2**             | —                | Foundry VTT's modern application framework using `HandlebarsApplicationMixin` and static class properties (`DEFAULT_OPTIONS`, `PARTS`, `TABS`).                      |

## Ilaris RPG Terms

| Term                            | Translation               | Definition                                                                                                                                        |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Held**                        | Hero                      | Player character. Actor type `held`. Has attributes, skills, spells, equipment.                                                                   |
| **Kreatur**                     | Creature                  | NPC or monster. Actor type `kreatur`. Has Kampfwerte (combat values), talents.                                                                    |
| **NSC**                         | NPC                       | Non-player character. Actor type `nsc`. Simplified version of a Held.                                                                             |
| **Fertigkeiten**                | Skills                    | Core skills like Athletik, Heimlichkeit, Überreden. Item type `fertigkeit`.                                                                       |
| **Talente**                     | Talents                   | Specializations within skills. Item type `talent`.                                                                                                |
| **Übernatürliche Fertigkeiten** | Supernatural Skills       | Magic/divine skill categories. Item type `uebernatuerliche_fertigkeit`.                                                                           |
| **Zauber**                      | Spells                    | Magical abilities. Item type `zauber`.                                                                                                            |
| **Liturgien**                   | Liturgies                 | Divine abilities. Item type `liturgie`.                                                                                                           |
| **Vorteile**                    | Advantages                | Character traits/perks. Item type `vorteil`.                                                                                                      |
| **Manöver**                     | Maneuvers                 | Combat actions. Item type `manoever`.                                                                                                             |
| **Waffen**                      | Weapons                   | Melee (`nahkampfwaffe`) and ranged (`fernkampfwaffe`) weapons.                                                                                    |
| **Waffeneigenschaften**         | Weapon Properties         | Modifiers and special rules for weapons. Item type `waffeneigenschaft`. Complex scripting support.                                                |
| **Rüstung**                     | Armor                     | Protective equipment. Item type `ruestung`.                                                                                                       |
| **Eigenheiten**                 | Quirks                    | Character personality traits. Item type `eigenheit`.                                                                                              |
| **Attribute**                   | Attributes                | Core stats: MU (Mut), KL (Klugheit), IN (Intuition), CH (Charisma), FF (Fingerfertigkeit), GE (Gewandtheit), KO (Konstitution), KK (Körperkraft). |
| **Schips**                      | Fate Points               | Spendable luck/fate points. Stored on Actor.                                                                                                      |
| **AT / VT / FK**                | Attack / Defense / Ranged | Combat values calculated from skills and modifiers.                                                                                               |
| **Ini / Initiative**            | Initiative                | Turn order value in combat.                                                                                                                       |
| **Gesundheit**                  | Health                    | Hit points system with Wunden (wounds), Erschöpfung (exhaustion).                                                                                 |
| **Kampfstil**                   | Combat Style              | Fighting style selection (e.g., Parierwaffenkampf).                                                                                               |
| **Belastung (BE)**              | Encumbrance               | Weight-based penalty system.                                                                                                                      |
| **Magieresistenz (MR)**         | Magic Resistance          | Defense against magical effects.                                                                                                                  |
| **Wundschwelle (WS)**           | Wound Threshold           | Damage threshold before receiving a wound.                                                                                                        |

## Codebase Terms

| Term                     | Definition                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Proxy class**          | `IlarisActorProxy` / `IlarisItemProxy` — dispatches to type-specific data models based on Actor/Item type.                                                                                        |
| **Feature module**       | Self-contained directory under `scripts/` with its own `hooks.js`, `data/`, `sheets/`, `templates/`, `styles/`, `_spec/`.                                                                         |
| **`_source/` directory** | Contains authoritative JSON source files for compendium packs. Always edit these, never LevelDB directly.                                                                                         |
| **`pack-all`**           | npm script that rebuilds all LevelDB packs from `_source/` JSON files.                                                                                                                            |
| **Sephrasto**            | External character creation tool for Ilaris. Data can be imported via XML.                                                                                                                        |
| **`CONFIG.ILARIS`**      | Global configuration object registered in `scripts/core/config.js`. Contains system constants.                                                                                                    |
| **TypeDataModel**        | Foundry schema class used to define and validate Actor/Item `system` data. In Ilaris, these live under `scripts/core/model-data/`, `scripts/actors/model-data/`, and `scripts/items/model-data/`. |
