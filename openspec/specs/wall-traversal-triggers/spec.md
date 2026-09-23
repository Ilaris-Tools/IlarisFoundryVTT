# wall-traversal-triggers Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

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

### Requirement: A traversal applies its unconditional effects independently from its resistance

An eligible traversal attempt SHALL first apply the Zone's configured instant
traversal consequences to the moving Token. A traversal resistance profile
SHALL be independent from those consequences: its result SHALL determine only
the table-managed traversal outcome and SHALL NOT avoid, reduce, duplicate, or
otherwise change the unconditional effect. The system SHALL send one configured
resistance prompt after dispatching the unconditional consequences.

#### Scenario: Wand aus Dornen succeeds

- **WHEN** a Token attempts to traverse _Wand aus Dornen_ and succeeds at GE 16
- **THEN** the Token SHALL receive `2W6 TP` exactly once
- **AND** the successful result SHALL not create a failed-traversal marker

#### Scenario: Wand aus Dornen fails

- **WHEN** a Token attempts to traverse _Wand aus Dornen_ and fails at GE 16
- **THEN** the Token SHALL receive `2W6 TP` exactly once
- **AND** the failed result SHALL create the failed-traversal marker

### Requirement: Failed traversal is a visible, table-managed state

On failed traversal resistance, the system SHALL create or retain one visible,
mechanically neutral [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
owned by the Region and Token. It SHALL record the Region ID, Zone application
ID, Token ID, and source spell UUID in dedicated Ilaris flags. It SHALL send a
German chat instruction to the affected target owner and active GM(s) stating
that the GM must place the Token back before the wall and that a later movement
attempt will resolve a new resistance and damage event. The system SHALL NOT
automatically block, revert, reposition, or otherwise constrain the Token.

#### Scenario: Failed traversal creates one reminder

- **WHEN** a Token fails a traversal resistance twice for the same wall Region
- **THEN** it SHALL have exactly one matching failed-traversal marker
- **AND** neither marker nor chat instruction SHALL modify the Token's statistics or movement

#### Scenario: Manual reset permits a later attempt

- **WHEN** the GM manually places a Token back before a wall after a failed traversal
- **AND** the Token next moves into that wall through the normal map movement path
- **THEN** the system SHALL resolve a fresh traversal attempt

### Requirement: Traversal markers have narrow success and cleanup ownership

On a successful traversal resistance, the system SHALL remove only the failed-
traversal marker matching that Region and Token. When the owning Region expires
or is deleted, the system SHALL remove its matching traversal markers without
removing markers from another Region, another cast, another Token, or a manual
Active Effect.

#### Scenario: Success clears only the matching wall marker

- **WHEN** a Token succeeds at a later traversal through one wall Region
- **THEN** its marker from that Region SHALL be removed
- **AND** a marker from another wall Region SHALL remain

#### Scenario: Region cleanup removes its traversal marker

- **WHEN** a wall Region expires or is deleted while a Token has its failed-traversal marker
- **THEN** the matching marker SHALL be removed
- **AND** unrelated Active Effects on the Token SHALL remain

### Requirement: Wand aus Dornen is authored as the reviewed traversal consumer

The _Wand aus Dornen_ compendium source SHALL enable persistent rectangular
traversal automation, disable creation and generic entry triggering for this effect, define
GE 16 as the traversal resistance, and define unconditional `2W6` PROFAN
damage without a damage-avoidance resistance. The Zone automation reference
SHALL explain the manual Token-reset convention and explicitly state that the
four-Initiativephase leaving attempt remains table-managed.

#### Scenario: Reopening the reviewed source preserves its rule split

- **WHEN** a GM opens the packed _Wand aus Dornen_ Item
- **THEN** its Zone profile SHALL retain traversal triggering and GE 16 resistance
- **AND** its `2W6` damage Pre-Effect SHALL not contain an `avoidTest`
