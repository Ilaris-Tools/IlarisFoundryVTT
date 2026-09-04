## 1. Theme and selector verification

- [x] 1.1 Inspect the installed Foundry v14 journal markup and confirm the
      `.journal-entry`, `.journal-entry-page`, `body.theme-dark`, and application
      `.theme-dark` selectors used by the design.
- [x] 1.2 Verify the relevant Foundry theme behavior against the Foundry API
      docs (v14) and installed v14 stylesheet; confirm no Hook or document API is
      required.
- [x] 1.3 Check foundryvtt.wiki for relevant stylesheet and application-theme
      guidance; confirm no `foundry.utils.*` helper or runtime DOM mutation is
      needed.

## 2. CSS implementation

- [x] 2.1 Add `scripts/core/styles/journal.css` with a dark-theme rule scoped
      to journal page callouts containing inline `background-color` styles.
- [x] 2.2 Use Foundry theme tokens for the dark surface and primary text, and
      retain the inline left-border colors for info, warning, and error meaning.
- [x] 2.3 Cover both body-level dark mode and a detached journal application's
      `.theme-dark` root without changing light mode or non-journal applications.
- [x] 2.4 Register the stylesheet in `system.json` after the core stylesheet.

## 3. Unit Tests

- [x] 3.1 Confirm no unit-test file changes are required because this is a
      static CSS-only behavior change, then run `npm test` for regression coverage.
      (`npm test -- --runInBand`: 38 suites and 557 tests passed.)

## 4. Quality checks

- [x] 4.1 Run `npm install` before build or test commands.
- [x] 4.2 Run the repository lint command and check the new CSS formatting with
      the configured formatter. (`npm run lint` passed; Prettier reports the CSS
      is formatted.)
- [x] 4.3 Run `git diff --check` and verify only the scoped stylesheet,
      manifest, and OpenSpec artifacts changed. (`git diff --check` passed.)

## 5. E2E Tests

- [ ] 5.1 In a running Foundry world, open representative quick references
      containing blue, yellow, and red callouts in light mode and verify their
      existing appearance is unchanged.
- [ ] 5.2 Switch to dark mode and verify all three callout types have readable
      text and dark surfaces while their colored left borders remain visible.
- [ ] 5.3 If detached/pop-out journals are available, repeat the dark-mode
      check and verify the application-root theme selector works.
- [ ] 5.4 Open a non-journal application containing styled content and verify
      the journal rule does not affect it.
