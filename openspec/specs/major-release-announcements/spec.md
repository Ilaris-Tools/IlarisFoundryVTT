## Purpose

One-time in-world communication for major releases, linking to existing Ilaris tutorials.

## Requirements

### Requirement: Major release tutorial chat announcement

The system SHALL allow the active GM to publish one persistent `ChatMessage` announcement for each Foundry-major release, containing links to the existing maintained tutorials and the full changelog link. The message SHALL be created with the Foundry `ChatMessage` document API: https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html.

#### Scenario: Fresh major release posts announcement

- **WHEN** a world starts with a major release that differs from `lastAnnouncedMajorRelease` and a GM is active
- **THEN** the system SHALL create one `ChatMessage` containing the German release summary, tutorial links, and changelog link

#### Scenario: Announcement state is persisted after success

- **WHEN** `ChatMessage.create` resolves successfully
- **THEN** the system SHALL persist the current major release in `lastAnnouncedMajorRelease`

#### Scenario: Announcement is not duplicated

- **WHEN** the current major release equals `lastAnnouncedMajorRelease`
- **THEN** the system SHALL not create another `ChatMessage`

#### Scenario: Non-GM does not publish

- **WHEN** a world starts without an active GM user
- **THEN** the system SHALL not create a major-release announcement or update `lastAnnouncedMajorRelease`

#### Scenario: Failed creation remains retryable

- **WHEN** `ChatMessage.create` rejects
- **THEN** the system SHALL report the error and SHALL NOT mark the major release as announced

### Requirement: Major release tutorial links

Each major-release announcement SHALL include at least one existing maintained tutorial target and a link to the complete changelog. The release configuration SHALL reference existing tutorial labels and URLs; it SHALL NOT require tutorial prose to be copied into the changelog.

#### Scenario: Tutorial links are rendered

- **WHEN** a release declares tutorial links
- **THEN** the generated chat content SHALL render each label as a link and include the complete changelog link

#### Scenario: Missing tutorial link blocks release generation

- **WHEN** a major release has no reference to an existing tutorial target
- **THEN** the changelog/release generator SHALL fail validation with an actionable error
