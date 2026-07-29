## ADDED Requirements

### Requirement: E2E coverage verifies reviewed compendium pre-effect data

The E2E suite SHALL verify representative reviewed compendium pre-effects through the existing [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) flows.

#### Scenario: Reviewed direct damage is applied

- **WHEN** a test casts a reviewed direct-damage spell against a selected target
- **THEN** the target's health state SHALL change by the configured deterministic damage result

#### Scenario: Reviewed marker and alternate resistance branch are visible

- **WHEN** a test resolves the reviewed marker spell through failed and successful resistance branches
- **THEN** the failure branch SHALL create the spell-named marker without a numeric modifier
- **AND** the success branch SHALL create the documented alternate modifier

#### Scenario: Damage-only approximation does not repeat automatically

- **WHEN** a test casts a reviewed damage-only approximation
- **THEN** it SHALL observe one direct-damage application
- **AND** it SHALL not assert unsupported zone, contact, or repeating behavior
