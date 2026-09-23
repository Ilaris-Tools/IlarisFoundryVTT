## Context

`comp_packs/kurzuebersichten/_source/` contains the authoritative JSON for
the system's short, in-game reference journals. Existing entries use a
`JournalEntry` with a text page whose `text.content` is structured HTML.

The recently introduced Pre-Effect and Ilaris-modifier features have user
documentation in `docs/einstellungen.md`, but no concise in-game reference.
The Item-Konfigurationen entry predates conditional ordinary modifiers on
Vorteile and correctly notes that examples such as _Eindrucksvoll I_ cannot
yet be automated.

## Goals / Non-Goals

**Goals:**

- Add a German, structured-HTML journal to explain the authoring and
  resolution of spell/liturgy Pre-Effects and Ilaris modifiers.
- Make the difference between native Foundry Änderungen and semantic
  Ilaris-Modifikatoren concrete and discoverable in-game.
- Preserve the current, explicit limitation for conditional Vorteil effects
  and identify their eventual implementation as follow-up work.

**Non-Goals:**

- Do not add `ilarisModifiers` to Vorteile or alter their data model, sheet,
  resolver source classification, or lifecycle.
- Do not modify spell/liturgy Pre-Effect data, ActiveEffect behavior, settings,
  roll dialogs, or damage resolution.
- Do not claim automation for next-roll-only effects, moving/repeating zones,
  target-category restrictions, or other deferred mechanics.

## Decisions

### One focused JournalEntry, written in German

Create one `JournalEntry` in the existing quick-reference compendium with one
text `JournalEntryPage`. Its source uses the established JSON shape and
structured HTML (`h2`/`h3`, paragraphs, lists, `code`, and concise callout
panels) rather than Markdown or a new renderer.

This keeps the guide available where game masters configure content and avoids
introducing a new documentation format. Splitting it into several entries
would make the central distinction between Pre-Effects, native changes, and
semantic modifiers harder to follow.

### Teach the two authoring mechanisms by outcome

The guide will first separate:

- **Änderungen**: unconditional native `system.*` paths and instant
  damage/healing; and
- **Ilaris-Modifikatoren**: context-sensitive GS, AT, VT, TP/Waffenschaden,
  Probe, Fertigkeit, Talent, situation, and main-attribute roll modifiers.

It will then explain phase, target, value, selectors, stacking, resistance,
and Mächtige Magie in the same wording used by the current sheet. This avoids
presenting a raw actor-path workaround for modifiers that must be resolved at
a prepare or roll boundary.

### State the stacking rule and limitation without over-promising

The journal will describe both world-setting modes. In Ilaris mode, each
matching supernatural context uses the strongest positive and strongest
negative component independently; `-5` therefore suppresses `-3`. In Foundry
mode, all Ilaris modifiers add. Applied components remain visible and
suppression details are available through the crossed-eye control.

The existing Item-Konfigurationen entry already correctly states that
context-dependent Vorteil effects are not supported. It is therefore retained
unchanged. The new journal makes the planned follow-up explicit: ordinary,
additive Ilaris modifiers on Vorteile are not currently available. This avoids
rewriting unrelated legacy guidance solely to add a link.

### Follow the existing compendium build flow

Only `_source/` JSON is edited. `npm run pack-all` regenerates the derived
LevelDB pack; no LevelDB file is manually changed. JSON parsing and a manual
in-Foundry render check provide enough confidence for this content-only
change.

## API Surface

- **Foundry documents used as source data:**
  [JournalEntry](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntry.html)
  and embedded
  [JournalEntryPage](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntryPage.html).
  They are not extended and no document methods are called by system code.
- **Hooks:** None listened to or triggered.
- **`foundry.utils.*` helpers:** None. The community wiki confirms that journal
  pages are embedded in journal entries and compendiums are the normal storage
  for prebuilt documents; no runtime helper is required for a static source
  entry.

## Risks / Trade-offs

- **Documentation diverges from UI behavior** → Use exact existing labels and
  examples derived from the templates and modifier constants; verify against a
  running Foundry world.
- **Readers infer unsupported Vorteil automation** → State the limitation and
  planned follow-up in a visible warning panel in the new guide; retain the
  matching limitation in the existing Item-Konfigurationen entry.
- **Structured HTML renders poorly** → Follow the existing quick-reference
  markup conventions and manually inspect the packed journal.
- **Generated LevelDB is stale** → Rebuild all packs using `npm run pack-all`.

## Migration Plan

1. Add the new journal source and confirm the existing source entry remains
   accurate.
2. Run `npm run pack-all` to regenerate the pack.
3. Reload the compendium in Foundry and verify both journals.
4. Rollback is recoverable by reverting the two source JSON documents and
   rebuilding the pack; no world migration is involved.

## Open Questions

None. The guide intentionally names the conditional-Vorteil feature as planned
follow-up work instead of treating it as available behavior.

## Testing Strategy

No executable code changes, unit tests, or test doubles are needed. Validate
the new JSON using the normal source tooling and inspect the generated
JournalEntry manually in Foundry. The manual E2E check covers rendering,
German labels, the Axxeleratus and Klingenwaffen examples, Ilaris/Foundry
stacking wording, and the visible conditional-Vorteil limitation. Existing
Pre-Effect and modifier resolver unit tests are unchanged behavioral
regression coverage.
