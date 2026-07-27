## MODIFIED Requirements

### Requirement: Heal spells have instant pre-effects

Heal spells in the compendium SHALL include pre-effect configurations that heal wounds using `damageType: "HEALING_WOUND"` with positive healing values.

#### Scenario: Balsam heals 2W6+4 wounds

- **WHEN** a GM casts Balsam and the spell succeeds
- **THEN** the target SHALL receive `2W6+4` healing via `_applyDamageDirectly` with `damageType: "HEALING_WOUND"`, which reduces wounds by WS thresholds
- **AND** the pre-effect change SHALL have `value: "2W6+4"` (positive, not negative)

#### Scenario: Mächtige Magie amplifies healing

- **WHEN** Balsam is cast with Mächtige Magie QS 1
- **THEN** the heal formula SHALL evaluate `2W6+4+4` (base + maechtigBonus × QS)

#### Scenario: All healing spells use HEALING_WOUND

- **WHEN** any healing spell (Balsam, Geistheilung, Hexenspeichel, Lach dich gesund, Tiere besprechen) is examined
- **THEN** each SHALL have `damageType: "HEALING_WOUND"` with a positive value formula

#### Scenario: Healing values are positive

- **WHEN** any healing spell pre-effect is examined
- **THEN** the `value` field SHALL be a positive formula (e.g., `"2W6+4"` not `"-2W6-4"`)
