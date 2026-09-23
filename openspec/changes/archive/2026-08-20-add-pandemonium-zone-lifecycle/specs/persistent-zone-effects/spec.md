## ADDED Requirements

### Requirement: Passive Zone applications support infinite DOT effects

A persistent passive Zone SHALL accept a non-instant Pre-Effect containing
`dot` changes. Its Region-owned application SHALL use infinite Ilaris timing;
the active GM SHALL retain it while the Token is contained and remove only that
application on leaving, Region expiry, dismissal, or deletion using
[RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
membership and the documented
[Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
embedded-document APIs.

#### Scenario: Entering creates one infinite DOT application

- **WHEN** a Token enters a passive Zone whose eligible Pre-Effect has a DOT
  change
- **THEN** the active GM SHALL create exactly one infinite Zone-owned DOT
  ActiveEffect for that Token

#### Scenario: Leaving removes only the matching DOT

- **WHEN** that Token later leaves the passive Zone
- **THEN** the active GM SHALL remove only the matching Region-owned DOT
- **AND** another Region's DOT and a manually created DOT SHALL remain
