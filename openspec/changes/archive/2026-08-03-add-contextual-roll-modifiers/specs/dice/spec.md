## MODIFIED Requirements

### Requirement: Skill and talent rolls resolve contextual effect modifiers

The unified FertigkeitDialog SHALL resolve roll-phase Ilaris modifiers for
its actor, Fertigkeit or Talent, and the current selected situation context
before calculating the probe value. It SHALL offer a localized situation
dropdown containing no special situation, social duel, waiting in a social
duel, investigation/research, and destroying/breaking an object. An explicitly
supplied situation from the roll opener SHALL initialize the dialog selection.
It SHALL include the resolved contribution in the displayed modifier
breakdown.

#### Scenario: Social-duel talent bonus applies

- **WHEN** a social-duel roll uses Einschüchtern or Überreden
- **THEN** a matching ordinary `situation: ["sozialesDuell"]` modifier SHALL
  be added to that probe

#### Scenario: Waited social-duel roll retains generic effects

- **WHEN** a roll selects the “Rededuell – abwartend” situation
- **THEN** a modifier selecting `sozialesDuellAbwartend` SHALL apply
- **AND** a modifier selecting the parent `sozialesDuell` SHALL also apply

#### Scenario: Situation-bound bonus does not leak

- **WHEN** the same talent is rolled without the `sozialesDuell` situation
- **THEN** the situation-bound modifier SHALL NOT be included

#### Scenario: Attribute modifier applies only to a tested attribute

- **WHEN** a FertigkeitDialog probe uses GE and the actor has a matching
  semantic GE modifier
- **THEN** the dialog SHALL include that modifier in the GE part of the probe
- **AND** it SHALL NOT modify the actor's prepared GE or GS values
