# Spell and liturgy effect inventory

This inventory contains the compendium entries whose currently supported behavior is represented by `system.preEffects` in `comp_packs/*/_source`.

## Structured direct damage

- **Aquafaxius** — `4W6` WASSER damage
- **Archofaxius** — `4W6` ERZ damage
- **Frigifaxius** — `4W6` EIS damage
- **Fulminictus Donnerkeil** — `2W6` TRUE_DAMAGE; Mächtige Magie `+4`
- **Hexengalle** — `2W6` TRUE_DAMAGE; Mächtige Magie `+1W6`; failed Zähigkeit resistance applies the timed `Handlungsunfähig — Hexengalle` marker
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
- **Fluch des Gewürms** and **Krabbelnder Schrecken** — failed Willenskraft resistance applies the timed `Handlungsunfähig` marker; successful resistance applies a timed global `-4` modifier. Both results retain the source spell and concrete casting skill in their effect provenance.
- **Plumbumbarum schwerer Arm** — timed Nahkampf modifier `-4`; Mächtige Magie `-2`
- **Tanz der Schwerter** — 16 Initiativephasen; GS `+4`, AT/VT `+2`; Mächtige Liturgie GS `+2`
- **Adlerauge Luchsenohr** and **Adlerauge Luchsenohr (Tiergeist)** — 64 Initiativephasen; Sinnenschärfe/Wachsamkeit `+4`; Mächtige Magie `+2`
- **Innere Ruhe** — 7,680 Initiativephasen; Selbstbeherrschung `+4`; Mächtige Liturgie `+2`
- **Mondsilberzunge** — 960 Initiativephasen; Überreden `+4`; Mächtige Liturgie `+2`
- **Rahjas Wohlgefallen** — 960 Initiativephasen; Menschenkenntnis/Betören `+4`; Mächtige Liturgie `+2`
- **Psychostabilis** and **Psychostabilis (Tiergeist)** — 960 Initiativephasen; MR `+4`; Mächtige Magie `+2`
- **Tanz des Ungehorsams** — 23,040 Initiativephasen; MR `+4`; Mächtige Magie `+2`

## Structured persistent zone markers

- **Dunkelheit** — stationary 4-step circle for 64 Initiativephasen; applies a visible, marker-only Active Effect to non-caster occupants. It does not alter Foundry scene lighting or token vision. The moving _Begleiter_ variant remains manual.

## Healing (intentionally excluded from the damage list)

- **Balsam Salabunde** — `2W6+4` HEALING_WOUND
- **Geistheilung** — `2W6+4` HEALING_WOUND
- **Hexenspeichel** — `2W6+4` HEALING_WOUND
- **Lach dich gesund** — `2W6+4` HEALING_WOUND
- **Tiere besprechen** — `4W6+8` HEALING_WOUND

## Intentional approximation and deferral boundaries

Pandämonium, Seelenfeuer, and Wand aus Flammen deliberately apply their configured damage once only. Their zone, contact, crossing, repeated-damage, and other trigger rules still require manual handling.

The reviewed numeric effects above deliberately do not extend coverage to Armatrutz, Rondras Rüstung, Attributo, Krötenkuss, Entzug von Travias Gaben, Warzen sprießen, Sensattaco, Ackersegen, or Feuersegen. They require derived armor protection, direct main-attribute behavior, contact/condition mechanics, or an ambiguous/manual rules interpretation.

The following entries are deliberately absent from this active inventory. Their `_source` JSON remains unchanged; the unsupported mechanics and future design direction are documented in [pre-effect deferred mechanics](pre-effect-deferred-mechanics.md):

- Aquasphaero, Archosphaero, Frigisphaero, Humosphaero, Ignisphaero, and Orcanosphaero
- Auge des Limbus, Kulminatio Kugelblitz, Mahlstrom, Sumpfstrudel, Windhose, Igniplano Flächenbrand, and Lodernder Zorn
- Fluch der Verwirrung, Große Verwirrung, and Melodie der Verwirrung
- Mirakel: CH, FF, GE, IN, KK, KL, KO, MR, and MU
- Zerschmetternder Bannstrahl
