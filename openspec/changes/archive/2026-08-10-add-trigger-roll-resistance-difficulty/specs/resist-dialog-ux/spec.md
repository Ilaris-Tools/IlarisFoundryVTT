## MODIFIED Requirements

### Requirement: Resist difficulty displayed in FertigkeitDialog preview

FertigkeitDialog SHALL display the resolved numeric `success_val` as an
immutable `Erschwernis` row in a resist-test preview. The value may originate
from a fixed Pre-Effect value or a snapshot of the triggering roll, but the
dialog SHALL not recalculate it while previewing the target's own test.

#### Scenario: Difficulty row appears in summary

- **WHEN** FertigkeitDialog renders with `this.success_val` set to a numeric
  value (for example, 16)
- **THEN** the summary section SHALL include a row labelled `Erschwernis`
  showing the difficulty value

#### Scenario: No difficulty row when success_val is null

- **WHEN** FertigkeitDialog renders with `this.success_val` as `null` (normal
  skill check, no resist context)
- **THEN** the summary section SHALL NOT include an `Erschwernis` row

#### Scenario: Triggering-roll difficulty remains a prompt snapshot

- **WHEN** the user changes modifiers (Hohe Qualität, Modifikator) in a
  resist dialog whose difficulty came from a triggering roll
- **THEN** the `Erschwernis` row SHALL remain displayed with the unchanged
  triggering-roll total
- **AND** the system SHALL not re-evaluate the original roll
