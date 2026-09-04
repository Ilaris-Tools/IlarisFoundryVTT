## 1. Source and API verification

- [x] 1.1 Inspect the current quick-reference JournalEntry source shape and
      reserve unique document/page IDs for the new entry.
- [x] 1.2 Verify the `JournalEntry` and `JournalEntryPage` source shape against
      the Foundry API docs (v14).
- [x] 1.3 Check foundryvtt.wiki for relevant compendium and embedded-document
      authoring guidance; confirm that no `foundry.utils.*` helper is needed for
      static `_source/` JSON.

## 2. Quick-reference content

- [x] 2.1 Add the structured-HTML source entry
      `Übersicht: Zauber, Liturgien & Pre-Effects` under
      `comp_packs/kurzuebersichten/_source/`.
- [x] 2.2 Document Pre-Effect authoring: successful-cast flow, duration,
      instant effects, native Änderungen, resistance tests, diminished outcomes,
      and Mächtige Magie.
- [x] 2.3 Document Ilaris-Modifikatoren: phases, targets, selectors,
      main-attribute roll-only behavior, applied/suppressed visibility, and
      Ilaris versus Foundry stacking modes.
- [x] 2.4 Add Axxeleratus and general-versus-Klingenwaffen AT examples that
      demonstrate the independent strongest positive and strongest negative
      supernatural components.
- [x] 2.5 Add a visible limitations panel for next-roll-only effects, moving
      or repeating zones, target-category restrictions, and other deferred
      mechanics.

## 3. Vorteil limitation and future work

- [x] 3.1 Confirm that
      `Item_Konfigurationen_Quick_Reference_items001pqr.json` already accurately
      states that conditional Vorteil effects are not automated; leave unrelated
      legacy guidance unchanged.
- [x] 3.2 State in the new journal that static Vorteil effects can use native
      Änderungen, but context-dependent effects such as _Eindrucksvoll I_ are not
      yet automated.
- [x] 3.3 Mark ordinary, additive Ilaris modifiers on Vorteile as planned
      follow-up work without adding the feature to this change.

## 4. Pack and quality validation

- [x] 4.1 Validate the new source JSON document parses correctly and contains
      a structured HTML text page.
- [x] 4.2 Run `npm install`.
- [ ] 4.3 Run `npm run pack-all`.
- [x] 4.4 Run `npm test` to retain regression coverage for the documented
      Pre-Effect and modifier behavior.
- [x] 4.5 Run `npm run lint`.

## 5. Unit Tests

- [x] 5.1 Record that no unit test file changes are required because this
      change adds no executable behavior; confirm the existing Pre-Effect and
      Ilaris modifier resolver test suites remain green in task 4.4.

## 6. E2E Tests

- [ ] 6.1 In a running Foundry world as GM, open the packed quick-reference
      compendium and inspect the new journal's HTML rendering and German labels.
- [ ] 6.2 Verify the Axxeleratus/Klingenwaffen examples, stacking explanation,
      suppressed-component visibility text, and conditional-Vorteil warning do not
      claim unsupported behavior.
- [ ] 6.3 Open `Übersicht: Item-Konfigurationen` and verify its existing text
      still correctly marks conditional Vorteil automation as unavailable.
