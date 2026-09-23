## MODIFIED Requirements

### Requirement: Independent condition sources

The system SHALL persist each manual or automated cause of a condition as a stable source entry on the condition effect. A source removal SHALL remove only that entry and SHALL delete the embedded effect with [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments) only after its final source has been removed. A timed one-shot Nachbrennen source SHALL be independently removable before its rule completion.

#### Scenario: Manual source survives maneuver-source removal

- **WHEN** Position4 has one manual source and one Niederwerfen source
- **AND** the Niederwerfen source is removed or expires
- **THEN** the Position4 effect SHALL remain active with its manual source

#### Scenario: Final source clears condition

- **WHEN** the final source of a Position4 condition is removed
- **THEN** the system SHALL delete only that Position4 embedded ActiveEffect

#### Scenario: Nachbrennen removal preserves another source

- **WHEN** a condition effect holds a pending Nachbrennen source and an independent source
- **AND** the pending Nachbrennen source is removed as extinguished or completed
- **THEN** the independent source SHALL remain on the condition effect
