# Spell and liturgy effect inventory

This inventory contains the compendium entries whose currently supported behavior is represented by `system.preEffects` in `comp_packs/*/_source`.

## Structured direct damage

- **Aquafaxius** — `4W6` WASSER damage
- **Archofaxius** — `4W6` ERZ damage
- **Frigifaxius** — `4W6` EIS damage
- **Fulminictus Donnerkeil** — `2W6` TRUE_DAMAGE; Mächtige Magie `+4`
- **Hexengalle** — `2W6` TRUE_DAMAGE; Mächtige Magie `+1W6`; separate timed marker after failed Zähigkeit resistance
- **Humofaxius** — `4W6` HUMUS damage
- **Ignifaxius Flammenstrahl** — `4W6` FEUER damage
- **Orcanofaxius** — `4W6` LUFT damage
- **Pandämonium** — `2W6` PROFAN damage; Mächtige Magie `+1W6`; one-time approximation only
- **Seelenfeuer** — `2W6` TRUE_DAMAGE; Mächtige Magie `+4`; one-time approximation only
- **Tlalucs Odem Pestgestank** — `2W6` TRUE_DAMAGE; Mächtige Magie `+1W6`; separate timed global `-4` after failed Zähigkeit resistance
- **Wand aus Flammen** — `4W6` TRUE_DAMAGE; Mächtige Magie `+2W6`; one-time approximation only
- **Zorn der Elemente** — `2W6` PROFAN damage

## Structured simple buffs and debuffs

- **Axxeleratus Blitzgeschwind** — GS `+4`, AT/VT `+2`, and Mächtige Magie GS `+2`
- **Axxeleratus Blitzgeschwind (Tiergeist)** — same effect as Axxeleratus Blitzgeschwind
- **Fluch des Gewürms** — spell-named marker after failed Willenskraft resistance; timed global `-4` after successful resistance
- **Plumbumbarum schwerer Arm** — timed Nahkampf modifier `-4`; Mächtige Magie `-2`

## Healing (intentionally excluded from the damage list)

- **Balsam Salabunde** — `2W6+4` HEALING_WOUND
- **Geistheilung** — `2W6+4` HEALING_WOUND
- **Hexenspeichel** — `2W6+4` HEALING_WOUND
- **Lach dich gesund** — `2W6+4` HEALING_WOUND
- **Tiere besprechen** — `4W6+8` HEALING_WOUND

## Intentional approximation and deferral boundaries

Pandämonium, Seelenfeuer, and Wand aus Flammen deliberately apply their configured damage once only. Their zone, contact, crossing, repeated-damage, and other trigger rules still require manual handling.

The following entries are deliberately absent from this active inventory. Their `_source` JSON remains unchanged; the unsupported mechanics and future design direction are documented in [pre-effect deferred mechanics](pre-effect-deferred-mechanics.md):

- Aquasphaero, Archosphaero, Frigisphaero, Humosphaero, Ignisphaero, and Orcanosphaero
- Auge des Limbus, Kulminatio Kugelblitz, Mahlstrom, Sumpfstrudel, Windhose, Igniplano Flächenbrand, and Lodernder Zorn
- Fluch der Verwirrung, Große Verwirrung, and Melodie der Verwirrung
- Mirakel: CH, FF, GE, IN, KK, KL, KO, MR, and MU
- Zerschmetternder Bannstrahl
