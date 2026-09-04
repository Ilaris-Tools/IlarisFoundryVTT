## ADDED Requirements

### Requirement: Journal callouts remain readable in dark mode

The system stylesheet SHALL apply a dark-theme surface and readable
theme-aware text color to quick-reference callout elements rendered inside
Foundry journal pages when the body or journal application is in dark mode.
The rule SHALL preserve the callout's existing colored left border.

#### Scenario: Existing blue callout in normal dark mode

- **WHEN** a user opens a quick-reference journal containing an inline
  `background-color` callout while the Foundry body has `theme-dark`
- **THEN** the callout background SHALL use the dark theme surface token
- **AND** its text SHALL use the dark theme primary text token
- **AND** its existing colored left border SHALL remain visible

#### Scenario: Warning and error callouts retain their distinction

- **WHEN** a dark-theme journal contains yellow or red callouts
- **THEN** their backgrounds SHALL be readable against dark-theme text
- **AND** their existing warning/error border colors SHALL remain unchanged

### Requirement: Journal readability works in detached theme-aware applications

The stylesheet SHALL apply the same dark-mode callout treatment when a
detached or pop-out journal application carries the `theme-dark` class on its
application root rather than relying only on the document body class.

#### Scenario: Detached journal is dark themed

- **WHEN** a detached journal application has the `theme-dark` class and
  renders a quick-reference callout
- **THEN** the callout SHALL receive the same dark surface and readable text
  treatment as a normal journal window

### Requirement: Light theme and non-journal applications remain unchanged

The dark-mode stylesheet SHALL be scoped to journal page content and SHALL NOT
alter callout backgrounds in light mode or styles in unrelated applications.

#### Scenario: Quick reference in light mode

- **WHEN** a user opens the same quick-reference journal while Foundry is in
  light mode
- **THEN** the existing light pastel callout background and inherited text
  styling SHALL remain unchanged

#### Scenario: Non-journal application has matching inline styling

- **WHEN** an actor sheet, dialog, or other non-journal application contains
  an element with an inline `background-color`
- **THEN** the journal readability rule SHALL NOT modify that element
