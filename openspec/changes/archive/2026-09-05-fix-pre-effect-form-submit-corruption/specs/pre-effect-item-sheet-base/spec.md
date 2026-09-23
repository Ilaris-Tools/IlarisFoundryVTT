## ADDED Requirements

### Requirement: Shared form-submit normalizes nested array fields

The shared Pre-Effect form-submit handler SHALL normalize object-indexed form data for `system.spellModifications` — including each modification's nested `preEffects`, `changes`, `ilarisModifiers`, `summonItem.overrides`, `summonCreature.overrides`, `summonCreature.dominationChecks.entries`, and `resistanceOutcomes` outcome payloads — back to arrays before persisting via [Item.update](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), not only `system.preEffects`.

#### Scenario: Spell modification form controls survive auto-submit

- **WHEN** a GM toggles a checkbox inside a structured spell modification's Pre-Effect (for example `avoidTest.enabled`)
- **THEN** the submitted update SHALL persist that modification's Pre-Effects as an array
- **AND** the Item SHALL retain the same number of Pre-Effects in that modification

#### Scenario: Outcome-payload controls render correct indexed names

- **WHEN** the shared Pre-Effect editor renders a `resistanceOutcomes` outcome payload
- **THEN** each control name SHALL include the enclosing pre-effect index
- **AND** no control name SHALL contain an empty index segment (for example `system.preEffects..resistanceOutcomes.failure.enabled`)
