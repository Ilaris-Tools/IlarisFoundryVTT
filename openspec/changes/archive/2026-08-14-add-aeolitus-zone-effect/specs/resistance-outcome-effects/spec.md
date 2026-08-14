## ADDED Requirements

### Requirement: A failure outcome can combine a condition, marker, and manual displacement

An enabled failure outcome SHALL allow its replacement `condition` and `marker` fields to be enabled together with optional `tableManagedDisplacement`. The canonical condition source SHALL remain independent from the visible marker effect. Both SHALL retain the resolved outcome and complete spell provenance.

#### Scenario: Combined failure does not replace the condition with a marker

- **WHEN** a failure result enables both `Position4` and a `zurueckgestossen` marker
- **THEN** the system SHALL add the canonical condition source and create the marker effect
- **AND** the marker SHALL not duplicate the native condition changes
