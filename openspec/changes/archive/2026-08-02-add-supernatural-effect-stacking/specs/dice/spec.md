## ADDED Requirements

### Requirement: Skill and talent rolls resolve contextual effect modifiers

The unified FertigkeitDialog SHALL resolve roll-phase Ilaris modifiers for
its actor, Fertigkeit or Talent, and any explicitly supplied situation
context before calculating the probe value. It SHALL include the resolved
contribution in the displayed modifier breakdown.

#### Scenario: Social-duel talent bonus applies

- **WHEN** a social-duel roll uses Einschüchtern or Überreden
- **THEN** a matching ordinary `situation: ["sozialesDuell"]` modifier SHALL
  be added to that probe

#### Scenario: Situation-bound bonus does not leak

- **WHEN** the same talent is rolled without the `sozialesDuell` situation
- **THEN** the situation-bound modifier SHALL NOT be included

#### Scenario: Attribute modifier applies only to a tested attribute

- **WHEN** a FertigkeitDialog probe uses GE and the actor has a matching
  semantic GE modifier
- **THEN** the dialog SHALL include that modifier in the GE part of the probe
- **AND** it SHALL NOT modify the actor's prepared GE or GS values

### Requirement: Probe summaries expose suppression without hiding applied modifiers

FertigkeitDialog SHALL always show applied Ilaris effect modifiers and their
effect sources in its normal modifier breakdown. If matching modifiers were
suppressed, it SHALL show an accessible suppression icon or button that
reveals the suppression ledger only when activated.

#### Scenario: Applied probe modifier remains visible

- **WHEN** an Ilaris modifier contributes to a FertigkeitDialog probe
- **THEN** the dialog SHALL display the applied contribution and its effect
  source directly

#### Scenario: Suppressed probe modifier is disclosed on demand

- **WHEN** one or more matching Ilaris modifiers were suppressed for a probe
- **THEN** the dialog SHALL display the suppression indicator
- **AND** activating it SHALL reveal the suppressed modifiers and their reason
