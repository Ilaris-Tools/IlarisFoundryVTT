## MODIFIED Requirements

### Requirement: Maneuver integration

The system SHALL integrate maneuvers (Manöver) into all three combat dialog types via `handleModifications()`. Maneuver damage-type changes SHALL retain their registry key through damage application, and unmodified melee and ranged attacks SHALL initialize with the registered `PROFAN` key.

#### Scenario: Maneuvers modify attack parameters

- **WHEN** a maneuver (e.g., Wuchtschlag, Gezielter Schlag) is selected
- **THEN** the attack roll modifiers SHALL reflect the maneuver's effects

#### Scenario: Maneuvers consume resources

- **WHEN** a maneuver with an energy or health cost is used
- **THEN** the cost SHALL be deducted from the attacker

#### Scenario: Maneuver damage type reaches damage application by key

- **WHEN** a selected maneuver uses `CHANGE_DAMAGE_TYPE` with a configured registry value
- **THEN** `applyDamageToTarget()` SHALL receive that registry value rather than its display label
- **AND** the configured damage-type behavior SHALL determine the affected health pool and armor handling

#### Scenario: Ordinary attacks start as Profan damage

- **WHEN** a melee or ranged attack resolves without a damage-type-changing maneuver
- **THEN** the damage application path SHALL receive `PROFAN`
