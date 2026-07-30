## ADDED Requirements

### Requirement: Default configuration baseline

The published E2E world SHALL use the documented Foundry and Ilaris default values for configurable settings, except for Foundry- or system-maintained migration metadata. A test requiring a non-default setting SHALL declare it through a shared fixture that applies the value before the test action and restores the captured prior value during teardown.

#### Scenario: Target-selection test requires an enabled setting

- **WHEN** an E2E case requires target selection while its baseline default is disabled
- **THEN** the case SHALL enable target selection through the shared setting fixture before opening the relevant dialog and SHALL restore the previous value afterwards.

### Requirement: Stateful E2E case restoration

An E2E case that mutates shared baseline state SHALL restore each mutated resource before it completes, using shared fixtures when more than one case needs the same restoration pattern.

#### Scenario: Actor and chat mutation

- **WHEN** a test modifies a baseline actor or creates chat messages
- **THEN** it SHALL restore the actor snapshot and remove test-created chat messages before the next serial case relies on the baseline.

#### Scenario: Setting or scene mutation

- **WHEN** a test changes a setting, scene, token, or other shared world resource
- **THEN** it SHALL restore the prior value or document state before completion using the documented Foundry APIs: [ClientSettings](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html), [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html).

### Requirement: Full-suite reproducibility

Stateful E2E regression cases SHALL pass both in isolation and in the serial full suite when run from the documented baseline world.

#### Scenario: Order-sensitive regression case

- **WHEN** a case has previously produced a full-suite-only failure
- **THEN** its setup and teardown SHALL be strengthened and verified in isolation and as part of the serial suite.
