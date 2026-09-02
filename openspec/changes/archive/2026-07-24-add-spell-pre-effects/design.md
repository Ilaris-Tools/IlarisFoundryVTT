## Context

The pre-effects infrastructure (`preEffects` array on übernatürlich items, `applyPreEffects()`, resist tests, Mächtige Magie amplification) is fully implemented. No spell compendium entries populate `system.preEffects` — all fields are empty arrays `[]`. This change adds the data.

The spell families identified in exploration share a common structure that maps cleanly to pre-effect templates.

## Goals / Non-Goals

**Goals:**

- Populate `preEffects` on ~30 spells across 4 families (damage rays, heal, buffs, debuffs)
- Use correct `changes[].key` targeting actual Actor data model fields
- Extract `maechtigBonus` from spell's `system.maechtig` text
- Set `baseDuration` from `system.wirkungsdauer` where applicable
- Run `npm run pack-all` after all edits

**Non-Goals:**

- Adding pre-effects to zone/area spells that require complex targeting logic (sphaero, Igniplano, Pandämonium) — these are deferred
- Adding pre-effects to utility spells (teleportation, detection, communication)
- Adding pre-effects to spells with conditional/modification-based effects
- Changing any code or data model schemas

## Decisions

### Decision 1: Which spells to include

**Chosen**: ~30 spells across 4 clear families, excluding zone/conditional spells.

| Family                           | Count | Pre-effect type                        |
| -------------------------------- | ----- | -------------------------------------- |
| Elemental rays (\*faxius + Zorn) | 7     | instant damage, elemental types        |
| Heals                            | 5     | instant heal (negative wounds formula) |
| Simple buffs                     | ~8    | duration-based ActiveEffect            |
| Simple debuffs                   | ~6    | duration-based ActiveEffect            |

**Rationale**: Zone spells (sphaero, Igniplano) have complex targeting (moving spheres, radius-based) that doesn't map cleanly to the current "target all selected actors" model. They're deferred to a future change.

### Decision 2: Damage type values

**Chosen**: Use the configurable `damageTypes` setting (implemented separately) for all damage type values. Map each spell to its corresponding element:

| Spell             | damageType       |
| ----------------- | ---------------- |
| Ignifaxius        | FEUER            |
| Frigifaxius       | EIS              |
| Aquafaxius        | WASSER           |
| Humofaxius        | HUMUS            |
| Archofaxius       | ERZ              |
| Orcanofaxius      | LUFT             |
| Zorn der Elemente | PROFAN (generic) |
| Heal spells       | PROFAN           |

**Rationale**: The `damageTypes` setting now provides 11 configurable types matching the spells' elements. Using specific elemental types enables future resistance/immunity handling. Zorn der Elemente uses PROFAN since it works with any element. Heal spells use PROFAN since they target wounds generically.

### Decision 3: Heal spells — negate formula, add healing path to damage pipeline

**Chosen**: Heal spells store their formula with a leading `-` in the pre-effect `value` (e.g., `value: "-2W6-4"`). The `_applyDamageDirectly` function gains a healing branch: when damage < 0, wounds are reduced instead of increased.

**Rationale**: `_applyDamageDirectly` currently only handles positive damage (`woundsToAdd > 0` guard). Adding a healing branch for negative values lets heal spells reuse the same pipeline. Healing removes wounds based on WS thresholds: each full WS of healing removes one wound. Wounds are capped at 0 (no negative wounds).

**Healing calculation:**

```
healAmount = Math.abs(damage)     // e.g., 12
woundsRemoved = Math.floor(healAmount / ws)  // e.g., WS=5 → 2 wounds removed
newWounds = Math.max(0, currentWounds - woundsRemoved)
```

### Decision 4: Mächtig bonus extraction

**Chosen**: Parse `system.maechtig` text to extract the bonus formula. For damage spells: "Die TP steigen um 2W6." → `maechtigBonus: "+2W6"`. For buffs: "Je zwei Stufen verleihen +1 RS." → `maechtigBonus: "+1"` (per 2 QS). For heals: "Erhöht die Heilpunkte um 4." → `maechtigBonus: "+4"`.

**Rationale**: The `amplifiedByMaechtigeMagie` flag and `maechtigBonus` string are already handled by the pre-effects processor — it appends `maechtigBonus` once per QS to the value formula before evaluation.

### Decision 5: Duration mapping

**Chosen**: Convert `system.wirkungsdauer` text to `baseDuration` integer (turns):

- "X Minuten" → X (1 minute ≈ 1 turn in combat)
- "X Initiativphasen" → X (1 IP ≈ 1 turn)
- "X Stunden" → X \* 60
- "augenblicklich" → `instant: true`

## Risks / Trade-offs

- **[Risk] Incorrect key paths** → Mitigation: Use the same `collectActorSystemPaths()` utility to verify keys against actual Actor data models
- **[Risk] Formula evaluation differences** → The pre-effects processor normalizes `W` to `d` notation. All spell formulae use `W6` → `d6`. Verified compatible.
- **[Risk] Heal spells use new code path** → Mitigation: Healing branch in `_applyDamageDirectly` is simple arithmetic. Test with Balsam as the first heal spell.
