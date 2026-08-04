## MODIFIED Requirements

### Requirement: Breaking changes notification

The system SHALL display a breaking changes notification dialog when the system version has unacknowledged breaking changes, and the generated content SHALL clearly identify whether character re-import is required. The dialog SHALL continue to use Foundry `DialogV2`: https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html.

#### Scenario: Dialog shown on version change with breaking changes

- **WHEN** the system version differs from `lastSeenBreakingChangesVersion` and the generated release data contains breaking changes
- **THEN** a dialog SHALL display the breaking changes for the new version

#### Scenario: Import-required warning shown

- **WHEN** generated release data marks `importRequired` as true
- **THEN** the dialog SHALL display the prominent German character re-import disclaimer

#### Scenario: Version acknowledged on dismiss

- **WHEN** the user dismisses the breaking changes dialog
- **THEN** `lastSeenBreakingChangesVersion` SHALL be updated to the current dialog identity

#### Scenario: No dialog when up to date or no breaking changes

- **WHEN** `lastSeenBreakingChangesVersion` matches the current dialog identity or no breaking-change template exists
- **THEN** no breaking changes dialog SHALL be shown

### Requirement: Changelog display

The system SHALL render validated changelog content in the breaking changes dialog using generated HTML, then apply Foundry `TextEditor.implementation.enrichHTML`: https://foundryvtt.com/api/v14/classes/foundry.applications.ux.TextEditor.html.

#### Scenario: Generated changelog rendered in dialog

- **WHEN** the breaking changes dialog opens
- **THEN** the generated release content SHALL be enriched and rendered as HTML

### Requirement: Breaking changes data

The release build SHALL define breaking changes in structured generated data mapping a release identity to descriptions, import-required status, and tutorial links where applicable.

#### Scenario: Breaking changes extracted per version

- **WHEN** generating breaking changes data
- **THEN** each system release with breaking changes SHALL have descriptions and an explicit import-required status

## ADDED Requirements

### Requirement: Major-release tutorial promotion

For each validated Foundry-major release, the release communication flow SHALL expose the tutorial announcement described by the `major-release-announcements` capability.

#### Scenario: Major release has tutorial promotion available

- **WHEN** the current system version belongs to a major release with validated tutorial links
- **THEN** the startup flow SHALL be able to publish the major-release tutorial chat announcement
