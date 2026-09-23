# Tasks — Refine Edit-Sheet Information Architecture

## 1. API & Codebase Verification

- [x] 1.1 Verify against Foundry API docs (v14) the relevant classes before implementation: `foundry.applications.sheets.ItemSheetV2`, `foundry.applications.api.HandlebarsApplicationMixin`, `foundry.applications.api.ApplicationV2` (`_prepareContext`, `_onRender`), and `Item#update` — record exact signatures in design/apply notes.
- [x] 1.2 Check foundryvtt.wiki for `foundry.utils.*` helpers relevant to cloning form data (`deepClone`, `expandObject`) and whether a documented helper exists for partial registration/preloading.
- [x] 1.3 Verify `Handlebars.registerPartial` + `foundry.applications.handlebars.loadTemplates` usage pattern against the v14 docs and the existing `scripts/core/handlebars.js` structure.
- [x] 1.4 Verify the `data-tooltip` rich-HTML mechanism in v14 (attribute support, HTML content, manager class) before writing tooltip markup; fall back to `title` if unsupported — record decision in design notes (Open Question 4).

## 2. Capabilities Module

- [x] 2.1 Create `scripts/items/capabilities/pre-effect-capabilities.js` with `PRE_EFFECT_CAPABILITIES` covering `zauber`, `liturgie`, `anrufung`, `manoever` and `getPreEffectCapabilities(itemType, context = 'base')`.
- [x] 2.2 Define the capability flag set per spec (`allowActivationTrigger`, `allowZone`, `allowArmedCombat`, `allowSummonItem`, `allowSummonCreature`, `allowResistance`, `allowIlarisModifiers`, `allowMarker`, `allowRawChanges`, …) for both `base` and `form` contexts.
- [x] 2.3 Wire capabilities into `PreEffectItemSheet._prepareContext` (add `preEffectCapabilities` flags); replace `isManeuverPreEffect` usages in `manoever` sheet/template with capability flags.

## 3. Shared Partials Infrastructure

- [x] 3.1 Create `scripts/items/templates/partials/pre-effect-card.hbs` as the single pre-effect card (all sections), parametrised by `pathPrefix` (+ precomputed indexes) and capability flags.
- [x] 3.2 Create `scripts/items/templates/partials/zone-editor.hbs` (shape, distance/angle/width, anchor/range, lifecycle, duration source/attribute, triggers, movement resistance) parametrised by `pathPrefix`.
- [x] 3.3 Create `scripts/items/templates/partials/effect-wirkung.hbs` with fachliche Bausteine (Schaden, Zustand, Ilaris-Modifikator, Marker) plus per-baustein `Erweitert` fold-out.
- [x] 3.4 Register and preload the partials in `scripts/core/handlebars.js` (`registerHandlebarsPartials()` inside `initializeHandlebars`, add template paths to `preloadHandlebarsTemplates`).

## 4. Pre-Effect Editor View Model

- [x] 4.1 Extend the editor view model in `scripts/items/sheets/pre-effect-item.js` to attach per-entry `pathPrefix` and `capabilities` (base: `system.preEffects.<i>`, form: `system.spellModifications.<f>.preEffects.<p>`); keep `_getEditorPreEffects` defaults.
- [x] 4.2 Refactor `scripts/items/templates/pre-effects.hbs` to render via `pre-effect-card.hbs` and `effect-wirkung.hbs`; remove inline field duplication; keep `resistanceOutcomes` outcome payloads with correct indexes.
- [x] 4.3 Confirm all persisted `name` attributes match the previous paths exactly (no rename); run existing `sheets/_spec` pre-effect tests.

## 5. Supernatural Talent Sheet Areas

- [x] 5.1 Restructure `scripts/items/templates/uebernatuerlich_talent.hbs` into four accordion areas: `Regeltext`, `Automatisierung`, `Strukturierte Zaubermodifikationen`, `Erweitert`.
- [x] 5.2 Move the base zone editor out of the always-visible section into the `Automatisierung` area as a single card via `zone-editor.hbs`; add `+ Zone hinzufügen` (creates `system.zone` default) and keep `Zonenprofil entfernen` (sets `system.zone = null`).
- [x] 5.3 Replace the inline duplicated form pre-effect/zone editors in the `Strukturierte Zaubermodifikationen` area with the shared partials (form-scoped `pathPrefix`); keep group/form add/edit/order/remove handlers.
- [x] 5.4 Add `Erweitert` area with the minimal leftover technical fields (per design Open Question 3 — resolve exact list during this task by inventorying remaining non-widget fields).

## 6. Maneuver Sheet

- [x] 6.1 Ensure `manoever.hbs` renders activation/operation/ilarisEnding fields only via `preEffectCapabilities.allowActivationTrigger` (capability-gated), replacing `isManeuverPreEffect`.
- [x] 6.2 Verify Manöver add-menu excludes spell-only features (Zone, etc.) and Zauber excludes maneuver triggers.

## 7. Summaries

- [x] 7.1 Create `scripts/items/sheets/summaries.js` with pure functions: `summarizeZone`, `summarizeDamage`, `summarizeResistance`, `summarizeArmedCombat`, `summarizeCondition`, `summarizeMarker` (German, `·` separators, safe fallbacks).
- [x] 7.2 Attach summaries to the view model in `_prepareContext` (per zone card, per pre-effect card, per effect baustein) for accordion headers.
- [x] 7.3 Check foundryvtt.wiki for existing pattern for localized string helpers; reuse `CONFIG.ILARIS`/`game.i18n` labels where available.

## 8. Two-Layer Effect Authoring & Raw-Field Audit

- [x] 8.1 Audit persisted automation data (grep `comp_packs/*/_source/**` + world `preEffects` usage) and build the raw-field inventory: `changes.type` custom/multiply/override, `priority`, `diminishedValue`/`diminishedMaechtigBonus`, `armedCombat.inputs[0]`/`damage`/`charges`, summon overrides (data paths), `tableManagedDisplacement` — record which must stay reachable under `Erweitert`.
- [x] 8.2 Implement per-baustein `Erweitert` fold-outs (default closed) exposing the baustein's own raw fields; implement `Benutzerdefinierte Änderung` as raw escape hatch.
- [x] 8.3 Reduce sheet-level `Erweitert` to the minimal leftover set per design (Open Question 3).

## 9. Add-Flow & Handlers

- [x] 9.1 Implement inline `+ Automatisierung hinzufügen` chooser (capability-gated feature list) and its click handler (`Item#update`), including feature-insert for pre-effects.
- [x] 9.2 Implement `+ Zone hinzufügen` / `Zonenprofil entfernen` handlers via `Item#update` (`system.zone` default / `null`).
- [x] 9.3 Keep existing click handlers for add/remove change, modifier, summon override, domination check, spell-modification group/form; verify they run against the refactored DOM.

## 10. Tooltips & i18n

- [x] 10.1 Add `data-tooltip` info buttons for Widerstandsprobe, Bewegungswiderstand, and `Erweiterte Eingaben` (or equivalent) with short German explanations + example; labels remain self-explanatory without tooltips.
- [x] 10.2 Ensure user-facing new labels are German and consistent with existing terms (Zustandsliste, Mächtige Magie, etc.).

## 11. Styling

- [x] 11.1 Add accordion/card CSS (`styles/`) for the areas, cards, summaries, and `Erweitert` fold-outs; dark-mode compatible (existing `dark-mode-journal-readability` pattern).

## 12. Unit Tests

- [x] 12.1 Create `scripts/items/capabilities/_spec/pre-effect-capabilities.spec.js` — flag sets per type/context, pure function.
- [x] 12.2 Create `scripts/items/sheets/_spec/summaries.spec.js` — summarizers incl. fallbacks.
- [x] 12.3 Create/update view-model specs (`scripts/items/sheets/_spec/pre-effect-item.spec.js`, `uebernatuerlich-talent.spec.js`, `manoever.spec.js`) — `pathPrefix` computation, capability flags, summary attachment; preserve behavioral assertions.

## 13. E2E Tests

- [x] 13.1 Adapt `e2e/cases/e2e-027-pre-effect-sheet-config/e2e-027-pre-effect-sheet-config.spec.ts`: assert `.avoid-test-section`/`resistance-outcomes-section` appear when configured, and that an imported compendium spell containing them shows them (per user decision 7); keep outcome-panel reveal-behavior test.
- [x] 13.2 New E2E case (e.g. `e2e-0NN-edit-sheet-add-flow`): add-flow `+ Automatisierung hinzufügen` → card appears + data persisted; capability gate (Manöver vs. Zauber).
- [x] 13.3 New E2E case or extension: Zone single-card add/remove; form zone/pre-effect render via shared partials (no duplicate editor).

## 14. Validation

- [x] 14.1 Run `npm test` (full Jest suite; fix regressions, triage per test-preservation policy).
- [x] 14.2 Run `npm run lint` and `npm run prettier` (or `npm run format`) on changed files.
- [x] 14.3 `node utils/foundry-lifecycle.mjs Status` → `Restart` (no `pack-all` — no compendium `_source/` changes in this change).
- [x] 14.4 Run focused E2E: `e2e-027` + new cases; then full `npx playwright test` if green.
- [x] 14.5 Review diff; commit with concise imperative message after E2E passes (per AGENTS.md Git handoff); do not commit pre-existing changes.
