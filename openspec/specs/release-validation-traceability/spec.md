## Purpose

Trace release checklist checks to automated evidence or explicit manual verification.

## Requirements

### Requirement: Release checklist coverage traceability

Release documentation and minor/major PR templates SHALL identify automated test IDs for each covered test item or mark it manual with a reason. For effect-extension releases, the major-release template and `docs/develop/release.md` SHALL map healing validation to E2E-030 and configurable damage-type settings validation to E2E-031.

#### Scenario: Major-release effect-extension traceability

- **WHEN** a contributor completes the major-release checklist for a release containing effect-extension behavior
- **THEN** the Zauber/Schadensystem and Welteinstellungen entries SHALL identify E2E-030 and E2E-031 where applicable
- **AND** the entries SHALL still state the remaining manual checks and their reasons

### Requirement: Full-suite result reporting

Release validation SHALL distinguish a successful full E2E run from an isolated rerun of a failed case.

#### Scenario: Isolated rerun does not replace full-suite evidence

- **WHEN** an E2E case passes when rerun by itself after failing in the serial suite
- **THEN** release validation SHALL report the isolated result separately from the full-suite result
