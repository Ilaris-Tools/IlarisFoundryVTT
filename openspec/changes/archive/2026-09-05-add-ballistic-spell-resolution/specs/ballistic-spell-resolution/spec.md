## ADDED Requirements

### Requirement: Ballistic casts resolve before target effects

An explicitly ballistic supernatural spell SHALL, after a successful cast and
before each target Pre-Effect, resolve the established ranged defense
lifecycle. It SHALL apply damage and every other target Pre-Effect only for a
target that does not defend successfully. The target context SHALL retain its [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
identity.

#### Scenario: Undefended target receives the spell effects

- **WHEN** a marked ballistic spell succeeds against a selected target
- **THEN** the system SHALL offer the normal ranged-defense path
- **AND** after no successful defense it SHALL apply that target's Pre-Effects exactly once

#### Scenario: Successful defense prevents all target effects

- **WHEN** the selected target successfully completes the ranged defense
- **THEN** the system SHALL apply neither damage nor any later Pre-Effect to that target

#### Scenario: Unmarked spell retains existing behavior

- **WHEN** a successful supernatural spell has no ballistic marker
- **THEN** the system SHALL retain its existing direct or zone Pre-Effect path
