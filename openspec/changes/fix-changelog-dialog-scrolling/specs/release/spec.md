## MODIFIED Requirements

### Requirement: Changelog display

The system SHALL render the changelog content in the breaking changes dialog
using Markdown. The dialog SHALL use the documented
[`foundry.applications.api.DialogV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html)
application configuration to attach its Ilaris presentation classes
automatically; generated changelog templates SHALL NOT need to author those
classes themselves.

#### Scenario: Markdown rendered in dialog

- **WHEN** the breaking changes dialog opens
- **THEN** the changelog content SHALL be rendered from Markdown to HTML

#### Scenario: Long generated changelog is scrollable

- **WHEN** generated changelog HTML exceeds the fixed dialog content height
- **THEN** the generated changelog body SHALL provide vertical scrolling while
  the explanatory text and acknowledgement action remain visible
