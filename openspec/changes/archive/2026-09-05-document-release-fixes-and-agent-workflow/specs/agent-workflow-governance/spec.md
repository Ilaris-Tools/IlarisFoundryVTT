## ADDED Requirements

### Requirement: Canonical provider-neutral workflow policy

`AGENTS.md` SHALL be the canonical repository policy for the OpenSpec lifecycle, role handoffs, validation, and Git handoff. `.agents/OPENSPEC_OPERATIONS.md` SHALL contain the complete provider-neutral bodies for the five OpenSpec operations. Provider-specific instruction, prompt, and skill files SHALL link to both sources and SHALL contain only provider metadata, invocation mechanics, or an explicit exception with its rationale.

#### Scenario: Provider discovers the shared workflow

- **WHEN** an AI contributor opens a provider-specific repository instruction file
- **THEN** it SHALL identify `AGENTS.md` as the canonical OpenSpec workflow source
- **AND** it SHALL instruct the AI to read the matching section in `.agents/OPENSPEC_OPERATIONS.md`
- **AND** it SHALL not copy a provider-specific version of the operation body

#### Scenario: Claude entry point exists

- **WHEN** a Claude user opens the repository instructions or starts a Claude Web review using the repository
- **THEN** `CLAUDE.md` SHALL direct the user and Claude to read and follow `AGENTS.md` before proposing, reviewing, or changing significant work

### Requirement: OpenSpec applies to significant externally authored changes

Every significant change, including one already authored by a human or another AI outside the repository workflow, SHALL be associated with an OpenSpec change before it is accepted for release. A retrospective change SHALL identify the implementation commit, verify it against the proposal and delta specifications, and make any mismatch explicit.

#### Scenario: Reviewed external release fix is documented

- **WHEN** a reviewed release-fix commit was created before its OpenSpec artifacts
- **THEN** its retrospective proposal SHALL name the commit hash and describe the implemented behavior
- **AND** the apply tasks SHALL audit the commit against every affected requirement before syncing or archiving

### Requirement: Proposal self-review is mandatory and traceable

The author of an OpenSpec proposal SHALL review its own proposal, design, specs, and tasks before applying or recommending acceptance. The review record SHALL appear under `## Proposal Self-Review` in `proposal.md`, state `PASS`, `PASS_WITH_NOTES`, or `BLOCK`, identify any notes or blockers, and cover scope, API evidence, affected requirements, testing impact, migration, and UI ordering when the change has UI.

#### Scenario: Claude proposes a change

- **WHEN** Claude creates or revises an OpenSpec proposal
- **THEN** Claude SHALL add a self-review record before starting implementation
- **AND** a `BLOCK` result SHALL prevent applying the change until the listed blocker is resolved

#### Scenario: Proposal has no UI

- **WHEN** a proposal changes no UI
- **THEN** its self-review record SHALL explicitly mark UI ordering as not applicable
