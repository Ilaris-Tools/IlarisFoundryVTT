## Why

The pre-effects system (instant damage, duration-based ActiveEffects, resist tests, Mächtige Magie amplification) is fully implemented — but no spell compendium entries actually use it. Every spell still relies on manual GM adjudication to apply damage, heals, buffs, and debuffs. Populating pre-effects on the ~30 spells that are clear candidates unlocks the automation for the first time in production data.

## What Changes

- **Add healing support to `_applyDamageDirectly`**: When damage is negative (heal formula evaluates to a negative number), reduce wounds instead of increasing them. Healing is capped at 0 wounds (no negative wounds). Each full WS threshold of healing removes one wound. Handles both standard and LEP systems.
- **Add pre-effects to direct damage spells**: 7 elemental ray spells (6 × \*faxius + Zorn der Elemente) get `preEffects[0]` with `instant: true`, `changes[0].key: "system.gesundheit.wunden"`, `damageType` matching the element (FEUER, EIS, WASSER, HUMUS, ERZ, LUFT; Zorn uses PROFAN as generic), and `amplifiedByMaechtigeMagie: true` with `maechtigBonus` extracted from `system.maechtig`
- **Add pre-effects to heal spells**: 4–5 heal spells (Balsam, Geistheilung, Hexenspeichel, Lach dich gesund, Tiere besprechen) get instant pre-effects targeting wounds. The heal formula (e.g., `2W6+4`) is negated in the pre-effect value so `_applyDamageDirectly` interprets it as healing
- **Add pre-effects to simple buffs**: ~8 buff spells (Armatrutz, Axxeleratus, Attributo, Movimento, Falkenauge, Standfest, Caldofrigo, Gardianum) get `instant: false` pre-effects with `baseDuration` derived from `system.wirkungsdauer` and appropriate `changes[].key`/`value` pairs
- **Add pre-effects to simple debuffs**: ~6 debuff spells (Blitz dich find, Corpofesso, Corpofrigo, Plumbumbarum, Horriphobus, Paralysis) get `instant: false` pre-effects with duration. Resist/avoid tests are deferred — they depend on whether the spell text describes the effect itself as avoidable, not just the casting difficulty
- **Run `npm run pack-all`** to repack modified compendiums

## Capabilities

### New Capabilities

- `spell-pre-effect-data`: Compendium data population — pre-effect configurations for damage, heal, buff, and debuff spells in `zauberspruche-und-rituale`

### Modified Capabilities

- `combat`: `_applyDamageDirectly` gains healing support for negative damage values

## Impact

- **`comp_packs/zauberspruche-und-rituale/_source/`**: ~30 JSON files modified to add `system.preEffects[]` entries
- **`scripts/combat/dialogs/shared-dialog-helpers.js`**: `_applyDamageDirectly` — add negative damage (healing) branch
- **`npm run pack-all`** required after editing source JSONs
