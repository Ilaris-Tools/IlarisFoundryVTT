## Why

The system now supports Pre-Effects and contextual Ilaris modifiers, but their
authoring model, resolution, and limitations are scattered across item sheets,
settings, and developer documentation. Game masters need an in-game,
German-language quick reference that explains which part of a spell or liturgy
can be automated and how to configure it safely.

The existing Item-Konfigurationen quick reference correctly states that
conditional Vorteil effects such as _Eindrucksvoll I_ are not yet automated.
That limitation must remain explicit and be recorded as follow-up work; this
documentation change must not imply that Vorteile already support Ilaris
modifiers.

## What Changes

- Add one structured-HTML `JournalEntry` source document to the
  `kurzuebersichten` compendium: **Übersicht: Zauber, Liturgien & Pre-Effects**.
  It explains the cast-to-effect flow, authoring fields, Ilaris modifiers,
  stacking modes, visibility of applied/suppressed components, and supported
  versus manual mechanics.
- Use concrete, current examples such as Axxeleratus and general versus
  Klingenwaffen-specific AT modifiers, including the independent strongest
  positive and strongest negative supernatural components.
- Preserve the existing **Übersicht: Item-Konfigurationen** statement that
  conditional Vorteil effects are not yet automated. The new guide records the
  limitation and its planned follow-up explicitly, without rewriting accurate
  existing guidance.
- Record an explicitly deferred follow-up: add ordinary, additive Ilaris
  modifiers to Vorteile so conditional Vorteil bonuses can eventually be
  authored and resolved through the same lifecycle. This change neither
  implements nor promises that capability.

This is purely additive user documentation plus a clarification of existing
documentation. It does not modify runtime effect resolution, ActiveEffect
behavior, or spell/liturgy data.

## Capabilities

### New Capabilities

- `spell-pre-effect-quick-reference`: An in-game quick-reference journal that
  documents spell/liturgy Pre-Effect authoring, semantic Ilaris modifiers,
  stacking, and present automation boundaries.

### Modified Capabilities

None.

## Impact

- Affected compendium source: `comp_packs/kurzuebersichten/_source/` only;
  the pack will be rebuilt with `npm run pack-all`.
- Foundry document data: one new
  [JournalEntry](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntry.html)
  containing one text
  [JournalEntryPage](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntryPage.html).
  No JavaScript calls, hooks, or `foundry.utils.*` helpers are introduced or
  changed.
- No external dependencies or settings changes.

## Testing Impact

- **New unit tests:** None; this change introduces no executable behavior.
- **Existing unit tests:** None require changes. Existing Pre-Effect and
  modifier resolver tests remain the behavioral coverage for the documented
  system.
- **New E2E case:** Manual Foundry verification that the packed journal opens,
  renders its HTML correctly, and states the Vorteil limitation without
  claiming unsupported automation. Environment: one GM in the existing test
  world; no player and no shared E2E helper required.
- **Existing E2E cases:** No behavioral case changes; run the relevant
  pre-effect regression cases if the full suite is available.
