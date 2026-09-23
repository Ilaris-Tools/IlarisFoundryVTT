## ADDED Requirements

### Requirement: Pre-effects resolve from the effective spell form

After a successful supernatural cast, the processor SHALL apply the effective pre-effect list resolved from selected structured forms rather than unconditionally reading the source Item's `system.preEffects`. Existing resistance, timing, Ilaris modifier, provenance, and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) behavior SHALL apply unchanged to each resolved entry.

#### Scenario: Attributo applies selected form effects

- **WHEN** a player successfully casts Attributo with an attribute replacement form
- **THEN** the processor SHALL apply that form's effective pre-effects

#### Scenario: Form identity is retained in provenance

- **WHEN** a structured form creates a persistent ActiveEffect
- **THEN** Ilaris source metadata SHALL record the source spell and selected form id
