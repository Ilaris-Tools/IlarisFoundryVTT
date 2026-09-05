## ADDED Requirements

### Requirement: Zone administration E2E cleanup is fixture-owned

Zone-administration verification SHALL mutate and clean up only the Regions
created for its current fixture.

#### Scenario: Selected zone administration leaves comparison zone unchanged

- **WHEN** a GM administers one fixture Zone
- **THEN** only that Zone's recorded document identifiers SHALL change
