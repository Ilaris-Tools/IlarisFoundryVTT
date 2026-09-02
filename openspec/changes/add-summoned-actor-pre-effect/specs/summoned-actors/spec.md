## ADDED Requirements

### Requirement: A successful pre-effect can materialize a configured creature Actor

For a valid `summonActor` pre-effect, the system SHALL resolve the configured
source UUID to a compendium [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
whose type is `kreatur`. It SHALL deep-clone the source's
[Actor#toObject](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#toObject)
data, create one independent world Actor, and create one linked
[TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html)
on the active [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html).
The world Actor and Token SHALL retain the source UUID, caster UUID, spell UUID,
pre-effect index, and one application id in Ilaris provenance flags.

#### Scenario: A valid creature source creates an independent Actor and Token

- **WHEN** a successful cast applies a `summonActor` pre-effect whose source UUID resolves to a creature Actor in an available compendium
- **THEN** one new world Actor and one linked Token SHALL be created
- **AND** neither document SHALL reuse the compendium source id
- **AND** both documents SHALL retain matching Ilaris application provenance

#### Scenario: An invalid source leaves no partial summon

- **WHEN** the configured source is missing, is not in a compendium, or is not a `kreatur` Actor
- **THEN** the system SHALL notify the casting user that the Beschwörungsquelle is unavailable
- **AND** it SHALL create neither a world Actor nor a Scene Token nor a lifecycle marker

#### Scenario: A later document-creation failure is rolled back

- **WHEN** Actor creation succeeds but Token or required marker creation fails
- **THEN** the system SHALL delete the newly created documents for that application in reverse order
- **AND** it SHALL not delete a source document or a document belonging to another application

### Requirement: Actor summoning honors placement and GM authority

The system SHALL use the configured placement policy. `casterAdjacent` SHALL
place a Token at a usable grid-aligned position adjacent to the caster's active
Token. `selectedTarget` SHALL place a Token at the selected material Token's
position without moving or deleting that Token. A player-initiated persistent
write SHALL be executed by an active GM through the existing `system.Ilaris`
socket route only after the GM verifies the requester controls the caster and
the source and Token context are valid.

#### Scenario: Krähenruf appears beside the caster

- **WHEN** a cast with `placement: "casterAdjacent"` succeeds and the caster has an active Scene Token
- **THEN** the summoned Token SHALL appear adjacent to that Token on the same Scene
- **AND** the system SHALL not move another Token to make room

#### Scenario: Skelettarius rises at selected material

- **WHEN** a cast with `placement: "selectedTarget"` succeeds for a selected material Token
- **THEN** the summoned Token SHALL use that Token's Scene position
- **AND** the material Token SHALL remain unchanged

#### Scenario: A player summon is authorized by a GM

- **WHEN** a player who controls the caster successfully casts a configured actor summon while an active GM is connected
- **THEN** the GM SHALL create the Actor and Token through the existing system socket route
- **AND** the requester SHALL not supply arbitrary Actor source data or placement coordinates

### Requirement: Summoned Actors have independent timed or permanent lifecycles

A `lifetime: "timed"` summon SHALL create a caster-owned owner-turn
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
marker using the pre-effect's effective duration. On expiry, the system SHALL
delete only its linked Token and world Actor before deleting the marker. A
`lifetime: "permanent"` summon SHALL create no expiry marker and SHALL remain
until manually removed.

#### Scenario: Krähenruf expires without affecting another summon

- **WHEN** two timed Actor summons have distinct application ids and the first marker expires
- **THEN** the system SHALL remove only the first summon’s Token, Actor, and marker
- **AND** the second summon SHALL remain present

#### Scenario: A manually removed linked document does not block expiry

- **WHEN** the linked Token or Actor has already been manually deleted when its timed marker expires
- **THEN** the expiry handler SHALL delete the remaining linked document when present and remove the marker without error
- **AND** it SHALL not remove an unrelated document

#### Scenario: Skelettarius is not removed by spell duration timing

- **WHEN** an instantaneous `lifetime: "permanent"` Actor summon succeeds
- **THEN** the system SHALL create no owner-turn expiry marker
- **AND** the summoned Actor and Token SHALL remain after subsequent combat turns

### Requirement: Actor summon overrides and activation delay are rule-visible

Actor-source overrides SHALL materialize before the world Actor is created.
Numeric values SHALL receive additive Mächtige-Magie increments as numbers and
formula values SHALL receive normalized additive formula increments. A positive
`activationDelay` SHALL create a visible readiness marker on the summoned Actor
and decrement it once for each forward global `combatTurn`; when it reaches
zero, the marker SHALL be removed and the system SHALL post an
`einsatzfähig` chat notification. The marker SHALL not automatically disable
combat UI actions or create a Combatant.

#### Scenario: Mächtige Magie strengthens the Krähenschwarm

- **WHEN** _Krähenruf_ succeeds with Mächtige Magie QS 2
- **THEN** the summoned Actor SHALL have its configured WS and AT increased by 2
- **AND** its configured TP formula SHALL include two additional `+1` increments

#### Scenario: Skelettarius becomes ready after two global phases

- **WHEN** a Skelettarius summon has `activationDelay: 2` and combat advances through two forward `combatTurn` events
- **THEN** the readiness marker SHALL be removed after the second event
- **AND** one chat message SHALL identify the summoned undead as einsatzfähig

#### Scenario: Backward combat navigation does not advance readiness

- **WHEN** a combat turn update has backward direction
- **THEN** no actor-summon readiness marker SHALL be decremented
