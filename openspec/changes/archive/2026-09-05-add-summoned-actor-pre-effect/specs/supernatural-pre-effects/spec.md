## ADDED Requirements

### Requirement: Pre-effects support a generic summon-actor operation

An übernatürlich Item pre-effect SHALL optionally define a `summonActor`
configuration containing `enabled`, a creature Actor `sourceUuid`, a placement
policy, `lifetime`, an `activationDelay`, and optional source-data overrides.
The pre-effect processor SHALL dispatch this operation after a successful cast
instead of creating an ordinary target ActiveEffect. It SHALL preserve the
existing `summonItem` operation and SHALL not dispatch both operations from one
pre-effect entry.

#### Scenario: A configured actor summon uses the selected cast context

- **WHEN** a successful pre-effect has an enabled `summonActor` operation
- **THEN** the processor SHALL pass the caster, selected target Token context, cast skill, effective duration, Mächtige-Magie QS, pre-effect index, and application id to the actor-summon operation
- **AND** it SHALL not create an ordinary target ActiveEffect for that operation

#### Scenario: Existing Item summons remain unchanged

- **WHEN** a successful pre-effect contains an enabled `summonItem` operation and no enabled `summonActor` operation
- **THEN** the processor SHALL create the configured owned Item clone with its existing lifecycle
- **AND** it SHALL not create a world Actor or Scene Token
