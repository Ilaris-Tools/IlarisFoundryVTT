## ADDED Requirements

### Requirement: Configurable weapon-damage multiplier roll behavior

The combat modifier pipeline SHALL apply the world weapon-damage roll expansion setting only to `WEAPON_DAMAGE` modifications with the `MULTIPLY` operator. When expansion is enabled, the system SHALL use [`foundry.dice.Roll#alter`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html#alter) to multiply both dice terms and numeric terms in the base weapon formula before damage is rolled. When expansion is disabled, the system SHALL retain result multiplication.

#### Scenario: Default result multiplication

- **WHEN** a `WEAPON_DAMAGE` multiplier of `2` is applied to base weapon damage `2W6+3` while the setting is disabled
- **THEN** the generated weapon-damage formula SHALL represent `(2W6+3)*2`
- **AND** the weapon-damage result SHALL be doubled after the base formula is evaluated

#### Scenario: Opt-in formula expansion

- **WHEN** a `WEAPON_DAMAGE` multiplier of `2` is applied to base weapon damage `2W6+3` while the setting is enabled
- **THEN** the generated weapon-damage formula SHALL represent `4W6+6`
- **AND** the damage roll SHALL roll four six-sided dice and include a flat bonus of six

#### Scenario: Flat damage remains outside weapon multiplier

- **WHEN** a weapon-damage multiplier is expanded while a separate flat `DAMAGE` modifier also applies
- **THEN** only the base weapon formula SHALL be expanded
- **AND** the flat damage modifier SHALL be applied after the weapon formula without being multiplied

#### Scenario: Other modifier types remain unchanged

- **WHEN** the weapon-damage roll expansion setting is enabled and a modifier type other than `WEAPON_DAMAGE` is processed
- **THEN** that modifier SHALL retain its existing operator behavior
