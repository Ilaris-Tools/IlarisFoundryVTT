## MODIFIED Requirements

### Requirement: Multiplayer defense routing

The system SHALL route defense and resistance prompts, plus their resulting
damage or Pre-Effect application, to the correct client using socket or chat
communication while preserving token context for unlinked [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) documents. Resistance target resolution SHALL prefer a structured token-aware target payload, then fall back to a serialized Actor UUID, and finally to a legacy world-actor id only when the prior forms cannot resolve an Actor.

#### Scenario: Defense prompt sent to target's client

- **WHEN** an attack hits a target controlled by another user
- **THEN** the defense prompt SHALL be sent via socket to the target's controlling client

#### Scenario: Token context preserved for unlinked actors

- **WHEN** applying damage to an unlinked token actor (`actorLink === false`)
- **THEN** the system SHALL resolve the actor from the token first, not the world actor

#### Scenario: GM permission escalation

- **WHEN** a non-GM client needs to apply damage to a target they don't own
- **THEN** the GM client SHALL handle the damage application via socket payload with full token metadata

#### Scenario: Resistance prompt prefers structured target context

- **WHEN** a resistance prompt contains `target.actorId`, `target.tokenId`, and `target.actorLink` for an unlinked Token Actor
- **THEN** every prompt-click and result-application stage SHALL resolve that Token Actor before a world Actor with the same source id

#### Scenario: UUID-only resistance prompt remains compatible

- **WHEN** a resistance prompt lacks a resolvable structured target but contains `targetActorUuid`
- **THEN** the system SHALL resolve that UUID with `foundry.utils.fromUuid`
- **AND** it SHALL use the resolved Actor for the resistance dialog and result application

#### Scenario: Legacy actor id remains a final fallback

- **WHEN** a resistance prompt lacks a resolvable structured target and UUID but contains `targetActorId`
- **THEN** the system SHALL resolve the world Actor with that id
- **AND** it SHALL warn or stop safely when no target can be resolved
