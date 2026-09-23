## ADDED Requirements

### Requirement: Actor summon processing has focused automated coverage

The unit suite SHALL cover actor-source resolution, provenance, placement,
GM-authorized dispatch, field-aware Mächtige-Magie overrides, atomic rollback,
timed cleanup, permanent retention, and forward-only readiness delay. It SHALL
also retain regression coverage for the existing `summonItem` dispatch branch.

#### Scenario: Actor summon failure cannot orphan a document

- **WHEN** a focused unit test simulates each creation failure after source resolution
- **THEN** it SHALL verify that only documents created by that application are cleaned up
- **AND** it SHALL verify that the failed operation reports no successful summon
