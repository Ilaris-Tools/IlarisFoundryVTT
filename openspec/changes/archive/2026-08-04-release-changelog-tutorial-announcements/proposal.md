## Why

Issue #390 asks for the existing tutorials to be promoted in chat when a major release changes the way the system is used. The current release notice is driven by free-form Markdown parsing, so release headers, migration warnings, and generated templates can drift apart; users may miss the specific instruction to re-import characters when that is genuinely required.

## What Changes

- Add a release/changelog contract that always represents the Foundry-major release header and the current system release beneath it.
- Add a required, explicit migration/import indicator for breaking changes, with a prominent German disclaimer when character re-import is required. **BREAKING**
- Make the changelog build step validate the release structure and reliably generate the version-specific breaking-change template.
- Extend the in-app major-release communication with a German announcement posted to world chat once by a GM, linking to the already-maintained tutorials and the full changelog.
- Track the announced major release separately from the per-user breaking-change acknowledgement so chat promotion is not duplicated across world startups.
- Add release documentation and automated coverage for changelog generation, warning classification, and major-release chat announcement behavior.

The change is additive to release tooling and communication, and modifies the existing breaking-change notification contract. It removes reliance on an unvalidated, free-form breaking-change section, but does not remove existing changelog content or migration behavior.

## Capabilities

### New Capabilities

- `major-release-announcements`: Publish a once-per-major-release announcement linking to existing tutorials in world chat and track its acknowledgement state.
- `changelog-release-contract`: Validate and generate structured major-release headers, migration disclaimers, and breaking-change templates from the changelog.

### Modified Capabilities

- `release`: Extend breaking-change data and notification requirements with explicit character-import guidance and major-release tutorial promotion.
- `settings`: Add persistent state for the last major release announced in chat.

## Impact

- Release source and tooling: `CHANGELOG.md`, `utils/generate-breaking-changes.js`, `utils/README.md`, and the release/build workflows.
- Runtime release UI: `scripts/changelog/changelog-notification.js`, its Handlebars/CSS assets, and settings registration in `scripts/settings/configure-game-settings.js`.
- Runtime chat: Foundry `ChatMessage` documents and the `ready` Hook; see [ChatMessage API](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html) and [Hooks API](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html).
- Runtime dialog: Foundry `DialogV2`; see [DialogV2 API](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html).
- Foundry utilities should be reused where applicable, especially `foundry.utils.isNewerVersion` and `foundry.utils.deepClone`; see [foundry.utils API](https://foundryvtt.com/api/v14/modules/foundry.utils.html).
- Tests: unit tests for the parser/generator and release hooks, plus E2E coverage for a major-release startup, the GM chat announcement, and the re-import warning.

## Testing Impact

- New unit scenarios: valid and invalid major-release headings; explicit import-required versus import-not-required warnings; generated template content; idempotent announcement-version checks; non-GM and already-announced startup paths.
- Existing unit coverage to update: release/changelog specs and settings mocks, if present; otherwise add focused `_spec_` modules beside the changelog and settings implementations.
- New E2E scenarios: a fresh major-release world shows the tutorial chat card once; subsequent startups do not duplicate it; a release marked as requiring import shows the warning dialog and tutorial link.
- Existing E2E cases affected: release-startup and settings-baseline fixtures may need the new setting default. Use a single-player/GM baseline world with system version set to the release under test; no additional player is required unless verifying chat visibility to players. Shared startup helpers should be promoted to `e2e/shared/` if they are reused.
