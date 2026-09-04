## MODIFIED Requirements

### Requirement: Outcome effects snapshot the concrete casting skill

Every outcome-created effect and condition source SHALL record the concrete
supernatural `castSkill` used for the originating roll, alongside a generic
`sourceItemUuid`, the legacy `spellUuid`, caster, component, and application
provenance. A source Item's candidate `fertigkeiten` list or literal `auto`
selection SHALL NOT be used as a substitute for that snapshot.

#### Scenario: Fixed skill is stored as the cast skill

- **WHEN** a supernatural Item has a non-`auto` selected skill and creates an
  outcome effect
- **THEN** the effect and any condition source SHALL record that selected skill
  as `castSkill`
- **AND** `sourceItemUuid` SHALL equal the source Item UUID and `spellUuid`
  SHALL retain the same value for compatibility

#### Scenario: Unique automatic skill is stored as the cast skill

- **WHEN** an automatic spell has one eligible supernatural skill with the
  highest casting value
- **THEN** the dialog SHALL use and snapshot that skill as `castSkill` before
  it rolls

#### Scenario: Tied automatic skills use the alphabetically later highest-PW skill

- **WHEN** an automatic spell has multiple eligible supernatural skills tied
  for its highest casting value
- **THEN** the dialog SHALL select and snapshot the alphabetically later
  highest-PW skill as `castSkill` before it rolls
- **AND** it SHALL not render a `Fertigkeit` selector or disable roll actions
  pending a selection
