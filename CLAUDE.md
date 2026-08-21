# Claude Instructions — Ilaris FoundryVTT

Before proposing, reviewing, or changing significant work, read and follow [AGENTS.md](AGENTS.md) and the relevant section of [.agents/OPENSPEC_OPERATIONS.md](.agents/OPENSPEC_OPERATIONS.md). They are the canonical OpenSpec policy and provider-neutral operation instructions.

## Claude Web

Claude Web does not automatically load repository instructions. Start the chat with:

> Read and follow `CLAUDE.md` and `AGENTS.md` in this repository before reviewing or changing it.

Attach or provide those files when the chat cannot access the repository.

## Required workflow

- Use OpenSpec for every significant change, including reviewed commits created outside the workflow. Such work needs a retrospective change that names and audits the commit before release acceptance.
- Follow Explore, Propose, Apply, and Archive. Do not skip directly from a request to implementation.
- Before applying a proposal or recommending it for acceptance, add its `## Proposal Self-Review` record in `proposal.md`. Use `PASS`, `PASS_WITH_NOTES`, or `BLOCK`, cover every category required by `AGENTS.md`, and do not apply a `BLOCK` proposal.
- Use `.claude/commands/opsx-*.prompt.md` for Claude-specific command mechanics. Those prompts supplement, but do not replace, `AGENTS.md`.

When instructions conflict, preserve the shared workflow policy in `AGENTS.md` unless that file documents an explicit exception.

## Git workflow

Base all work on `develop` and target pull requests at `develop`; `main` is the production branch and only receives release merges. See the "Git Workflow" section in [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

For a disposable credentialed Foundry VM in Claude Web, use
`.claude/hooks/foundry-env.mjs` or run `npm run foundry:cloud -- <E2E paths>`.
The adapter runs only when injected `FOUNDRY_*` credentials are configured and
never reads a secrets file; see
[`utils/foundry-env/README.md`](utils/foundry-env/README.md). Normal local E2E
work continues to use an already-running external server.
