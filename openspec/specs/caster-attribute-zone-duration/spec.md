# Caster Attribute Zone Duration Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Persistent Zone duration can snapshot a caster attribute

A persistent Zone profile SHALL optionally define
`duration.source: "casterAttribute"` and a valid Ilaris main attribute key in
`duration.attribute`. Before creating the persistent
[RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html),
the active GM SHALL read that attribute from the successful caster and snapshot
its finite, positive value as the Region's normal `sceneRounds` `remaining`
and `originalValue`. The Region SHALL not retain a live link to the actor
attribute.

#### Scenario: KO becomes a numeric Scene-round duration

- **WHEN** a successful persistent Zone has `duration.source:
"casterAttribute"` and `duration.attribute: "KO"`
- **AND** the caster's KO is 6
- **THEN** the created Region SHALL persist `durationType: "sceneRounds"`,
  `remaining: 6`, and `originalValue: 6`

#### Scenario: Later attribute changes do not alter a Zone

- **WHEN** a Zone captured KO as 6 and the caster's KO later changes
- **THEN** the Region SHALL continue to age from its persisted numeric value
- **AND** the system SHALL not recompute the Zone duration

#### Scenario: Invalid caster attribute prevents a Zone

- **WHEN** a caster-attribute duration source is missing, invalid, zero, or
  non-finite at successful casting
- **THEN** the system SHALL show a localized error and SHALL not create a
  Region
