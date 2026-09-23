## Why

The quick-reference JournalEntries use fixed light pastel backgrounds in
inline HTML callout styles. In Foundry's dark theme, journal text inherits a
light theme color while those backgrounds remain pale, producing very low
contrast and making several guides difficult to read.

## What Changes

- Add a system stylesheet scoped to Foundry journal pages in dark mode.
- Replace the fixed callout background with Foundry's dark theme surface token
  and explicitly use the dark theme text token for readable contrast.
- Preserve each callout's existing colored left border so informational,
  warning, and error panels remain distinguishable.
- Register the stylesheet in `system.json` so the behavior applies to all
  quick-reference journals, including future entries, without rewriting their
  HTML or `_source/` data.
- Verify the behavior in light mode, dark mode, and detached/pop-out journal
  windows where the theme class is applied to the application root.

This modifies presentation only. It does not change journal content, Foundry
document data, game rules, or the existing light-theme appearance.

## Capabilities

### New Capabilities

- `dark-mode-journal-readability`: Theme-aware contrast for Ilaris journal
  callouts in Foundry's dark UI.

### Modified Capabilities

None.

## Impact

- Affected files: a new CSS file under `scripts/core/styles/` and the
  stylesheet list in `system.json`.
- The stylesheet targets Foundry's rendered journal markup only; it does not
  extend or call any Foundry API class, hook, or `foundry.utils.*` helper.
- No compendium `_source/` data, LevelDB pack, migration, setting, or external
  dependency changes are required.
- The CSS uses Foundry-provided theme variables and the `theme-dark` state
  exposed by the application UI. The relevant rendered surface is the
  [JournalEntry](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntry.html)
  and its text
  [JournalEntryPage](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntryPage.html),
  but neither document class is modified.

## Testing Impact

- **New unit tests:** None; the change contains no executable logic.
- **Existing unit tests:** No updates expected. Run the existing suite to
  ensure the manifest and stylesheet addition introduce no regressions.
- **New E2E/manual cases:** Open representative quick references containing
  blue, yellow, and red callouts in both light and dark themes; verify readable
  text, preserved border semantics, and no change to normal light-theme
  styling. Repeat once in a detached/pop-out journal window if available.
- **Existing E2E cases:** No behavior scenarios change; visual smoke testing
  covers the affected user flow.
- **Environment:** one GM in the existing `schwarzpulver` world is sufficient;
  no player or shared test fixture is required.
