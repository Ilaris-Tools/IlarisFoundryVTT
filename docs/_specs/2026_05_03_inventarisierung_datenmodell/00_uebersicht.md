# Ilaris Datenmodell — Übersicht

Vollständiges Inventar aller Datenfelder, Typen und Namenskonventionen des Ilaris FoundryVTT Systems.

## Dokumente

| Datei                                                                      | Inhalt                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01_actor_templates.md](01_actor_templates.md)                             | Alle Actor-Templates expandiert (gesundheit, attribute, abgeleitete, …)         |
| [02_actor_held_nsc.md](02_actor_held_nsc.md)                               | Actor-Typ `held` und `nsc` mit Compendium-Delta                                 |
| [03_actor_kreatur.md](03_actor_kreatur.md)                                 | Actor-Typ `kreatur` mit Compendium-Delta                                        |
| [04_item_shared_templates.md](04_item_shared_templates.md)                 | Shared Item-Templates (waffe, fertigkeit, gegenstand, …)                        |
| [05_item_gruppe_a_waffen.md](05_item_gruppe_a_waffen.md)                   | nahkampfwaffe, fernkampfwaffe, angriff, waffeneigenschaft                       |
| [06_item_gruppe_b_fertigkeiten.md](06_item_gruppe_b_fertigkeiten.md)       | fertigkeit, uebernatuerliche_fertigkeit, talent, freie_fertigkeit, freiestalent |
| [07_item_gruppe_c_uebernatuerlich.md](07_item_gruppe_c_uebernatuerlich.md) | zauber, liturgie, anrufung                                                      |
| [08_item_gruppe_d_ausruestung.md](08_item_gruppe_d_ausruestung.md)         | ruestung, gegenstand                                                            |
| [09_item_gruppe_e_meta.md](09_item_gruppe_e_meta.md)                       | vorteil, manoever, eigenheit, eigenschaft, info, abgeleiteter-wert, effect-item |
| [10_inkonsistenz_register.md](10_inkonsistenz_register.md)                 | Alle Inkonsistenzen, Namenskonflikte, Schema-Deltas                             |
| [11_migrationsplan_modeldata.md](11_migrationsplan_modeldata.md)           | Phasenplan fuer die Umstellung auf ModelData inkl. Migration, Tests und Rollout |

## Datenquellen

- `template.json` — Schema-Definitionen
- `scripts/actors/data/` — Actor-Datenmodelle
- `scripts/items/data/` — Item-Datenmodelle
- `scripts/waffe/` — Waffen-Subsystem
- `comp_packs/*/\_source/` — Compendium-Beispieldaten

## Feldtabellen-Format

Alle Feldtabellen folgen diesem Schema:

| Feld | Typ | Default | `system.X`-Pfad | Code-Querverweise | Compendium-Delta |
| ---- | --- | ------- | --------------- | ----------------- | ---------------- |

**Compendium-Delta-Legende:**

- ✅ Vorhanden und korrekt
- ❌ Fehlt in `_source/`
- ⚠️ Vorhanden aber abweichend (Typ-Mismatch, anderer Wert)
- 🆕 In `_source/` vorhanden, **nicht** in `template.json` definiert
