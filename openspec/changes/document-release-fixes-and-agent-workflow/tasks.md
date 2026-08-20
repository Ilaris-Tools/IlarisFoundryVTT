## 1. Retrospective release-fix audit

- [x] 1.1 Compare commit `36492f283a9ec71a760a9b6b8314017875232f42` with the combat, damage-type, configurable-damage-type, and supernatural-pre-effect delta scenarios; record any mismatch before changing runtime code.
- [x] 1.2 Verify against Foundry API docs (v14) that the existing `Actor.uuid`, `foundry.utils.fromUuid`, `Game#settings`, `ClientSettings#get`, and ChatMessage usage matches the recorded requirements.
- [x] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and record why the existing `fromUuid` approach remains appropriate.
- [x] 1.4 Audit `CHANGELOG.md`, `package.json`, and `package-lock.json` for v14.1 metadata consistency; document that no compendium `_source/` data changed and `npm run pack-all` is not required.

**Audit outcome:** No mismatch was found. The commit uses `Actor.uuid` and `foundry.utils.fromUuid` for synthetic Actors, retains legacy IDs only as a fallback, uses the documented settings and ChatMessage APIs, and implements every recorded UI/damage behavior. The v14.1 package, lockfile, and system manifest versions agree; the changelog contains the reviewed v14.1 entries. The community API wiki and Foundry v14 API list `fromUuid` as the appropriate document-resolution helper. No compendium `_source/` file changed, so `npm run pack-all` is not required.

## 2. Canonical agent workflow and provider adapters

- [x] 2.1 Expand `AGENTS.md` as the single canonical OpenSpec workflow policy, including retrospective/external changes and a required, traceable proposal self-review gate.
- [x] 2.2 Add root `CLAUDE.md` as a concise Claude/Claude Web entry point that directs significant work to `AGENTS.md`, explains the needed user prompt context, and forbids applying a blocked proposal.
- [x] 2.3 Replace duplicated shared OpenSpec policy in `.github/copilot-instructions.md` with a link to `AGENTS.md`, retaining only Copilot-specific mechanics and explicit precedence information.
- [x] 2.4 Update the Claude OpenSpec command prompts to direct users to the canonical policy and self-review gate instead of embedding another workflow copy.
- [x] 2.5 Audit all provider instruction entry points for working links and verify that no provider-specific file contradicts the canonical lifecycle, handoff contract, or self-review gate.

**Adapter audit:** `CLAUDE.md`, all `.claude/commands/`, all `.codex/skills/openspec-*`, `.github/copilot-instructions.md`, `.github/prompts/`, and `.github/skills/openspec-*` now point to `AGENTS.md`. The provider-specific files retain command/skill mechanics only; none duplicates or contradicts the lifecycle or self-review gate.

- [x] 2.6 Create `.agents/OPENSPEC_OPERATIONS.md` as the single canonical body for Explore, Propose, Apply, Sync, and Archive; reduce every Claude, Codex, and GitHub OpenSpec skill/prompt to a provider-metadata adapter that instructs the AI to read its matching section.

**Canonical-body result:** The shared operation document uses the Codex operation wording as the reference. All provider adapters point to their matching central section and explicitly state that provider-specific material cannot override it.

## 3. Unit tests and static validation

- [x] 3.1 Run the focused Jest coverage in `scripts/combat/_spec/shared_dialog_helpers.test.js` for LEP healing, `NORMAL`, and damage-type registry keys.
- [x] 3.2 Run the focused Jest coverage in `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for UUID target resolution, missing targets, and escaped prompt content.
- [x] 3.3 Run `npm test` and `npm run lint`; investigate any failure attributable to this change and report unrelated pre-existing failures separately.

**Results:** Focused combat: 76 passed. Focused resist handler: 11 passed. Full Jest suite: 37 suites / 550 tests passed. `npm run lint` passed without unrelated modifications.

## 4. E2E review

- [x] 4.1 Confirm that this documentation-only change adds no runtime interaction and therefore requires no new Playwright scenario or Foundry lifecycle run.
- [x] 4.2 If the retrospective audit requires a runtime correction, add the affected E2E scenario, use `node utils/foundry-lifecycle.mjs Status` before execution, and validate it in `ilaris-e2e-world-v14363-r1`.

**E2E decision:** Not applicable. The retrospective audit found no runtime correction, and this change affects only specifications and instruction files.

## 5. Proposal review, OpenSpec validation, and handoff

- [x] 5.1 Complete and record the mandatory proposal self-review with a `PASS`, `PASS_WITH_NOTES`, or `BLOCK` decision, covering scope, API evidence, requirements, tests, migration, and UI ordering (not applicable for this change).
- [x] 5.2 Run `openspec validate document-release-fixes-and-agent-workflow --strict` and resolve change-local validation errors.
- [x] 5.3 Review the final diff, ensure only retrospective documentation and workflow-policy files are included, and commit the completed change with a concise imperative message after the required checks pass.
- [x] 5.4 Validate the canonical operation-body consolidation, review its scoped documentation diff, and commit the follow-up update.
