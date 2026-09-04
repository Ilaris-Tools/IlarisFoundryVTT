## ADDED Requirements

### Requirement: Zone E2E assertions are ownership-scoped

Zone runtime verification SHALL distinguish effects and documents owned by the
test-created Region from unrelated persistent world state.

#### Scenario: Outside actor state does not fail Dämonenbann cleanup

- **WHEN** a Dämonenbann E2E fixture creates a temporary Region
- **THEN** it SHALL assert only ActiveEffects whose zone provenance matches that Region

#### Scenario: Cone containment selects only the inside fixture token

- **WHEN** a Pestgestank cone is placed around deterministic inside and outside tokens
- **THEN** zone targeting SHALL include the inside token and exclude the outside token
