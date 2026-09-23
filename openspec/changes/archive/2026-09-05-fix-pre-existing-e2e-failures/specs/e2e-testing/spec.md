## ADDED Requirements

### Requirement: Restart-dialog isolation

E2E cases SHALL dismiss Foundry reload/restart confirmation dialogs they trigger (e.g., `reload-world-confirm`) before continuing with subsequent interactions, and SHALL restore any affected settings. A leftover reload dialog SHALL NOT intercept pointer events of later steps.

#### Scenario: Settings save triggers reload dialog

- **WHEN** an E2E case saves a setting that makes Foundry open a reload confirmation dialog
- **THEN** the case SHALL dismiss the dialog (e.g., click `No` / `data-action="no"` or the equivalent) before performing subsequent clicks or assertions
- **AND** the affected setting SHALL be restored in cleanup (e.g., `afterEach`)

#### Scenario: Reload dialog interception is prevented

- **WHEN** an E2E case continues after a settings save
- **THEN** no open reload dialog SHALL intercept pointer events of later steps
