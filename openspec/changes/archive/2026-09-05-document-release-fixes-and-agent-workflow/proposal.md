## Why

Commit `36492f283a9ec71a760a9b6b8314017875232f42` contains reviewed, release-blocking fixes for v14.1, but it was created outside the repository's OpenSpec workflow. The implemented behavior must be recorded in the relevant specifications before release, and contributors using Claude Web need a clear, provider-neutral way to discover and follow the same workflow.

## What Changes

- Record the already-reviewed v14.1 implementation as a retrospective OpenSpec change. This change documents and verifies the commit; it does not intentionally alter the released runtime behavior.
- Correct the combat specification for LEP healing: `system.gesundheit.wunden` is accumulated damage in LEP mode, so healing reduces it and never uses a nonexistent maximum field.
- Specify that an absent damage type and the legacy `NORMAL` sentinel use default behavior without a warning, and that maneuver damage-type changes retain the configured registry key rather than the human-readable label.
- Specify the pre-effect editor's persisted select values, safe resistance target resolution through an Actor UUID (including synthetic actors), missing-target handling, and escaped resistance-prompt content.
- Record the v14.1 release metadata and changelog audit as a retrospective implementation record.
- Introduce one provider-neutral agent-workflow policy in `AGENTS.md` and one canonical OpenSpec operation-instruction file; reduce every provider skill/prompt to a thin adapter that reads the matching shared operation section. The Claude adapter SHALL require OpenSpec for significant changes and a documented self-review of each proposal before it is applied or accepted.

This is primarily retrospective documentation and workflow governance. It modifies documented behavior, but introduces no planned breaking user-facing change beyond the reviewed commit.

## Capabilities

### New Capabilities

- `agent-workflow-governance`: A provider-neutral OpenSpec policy, provider adapters, and a mandatory proposal self-review record for human- or AI-authored changes.

### Modified Capabilities

- `combat`: Correct LEP healing semantics and document the Foundry v14 message-mode setting used by the Akrobatik defense flow.
- `damage-type-behavior`: Define the safe default behavior for the absent and legacy `NORMAL` damage-type sentinel.
- `configurable-damage-types`: Require consumers, including maneuvers, to carry the registry value key through to behavior lookup.
- `supernatural-pre-effects`: Preserve configured pre-effect form selections and resolve resistance targets by UUID, including unlinked-token synthetic actors.

## Impact

### Retrospective implementation scope

The audit covers `CHANGELOG.md`, `package.json`, `package-lock.json`, combat helpers and API, the pre-effect processor and resistance handler, the pre-effect Handlebars template, and their co-located Jest tests. The commit already corrected the main `pre-effect-unit-tests` LEP scenario, so this change audits it without creating a duplicate no-op delta. It also records the removal of debug-only output and an unused import. No compendium source is affected.

The reviewed implementation uses [`Actor`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) UUIDs, [`Game#settings`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings) / [`ClientSettings#get`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get), [`foundry.utils.fromUuid`](https://foundryvtt.com/api/v14/modules/foundry.utils.html#fromUuid), and ChatMessage creation. It continues to listen to the system's existing `Ilaris.postSkillRoll` hook; this change does not add or change a Foundry hook.

### Documentation and instruction scope

`AGENTS.md` becomes the canonical repository policy for the OpenSpec workflow. Provider-specific files may add provider mechanics or path-scoped rules, but SHALL link to that policy instead of duplicating it. A root `CLAUDE.md` will make the policy discoverable to Claude users; this aids Claude Web users when they include the repository instructions in their review prompt, but cannot technically force a hosted chat to read repository files.

## Testing Impact

The runtime code and regression tests were included in the reviewed commit. This retrospective change adds no new runtime logic, so it needs no new E2E scenario or Foundry-world run unless the audit finds a mismatch that requires a code correction.

- Audit the existing unit coverage in `scripts/combat/_spec/shared_dialog_helpers.test.js` and `scripts/effects/pre-effects/_spec/resist-handler.spec.js`, including LEP healing, `NORMAL`, registry keys, UUID target resolution, and missing-target warnings.
- Run the existing Jest suite and lint as release-documentation verification. No player setup, world state, or shared Playwright helper is required for the documentation-only work.
- Validate the OpenSpec delta specs strictly and verify that all provider adapters resolve to the central workflow document.

## Proposal Self-Review

**Decision: PASS**

- **Scope and requirements:** The proposal maps each reviewed runtime fix to an existing capability, except the already-corrected `pre-effect-unit-tests` main spec, which is audited rather than duplicated. It introduces one narrowly scoped governance capability.
- **API evidence:** The existing commit's `Actor.uuid`, `foundry.utils.fromUuid`, `Game#settings`, `ClientSettings#get`, and ChatMessage usage were checked against the Foundry v14 API. No new Foundry API or hook is proposed.
- **Testing impact:** The focused combat and resistance-handler suites passed (87 tests), the full Jest suite passed (37 suites / 550 tests), and lint passed. No new runtime behavior means no E2E test is required.
- **Migration and rollback:** This is documentation and instruction work; it does not migrate data, touch compendiums, or require packing. Its documentation changes can be reverted independently of the reviewed release fix.
- **UI ordering:** Not applicable; no UI is changed by this proposal.

**Application result:** The apply audit found no mismatch between the named commit and its delta requirements. The complete refined Codex operation wording was extracted into the shared operation source; every provider adapter now contains only metadata and a link to its corresponding central section. No compendium source changed, so `npm run pack-all` and a Foundry lifecycle/E2E run are not required.
