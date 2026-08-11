## ADDED Requirements

### Requirement: Zone targets enter the existing pre-effect pipeline after success

The supernatural pre-effect processor SHALL accept token-aware targets resolved from an instant measured template and SHALL apply each pre-effect once per resolved target only after the originating spell succeeds. Non-zone target behavior SHALL remain unchanged.

#### Scenario: Instant zone uses token actors

- **WHEN** a successful instant zone resolves two intersecting tokens
- **THEN** `applyPreEffects` SHALL process two targets carrying `tokenId`, `actorId`, and `actorLink`

#### Scenario: Zone effects remain deferred on failure

- **WHEN** an instant or persistent zone spell fails
- **THEN** the processor SHALL not apply pre-effects and no persistent zone SHALL be created

### Requirement: Persistent zone triggers reuse resistance routing

Persistent zone entry and turn-start events SHALL invoke the existing pre-effect and resist-handler paths with serialized source zone context. A resistance result SHALL affect only the triggering token actor.

#### Scenario: Entry resistance resolves for one token

- **WHEN** one token enters a persistent zone with `avoidTest.enabled === true`
- **THEN** the existing resist prompt flow SHALL be used with the zone's spell and token metadata
