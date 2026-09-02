## 1. OpenSpec Config — Testing Rules

- [x] 1.1 Add testing-related artifact rules to `openspec/config.yaml`: proposal rule to include "Testing Impact" section, design rule to include "Testing Strategy" section, tasks rule to include dedicated test task groups

## 2. Explore Phase — Testing Lens

- [x] 2.1 Update `.github/skills/openspec-explore/SKILL.md`: add "Testing Lens" subsection describing when and how to surface testing questions during exploration (UI changes → E2E questions, new pure functions → unit test opportunities, internal refactors → unit test focus)
- [x] 2.2 Update `.github/prompts/opsx-explore.prompt.md`: mirror the same testing lens guidance

## 3. Propose Phase — Testing Sections

- [x] 3.1 Update `.github/skills/openspec-propose/SKILL.md`: add "Testing Impact" section to the proposal template description, add "Testing Strategy" section to the design template description, add "Unit Tests" and "E2E Tests" task groups to the tasks template description
- [x] 3.2 Update `.github/prompts/opsx-propose.prompt.md`: mirror the same template changes

## 4. Apply Phase — Test-First Ordering

- [x] 4.1 Update `.github/skills/openspec-apply-change/SKILL.md`: add test-first micro-cycle description — when a code task has a corresponding unit test task, execute the test task first; for E2E test tasks, generate `.spec.ts` from the referenced spec scenario or delegate to the E2E Spec Generator
- [x] 4.2 Update `.github/prompts/opsx-apply.prompt.md`: mirror the same test-first guidance

## 5. Archive Phase — Test Coverage Gate

- [x] 5.1 Update `.github/skills/openspec-archive-change/SKILL.md`: add test coverage verification step — check that test files exist for touched capabilities (where applicable), note gaps but do not block
- [x] 5.2 Update `.github/prompts/opsx-archive.prompt.md`: mirror the same verification guidance

## 6. E2E Spec Generator Agent

- [x] 6.1 Read existing `.github/agents/e2e-testfall-assistant.md` for context on current agent structure
- [x] 6.2 Create `.github/agents/e2e-spec-generator.md`: refactored agent that takes a spec scenario as input, asks only essential questions (players, world, shared code), generates `.spec.ts` skeleton with `@spec` and `@scenario` JSDoc tags
- [x] 6.3 Update `.github/copilot-instructions.md` to list the E2E Spec Generator

## 7. Synced Main Specs

- [x] 7.1 Sync delta spec `e2e-testing` to `openspec/specs/e2e-testing/spec.md`: apply MODIFIED and ADDED requirements
- [x] 7.2 Create `openspec/specs/openspec-testing-integration/spec.md` from the delta spec

## 8. Deprecation Markers for Existing testfall.md Files

- [x] 8.1 Add a deprecation comment to the top of each existing `e2e/cases/*/testfall.md` file: "DEPRECATED — canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only."

## 9. Validation

- [x] 9.1 Verify all modified files follow existing formatting conventions
- [x] 9.2 Run `npm run lint` to ensure no style violations
- [x] 9.3 Manually review each modified skill/prompt file for consistency with the other files
- [x] 9.4 Verify the E2E Spec Generator agent definition follows the same format as existing `.github/agents/` files
