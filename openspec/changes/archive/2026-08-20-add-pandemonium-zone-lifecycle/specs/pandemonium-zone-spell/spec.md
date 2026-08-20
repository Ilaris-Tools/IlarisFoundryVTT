## ADDED Requirements

### Requirement: Pandämonium is authored as a passive damage Zone

The _Pandämonium_ compendium source SHALL define a freely placed, persistent
circle with a two-step radius and 16-step casting range. It SHALL use passive
Zone effects, create applications for initial occupants and later entrants,
and retain its one-hour duration through the existing scene-round Zone
lifecycle. Its passive non-instant Pre-Effect SHALL be an infinite
`system.gesundheit.wunden` DOT of `2W6` `PROFAN` damage; Mächtige Magie SHALL
add `+1W6` to every tick.

#### Scenario: Contained Token receives ongoing Pandämonium damage

- **WHEN** _Pandämonium_ is successfully placed with a non-caster Token inside
- **THEN** that Token SHALL receive one visible Region-owned infinite DOT
  ActiveEffect
- **AND** its next supported owner-turn end SHALL resolve `2W6 PROFAN` damage

#### Scenario: Leaving ends Pandämonium damage

- **WHEN** an affected Token leaves the _Pandämonium_ Region
- **THEN** its Region-owned DOT SHALL be removed
- **AND** later owner turns SHALL not resolve another Pandämonium tick

### Requirement: Pandämonium requires GE 16 to move through its Zone

_Pandämonium_ SHALL enable the generic Zone movement-resistance profile with
GE 16. It SHALL apply to normal movement within, into, or out of the Zone;
its damage remains independent and is not reapplied by movement resistance.
The actor Vorteil _Unheilig_ exception SHALL remain a visible manual
table/GM responsibility in this change.

#### Scenario: Failed movement is not automatic movement control

- **WHEN** an affected Token fails _Pandämonium_'s GE 16 movement resistance
- **THEN** the system SHALL create the source-linked origin-restoration marker
  and send its German instruction
- **AND** it SHALL not move the Token or apply an extra damage tick

#### Scenario: Unheilig remains manual

- **WHEN** a GM reviews the _Pandämonium_ source or automation guide
- **THEN** it SHALL state that _Unheilig_ is not automatically detected
- **AND** it SHALL not create an actor-item or terrain condition schema
