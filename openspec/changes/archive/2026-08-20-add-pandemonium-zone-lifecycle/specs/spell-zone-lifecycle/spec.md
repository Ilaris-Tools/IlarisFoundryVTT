## ADDED Requirements

### Requirement: Zone profiles author an opt-in movement resistance

A normalized persistent Zone profile SHALL default `movementResistance.enabled`
to `false`. When enabled, it SHALL persist a selected main attribute, fixed
resistance difficulty, and German failure-marker label. The concrete
supernatural Item sheet SHALL render its `Bewegungswiderstand` control after
the existing creation, entry, and round-start trigger controls and before Zone
removal; when enabled, `Attribut` and `Schwierigkeit` SHALL be visible below
it. Structured form Zone editors SHALL retain the same local order before
their Zone buttons. Existing Zone controls and sections SHALL not move.

#### Scenario: GM authors movement resistance

- **WHEN** a GM enables `Bewegungswiderstand`, selects GE, and enters 16
- **THEN** the Item SHALL persist `movementResistance.enabled: true`,
  `attribut: "GE"`, and `resistDifficulty: 16`

#### Scenario: Existing profiles remain inert

- **WHEN** an existing persistent Zone omits `movementResistance`
- **THEN** its normalized profile SHALL disable movement resistance
- **AND** normal movement SHALL retain its existing behavior
