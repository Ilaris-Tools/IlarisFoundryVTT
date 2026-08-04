## 1. Release contract and generator

- [x] 1.1 Define the canonical major/release heading, import marker, and existing-tutorial reference format in `CHANGELOG.md` and update the current v14 entry.
- [x] 1.2 Refactor `utils/generate-breaking-changes.js` into a validated parser that returns release metadata, distinguishes import-required status, resolves existing tutorial links, and reports actionable errors.
- [x] 1.3 Generate the current breaking-change Handlebars artifact and update `utils/README.md` and the build workflow documentation with the required format.
- [x] 1.4 Verify the generator’s runtime assumptions against the Foundry VTT v14 API documentation where generated content is consumed.
- [x] 1.5 Check the community wiki for relevant `foundry.utils.*` helpers before adding version comparison or deep-cloning utilities.

## 2. Settings and runtime announcement

- [x] 2.1 Add the `lastAnnouncedMajorRelease` setting constant and non-configurable registration with an empty default.
- [x] 2.2 Implement a release announcement helper that checks GM authority, compares major-release state, creates the tutorial `ChatMessage`, and persists state only after success.
- [x] 2.3 Integrate the helper into the existing changelog `ready` flow without coupling it to per-user breaking-change acknowledgement.
- [x] 2.4 Add German announcement content and styling, including tutorial links, changelog link, and conditional re-import guidance.
- [x] 2.5 Verify `ChatMessage.create`, `Hooks.once("ready")`, `DialogV2`, settings APIs, and `TextEditor.implementation.enrichHTML` against the Foundry VTT v14 API documentation.
- [x] 2.6 Check the community wiki for the recommended enriched-chat and idempotent startup patterns.

## 3. Release documentation and checklist integration

- [x] 3.1 Update the release documentation and major-release PR checklist to require the canonical headings, explicit import marker, references to existing tutorials, and generated-template check.
- [x] 3.2 Document the distinction between a breaking change and a change that requires character re-import.

## 4. Unit Tests

- [x] 4.1 Add parser/generator unit coverage beside `utils/generate-breaking-changes.js` for valid structure, missing headings, marker validation, existing-tutorial reference validation, and stale-template cleanup.
- [x] 4.2 Add changelog runtime unit coverage under `scripts/changelog/_spec_/` for dialog gating, import disclaimer rendering, GM-only announcement, successful acknowledgement, failure retry, and duplicate prevention.
- [x] 4.3 Add settings unit coverage for registration defaults, centralized constants, and independent announcement/dialog state.

## 5. E2E Tests

- [x] 5.1 Add an E2E scenario for a fresh major-release world where a GM sees the tutorial announcement in chat and the import-required warning when declared.
- [x] 5.2 Add an E2E regression scenario proving a second startup does not duplicate the major-release chat message and that existing users can acknowledge the dialog.
- [x] 5.3 Update the baseline world/settings fixtures for the new setting and document the single-GM environment; promote reusable startup/chat helpers to `e2e/shared/` if needed.

## 6. Validation

- [x] 6.1 Run `npm install`.
- [x] 6.2 Run `npm test`.
- [x] 6.3 Run `npm run lint`.
- [x] 6.4 Run `npm run generate-breaking-changes` and verify the generated template is packaged.
