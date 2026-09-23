## Context

Ilaris quick-reference journals use inline pastel backgrounds for informational,
warning, and error callouts. Foundry's dark theme changes the surrounding
application text to a light theme color, but inline `background-color` values
remain light. The result is low contrast in the rendered
`.journal-entry-page` content.

Foundry VTT provides the `body.theme-dark` state for the normal game view and
allows an ApplicationV2 root to carry a theme class for detached applications.
The installed v14 stylesheet exposes theme tokens such as
`--color-cool-4` and `--color-text-primary`, which are the appropriate values
for a system stylesheet to consume.

## Goals / Non-Goals

**Goals:**

- Make existing journal callouts readable in dark mode across all quick
  references.
- Keep the existing colored left border as the semantic info/warning/error
  cue.
- Leave light-mode rendering, journal content, and compendium data unchanged.
- Cover both body-level and application-root dark-theme classes.

**Non-Goals:**

- Do not rewrite inline HTML in the quick-reference sources or templates.
- Do not change Foundry core styles, journal document data, or journal behavior.
- Do not introduce a render hook, DOM mutation, JavaScript helper, or external
  dependency.
- Do not recolor unrelated system forms, dialogs, chat messages, or actor
  sheets.

## Decisions

### Use a dedicated journal stylesheet

Add `scripts/core/styles/journal.css` and register it in `system.json` after
the core stylesheet. A dedicated file keeps the cross-cutting journal rule
discoverable and avoids mixing it into unrelated sheet styles. Appending the
rule to `core.css` was considered, but would make ownership less clear.

### Scope to journal pages and dark-theme state

The selector will be limited to `.journal-entry .journal-entry-page` and
elements whose inline style contains `background-color`. It will be activated
for `body.theme-dark` and for a `.theme-dark` journal application root. This
covers normal and detached journal windows while avoiding changes to other
applications.

### Consume Foundry theme tokens

Dark-mode callouts will use `var(--color-cool-4)` for the surface and
`var(--color-text-primary)` for text. These tokens adapt to Foundry's current
dark palette and avoid inventing another color scheme. The inline border color
will not be overridden, preserving the existing blue/yellow/red semantic cue.

Because the source background is inline CSS, `background-color: ... !important`
is required for the stylesheet rule to win. The text color is also made
explicit so it remains readable if a future journal parent changes its
inheritance.

### Keep source HTML unchanged

Moving every callout from inline colors to semantic classes was considered.
That would require updating several `_source` documents and the HTML templates
that `npm run pack-all` injects. A scoped attribute selector solves the current
problem without a content migration; if future callouts use classes, the
stylesheet can add those selectors later.

## API Surface

- **Foundry classes:** None extended or invoked. The rule styles the rendered
  markup of the
  [JournalEntry](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntry.html)
  and text
  [JournalEntryPage](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntryPage.html)
  surfaces only.
- **Hooks:** None listened to or triggered.
- **`foundry.utils.*` helpers:** None. The community API guidance confirms
  that static stylesheet delivery is sufficient; no document or utility API is
  needed.

## Risks / Trade-offs

- **[Risk]** A future callout changes its inline background spelling →
  **Mitigation:** Keep the selector scoped and document the accepted pattern;
  add a semantic class in a later content migration if the palette expands.
- **[Risk]** `!important` could override a deliberate future callout style →
  **Mitigation:** Apply it only inside dark journal pages and only to the
  background/text properties required for contrast.
- **[Risk]** A detached window uses a different root class →
  **Mitigation:** Test both body-level and application-root `.theme-dark`
  selectors.
- **[Risk]** CSS ordering changes after a Foundry update → **Mitigation:**
  Register the stylesheet through the system manifest and verify computed
  styles in a running v14 world.

## Migration Plan

1. Add the stylesheet and manifest entry.
2. Reload the system/world so Foundry loads the stylesheet.
3. Verify representative quick-reference journals in light and dark modes,
   including a detached window if available.
4. Rollback is limited to removing the stylesheet and its manifest entry; no
   compendium rebuild or world migration is required.

## Open Questions

None. The current inline callout palette is stable enough for a scoped CSS
override, and a content-class migration can be considered separately if the
palette grows.

## Testing Strategy

No executable logic is introduced, so no unit test or Jest mock is required.
Run the existing test and lint commands for regression confidence, check CSS
formatting, and manually inspect representative journals. The manual matrix
must cover blue, yellow, and red callouts; light and dark themes; normal and,
where available, detached journal applications; and a non-journal system
application to confirm the selector does not leak.
