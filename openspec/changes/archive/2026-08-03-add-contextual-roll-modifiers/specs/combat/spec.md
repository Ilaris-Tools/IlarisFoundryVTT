## MODIFIED Requirements

### Requirement: Supernatural combat dialog (UebernatuerlichDialog)

The system SHALL provide UebernatuerlichDialog extending CombatDialog for
supernatural abilities including energy cost tracking, Blutmagie, Verbotene
Pforten, and player/GM-managed contextual Vorteil conditions. The existing
[`HandlebarsApplicationMixin`](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)-based
dialog SHALL pass selected, session-local condition tags to the roll-phase
Ilaris modifier resolver for its supernatural Probe and show any applied
ordinary contribution in its summary.

#### Scenario: Energy cost enforcement

- **WHEN** `restrictEnergyCost` setting is enabled and the caster lacks sufficient Astralenergie/Karmaenergie
- **THEN** the dialog SHALL prevent the action

#### Scenario: Blutmagie conversion

- **WHEN** the caster uses Blutmagie (blood magic)
- **THEN** energy costs SHALL be converted to health damage at the configured ratio

#### Scenario: Contextual Vorteil is selected for one supernatural roll

- **WHEN** the player or GM selects a relevant condition in the supernatural dialog
- **THEN** its matching ordinary Vorteil Probe modifier SHALL affect that dialog's preview and roll
- **AND** the selection SHALL not be persisted on the Actor or Item
