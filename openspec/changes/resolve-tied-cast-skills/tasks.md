## 1. Deterministic automatic cast-skill resolution

- [x] 1.1 Replace the tied-highest-PW selection-required result with the alphabetically later eligible skill in `scripts/combat/dialogs/cast-skill-context.js`.
- [x] 1.2 Remove the now-unreachable tied-skill selector context, listener, and roll guards from the supernatural dialog and its Handlebars template.

## 2. Unit Tests

- [x] 2.1 Update `scripts/combat/dialogs/_spec/cast-skill-context.spec.js` to assert the alphabetically later highest-PW skill is selected automatically, including German-name ordering.
- [x] 2.2 Run the focused cast-skill-context Jest specification and then the full `npm test` suite.

## 3. E2E Tests

- [x] 3.1 Update `e2e/cases/e2e-026-pre-effect-resist-flow/e2e-026-pre-effect-resist-flow.spec.ts` so the tied-skill case asserts immediate roll availability without a `Fertigkeit` selector.
- [x] 3.2 Use `node utils/foundry-lifecycle.mjs Status`, restart Foundry if required, and run the updated E2E-026 case against the local E2E world; capture the visible dialog evidence in `runtime-verification.md`.

## 4. Quality and Handoff

- [x] 4.1 Run `npm run lint` and `openspec validate resolve-tied-cast-skills --strict`.
- [ ] 4.2 Review the scoped diff, update this task list with completed evidence, and commit only the completed change files after all required validation passes.
