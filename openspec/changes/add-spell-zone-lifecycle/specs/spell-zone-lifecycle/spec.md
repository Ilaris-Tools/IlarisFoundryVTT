## ADDED Requirements

### Requirement: Structured zone profile

Übernatürlich items and selected spell modifications SHALL support an optional normalized zone profile containing shape, dimensions, pivot, placement anchor, placement range, lifecycle, and trigger timing. The profile SHALL remain absent for non-zone items.

#### Scenario: Cone profile is normalized

- **WHEN** Tlalucs Odem Pestgestank is loaded with its zone data
- **THEN** the normalized profile SHALL identify a cone with length 8, angle 45 degrees, caster anchor, and tip pivot

#### Scenario: Rectangle profile is normalized

- **WHEN** Wand aus Dornen is loaded with its zone data
- **THEN** the normalized profile SHALL identify a rectangle with length 4, width 1, free placement, top-left pivot, and placement range 8

#### Scenario: Modification replaces zone geometry

- **WHEN** Miasmasphaero is selected for Tlalucs Odem Pestgestank
- **THEN** the effective profile SHALL replace the cone with a caster-centered circle while retaining the modification's effective spell profile

### Requirement: Pre-roll zone placement

The supernatural dialog SHALL place a temporary Foundry measured-template preview after casting maneuvers and their range modifiers are resolved but before the spell roll. The placement range for free zones SHALL be measured from the caster token center. The Foundry `MeasuredTemplate` document/placeable API SHALL be used after v14 verification: [MeasuredTemplate](https://foundryvtt.com/api/v14/classes/foundry.documents.MeasuredTemplate.html), [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.Token.html), and [Token](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html).

#### Scenario: Maneuver range modifies placement

- **WHEN** a casting maneuver adds placement range
- **THEN** the preview SHALL allow the zone pivot up to base range plus the maneuver bonus from the caster token center

#### Scenario: Placement is cancelled

- **WHEN** the user cancels zone placement
- **THEN** the spell SHALL not roll, pay energy, or create a persistent measured template

#### Scenario: Placement is redone

- **WHEN** the user activates the supernatural dialog's redo-placement button
- **THEN** the current temporary placement SHALL be discarded and a new preview SHALL be opened before rolling

### Requirement: Successful instant-zone resolution

An instant zone SHALL resolve only after a successful spell roll. Current tokens intersecting the confirmed template SHALL be converted into token-aware `selectedActors` and passed to the existing pre-effect pipeline.

#### Scenario: Tlalucs cone affects current occupants

- **WHEN** Tlalucs Odem Pestgestank succeeds with a confirmed cone
- **THEN** every token selected by Foundry's standard measured-template intersection behavior SHALL receive the existing pre-effect processing once

#### Scenario: Failed instant zone has no effects

- **WHEN** an instant zone spell fails
- **THEN** no target SHALL receive damage, a resistance prompt, or a persistent zone template

### Requirement: Persistent zone document

A persistent zone SHALL create a measured-template document on the active Scene after a successful cast, storing resolved Ilaris zone metadata in flags. The zone SHALL remain until its resolved duration expires or the template is deleted. The `Scene`, `MeasuredTemplate`, and document embedded-document APIs SHALL be verified against v14 before implementation: [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).

#### Scenario: Wand aus Dornen persists

- **WHEN** Wand aus Dornen succeeds with confirmed placement
- **THEN** a measured template SHALL remain on the scene with its effective profile, caster context, spell UUID, application ID, and trigger configuration

#### Scenario: Persistent zone expires

- **WHEN** a persistent zone reaches its resolved duration
- **THEN** the measured template SHALL be removed and no future entry or turn trigger SHALL be dispatched

### Requirement: Entry and beginning-of-turn triggers

Persistent zones SHALL support independent `onEnter` and `onTurnStart` trigger flags. Entry SHALL include re-entry after the token leaves. Trigger handling SHALL deduplicate repeated document updates for the same zone, token, and trigger window.

#### Scenario: Re-entry triggers again

- **WHEN** a token leaves a persistent zone and later enters it again
- **THEN** the zone SHALL dispatch a new entry trigger for that token

#### Scenario: Beginning-of-turn trigger is optional

- **WHEN** a token begins its turn inside a zone whose `onTurnStart` flag is enabled
- **THEN** the zone SHALL dispatch one turn-start trigger for that token in that turn
- **AND WHEN** the flag is disabled
- **THEN** no turn-start trigger SHALL be dispatched

### Requirement: Resistance and token context

Zone-triggered effects SHALL reuse the existing resistance and pre-effect pipelines and SHALL preserve `tokenId`, `actorId`, and `actorLink` so unlinked token actors are resolved from the token first. Resistance prompts SHALL be dispatched once per trigger event and SHALL apply the result only to the triggering token actor.

#### Scenario: Thorn wall sends an entry resistance prompt

- **WHEN** a token enters Wand aus Dornen and its pre-effect has an enabled avoid test
- **THEN** the controlling client SHALL receive the existing resist prompt with the originating zone and token context

#### Scenario: Duplicate movement update does not duplicate prompt

- **WHEN** several token updates occur while the token remains inside the wall
- **THEN** only one prompt SHALL be created for that entry event
