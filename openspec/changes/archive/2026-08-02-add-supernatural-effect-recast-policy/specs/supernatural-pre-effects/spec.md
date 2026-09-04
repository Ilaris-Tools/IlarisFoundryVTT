## MODIFIED Requirements

### Requirement: Effect origin tracking

Each created [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) SHALL record its origin using Foundry V14's `origin` field plus Ilaris-specific flags. Every non-instant Pre-Effect SHALL additionally record its source component index and the application identity shared by all persistent effects from that target and cast.

#### Scenario: Origin records caster UUID

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `origin` SHALL be set to the caster's actor UUID

#### Scenario: Flags record spell metadata and application identity

- **WHEN** a non-instant ActiveEffect is created from Pre-Effect entry `N`
- **THEN** `flags.ilaris` SHALL contain `sourceType: "uebernatuerlich"`,
  `spellName`, `spellUuid`, `casterUuid`, `fertigkeiten`,
  `preEffectIndex: N`, and an `applicationId`

## ADDED Requirements

### Requirement: Persistent same-spell recasts follow the world stacking mode

Before a non-instant Pre-Effect creates its ActiveEffect, the processor SHALL
read the world `supernaturalEffectStacking` setting. The policy SHALL apply at
the common creation path used by both direct casts and resolved resistance
tests.

#### Scenario: Ilaris mode retains same-spell effects

- **WHEN** the world uses `ilaris` mode and a target receives the same
  non-instant spell Pre-Effect component more than once
- **THEN** the processor SHALL create an additional ActiveEffect for every
  successful application
- **AND** it SHALL NOT delete an existing effect
- **AND** those semantic modifiers SHALL remain subject to normal
  strongest-effect resolution

#### Scenario: Foundry mode replaces a prior source application

- **WHEN** the world uses `foundry` mode and a target receives a non-instant
  Pre-Effect from a spell or liturgy source with a new `applicationId`
- **THEN** the processor SHALL delete all existing embedded
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  documents on that target whose `flags.ilaris.sourceType` is
  `"uebernatuerlich"`, whose `spellUuid` matches the source, and whose
  `applicationId` differs or is absent
- **AND** it SHALL use
  [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments)
  before it creates the new effect
- **AND** the new effect SHALL contain the current duration and materialized
  amplification or diminished-resistance values

#### Scenario: Components from one new application remain together

- **WHEN** a spell has two non-instant Pre-Effect components with the same
  `applicationId` in `foundry` mode
- **THEN** the processor SHALL retain both components
- **AND** it SHALL NOT delete a component created earlier by that same
  application

#### Scenario: Previous legacy effects are replaced with their source

- **WHEN** an existing supernatural effect has the same spell UUID but lacks
  `flags.ilaris.applicationId`
- **THEN** the processor SHALL delete that effect during a Foundry-mode recast
  from the same source
