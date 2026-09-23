## Purpose

LLM-assisted generation of pre-effect configurations for übernatürlich (Zauber/Liturgie/Anrufung) items, using an OpenAI-compatible chat completions API configured via client-scoped GM settings.

## Requirements

### Requirement: Client-scoped LLM API settings

Three client-scoped settings SHALL be available for configuring the LLM API: `llmApiUrl` (string, default empty), `llmApiKey` (string, default empty), and `llmModel` (string, default empty). All SHALL use `scope: "client"` to store values in the GM's browser `localStorage` only.

#### Scenario: API key is password-masked in settings UI

- **WHEN** the IlarisSettingsDialog renders the General tab for a GM
- **THEN** the `llmApiKey` input SHALL use `type="password"` to mask the value
- **AND** the `llmApiUrl` and `llmModel` inputs SHALL use `type="text"`

#### Scenario: Settings hidden from non-GMs

- **WHEN** a non-GM user opens the IlarisSettingsDialog
- **THEN** the LLM settings section SHALL NOT be rendered

#### Scenario: Client scope keeps key out of world data

- **WHEN** the GM configures the API key
- **THEN** the value SHALL be stored in `localStorage` only
- **AND** the value SHALL NOT be synced to other clients or stored in the world database

### Requirement: LLM prompt builder utility

A pure function `buildPreEffectPrompt(spellData, damageTypes, systemKeys)` SHALL construct a system message and user message for the OpenAI-compatible chat completions API.

#### Scenario: System message includes JSON schema

- **WHEN** `buildPreEffectPrompt()` is called
- **THEN** the system message SHALL describe the pre-effect JSON schema with all field names, types, and constraints

#### Scenario: System message includes available keys

- **WHEN** `buildPreEffectPrompt()` is called with `systemKeys: ["system.gesundheit.wunden", ...]`
- **THEN** the system message SHALL list all available `system.*` key paths

#### Scenario: System message includes available damage types

- **WHEN** `buildPreEffectPrompt()` is called with `damageTypes: [{value: "FEUER", label: "Feuer"}, ...]`
- **THEN** the system message SHALL list all available damage types with their values

#### Scenario: User message contains spell data

- **WHEN** `buildPreEffectPrompt()` is called with spell data including `name`, `text`, `maechtig`, `wirkungsdauer`, `ziel`
- **THEN** the user message SHALL contain all spell metadata as structured text

#### Scenario: Response format instruction

- **WHEN** `buildPreEffectPrompt()` constructs the system message
- **THEN** it SHALL instruct the LLM to return ONLY valid JSON in the format `{"preEffects": [...]}`, without markdown code fences

### Requirement: Generate button on übernatürlich item sheet

A `🤖 Generieren` button SHALL be present in the shared Pre-Effects section only when it is rendered by an übernatürlich item sheet and the current user is a GM with a configured API. The LLM request handler and availability context SHALL remain owned by `UebernatuerlichTalentSheet`; another Item sheet that inherits standard Pre-Effect authoring SHALL not acquire spell-generation behavior merely through that shared base.

#### Scenario: Button visible to GMs

- **WHEN** a GM opens a Zauber/Liturgie/Anrufung item sheet with a pre-effects section
- **THEN** a "🤖 Generieren" button SHALL be rendered in the pre-effects section

#### Scenario: Button hidden from non-GMs

- **WHEN** a non-GM user opens the same sheet
- **THEN** the "🤖 Generieren" button SHALL NOT be rendered

#### Scenario: Button hidden when API not configured

- **WHEN** the sheet renders and `llmApiUrl` or `llmApiKey` is empty
- **THEN** the "🤖 Generieren" button SHALL NOT be rendered (even for GMs)

#### Scenario: Button visible when API is configured

- **WHEN** a GM opens the sheet and both `llmApiUrl` and `llmApiKey` are non-empty
- **THEN** the "🤖 Generieren" button SHALL be rendered

#### Scenario: Button hidden on a maneuver sheet

- **WHEN** a GM opens a maneuver item sheet while the LLM API is configured
- **THEN** the shared Pre-Effect section SHALL NOT render a `🤖 Generieren` button

#### Scenario: Button shows loading state during request

- **WHEN** the GM clicks "🤖 Generieren"
- **THEN** the button SHALL change to "⏳ Wird generiert..." and be disabled until the API response is received or an error occurs

#### Scenario: Successful generation populates preEffects

- **WHEN** the API returns valid JSON with `preEffects: [...]`
- **THEN** the item's `system.preEffects` SHALL be updated with the generated array
- **AND** the sheet SHALL re-render to show the new pre-effects

#### Scenario: Invalid JSON response shows error

- **WHEN** the API returns a response that is not valid JSON
- **THEN** `ui.notifications.error()` SHALL be shown with an excerpt of the response
- **AND** the button SHALL be re-enabled with the original "🤖 Generieren" label

#### Scenario: Network error shows notification

- **WHEN** the `fetch()` call fails (network error, timeout, non-200 response)
- **THEN** `ui.notifications.error()` SHALL be shown with the error details
- **AND** the button SHALL be re-enabled with the original label

#### Scenario: Successful generation re-enables button

- **WHEN** the API returns valid JSON and preEffects are applied
- **THEN** the button SHALL be re-enabled with the original "🤖 Generieren" label

### Requirement: LLM settings documented in user documentation

The LLM API settings SHALL be documented both in `docs/einstellungen.md` (MkDocs) and in the in-game quick reference journal (`Welteinstellungen_Quick_Reference` in `kurzuebersichten` compendium).

#### Scenario: MkDocs settings page documents LLM fields

- **WHEN** a GM reads `docs/einstellungen.md`
- **THEN** the LLM settings (`llmApiUrl`, `llmApiKey`, `llmModel`) SHALL be listed with descriptions, supported providers (OpenAI, OpenRouter, DeepSeek, Ollama), and a note that the key is stored client-side

#### Scenario: In-game journal documents LLM fields

- **WHEN** a GM opens the "Übersicht: Welteinstellungen" journal entry in Foundry
- **THEN** a section SHALL describe the LLM/KI settings with the same information as the MkDocs page

### Requirement: LLM prompt distinguishes Foundry changes and Ilaris modifiers

`buildPreEffectPrompt()` SHALL document native `changes` and semantic
`ilarisModifiers` as separate parts of the generated pre-effect JSON schema.
It SHALL describe the Ilaris modifier fields, supported selectors, and the
rule that context-sensitive or übernatürlich non-stacking bonuses belong in
`ilarisModifiers` rather than duplicated actor-path changes. It SHALL describe
the semantic equivalents of native Mächtige Magie/Liturgie and diminished-resist
fields, and SHALL require main-attribute effects to use roll-phase semantic
modifiers rather than native Actor paths.

#### Scenario: Generated spell can describe a weapon-scoped bonus

- **WHEN** an LLM is asked to generate a pre-effect for a spell that grants
  AT only with Klingenwaffen
- **THEN** the prompt SHALL provide an `ilarisModifiers` representation with
  a Klingenwaffen selector

#### Scenario: LLM retains ordinary native change option

- **WHEN** an LLM is asked to generate an unconditional actor-path change
- **THEN** the prompt SHALL still document the existing native `changes`
  representation

#### Scenario: LLM receives main-attribute and amplification guidance

- **WHEN** `buildPreEffectPrompt()` describes the pre-effect schema
- **THEN** it SHALL direct a GE or KK change to `ilarisModifiers`
- **AND** it SHALL document the modifier fields used for Mächtige
  Magie/Liturgie and diminished-resist value materialization
