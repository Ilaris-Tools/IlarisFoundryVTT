## ADDED Requirements

### Requirement: Semantic prepare modifiers support MR

The semantic modifier model SHALL support canonical target `mr` for
Magieresistenz. The Actor preparation lifecycle SHALL resolve matching
prepare-phase MR modifiers through
[Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects)
and add the result only to prepared `system.abgeleitete.mr` data.

#### Scenario: Semantic MR modifies prepared MR

- **WHEN** an active effect has a matching prepare-phase `mr` modifier
- **THEN** the actor's prepared `system.abgeleitete.mr` SHALL include its
  resolved contribution
- **AND** the system SHALL NOT persist an actor update during preparation

#### Scenario: Ilaris mode selects strongest MR components

- **WHEN** matching supernatural MR modifiers with `strongest-supernatural`
  provide `+4`, `+2`, and `-3`
- **THEN** Ilaris mode SHALL apply `+4` and `-3`
- **AND** it SHALL suppress the `+2` component without disabling its effect

#### Scenario: Foundry mode adds MR components

- **WHEN** the world uses Foundry stack mode and matching supernatural MR
  modifiers provide `+4` and `+2`
- **THEN** prepared MR SHALL include `+6`
