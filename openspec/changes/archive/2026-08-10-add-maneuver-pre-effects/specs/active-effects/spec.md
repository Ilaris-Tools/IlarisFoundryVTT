## ADDED Requirements

### Requirement: ActiveEffects can expose a source-linked opposed escape action

The system SHALL expose a visible `Befreiungsprobe` action for an embedded
ActiveEffect with `system.ilarisEnding.type: "opposedEscape"`. The ending data
SHALL identify the source Actor by UUID and SHALL be limited to the supported
GE/KK opposed escape configuration. Effects without that ending SHALL retain
their existing effect-row behavior. The action operates on the persisted
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html).

#### Scenario: The affected actor starts an escape attempt

- **WHEN** the affected actor activates `Befreiungsprobe` on an eligible
  opposed-escape effect
- **THEN** the system SHALL offer GE and KK with their current PW values
- **AND** it SHALL associate the resulting attempt with that exact effect

### Requirement: Opposed escape resolves through a source counter-check

After the affected actor submits an opposed escape roll, the system SHALL send
a whispered counter-check prompt to a controlling user of the persisted source
Actor, or to an active GM if none is available. The source counter-check and
the escape result SHALL use the existing attacker-versus-defender outcome
convention. A successful escape SHALL remove only the linked effect using
[Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments).

#### Scenario: Successful escape removes only its own hold

- **WHEN** an affected actor wins the counter-check for one opposed-escape
  effect while another hold effect is also active
- **THEN** the system SHALL delete only the effect linked to that escape
  attempt
- **AND** the other hold effect SHALL remain active

#### Scenario: Failed escape preserves the effect

- **WHEN** the affected actor does not win the opposed counter-check
- **THEN** the linked effect SHALL remain active

### Requirement: Escape prompts validate their persisted context

The system SHALL validate the target Actor, effect ID, ending type, source
Actor UUID, and single-use interaction identity before resolving an escape
prompt. It SHALL reject a stale, duplicated, or mismatched prompt without
deleting an effect.

#### Scenario: A duplicate prompt cannot remove an effect twice

- **WHEN** a previously resolved escape prompt is activated again
- **THEN** the system SHALL reject the prompt
- **AND** it SHALL not delete any ActiveEffect
