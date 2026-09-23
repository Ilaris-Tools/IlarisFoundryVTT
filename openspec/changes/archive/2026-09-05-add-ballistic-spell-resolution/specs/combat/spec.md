## MODIFIED Requirements

### Requirement: Supernatural combat dialog (UebernatuerlichDialog)

The system SHALL provide `UebernatuerlichDialog` extending `CombatDialog` for supernatural abilities including energy cost tracking, Blutmagie, Verbotene Pforten, and player/GM-managed contextual Vorteil conditions. The dialog SHALL pass selected, session-local condition tags to the roll-phase Ilaris modifier resolver for its supernatural Probe and show any applied ordinary contribution in its summary. When `useTargetSelection` is enabled and the item has a normalized zone profile, the dialog SHALL show one `Zone platzieren` control above the right-column `Würfelaktionen`, create and retain an inert draft Region before rolling, enable roll actions only while that draft exists, and defer all zone effects or persistence until a successful cast. When that setting is disabled, zone automation SHALL not run and the spell retains its manual outcome path. For an explicitly ballistic source, a successful targeted cast SHALL enter the ranged-defense outcome gate before it calls target Pre-Effects.

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

- **WHEN** a supernatural item has a normalized zone profile and target automation is enabled
- **THEN** the dialog SHALL show `Zone platzieren` above `Würfelaktionen` and keep roll actions unavailable until placement is confirmed
- **AND** the confirmed shape SHALL remain visible as an inert draft Region until the spell is resolved, replaced, cancelled, or the dialog is closed

#### Scenario: Zone placement can be redone

- **WHEN** the user activates `Zone platzieren` while a draft is present
- **THEN** the dialog SHALL discard the current draft and reopen zone placement without rolling or paying energy

#### Scenario: Zone automation is disabled with target selection

- **WHEN** `useTargetSelection` is disabled
- **THEN** a zone spell SHALL not open template placement or resolve automatic zone targets
- **AND** the dialog SHALL retain the existing manual outcome path

#### Scenario: Zone placement requires a caster token and active scene

- **WHEN** zone automation is enabled but the caster token or active Scene cannot be resolved
- **THEN** the dialog SHALL notify the user and abort before rolling or charging energy

#### Scenario: Ballistic cast keeps the normal dialog layout

- **WHEN** a user opens and rolls an explicitly ballistic supernatural spell
- **THEN** the dialog SHALL retain its existing target list, roll controls, and summaries while the defense outcome resolves in chat
