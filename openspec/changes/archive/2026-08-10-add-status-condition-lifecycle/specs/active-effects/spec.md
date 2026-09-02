## ADDED Requirements

### Requirement: Condition-source timing is independent per source

The owner-turn timing lifecycle SHALL reduce and remove timed condition sources
independently, without using a condition effect's global duration to delete
other sources. It SHALL use the existing documented
[Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
embedded-document update/delete methods for the resulting ledger mutation.

#### Scenario: Timed source expires while another source remains

- **WHEN** an owner-turn source on a condition reaches its configured expiry
- **AND** the condition has another active source
- **THEN** the system SHALL remove only the expired source
- **AND** the condition ActiveEffect SHALL remain active

#### Scenario: Timed source is final source

- **WHEN** an owner-turn source is the final source on a condition and reaches its configured expiry
- **THEN** the system SHALL delete the condition ActiveEffect at its configured expiry point
