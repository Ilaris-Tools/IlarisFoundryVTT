## MODIFIED Requirements

### Requirement: DOT (Damage Over Time) effects

The system SHALL support DOT effects using the `change.type === "dot"` change
type registered as a first-class Foundry V14 change type via
`foundry.data.fields.TypeDataField`. An active finite `ownerTurns` DOT SHALL
continue to resolve at the end of its owner's turn and use its normal timing
decrement/expiry lifecycle. An active infinite DOT owned by a passive Zone
application SHALL resolve once at the end of its owner's turn without setting
expiry flags, decrementing timing, or expiring. A DOT SHALL resolve supported
numeric or dice-formula values and its configured damage type through the
shared damage path before updating the owning actor; its chat result SHALL
identify the source effect.

#### Scenario: DOT effect identification

- **WHEN** an effect has changes with keys starting with
  `system.gesundheit.wunden` or `system.gesundheit.erschoepfungen` and
  `type === "dot"`
- **THEN** these changes SHALL be identified as DOT changes

#### Scenario: Finite DOT damage application

- **WHEN** an active finite owner-turn effect with DOT changes reaches its
  documented owner-turn end processing
- **THEN** the DOT damage SHALL be applied to the owning actor and a
  ChatMessage SHALL be created documenting the tick
- **AND** its existing duration decrement and expiry behavior SHALL remain
  unchanged

#### Scenario: Infinite passive-Zone DOT tick

- **WHEN** an active passive-Zone-owned infinite DOT reaches its owner's turn
  end during forward combat progression
- **THEN** it SHALL apply exactly one DOT tick through the shared damage path
- **AND** its timing remaining value and Region-owned lifetime SHALL remain
  unchanged

#### Scenario: Formula and typed DOT damage

- **WHEN** a DOT has the formula `2W6+1W6` and damage type `PROFAN`
- **THEN** the system SHALL roll the formula and apply the resolved typed
  damage once
- **AND** it SHALL not add an unrolled formula string to actor health data

#### Scenario: Invalid DOT does not partially mutate health

- **WHEN** a DOT formula or configured damage type cannot be resolved
- **THEN** the system SHALL issue a GM-facing warning
- **AND** it SHALL not partially update the actor's health data
