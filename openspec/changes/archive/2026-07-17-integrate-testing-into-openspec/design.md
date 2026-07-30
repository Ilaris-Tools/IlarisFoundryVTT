## Context

The OpenSpec workflow (explore → propose → apply → archive) currently treats testing as a validation afterthought. Unit tests and E2E tests are never surfaced during planning phases — they only appear as "run npm test" checkboxes at the end of tasks.md. Meanwhile, the E2E Testfall Assistant exists as a standalone agent with an 11-step intake flow that creates `testfall.md` files whose content largely duplicates what spec scenarios already describe.

The user has decided:

1. Testing awareness should be "where applicable" — the explore phase decides, not a mandatory checklist
2. E2E test creation should be simpler — proposal captures key context (players, world, shared code), no 11-step intake during apply
3. Spec scenarios and test specifications should be unified — `testfall.md` deprecated
4. Test files should exist for touched capabilities where applicable — archive gate

This is purely a development workflow change. No game system code, compendium data, or Foundry APIs are affected.

## Goals / Non-Goals

**Goals:**

- Make testing a natural part of the explore conversation, not a separate step
- Add testing-aware sections to proposal.md and design.md templates
- Add dedicated test task groups to tasks.md
- Apply test-first ordering in the apply phase (test task before code task)
- Deprecate testfall.md in favor of spec scenarios as the canonical test specification
- Refactor E2E Testfall Assistant into a lighter E2E Spec Generator
- Add test file existence gate to archive phase (where applicable)

**Non-Goals:**

- Mandatory test coverage metrics or thresholds
- Auto-generating tests without human review
- Deleting existing testfall.md files
- Changing how Playwright or Jest are configured
- Modifying any game system code, compendium data, or Foundry API usage

## Decisions

### Decision 1: Testing is a lens, not a phase

**Chosen**: Inject testing awareness into each existing OpenSpec phase rather than creating a separate "testing phase."

**Alternatives considered**:

- New "testing" phase between propose and apply — rejected because it adds friction without corresponding value
- Separate "test planning" artifact — rejected because testing context belongs with the artifacts it relates to

**Rationale**: The explore phase already investigates the codebase — asking "what tests exist here?" is a natural extension. The propose phase already lists capabilities and impact — "what test coverage does this need?" fits there. Keeping testing woven into existing phases avoids workflow bloat.

### Decision 2: Spec scenarios become the canonical test specification

**Chosen**: Deprecate `testfall.md`. Spec scenarios (WHEN/THEN in `openspec/specs/<capability>/spec.md`) serve as the test specification. E2E `.spec.ts` files reference the spec scenario they implement.

**Alternatives considered**:

- Keep both — rejected because maintaining two near-identical documents creates drift
- Delete all existing testfall.md — rejected because existing cases still reference them; deprecation is safer

**Rationale**: The spec's WHEN/THEN format is already a test case. The only content unique to testfall.md is environment setup (players, world) and chat validation strings — these can live as JSDoc comments in the `.spec.ts` file or be captured in the proposal's Testing Impact section.

### Decision 3: E2E Testfall Assistant → E2E Spec Generator

**Chosen**: Refactor the existing agent into a lighter version that takes a spec scenario as input, asks only essential questions (players, world, shared code candidates), and generates a `.spec.ts` skeleton.

**Alternatives considered**:

- Keep the 11-step intake — rejected as too heavy for OpenSpec integration where the spec scenario already defines the test
- Remove the agent entirely — rejected because having a guided E2E creation tool is still valuable

**Rationale**: The agent's core value — asking the right environment questions and generating valid Playwright code — remains. The intake shrinks because the spec scenario already answers "what should this test do?"

### Decision 4: Proposal captures E2E context upfront

**Chosen**: The proposal's "Testing Impact" section captures players needed, world state, and shared code candidates. This makes E2E test creation during apply straightforward — the key decisions are already made.

**Alternatives considered**:

- Ask during apply — rejected because it breaks the implementation flow
- Put in design.md instead — partial; proposal is the right place for scoping questions

**Rationale**: By the time apply runs, the implementer should know exactly what E2E tests to create. The proposal front-loads the environment decisions.

## Risks / Trade-offs

- **Existing testfall.md files become stale** → Mitigation: clearly mark them as deprecated with a comment pointing to the canonical spec; they still serve as documentation for existing cases
- **Proposal authors might skip Testing Impact** → Mitigation: the section is optional ("where applicable"); the explore phase encourages but doesn't enforce it
- **E2E Spec Generator might miss edge cases that the 11-step intake caught** → Mitigation: the spec scenario covers what to test; environment questions cover how; the Reviewer gate remains as a quality check
