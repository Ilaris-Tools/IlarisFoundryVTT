## MODIFIED Requirements

### Requirement: Supernatural combat dialog (UebernatuerlichDialog)

The system SHALL provide `UebernatuerlichDialog` extending `CombatDialog` for supernatural abilities including energy cost tracking, Blutmagie, Verbotene Pforten, and player/GM-managed contextual Vorteil conditions. The dialog SHALL pass selected, session-local condition tags to the roll-phase Ilaris modifier resolver for its supernatural Probe and show any applied ordinary contribution in its summary. When the item has a normalized zone profile, the dialog SHALL resolve maneuver-modified placement range, place the zone before rolling, support cancellation and redo placement, and defer all zone effects or persistence until a successful cast.

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

#### Scenario: Zone placement precedes the roll

- **WHEN** a supernatural item has a normalized zone profile and the user starts casting
- **THEN** the dialog SHALL resolve casting maneuvers, place a temporary zone preview, and roll only after placement is confirmed

#### Scenario: Zone placement can be redone

- **WHEN** the user activates redo placement
- **THEN** the dialog SHALL discard the temporary placement and reopen zone placement without rolling or paying energy
