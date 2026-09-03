## ADDED Requirements

### Requirement: E2E startup restores declared baseline settings

The shared E2E login fixture SHALL restore each setting named in `E2E_BASELINE.settingDefaults` to its declared value after Foundry is ready and before asserting the baseline. It SHALL then validate the restored settings with the normal baseline assertion.

#### Scenario: Interrupted non-default setting is recovered

- **WHEN** a previous E2E process leaves a declared baseline setting at a non-default value
- **THEN** the next shared-fixture login SHALL restore the declared default before the test begins

#### Scenario: Other baseline dependencies remain validated

- **WHEN** the configured E2E world lacks a required user, actor, ownership relation, or active scene
- **THEN** baseline validation SHALL still fail after setting recovery
