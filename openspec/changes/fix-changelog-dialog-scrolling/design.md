## Context

`DialogV2` renders supplied content inside a framed application window as
`window-content > form.dialog-form > div.dialog-content`. The changelog dialog
fixes the window at 600 × 520 pixels and currently gives only the generated
inner body a flex/overflow rule. Its intermediate form and dialog-content
elements do not claim the available height, so a long generated changelog can
be clipped instead of making that body scrollable.

The generated `.hbs` file is data output from `utils/generate-breaking-changes.js`.
It must remain presentation-agnostic: the dialog, not every generated file,
owns the CSS scope and layout.

## Goals / Non-Goals

**Goals:**

- Make an overlong generated changelog readable through a vertical scrollbar.
- Keep the dialog explanation and acknowledgement action visible.
- Apply the required CSS hook from the DialogV2 configuration for every dialog
  instance, without modifying generated changelog templates.

**Non-Goals:**

- Changing changelog Markdown extraction, sanitisation, acknowledgement
  semantics, dialog dimensions, or release data.
- Making the dialog resizable or replacing DialogV2 with a custom application.

## Decisions

### Use DialogV2 `window.contentClasses` for the layout scope

Add an Ilaris-specific class through the dialog's `window.contentClasses`
configuration. Foundry applies this class directly to `.window-content`, which
is the element that owns the bounded application content area. The existing
application `classes` entry remains the hook for frame styling such as the
warning icon.

This is preferable to adding a class to generated `.hbs` output: the generator
has no knowledge of the enclosing dialog, while every dialog instance is
configured in one reliable place.

### Establish a constrained flex chain before the scroll body

Style the content class, its immediate `.dialog-form`, and
`.dialog-content` as a vertical flex chain with `flex: 1` and `min-height: 0`.
The existing `.ilaris-changelog-body` remains the sole `overflow-y: auto`
element. The footer does not shrink, so `Verstanden` stays reachable.

This follows the core DialogV2 structure and Foundry's ApplicationV2 window
layout, rather than adding JavaScript sizing or scroll handlers.

## API Surface

- [`foundry.applications.api.DialogV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html): existing dialog constructor; its `content` is rendered inside the DialogV2 form.
- [`foundry.applications.api.ApplicationV2`](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html): existing `ApplicationConfiguration.classes` and `window.contentClasses` configuration add the automatic CSS hooks.
- Hook events: none are added or changed. The existing `Hooks.once('ready', callback)` invocation is outside the layout change.
- `foundry.utils.*`: none. The community DialogV2 guidance confirms that `classes` is the appropriate dialog styling hook; CSS layout requires no Foundry helper.

## Risks / Trade-offs

- [A core DialogV2 DOM change] → Target documented DialogV2 class names and verify the rendered hierarchy against Foundry v14 during the E2E check.
- [A generic selector could affect other dialogs] → Scope every new layout selector under the new Ilaris content class.
- [CSS-only regression remains visually subtle] → Use generated content that exceeds the fixed height and assert both overflow and visible footer in E2E.

## Migration Plan

No data migration is required. Deploying the system stylesheet and dialog
configuration applies the layout on the next dialog render. Rollback consists
of reverting those two files; existing generated `.hbs` files are unaffected.

## Testing Strategy

- Add focused unit coverage for the dialog configuration seam so the automatic
  `window.contentClasses` hook remains part of every rendered notification.
- Add a focused E2E case that marks the release notification unseen, injects a
  long generated changelog response, then verifies the automatically applied
  content class, a scrollable body, and a visible acknowledgement button.
- Run the case in `ilaris-e2e-world-v14363-r1` as `e2e-gm`; no player or actor
  fixtures are needed.

## Open Questions

None.
