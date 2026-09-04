## ADDED Requirements

### Requirement: Targeted successful casts reach their Pre-Effect result path

An eligible targeted supernatural cast SHALL expose a working visible roll
action. A successful action SHALL create its normal roll chat result before
the system dispatches the effective Pre-Effects.

#### Scenario: Targeted instant spell creates its roll result

- **WHEN** a user selects a valid target for an instant-damage spell and
  activates the rendered roll action
- **THEN** the system SHALL create the roll chat message
- **AND** it SHALL then apply the effective instant Pre-Effect to that target

### Requirement: Ballistic defense fixtures exercise both outcomes

The ballistic E2E fixture SHALL provide an eligible Akrobatik defense option
for its defended scenario without relying on pre-existing mutable actor state.

#### Scenario: Successful Akrobatik defense prevents application

- **WHEN** the fixture target successfully resolves its rendered Akrobatik defense
- **THEN** the deferred target Pre-Effect SHALL not be applied
