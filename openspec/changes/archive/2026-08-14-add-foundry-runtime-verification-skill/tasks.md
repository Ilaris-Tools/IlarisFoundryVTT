## 1. Runtime-verification workflow design

- [x] 1.1 Review the existing OpenSpec apply workflow, lifecycle helper, and E2E conventions that the new skill must coordinate.
- [x] 1.2 Define a reusable change-directory checklist template with scenario/task traceability, UI path, state evidence, cleanup, diagnostics, and user-confirmation fields.

## 2. Repository-local skill

- [x] 2.1 Initialize `.codex/skills/foundry-runtime-verification/` with required OpenAI agent metadata.
- [x] 2.2 Implement the skill instructions for deriving, executing, and updating change-specific runtime verification.
- [x] 2.3 Add concise references for the checklist template and Foundry/Playwright workflow patterns, including the `page.evaluate` boundary.

## 3. OpenSpec integration

- [x] 3.1 Update `openspec-apply-change` to invoke runtime verification for Foundry-facing validation and to record non-applicability for other changes.

## 4. Validation

- [x] 4.1 Run the skill validator and resolve structural issues.
- [x] 4.2 Review the resulting checklist workflow against a completed stateful Foundry change and confirm it covers visible UI, data state, diagnostics, cleanup, and manual confirmation.
- [x] 4.3 Validate the OpenSpec change in strict mode and review the scoped diff.
