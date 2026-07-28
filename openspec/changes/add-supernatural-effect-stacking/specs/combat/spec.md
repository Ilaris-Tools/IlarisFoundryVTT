## ADDED Requirements

### Requirement: Combat resolves contextual Ilaris effect modifiers

Melee and ranged combat dialogs SHALL request roll-phase Ilaris modifiers with
the acting actor, weapon Fertigkeit, weapon Talent, and the resolved combat
context. The resulting AT, VT, TP, and Waffenschaden contributions SHALL be
included in the corresponding roll or damage calculation and displayed in the
dialog summary as an effect-derived modifier.

#### Scenario: Klingenwaffen attack receives its matching AT bonus

- **WHEN** an actor attacks with a weapon whose Fertigkeit is Klingenwaffen
- **THEN** a matching `fertigkeit: ["Klingenwaffen"]` AT modifier SHALL be
  included in the attack result

#### Scenario: Defense applies a separate VT modifier

- **WHEN** a combatant makes a defense roll
- **THEN** matching VT modifiers SHALL be resolved for the defending actor and
  included independently of the attacker's AT modifiers

#### Scenario: Damage effect comparison and contribution are maneuver-independent

- **WHEN** competing übernatürliche TP or Waffenschaden effect modifiers use
  fixed values or linear W6 formulas and a later maneuver modifies ordinary
  weapon damage
- **THEN** combat SHALL select the stronger effect from the raw configured or
  expected comparison magnitudes
- **AND** it SHALL add the selected effect contribution after maneuver
  transformations without multiplying, halving, or otherwise changing it
