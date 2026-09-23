# Refine Edit-Sheet Information Architecture

## Why

The item data model for supernatural talents (Zauber, Liturgie, Anrufung) and Manöver is powerful and generic, but the edit sheets render the model 1:1: every possible automation feature is always visible, regardless of whether the concrete item uses it. An `Ignifaxius Flammenstrahl` without zone automation still shows the complete zone editor, and every pre-effect card shows summon, armed-combat, and resistance sections with plain `Aktiviert` checkboxes. The result is clutter and a UI that mirrors object structure instead of user intent.

## What Changes

UI-only restructuring of the edit sheets for pre-effect-capable item types (`zauber`, `liturgie`, `anrufung`, `manoever`). The data model stays generic and unchanged — no data migration, no breaking data change.

- **Four accordion-based areas** (no tabs, everything reachable): `Regeltext`, `Automatisierung`, `Strukturierte Zaubermodifikationen`, `Erweitert`.
- **Inactive features are not rendered.** Optional automation features are added explicitly via `+ … hinzufügen` actions instead of always-visible activation checkboxes.
- **Zone (Decision A):** the base zone (`system.zone`) becomes its own single-instance card inside `Automatisierung`, with its own `+ Zone hinzufügen` / `Zonenprofil entfernen` flow. It shares the card look and the shared zone-editor partial with form zones, but keeps its separate data path.
- **Shared partials instead of duplication:** `pre-effect-card.hbs` and `zone-editor.hbs` become path-prefix-parametrised partials used by the base editor (`system.preEffects`, `system.zone`) and by structured spell-modification forms (`system.spellModifications[i].preEffects`, `.zone`). This removes the today-valid reduced inline copy of the pre-effect/zone editor inside `uebernatuerlich_talent.hbs`.
- **Capabilities in a dedicated module:** `scripts/items/capabilities/pre-effect-capabilities.js` exports `PRE_EFFECT_CAPABILITIES` (per item type) and `getPreEffectCapabilities(itemType, context)` with `context = 'base' | 'form'`. Sheets load them into the template context (generalising the existing `isManeuverPreEffect` pattern).
- **Derived accordion summaries** (e.g. `Kegel · 8 Schritt · beim Zaubernden`, `4W6 Feuer · Mächtig +2W6`) via a small summary-builder module of pure functions — no stored summary text.
- **Two-layer effect authoring:** per effect, fachliche Bausteine (Schaden, Zustand, Ilaris-Modifikator, Marker, Beschwörung, Kampfeffekt, Widerstandsprobe) as the default surface, each with an `Erweitert` fold-out (default closed) exposing its own raw fields (`type`, `key`, `priority`, diminished values, …). `Benutzerdefinierte Änderung` remains the raw escape hatch. Sheet-level `Erweitert` is reduced to a minimal set.
- **Context-dependent visibility** per item type and per editor context (base vs. form) so that e.g. maneuver activation triggers only appear for Manöver.

## Capabilities

### New Capabilities

- `edit-sheet-information-architecture`: Information architecture of the item edit sheets for pre-effect-capable types — area structure, accordions with derived summaries, explicit add-flows, capability-driven visibility, shared parametrised partials, two-layer (fachlich/Erweitert) effect authoring, and zone-as-single-card (Decision A).

### Modified Capabilities

- _(none)_ — Existing requirements in `item-sheets`, `pre-effect-item-sheet-base`, `structured-spell-modifications`, `supernatural-pre-effects`, `maneuver-pre-effects`, and related runtime specs remain valid; the new capability adds the UI/IA layer on top.

## Impact

- **Files:**
    - Templates: `scripts/items/templates/uebernatuerlich_talent.hbs`, `scripts/items/templates/manoever.hbs`, `scripts/items/templates/pre-effects.hbs` (refactored into shared partials), new partials under `scripts/items/templates/partials/` (`pre-effect-card.hbs`, `zone-editor.hbs`, `effect-bausteine.hbs`).
    - Sheets: `scripts/items/sheets/pre-effect-item.js`, `scripts/items/sheets/uebernatuerlich-talent.js`, `scripts/items/sheets/manoever.js` (capability loading, add/handlers, summary context).
    - New modules: `scripts/items/capabilities/pre-effect-capabilities.js`, summary builder (e.g. `scripts/items/sheets/summaries.js`).
    - Styles: `styles/` (accordion/card styling).
    - Tests: `scripts/items/sheets/_spec/…` (unit) and `e2e/cases/e2e-027-…` (adapted), possibly new E2E case.
- **Foundry API (verify each against https://foundryvtt.com/api/v14/ during design/apply):**
    - `HandlebarsApplicationMixin` — https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html
    - `ItemSheetV2` — https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html
    - `ApplicationV2` — https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html
    - `Item` (`Item#update`) — https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html
    - `foundry.utils.*` helpers (`expandObject`, `deepClone`) — https://foundryvtt.com/api/v14/functions/foundry.utils.expandObject.html
    - Tooltips (`data-tooltip`): no class assumed here — verified in design against v14 API docs before implementation.
    - No new Hooks; no socket usage.
- **Dependencies:** none new. No compendium `_source/` changes → **no `npm run pack-all`**.
- **Behavior:** additive UI restructure; editing semantics and persisted data paths remain identical. Existing items keep all configured automation; inactive features simply stop rendering. Intended UI behavior change (this is the point of the change), not a data-breaking change.
- **Migration / rollback:** none required (UI-only). Rollback = revert commit.

### Testing Impact

- **New unit tests (Jest, `scripts/items/sheets/_spec/`):**
    - `getPreEffectCapabilities(itemType, context)` per type (zauber/liturgie/anrufung/manoever, base vs. form).
    - Summary-builder pure functions (damage, zone, resistance, armed-combat, condition summaries) incl. German formatting and missing-value fallbacks.
    - Partial context builders: capability flags and path-prefix computation (`system.preEffects.0` vs `system.spellModifications.0.preEffects.1`).
- **Existing unit tests to update:** `scripts/items/sheets/_spec/pre-effect-item.spec.js`, `uebernatuerlich-talent.spec.js`, `manoever.spec.js` where they assert editor context/defaults (surface changes, not behavior).
- **New E2E cases (candidates):** add-flow through `+ Automatisierung hinzufügen` → feature appears as card; zone single-card add/remove in `Automatisierung`; capability-gated visibility on Manöver vs. Zauber.
- **Existing E2E cases affected:** `e2e/cases/e2e-027-pre-effect-sheet-config/` — assertions that `.avoid-test-section` / `.resistance-outcomes-section` are always visible are adapted to: sections appear when configured, and are visible when opening a compendium spell that already contains them (user decision 7).
- **E2E environment:** world `ilaris-e2e-world-v14363-r1`, port `30000`; run `node utils/foundry-lifecycle.mjs Status` before, `Restart` after code/template changes (pack-all not required — no compendium data change).

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** UI/IA restructure of item edit sheets for pre-effect-capable types; four accordion areas, shared parametrised partials, capability module, derived summaries, two-layer effect authoring, zone as single card (Decision A). No data-model changes.
- **Affected requirements:** new `edit-sheet-information-architecture` capability; existing requirements in `pre-effect-item-sheet-base` / `structured-spell-modifications` / runtime specs remain compatible (no conflict found: visibility wording like “enables” does not mandate always-visible checkboxes; authoring via `Item#update` is preserved).
- **API evidence:** ItemSheetV2/HandlebarsApplicationMixin/ApplicationV2/Item/foundry.utils links listed; tooltip mechanism explicitly deferred to design-time verification (no assumptions).
- **Testing impact:** unit + E2E coverage planned; `e2e-027` assertions adapted intentionally (UI behavior change), equivalent regression coverage retained via add-flow and pre-configured-spell checks.
- **Migration / rollback:** none — UI-only; no compendium/pack changes.
- **UI ordering:** this change IS the UI change; accordion structure and defaults are specified in the delta spec (design-level details in `design.md`).
- **Notes:** (1) The exact fachlich↔roh field boundary (e.g. `changes.type = "custom"`, `priority`, diminished values, `armedCombat.inputs`, summon overrides, `tableManagedDisplacement`) is audited in apply against every existing source item before hiding anything under `Erweitert`. (2) Scope intentionally limited to pre-effect-capable types; other item types (Gegenstand, Vorteil, Waffen…) are out of scope and may follow in a later change.
