# zone-movement-resistance Specification

## Purpose

Canonical requirements for opt-in resistance prompts during normal movement
through persistent Zones.

## Requirements

### Requirement: Persistent Zones can require resistance for normal movement

An eligible persistent Zone with `movementResistance.enabled: true` SHALL use
the documented
[TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
Region movement path to identify a normal, non-teleport movement containing a
`MOVE`, `ENTER`, or `EXIT` segment. The active GM SHALL create at most one
resistance prompt for each `regionId:tokenId:movementId` window. Teleport,
direct document repositioning, Region edits, and paths without Region segments
SHALL remain ineligible.

#### Scenario: Internal movement requires resistance

- **WHEN** a Token normally moves wholly within an eligible Zone and Foundry
  identifies a `MOVE` segment
- **THEN** the system SHALL send one configured resistance prompt

#### Scenario: Crossing a Zone boundary requires resistance

- **WHEN** a Token normally enters or exits an eligible Zone and Foundry
  identifies an `ENTER` or `EXIT` segment
- **THEN** the system SHALL send one configured resistance prompt

#### Scenario: Teleport and direct update remain inert

- **WHEN** a Token teleports, is directly repositioned, or a Region is edited
- **THEN** the system SHALL not create a movement-resistance prompt or marker

### Requirement: Failed Zone movement is visible and table managed

On failed movement resistance, the system SHALL create or retain one
mechanically neutral
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
owned by the Region and Token. Its Ilaris flags SHALL retain Region ID,
application ID, Token ID, source spell UUID, concrete cast skill, and the
recorded normal-movement origin. A German chat instruction to the affected
owner and active GM(s) SHALL state that the GM must restore the Token to that
origin. The system SHALL not block, revert, or reposition the Token.

#### Scenario: Failure retains one origin-restoration marker

- **WHEN** a Token fails movement resistance twice for the same Zone
- **THEN** it SHALL retain exactly one matching marker
- **AND** the marker SHALL identify the latest failed movement origin

#### Scenario: Success or Zone cleanup removes only the matching marker

- **WHEN** a Token later succeeds for that Zone or the owning Region is removed
- **THEN** the system SHALL remove only that Zone's matching movement marker
- **AND** a marker from another Region or manual source SHALL remain
