## ADDED Requirements

### Requirement: Ilaris modifier data and configuration are available on effects

The system SHALL extend the custom ActiveEffect type data and
[ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html)
sheet to expose `system.ilarisModifiers` and the effect source classification
required by rule-aware modifiers. The configuration UI SHALL provide a
distinct German-labeled Ilaris-Modifikatoren section without altering the
native Foundry Changes tab.

#### Scenario: GM adds an Ilaris modifier in the effect configuration

- **WHEN** a GM opens an Ilaris ActiveEffect configuration sheet
- **THEN** the sheet SHALL allow the GM to add, edit, and remove declarative
  Ilaris modifiers including phase, target, value, stacking policy, source,
  and selectors

#### Scenario: Native change remains a native change

- **WHEN** a GM edits the core Changes tab of the same sheet
- **THEN** the edited entry SHALL remain in the ActiveEffect `changes` array
- **AND** it SHALL NOT implicitly create an `ilarisModifiers` entry

### Requirement: Main attributes use semantic modifiers exclusively

The system SHALL prevent a native ActiveEffect `changes` entry from directly
modifying a main-attribute path. The configuration UI and Pre-Effect processor
SHALL redirect an additive main-attribute change to a roll-phase semantic
`ilarisModifier` when its target can be mapped, and SHALL reject unsupported
main-attribute operations with a German validation message. The custom
ActiveEffect application logic SHALL skip a legacy direct main-attribute
change that bypassed those authoring paths.

#### Scenario: Additive GE change becomes a roll-only modifier

- **WHEN** a GM configures or generates an additive native change for the GE
  main-attribute path
- **THEN** the system SHALL store it as a semantic roll-phase GE modifier
- **AND** it SHALL NOT retain the direct main-attribute entry in `changes`

#### Scenario: Legacy direct main-attribute change cannot affect derived values

- **WHEN** an imported or legacy ActiveEffect contains a direct native GE or
  KK main-attribute change
- **THEN** IlarisActiveEffect SHALL not apply that native change
- **AND** it SHALL not alter any prepared attribute or derived value

### Requirement: Prepare-phase modifiers share the Actor effect lifecycle

The Ilaris Actor preparation flow SHALL resolve active `prepare` modifiers in
the documented
[Actor#applyActiveEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#applyActiveEffects)
lifecycle after applicable native changes have been determined and before
dependent Ilaris derived values are calculated. It SHALL apply the result only
to prepared actor data and SHALL NOT persist an actor update during data
preparation.

#### Scenario: Prepared value reflects an active modifier

- **WHEN** an active effect has a matching prepare-phase GS modifier
- **THEN** the actor's prepared GS SHALL include the resolved modifier before
  the actor's derived values are consumed

#### Scenario: Main-attribute modifier is excluded from preparation

- **WHEN** an active effect has a semantic prepare request for a main
  attribute such as GE or KK
- **THEN** the ActiveEffect preparation integration SHALL reject or redirect it
  to roll-phase resolution
- **AND** it SHALL NOT alter the prepared attribute or derived values

#### Scenario: Core priority remains effective

- **WHEN** native changes with Foundry modes and priorities coexist with
  prepare-phase Ilaris modifiers
- **THEN** native changes SHALL retain Foundry's documented handling
- **AND** the semantic modifier result SHALL be applied only in its defined
  Ilaris preparation step
