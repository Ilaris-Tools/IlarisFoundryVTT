## ADDED Requirements

### Requirement: ActiveEffects retain passive Zone provenance

The system SHALL store passive Zone ownership separately from ordinary supernatural spell-cast provenance in `flags.ilaris`. A passive Zone effect SHALL retain its Region ID, Region application identity, target Token ID, spell UUID, and Pre-Effect index so that only its owning Region lifecycle can remove it.

#### Scenario: Passive Zone provenance is available after reload

- **WHEN** a passive Zone ActiveEffect is persisted and the Scene or Actor reloads
- **THEN** the effect SHALL retain its passive marker and complete Region/token ownership fields
- **AND** the lifecycle service SHALL be able to identify it without relying on in-memory state

### Requirement: Passive Zone effects bypass ordinary spell-recast replacement

The optional Foundry supernatural-stacking mode SHALL continue to replace ordinary repeated spell applications, but it SHALL NOT replace a passive Zone application merely because another Region shares its spell UUID.

#### Scenario: Second passive Region does not replace the first

- **WHEN** two passive Regions created from the same spell affect the same Actor while Foundry stacking is enabled
- **THEN** the Actor SHALL retain one passive ActiveEffect from each Region
