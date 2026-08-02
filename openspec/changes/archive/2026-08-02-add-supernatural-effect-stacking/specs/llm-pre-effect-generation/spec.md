## ADDED Requirements

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
