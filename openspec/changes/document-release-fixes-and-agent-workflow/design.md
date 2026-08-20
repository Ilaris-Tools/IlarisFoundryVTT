## Context

The reviewed v14.1 release-fix commit predates its OpenSpec change. Its code is intentionally treated as the implementation baseline: this change adds the missing requirements, verification record, and future contributor policy without silently rewriting the reviewed runtime behavior.

The repository already has a tool-neutral `AGENTS.md`, but `.github/copilot-instructions.md` repeats much of the OpenSpec policy and Claude has no root instruction entry point. Repeated policy has already drifted and does not make Claude Web users explicitly perform a proposal review.

## Goals / Non-Goals

**Goals:**

- Create a traceable retrospective record from commit `36492f283a9ec71a760a9b6b8314017875232f42` to requirements, tests, and release metadata.
- Make `AGENTS.md` the canonical OpenSpec workflow policy and add concise provider adapters.
- Require every proposal author, including Claude, to perform and record a structured self-review before the proposal is used for implementation or acceptance.
- Preserve provider-specific mechanics and path-scoped instructions without copying the shared policy.

**Non-Goals:**

- Change the reviewed release-fix runtime behavior.
- Claim that a repository file can force Claude Web to read it. A human must include or point Claude Web to `CLAUDE.md`/`AGENTS.md` when starting a chat.
- Replace provider-specific skills, commands, or agent profiles with symlinks; those remain provider integration assets.
- Add E2E coverage or launch Foundry for a documentation-only change.

## Decisions

### Treat the commit as a retrospective baseline

The design records the exact commit hash in proposal, tasks, and review evidence. Requirements are written as the desired released behavior, while implementation tasks first compare the commit to those requirements. This creates a reviewable trail without inventing a second implementation.

Alternative: revert and re-implement through a new change. Rejected because the user has reviewed the code and the risk of release regression outweighs the governance benefit.

### Use `AGENTS.md` as the shared policy and adapters as entry points

`AGENTS.md` already declares itself tool-agnostic and is the natural source of truth. `CLAUDE.md` will be a small Claude-facing entry point and Copilot instructions will link to the shared workflow rather than replicate it. Provider files may state how their environment invokes a skill or command, but the lifecycle, handoff contract, and review gate live once in `AGENTS.md`.

Alternative: add a new generic workflow document and point every file to it. Rejected because it creates another document that must be found before the already-established repository instruction file.

### Require a self-review record, not self-approval

The proposal author must check scope, affected requirements, API evidence, test impact, migration/rollback, UI ordering where applicable, and consistency across proposal/design/specs/tasks. The record must be `PASS`, `PASS_WITH_NOTES`, or `BLOCK`. A `BLOCK` proposal cannot be applied; a pass is evidence, not a substitute for a separate reviewer when the work requires one.

The record lives in a `## Proposal Self-Review` section in `proposal.md`, keeping it adjacent to the scope and testing decisions it evaluates.

Alternative: rely solely on a later external review. Rejected because Claude Web may create its own proposal and otherwise skip a quality gate before implementation.

### Keep tests proportionate to the change

The reviewed commit's existing unit tests are audited and rerun. No new user flow is introduced by the documentation and policy files, so no E2E run is required unless the retrospective audit finds a behavior discrepancy that leads to code changes.

## API Surface

This documentation change does not add a Foundry API call or hook. It records the existing implementation's use of:

- [`Actor`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) and its UUID, including synthetic Actors of unlinked Tokens.
- [`Game#settings`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings) and [`ClientSettings#get`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get) for damage-type behavior and the core message mode.
- [`foundry.utils.fromUuid`](https://foundryvtt.com/api/v14/modules/foundry.utils.html#fromUuid) to resolve the serialized resistance target.
- [`ChatMessage`](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html) creation for resistance and healing feedback.
- The existing system `Ilaris.postSkillRoll` hook. No Foundry hook event is added or changed.

The Foundry v14 API and the [community API wiki](https://foundryvtt.wiki/en/development/api) are verification sources for the retrospective audit. No new `foundry.utils.*` helper is introduced.

## Risks / Trade-offs

- **A Claude Web user does not provide repository instructions to the chat** → `CLAUDE.md` makes the expected prompt and policy location explicit, but the repository cannot enforce remote-chat context loading.
- **Provider adapters drift back into copied policy** → keep adapters short and require them to link to `AGENTS.md`; audit this as a task.
- **The retrospective specification differs from the committed code** → compare each requirement directly with the named commit before changing main specs; any mismatch blocks archival until resolved.
- **Existing unrelated OpenSpec validation failures obscure this change** → validate this change strictly and separately; report unrelated repository-wide failures without changing them.

## Migration Plan

1. Add the retrospective specs and tasks without changing runtime code.
2. In the apply phase, audit the named commit and update the central/provider instruction files.
3. Run the focused tests, lint, strict change validation, and the required proposal self-review record.
4. Sync the verified deltas and archive only after all implementation and documentation tasks are complete.

Rollback is a normal revert of the documentation-only commit; the reviewed v14.1 runtime commit remains intact.

## Testing Strategy

Use the existing Jest tests in `scripts/combat/_spec/shared_dialog_helpers.test.js` and `scripts/effects/pre-effects/_spec/resist-handler.spec.js` as regression evidence for the already-implemented behavior. Run the full unit suite and lint because the work updates repository instructions and specs. Validate `document-release-fixes-and-agent-workflow` with `openspec validate --strict`.

No E2E scenario is added: no UI or runtime behavior is introduced by this change. If the audit identifies a code mismatch, create or amend the affected unit/E2E task before implementing that correction and use the standard `ilaris-e2e-world-v14363-r1` lifecycle where applicable.
