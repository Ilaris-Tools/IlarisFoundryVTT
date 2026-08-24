## Why

The generated breaking-changes dialog has a fixed window height, but long generated HTML can exceed that height without exposing a usable scrollbar. Release notes must remain readable and the acknowledgement action must remain reachable regardless of their length.

## What Changes

- Modify the changelog dialog layout contract so the DialogV2 form and content layers consume the bounded window height.
- Keep the generated changelog body as the scroll container, while the title, explanatory text, and `Verstanden` action remain visible.
- Preserve the automatic CSS scope: every changelog dialog instance receives the Ilaris-specific class from its DialogV2 configuration; generated `.hbs` content needs no hand-authored presentation wrapper.

This modifies existing behavior only. It adds no settings, data migration, or change to changelog extraction.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release`: Breaking-changes content must remain accessible through scrolling when its generated HTML exceeds the dialog’s available content height.

## Impact

- Affected implementation: `scripts/changelog/changelog-notification.js` and `scripts/changelog/styles/changelog-notification.css`.
- Foundry API: [`foundry.applications.api.DialogV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html) continues to render the dialog; [`ApplicationV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html) provides the application and CSS-class configuration surface.
- Hooks: no Hook event changes; the existing `ready` hook continues to decide when the dialog opens.
- Utilities: no `foundry.utils.*` utility is added or changed; generated HTML continues through the existing `TextEditor.implementation.enrichHTML` call.

## Testing Impact

- Unit tests: add focused coverage for the `DialogV2` configuration to ensure the automatic changelog content class remains attached.
- E2E: add a focused changelog-dialog regression case in `e2e/cases/` that supplies content taller than the fixed dialog, verifies the Ilaris class is present automatically, verifies the generated body is scrollable, and verifies the acknowledgement button remains visible.
- E2E environment: `ilaris-e2e-world-v14363-r1`, `e2e-gm`; no player, target, or shared fixture is required.

## Proposal Self-Review

**Decision: PASS**

- **Scope:** The change is limited to the release-notification dialog layout;
  changelog extraction, settings, generated content, and release data remain
  unchanged.
- **Affected requirements:** The `release` capability now covers long generated
  content accessibility in addition to Markdown rendering.
- **API evidence:** Foundry v14 documents `DialogV2` as an ApplicationV2 and
  supports application `classes` plus `window.contentClasses`; the local v14
  implementation confirms that DialogV2 content is wrapped in a form and
  `.dialog-content`.
- **Testing impact:** The proposal includes an E2E regression flow with long
  generated content and focused coverage for the dialog configuration seam.
- **Migration/rollback:** No migration is required; reverting the dialog
  configuration and stylesheet restores the previous behavior without touching
  generated templates.
- **UI ordering:** The explanatory text stays above the scrollable generated
  body, and the acknowledgement action remains below it at all times.
