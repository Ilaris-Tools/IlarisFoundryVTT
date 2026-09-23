## ADDED Requirements

### Requirement: Per-file session reuse

Multi-test E2E case files SHALL reuse a single Foundry session per file: the login SHALL happen once in `beforeAll` (shared page via `browser.newPage()`), and the session SHALL be closed in `afterAll`. State modified between/within tests SHALL be restored (snapshots, settings, chat) so test semantics remain equivalent; the sequential execution model (`workers: 1`) stays unchanged.

#### Scenario: Multi-test file shares one session

- **WHEN** a case file contains more than one test
- **THEN** the file SHALL log in once (`beforeAll`) and reuse the page across its tests (`afterAll` closes it)
- **AND** per-test cleanup SHALL restore mutated actor/setting/chat state

#### Scenario: Single-test file keeps simple setup

- **WHEN** a case file contains exactly one test
- **THEN** it SHALL keep the current per-test login (no reuse wrapper needed)
