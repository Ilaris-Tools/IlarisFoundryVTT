## Purpose

Breaking changes notification dialog and changelog display for system version updates.

## Requirements

### Requirement: Breaking changes notification

The system SHALL display a breaking changes notification dialog when the system version changes and unacknowledged breaking changes exist.

#### Scenario: Dialog shown on version change

- **WHEN** the system version in `system.json` differs from `lastSeenBreakingChangesVersion`
- **THEN** a dialog SHALL display the breaking changes for the new version

#### Scenario: Version acknowledged on dismiss

- **WHEN** the user dismisses the breaking changes dialog
- **THEN** `lastSeenBreakingChangesVersion` SHALL be updated to the current system version

#### Scenario: No dialog when up to date

- **WHEN** `lastSeenBreakingChangesVersion` matches the current system version
- **THEN** no breaking changes dialog SHALL be shown

### Requirement: Changelog display

The system SHALL render the changelog content in the breaking changes dialog using Markdown.

#### Scenario: Markdown rendered in dialog

- **WHEN** the breaking changes dialog opens
- **THEN** the changelog content SHALL be rendered from Markdown to HTML

### Requirement: Breaking changes data

The system SHALL define breaking changes in a structured format mapping versions to change descriptions.

#### Scenario: Breaking changes extracted per version

- **WHEN** generating breaking changes data
- **THEN** each system version with breaking changes SHALL have a list of change descriptions

## Data Model

### Release settings

| Field                            | Type   | Description                                                       |
| -------------------------------- | ------ | ----------------------------------------------------------------- |
| `lastSeenBreakingChangesVersion` | String | Tracks which version's breaking changes the user has acknowledged |

## Cross-References

- [settings](../settings/spec.md) — `lastSeenBreakingChangesVersion` is a registered game setting
