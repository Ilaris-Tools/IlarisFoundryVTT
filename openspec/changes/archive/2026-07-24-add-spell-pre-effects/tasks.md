## 0. Add healing support to damage pipeline

- [x] 0.1 In `_applyDamageDirectly` (`scripts/combat/dialogs/shared-dialog-helpers.js`), add negative damage branch: when damage < 0, calculate wounds removed via `Math.floor(Math.abs(damage) / ws)`, reduce wounds (capped at 0), send healing chat message
- [x] 0.2 Handle STUMPF damage type healing (reduce Erschöpfung instead of wounds)
- [x] 0.3 Handle LEP system healing

## 1. Damage spells — \*faxius family (7 spells)

- [x] 1.1 Ignifaxius Flammenstrahl — add preEffects: instant damage 4W6, FEUER, maechtigBonus +2W6
- [x] 1.2 Frigifaxius — add preEffects: instant damage 4W6, EIS, maechtigBonus from text
- [x] 1.3 Aquafaxius — add preEffects: instant damage 4W6, WASSER
- [x] 1.4 Humofaxius — add preEffects: instant damage 4W6, HUMUS
- [x] 1.5 Archofaxius — add preEffects: instant damage 4W6, ERZ
- [x] 1.6 Orcanofaxius — add preEffects: instant damage 4W6, LUFT
- [x] 1.7 Zorn der Elemente — add preEffects: instant damage 2W6, PROFAN

## 2. Heal spells (5 spells)

- [x] 2.1 Balsam Salabunde — add preEffects: instant, value "-2W6-4", maechtigBonus "+4"
- [x] 2.2 Geistheilung — add preEffects: instant, value "-2W6-4"
- [x] 2.3 Hexenspeichel — add preEffects: instant, value "-2W6-4"
- [x] 2.4 Lach dich gesund — add preEffects: instant, value "-2W6-4"
- [x] 2.5 Tiere besprechen — add preEffects: instant, value "-4W6-8", maechtigBonus "+8"

## 3. Buff spells (~8 spells) — deferred: key path mapping documented in spec

- [ ] 3.1 Armatrutz — RS +1 (❌ RS is derived, no direct field)
- [x] 3.2 Axxeleratus — GS +4 (`system.abgeleitete.gs`), AT/VT +2 (`system.modifikatoren.nahkampfmod`, `system.modifikatoren.verteidigungmod`)
- [ ] 3.3 Attributo — Attribut +2 (❌ multiple sub-fields, dynamic attribute selection)
- [ ] 3.4 Movimento Dauerlauf — GS buff (`system.abgeleitete.gs`)
- [ ] 3.5 Falkenauge Meisterschuss — AT buff (`system.modifikatoren.nahkampfmod`)
- [ ] 3.6 Standfest Katzengleich — defense buff (`system.modifikatoren.verteidigungmod`)
- [ ] 3.7 Caldofrigo — elemental resist (❌ no resistance field)
- [ ] 3.8 Gardianum Zauberschild — MR buff (`system.abgeleitete.mr`)

## 4. Debuff spells (~6 spells) — deferred: key path mapping needed

- [ ] 4.1 Blitz dich find — geblendet -2 (❌ no direct "blinded" field)
- [ ] 4.2 Corpofesso Gliederschmerz — Erschöpfung per movement (❌ conditional effect)
- [ ] 4.3 Corpofrigo Kälteschock — debuff
- [ ] 4.4 Plumbumbarum — -AT (`system.modifikatoren.nahkampfmod`)
- [ ] 4.5 Horriphobus Schreckgestalt — fear (❌ no direct "fear" effect field)
- [ ] 4.6 Paralysis — stun/paralysis (❌ no direct condition field)

## 5. Validation

- [x] 5.1 Run `npm test` and verify no regressions
- [x] 5.2 Run `npm run lint` — clean
- [x] 5.3 Run `npm run pack-all` to repack modified compendiums
- [ ] 5.4 Manually verify: open a modified spell sheet, confirm preEffects section renders correctly
- [ ] 5.5 Manually test: cast Ignifaxius, verify instant damage is applied automatically
- [ ] 5.6 Manually test: cast Armatrutz, verify ActiveEffect is created with correct duration and values
- [ ] 5.7 Manually test: cast Blitz dich find against a target, verify resist prompt appears
