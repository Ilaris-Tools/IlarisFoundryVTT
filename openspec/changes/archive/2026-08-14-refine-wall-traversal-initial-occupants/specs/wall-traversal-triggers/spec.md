## MODIFIED Requirements

### Requirement: Persistent wall Zones detect movement-based traversal attempts

A persistent, triggered rectangular Zone SHALL support the optional
`trigger.onTraverse` flag, which defaults to `false`. A traversal profile SHALL require
`trigger.triggerOnCreate: false` and `trigger.onEnter: false`. When it is true, the active GM SHALL use the
processed movement data from Foundry v14's
[TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
and `segmentizeRegionMovementPath` to identify a real movement path that
contains a non-teleport `ENTER` or `EXIT` segment for that Region. It SHALL not
infer traversal from final Region membership alone. Teleport movement, initial
occupancy, direct document repositioning, Region-boundary edits, and MOVE-only
paths SHALL NOT be traversal attempts.

#### Scenario: A Token moves through a wall in one normal movement

- **WHEN** a Token normally moves from one side of an eligible wall Region to the other
- **THEN** its processed Region path SHALL contain an `ENTER` or `EXIT` segment
- **AND** the system SHALL resolve exactly one traversal attempt for that Region and Token

#### Scenario: A Token enters but stops within a wall

- **WHEN** a Token normally moves from outside an eligible wall Region into it and ends within it
- **THEN** the `ENTER` segment SHALL be treated as one traversal attempt

#### Scenario: A Token leaves a wall through normal movement

- **WHEN** a Token normally moves from inside an eligible wall Region to outside it
- **THEN** the `EXIT` segment SHALL be treated as one traversal attempt
- **AND** the system SHALL use the same unconditional consequence and resistance flow as an inbound attempt

#### Scenario: A Token starts within a newly placed wall

- **WHEN** an eligible wall Region is created or placed over a Token already contained by it
- **THEN** the system SHALL create no traversal prompt, damage, or marker
- **AND** a later normal `EXIT` movement SHALL remain eligible as one traversal attempt

#### Scenario: Parallel or internal movement does not attempt traversal

- **WHEN** a Token's normal movement yields only MOVE segments for a wall Region or no Region segment
- **THEN** the system SHALL NOT create a traversal prompt, damage, or marker

#### Scenario: Teleporting across a wall does not trigger traversal

- **WHEN** a Token movement across a wall is identified by Foundry as teleport movement
- **THEN** the system SHALL NOT resolve a traversal attempt
