# Canonical OpenSpec Operation Instructions

This is the single canonical body for the repository's OpenSpec operations. Provider adapters in `.claude/commands/`, `.codex/skills/`, `.github/prompts/`, and `.github/skills/` MUST read the named section in full. The pre-consolidation Codex skills were used as the source for this document; where earlier provider copies differed, the Codex behavior wins.

Read [AGENTS.md](../AGENTS.md) first. It defines the repository-wide workflow policy, including the mandatory `## Proposal Self-Review` gate.

## Shared operation rules

- The input after an operation command is a change name or a natural-language request, as applicable to that operation.
- If the work belongs to a named OpenSpec store, first run `openspec store list --json`; then retain `--store <id>` for every command that accepts it. Otherwise use the nearest repository-local `openspec/` root.
- Use `openspec status --change "<name>" --json` to obtain the resolved planning paths and dependencies. Do not assume paths.
- Read every dependency or context file returned by `openspec instructions ... --json` before writing or applying an artifact.
- Follow the schema instructions returned by the CLI; they are authoritative for artifact shape and task progress.
- Preserve German domain language in UI/data and English structural code. Verify Foundry v14 APIs and helpers when implementation touches them.

## Explore (`openspec-explore`)

Explore is read-only thinking mode. Investigate code, documents, and existing changes; clarify intent, alternatives, risks, UI ordering where relevant, and validation. Do not implement code, edit files, create a branch, or change task checkboxes.

If the user asks to capture a decision, recommend or create an OpenSpec proposal only when they explicitly request it. For an existing change, inspect its artifacts and report assumptions, findings, and unresolved questions. End with a concise summary and the natural next operation (`propose` or `apply`).

## Propose (`openspec-propose`)

1. Derive or confirm a kebab-case change name. If the request is materially unclear, ask one open question before creating a change.
2. Run `openspec new change "<name>"`, then `openspec status --change "<name>" --json`.
3. Create artifacts in dependency order. Before each artifact, run `openspec instructions <artifact-id> --change "<name>" --json`, read its completed dependencies, and use its template and rules.
4. Continue until every artifact in `applyRequires` is complete. Re-run status after each artifact.
5. Add `## Proposal Self-Review` to `proposal.md` before reporting the proposal ready. Record `PASS`, `PASS_WITH_NOTES`, or `BLOCK`; cover scope, requirements, API evidence, testing, migration/rollback, and UI ordering. A `BLOCK` proposal is not ready to apply.
6. Run `openspec validate <name> --strict` and resolve change-local errors.

Report the change location, artifacts, self-review decision, validation result, and whether it is ready for `apply`.

## Apply (`openspec-apply-change`)

1. Use the named change, infer it from the conversation when unambiguous, or list active changes and ask the user to select. Announce the selected change and how to override it.
2. Run `openspec status --change "<name>" --json` and `openspec instructions apply --change "<name>" --json`. Read every listed context file.
3. If apply is blocked, report the missing artifact. If it is already complete, report that it is ready for archive unless the user asked to amend it.
4. Implement pending tasks in dependency order. Keep changes minimal, mark each completed task immediately, and use test-first ordering for new behavior when applicable.
5. Pause only for a genuine ambiguity, design issue, error, or missing authority. Otherwise continue through the tasks.
6. Run the validation and tests required by the change and `AGENTS.md`. Use the Foundry lifecycle helper and E2E environment only when runtime validation is required.
7. Perform the final review, record the self-review result if the proposal changed, mark final tasks, and commit only the agent's scoped changes after required checks pass.

Report completed tasks, validation, remaining work, and whether the change is ready to archive.

## Sync (`openspec-sync-specs`)

1. Select a completed change using the same selection rules as Apply.
2. Read the change delta specs, their matching main specs, the proposal, design, and tasks.
3. Merge each delta requirement into its main specification according to its ADDED, MODIFIED, REMOVED, or RENAMED operation. Preserve full modified requirement blocks and resolve conflicts deliberately.
4. Run strict validation for the change and any applicable main-spec validation. Do not archive unless the user also requests archive.
5. Report the synchronized capabilities and any remaining change tasks.

## Archive (`openspec-archive-change`)

1. Select a change using the same selection rules as Apply.
2. Confirm all tasks are complete, required tests and strict validation have passed, and the implementation has been committed. If delta specs are not synchronized, sync them before archiving unless the workflow explicitly permits otherwise.
3. Run `openspec archive <name>` using the CLI's resolved store context if applicable. Do not manually move change directories.
4. Verify the archive location and report the archive result, synced capabilities, and any follow-up work.
