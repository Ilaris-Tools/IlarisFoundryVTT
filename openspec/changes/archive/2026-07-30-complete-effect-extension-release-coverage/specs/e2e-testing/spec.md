## ADDED Requirements

### Requirement: Combat target-selection synchronization coverage

The combat E2E baseline SHALL prove that selecting a target in the target-selection dialog synchronizes the selected Token into the current user's Foundry target set.

#### Scenario: Dialog target is a Foundry target

- **WHEN** the user selects a Token in the combat target-selection dialog and submits it
- **THEN** the Token SHALL be present in `game.user.targets`
- **AND** the downstream combat flow SHALL use that selected target
