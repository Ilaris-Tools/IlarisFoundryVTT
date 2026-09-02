## ADDED Requirements

### Requirement: Reviewed resistance-outcome spell source data

The reviewed spell source Items SHALL use explicit resistance outcome payloads
when their rules assign distinct persistent results to success and failure.
Their marker and modifier effects SHALL preserve the source spell provenance
required by the `supernatural-pre-effects` capability.

#### Scenario: Fluch des Gewürms has distinct resistance outcomes

- **WHEN** _Fluch des Gewürms_ is examined in compendium `_source/`
- **THEN** it SHALL define a Willenskraft 16 resistance Pre-Effect with a
  failure marker labelled `Handlungsunfähig` and a success payload applying a
  global `-4` Ilaris modifier for 16 Initiativephasen

#### Scenario: Krabbelnder Schrecken has distinct resistance outcomes

- **WHEN** _Krabbelnder Schrecken_ is examined in compendium `_source/`
- **THEN** it SHALL define the same reviewed Willenskraft 16 failure-marker
  and success-`-4` outcome pattern for 16 Initiativephasen

#### Scenario: Hexengalle uses a marker instead of a numeric placeholder

- **WHEN** _Hexengalle_ is examined in compendium `_source/`
- **THEN** its failed Zähigkeit 16 resistance result SHALL use a timed,
  spell-traceable `Handlungsunfähig` marker for two Initiativephasen
- **AND** it SHALL not use an unrelated zero-valued modifier merely to create
  an effect document
