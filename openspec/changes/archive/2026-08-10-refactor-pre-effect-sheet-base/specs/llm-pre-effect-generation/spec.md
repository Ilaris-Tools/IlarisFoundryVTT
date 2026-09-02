## MODIFIED Requirements

### Requirement: Generate button on übernatürlich item sheet

A `🤖 Generieren` button SHALL be present in the shared Pre-Effects section
only when it is rendered by an übernatürlich item sheet and the current user
is a GM with a configured API. The LLM request handler and availability
context SHALL remain owned by `UebernatuerlichTalentSheet`; another Item sheet
that inherits standard Pre-Effect authoring SHALL not acquire spell-generation
behavior merely through that shared base.

#### Scenario: Button visible to GMs

- **WHEN** a GM opens a Zauber/Liturgie/Anrufung item sheet with a pre-effects
  section
- **THEN** a `🤖 Generieren` button SHALL be rendered in the pre-effects
  section

#### Scenario: Button hidden from non-GMs

- **WHEN** a non-GM user opens the same sheet
- **THEN** the `🤖 Generieren` button SHALL NOT be rendered

#### Scenario: Button hidden when API not configured

- **WHEN** the supernatural sheet renders and `llmApiUrl` or `llmApiKey` is
  empty
- **THEN** the `🤖 Generieren` button SHALL NOT be rendered (even for GMs)

#### Scenario: Button visible when API is configured

- **WHEN** a GM opens a supernatural sheet and both `llmApiUrl` and
  `llmApiKey` are non-empty
- **THEN** the `🤖 Generieren` button SHALL be rendered

#### Scenario: Button hidden on a maneuver sheet

- **WHEN** a GM opens a maneuver item sheet while the LLM API is configured
- **THEN** the shared Pre-Effect section SHALL NOT render a `🤖 Generieren`
  button

#### Scenario: Button shows loading state during request

- **WHEN** the GM clicks `🤖 Generieren` on a supernatural item sheet
- **THEN** the button SHALL change to `⏳ Wird generiert...` and be disabled
  until the API response is received or an error occurs

#### Scenario: Successful generation populates preEffects

- **WHEN** the API returns valid JSON with `preEffects: [...]`
- **THEN** the item's `system.preEffects` SHALL be updated with the generated
  array
- **AND** the sheet SHALL re-render to show the new pre-effects

#### Scenario: Invalid JSON response shows error

- **WHEN** the API returns a response that is not valid JSON
- **THEN** `ui.notifications.error()` SHALL be shown with an excerpt of the
  response
- **AND** the button SHALL be re-enabled with the original `🤖 Generieren`
  label

#### Scenario: Network error shows notification

- **WHEN** the `fetch()` call fails (network error, timeout, non-200 response)
- **THEN** `ui.notifications.error()` SHALL be shown with the error details
- **AND** the button SHALL be re-enabled with the original `🤖 Generieren`
  label

#### Scenario: Successful generation re-enables button

- **WHEN** the API returns valid JSON and preEffects are applied
- **THEN** the button SHALL be re-enabled with the original `🤖 Generieren`
  label
