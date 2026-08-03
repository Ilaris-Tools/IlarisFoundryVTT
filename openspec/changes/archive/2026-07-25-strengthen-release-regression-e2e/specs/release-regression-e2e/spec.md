## ADDED Requirements

### Requirement: Reachable critical dialogs

Critical import and synchronization dialogs SHALL expose their confirmation controls to a user through visible content or scrollable dialog content.

#### Scenario: Long confirmation content

- **WHEN** an XML import or synchronization confirmation has content taller than its window
- **THEN** the user SHALL be able to scroll to and activate the confirmation button

### Requirement: Renderable generated Held sheets

Newly created and XML-imported Held actors SHALL render the Kampf sheet part without a template error.

#### Scenario: Open generated Held

- **WHEN** a user opens a newly created or XML-imported Held
- **THEN** the Kampf tab SHALL render with populated Kampfstil controls and no render error

### Requirement: User-visible regression coverage

E2E tests SHALL verify visible reachability, layout, selected values, and rendered outcomes for critical controls, rather than only programmatic click success.

#### Scenario: Token statuses and combat defaults

- **WHEN** token statuses, synchronized combat items, or chat roll-mode defaults are displayed
- **THEN** their visible ordering, colour, enabled controls, and selected values SHALL match the configured behaviour
