## ADDED Requirements

### Requirement: Release checklist coverage traceability

Release documentation and minor/major PR templates SHALL identify, for each release test item, either the automated test IDs that cover it or that it remains manual with a reason.

#### Scenario: Automated checklist item

- **WHEN** a reviewer reads a release checklist item that has automated coverage
- **THEN** the item SHALL name the relevant unit or E2E test ID/path.

#### Scenario: Manual checklist item

- **WHEN** a release checklist item cannot be automated reliably
- **THEN** it SHALL be marked manual and state the remaining human verification purpose.

### Requirement: Full-suite result reporting

Release validation documentation SHALL distinguish a successful full E2E run from an isolated rerun of a failed case.

#### Scenario: Full-suite-only failure

- **WHEN** a case fails in the serial full E2E suite but passes in isolation
- **THEN** the result SHALL be reported as a full-suite reliability issue rather than a green full-suite result.
