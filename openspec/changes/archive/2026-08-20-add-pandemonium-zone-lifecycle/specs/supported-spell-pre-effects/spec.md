## MODIFIED Requirements

### Requirement: Accepted partial damage remains explicitly bounded

_Seelenfeuer_ and _Wand aus Flammen_ SHALL define one-time direct-damage
Pre-Effects only. Their ongoing zone, contact, crossing, and per-Initiativephase
behavior SHALL remain documented as manual/deferred. _Pandämonium_ SHALL
instead use the reviewed persistent passive-Zone lifecycle defined by the
`pandemonium-zone-spell` capability; its _Unheilig_ exception SHALL remain
explicitly documented as manual until generic Vorteil applicability exists.

#### Scenario: Remaining damage-only approximation is applied once

- **WHEN** _Seelenfeuer_ or _Wand aus Flammen_ succeeds against selected
  targets
- **THEN** its configured direct damage SHALL be applied once through the
  shared damage pipeline
- **AND** the system SHALL not claim to automate its omitted trigger or
  repeating behavior

#### Scenario: Pandämonium is no longer a one-time approximation

- **WHEN** a contributor reviews the supported spell inventory after this
  change
- **THEN** _Pandämonium_ SHALL be identified as a persistent passive Zone
- **AND** it SHALL not be described as a one-time damage-only approximation
