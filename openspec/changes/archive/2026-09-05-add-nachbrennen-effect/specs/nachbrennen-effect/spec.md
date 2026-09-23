## ADDED Requirements

### Requirement: Failed fire side-effect check creates pending Nachbrennen

When resolved damage has a configured `elementalSideEffect: "nachbrennen"`, the system SHALL request or resolve a KO-20 countercheck for the affected target and on failure create one visible target-owned pending Nachbrennen source on an [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html).

#### Scenario: Successful KO check prevents Nachbrennen

- **WHEN** a target succeeds at the KO-20 countercheck
- **THEN** the system SHALL create no pending Nachbrennen source

#### Scenario: Failed KO check creates pending Nachbrennen

- **WHEN** a target fails the KO-20 countercheck
- **THEN** the system SHALL show one pending Nachbrennen effect with four owner initiative phases remaining

### Requirement: Pending Nachbrennen completes once or is extinguished

The pending source SHALL decrement only at the affected combatant's owner initiative phase; after its fourth phase the system SHALL apply exactly one wound, emit a completion chat result, and remove that source. Removing the pending source before completion SHALL represent extinguishing and SHALL prevent the wound.

#### Scenario: Fourth owner phase applies one wound

- **WHEN** a pending Nachbrennen source reaches its fourth owner initiative phase
- **THEN** the system SHALL apply exactly one wound and remove that source

#### Scenario: Extinguishing prevents the final wound

- **WHEN** a user removes the pending Nachbrennen source before its fourth owner initiative phase
- **THEN** the system SHALL not apply the final wound

#### Scenario: Unrelated source remains

- **WHEN** an effect has a Nachbrennen source and another independent source
- **THEN** resolving or extinguishing Nachbrennen SHALL leave the unrelated source active
