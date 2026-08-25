## 1. API and layout verification

- [x] 1.1 Verify the `DialogV2` and `ApplicationV2` class/content-class configuration against the Foundry VTT v14 API documentation before modifying the dialog.
- [x] 1.2 Check foundryvtt.wiki for DialogV2 and `foundry.utils.*` guidance; record that the CSS-only layout needs no new helper.

## 2. Changelog dialog layout

- [x] 2.1 Configure the changelog `DialogV2` content class so every rendered notification automatically has its dedicated layout hook.
- [x] 2.2 Update the scoped stylesheet to create a bounded flex chain from `.window-content` through `dialog-form` and `dialog-content`, with only the generated changelog body scrolling and the footer remaining visible.

## 3. Unit Tests

- [x] 3.1 Add focused unit coverage in `scripts/changelog/_spec/` for the dialog configuration if the implementation exposes a testable configuration/helper seam; otherwise document why the visual layout is covered exclusively by E2E.

## 4. E2E Tests

- [x] 4.1 Add `e2e/cases/e2e-033-changelog-notification-scroll/` with generated content exceeding the fixed dialog height; assert the automatic content class, vertical body overflow, and a visible `Verstanden` action in `ilaris-e2e-world-v14363-r1` as `e2e-gm`.
- [x] 4.2 Run the focused changelog E2E case after restarting Foundry with the current system code, preserving screenshots/video on failure.

## 5. Validation and handoff

- [x] 5.1 Run `npm install`, relevant Jest coverage, `npm test`, and `npm run lint`.
- [x] 5.2 Run `openspec validate fix-changelog-dialog-scrolling --strict`, review the final CSS/DOM scope and generated-template boundary, and record the manual dialog check.
- [x] 5.3 Commit only this change's scoped files after required validation passes.

Validation record: The live `e2e-gm` browser check rendered an 80-entry
generated changelog in `ilaris-e2e-world-v14363-r1`; the body had
`overflow-y: auto`, exceeded its client height, and retained a visible,
working `Verstanden` action.
