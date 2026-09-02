## ADDED Requirements

### Requirement: Replacement forms can summon Items

A structured form with `effectMode: "replace"` SHALL use the established `summonItem` pre-effect representation. On successful selection it SHALL resolve the configured source UUID using the existing source-kind catalog and create the Item with normal timed cleanup.

#### Scenario: Schimmernder Schild summons a configured shield

- **WHEN** Schimmernder Schild is selected and Fortifex succeeds
- **THEN** only its configured shield summon pre-effect SHALL resolve
- **AND** the resulting Item SHALL retain normal owner/timing cleanup
