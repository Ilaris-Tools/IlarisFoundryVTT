## ADDED Requirements

### Requirement: Major release announcement setting

The system SHALL register `lastAnnouncedMajorRelease` as a non-configurable string game setting with an empty default, and all reads and writes SHALL use a constant from `configure-game-settings.model.js`.

#### Scenario: Setting registered with empty default

- **WHEN** `registerIlarisGameSettings()` runs on init
- **THEN** `lastAnnouncedMajorRelease` SHALL be registered with `config: false` and default `""`

#### Scenario: Announcement state uses constant

- **WHEN** the major-release announcement flow reads or writes its state
- **THEN** it SHALL use the centralized setting-name constant rather than a string literal

#### Scenario: Existing acknowledgement setting remains independent

- **WHEN** the breaking-change dialog acknowledges a release
- **THEN** only `lastSeenBreakingChangesVersion` SHALL be updated and `lastAnnouncedMajorRelease` SHALL remain unchanged
