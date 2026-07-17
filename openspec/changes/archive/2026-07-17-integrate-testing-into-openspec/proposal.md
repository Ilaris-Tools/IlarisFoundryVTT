## Why

Testing is currently an afterthought in the OpenSpec workflow. Unit tests and E2E tests are never mentioned during explore/propose — they only appear as a "run npm test" checkbox at the end of tasks.md. Meanwhile, the E2E Testfall Assistant exists as a standalone agent with an 11-step intake flow that creates `testfall.md` files duplicating what spec scenarios already describe. This change weaves testing consciousness into every phase of OpenSpec and unifies spec scenarios with test specifications.

## What Changes

- **ADDED**: Testing lens in the explore phase — the explore agent naturally surfaces testing questions when relevant (which E2E cases are affected, what units are testable, what new scenarios need coverage)
- **ADDED**: "Testing Impact" section to `proposal.md` template — captures new/existing unit tests, E2E cases affected, and environment setup (players, world, shared code candidates)
- **ADDED**: "Testing Strategy" section to `design.md` template — identifies testable units and E2E coverage for the change
- **ADDED**: Dedicated "Unit Tests" and "E2E Tests" task groups in `tasks.md` — test tasks are first-class, not buried in validation
- **MODIFIED**: Apply phase ordering — when a code task has a corresponding test task, the test is written first (test-first micro-cycle)
- **MODIFIED**: Archive phase — adds a gate that test files exist for touched capabilities (where applicable)
- **MODIFIED**: E2E Testfall Assistant refactored into a lighter "E2E Spec Generator" — takes a spec scenario directly, asks only essential questions (players, world, shared code), generates `.spec.ts` skeleton. No more `testfall.md`.
- **REMOVED**: `testfall.md` as a required artifact for new E2E cases — spec scenarios become the canonical test specification. Existing `testfall.md` files are retained but deprecated.

## Capabilities

### New Capabilities

- `openspec-testing-integration`: Testing-aware behavior across all OpenSpec phases — explore asks testing questions, proposal/design capture testing impact, apply uses test-first ordering, archive verifies test coverage

### Modified Capabilities

- `e2e-testing`: E2E tests are now generated from spec scenarios instead of standalone `testfall.md`; E2E Testfall Assistant is refactored into a lighter E2E Spec Generator that takes a spec scenario as input and asks only essential environment questions

## Impact

- **Files modified**: `.github/skills/openspec-explore/SKILL.md`, `.github/skills/openspec-propose/SKILL.md`, `.github/skills/openspec-apply-change/SKILL.md`, `.github/skills/openspec-archive-change/SKILL.md`, `.github/prompts/opsx-explore.prompt.md`, `.github/prompts/opsx-propose.prompt.md`, `.github/prompts/opsx-apply.prompt.md`, `.github/prompts/opsx-archive.prompt.md`, `openspec/config.yaml`
- **Files created**: `.github/agents/e2e-spec-generator.md` (lighter replacement for E2E Testfall Assistant)
- **Files deprecated** (not deleted): `e2e/cases/*/testfall.md` — retained for existing cases, not created for new ones
- **New hooks**: None
- **Foundry APIs touched**: None — this is a development workflow change, not a system code change
- **Type**: Purely additive to the development process. Does not modify any game system code, compendium data, or user-facing behavior.
