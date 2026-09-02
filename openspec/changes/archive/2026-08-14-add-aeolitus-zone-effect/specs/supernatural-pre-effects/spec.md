## ADDED Requirements

### Requirement: Pre-Effect failure materialization dispatches table-managed notices

When a selected resistance failure result contains an enabled `tableManagedDisplacement`, the Pre-Effect processor SHALL materialize its normal condition and marker result first, then create the outcome's one whispered manual-displacement notice. It SHALL use the resolved target Token context and preserve the source Item, selected form, caster, application, and cast-skill metadata used by the marker.

#### Scenario: Zone-triggered failure retains Token-safe notice context

- **WHEN** a Zone target with an unlinked Token Actor fails a qualifying resistance
- **THEN** the marker and instruction SHALL refer to that Token Actor
- **AND** the system SHALL not resolve a world Actor merely because it shares the source Actor ID
