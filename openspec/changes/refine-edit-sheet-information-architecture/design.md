# Design — Refine Edit-Sheet Information Architecture

## Context

The item edit sheets for supernatural talents (`zauber`, `liturgie`, `anrufung` — all backed by `createUebernatuerlichTalentFields`) and `manoever` are the most powerful editors in the system. They render the generic data model 1:1:

- `uebernatuerlich_talent.hbs` renders a flat rule-text block, then an always-visible **Zonenautomatisierung** editor (`system.zone`), then an always-visible **Strukturierte Zaubermodifikationen** editor (`system.spellModificationGroups` + `system.spellModifications`).
- `pre-effects.hbs` renders one `<fieldset>` per pre-effect with **every** section always visible: duration, condition, instant, marker, changes (raw `key`/`type`/`value`), Ilaris modifiers, summon item, summon creature, armed combat, avoid test, resistance outcomes — each gated only by `Aktiviert` checkboxes, not by visibility.
- Structured spell-modification forms **inline-duplicate** a reduced copy of the pre-effect editor and the zone editor (observed in `uebernatuerlich_talent.hbs`), because the system has **no Handlebars partial infrastructure** (`Handlebars.registerPartial` is not used anywhere; only helpers are registered in `scripts/core/handlebars.js`).

All data paths (`system.preEffects`, `system.zone`, `system.spellModifications[i].preEffects/.zone`) and the shared form-submit normalization in `PreEffectItemSheet` (`normalizePreEffectFormData`, `normalizeSpellModificationFormData`) stay unchanged — this change is UI-only.

## Goals / Non-Goals

**Goals:**

- Show only what is relevant/active for the concrete item; inactive automation features are not rendered.
- Four accordion-based areas for pre-effect-capable sheets: `Regeltext`, `Automatisierung`, `Strukturierte Zaubermodifikationen`, `Erweitert` (no tabs — user decision).
- Reuse one component set for base and form nesting (path-prefix-parametrised partials) — remove the duplicated inline editors.
- Capability-driven visibility per item type via a dedicated module (not `CONFIG.ILARIS`).
- Derived German summary in every accordion header (no stored summary text).
- Two-layer effect authoring: fachliche Bausteine as default + per-baustein `Erweitert` fold-out for raw fields; `Benutzerdefinierte Änderung` remains the escape hatch.
- Zone as one single-instance card inside `Automatisierung` (Decision A), separate data path, own add/remove flow.
- Rich tooltips for complex concepts; labels remain understandable without tooltips.

**Non-Goals:**

- No data-model changes, no migration, no compendium `_source/` changes (`npm run pack-all` not required).
- No restructuring of other item types (Gegenstand, Vorteil, Waffen, …) — future change.
- No changes to runtime behavior of pre-effects/zones/casting (specs `supernatural-pre-effects`, `spell-zone-lifecycle`, `structured-spell-modifications` remain the contract).
- No new dialogs/apps (the add-flow is inline within the sheet).

## Decisions

### D1 — Areas as stacked accordion sections, not AppV2 TABS

Item sheets currently have no tabs; the `preEffects` part is stacked below the form. We keep that: `PARTS` order becomes `form` (Regeltext) → `automation`-focused structure inside the form template (accordion `<details>` elements) with the existing `preEffects` part folded into the `Automatisierung` area.

- **Alternative considered:** AppV2 `TABS` (like actor sheets). Rejected — user decision 6 (accordions only, everything reachable/understandable), and tabs would fragment a heavily cross-referenced authoring flow (summon/zone/resistance interplay).
- **Implementation:** native `<details>/<summary>` accordions (no custom JS required for open/close; CSS controls `summary` styling; content visible when `open`). The `open` state for active automation cards defaults to closed if a summary exists, else open (avoid hidden-but-empty cards).

### D2 — Shared path-prefix-parametrised partials (new partial infrastructure)

Introduce the system's first partials, registered and preloaded in `scripts/core/handlebars.js` (extend `initializeHandlebars` with `registerHandlebarsPartials()` + preload paths):

```text
scripts/items/templates/partials/pre-effect-card.hbs   — one pre-effect (all sections, capability-gated)
scripts/items/templates/partials/zone-editor.hbs       — one zone profile (single instance)
scripts/items/templates/partials/effect-wirkung.hbs    — effect building blocks (Schaden/Zustand/Modifikator/Marker)
```

Each partial receives a precomputed `pathPrefix` string from the JS context (e.g. `system.preEffects.0`, `system.spellModifications.1.preEffects.2`, `system.zone`) and builds `name="{{pathPrefix}}.baseDuration"` etc. `_prepareContext` produces a **normalized editor view model** (`editorPreEffects`, `editorForms`, `editorZone`) that carries `pathPrefix` + `capabilities` per entry, so Handlebars stays free of `@../../index` spaghetti — the template already uses a similar normalize step (`_getEditorPreEffects`).

- **Alternative considered:** hand-written duplicated templates per context (status quo) — rejected because it drifted (form editor uses fewer fields than the base editor) and will drift further with feature additions.
- **Alternative considered:** AppV2 nested parts per pre-effect — rejected: dynamic list counts, needs re-render orchestration; partials are simpler and match Handlebars usage elsewhere in Foundry systems.
- **Guardrail:** partials stay _view-only_; all data mutation remains in sheet click handlers (`Item#update`), preserving the auto-submit/normalization path.

### D3 — Capabilities in a dedicated module

`scripts/items/capabilities/pre-effect-capabilities.js`:

```js
export const PRE_EFFECT_CAPABILITIES = {
    zauber:   { allowActivationTrigger: false, allowZone: true, allowArmedCombat: true,
                allowSummonItem: true, allowSummonCreature: true, allowResistance: true,
                allowIlarisModifiers: true, allowMarker: true, allowRawChanges: true, ... },
    liturgie: { /* like zauber */ },
    anrufung: { /* like zauber */ },
    manoever: { allowActivationTrigger: true, allowZone: false, /* ... */ },
}

export function getPreEffectCapabilities(itemType, context = 'base') { ... }
```

- `context = 'base' | 'form'` restricts what form pre-effects may offer (e.g. no `activation` trigger in forms).
- Sheets merge the flags into template context; templates gate visibility with `{{#if capabilities.allowX}}`. This **generalises** the existing `isManeuverPreEffect` flag; `manoever` gets `allowActivationTrigger` etc. from the map (remove the special-case flag after mapping).
- **Why not `CONFIG.ILARIS`:** already full of runtime config; capabilities are authoring-UI concerns and belong with the sheets.
- **Why not data-model schema:** the model stays deliberately generic (`h.arrayOfObjects()`); capabilities are presentation metadata, not data constraints.

### D4 — Zone as single-instance card in `Automatisierung` (Decision A)

- The base zone (`system.zone`, `null` = absent) renders as one dedicated card in the `Automatisierung` area: `[▶ Zone] Kegel · 8 Schritt · beim Zaubernden`.
- `+ Zone hinzufügen` creates `system.zone = { shape: 'circle', distance: 1, ... }` via `Item#update`; `Zonenprofil entfernen` (existing `clear-zone-profile` handler) sets `system.zone = null`.
- Form zones (`spellModifications[i].zone`) render inside each form accordion using the **same** `zone-editor.hbs` partial — card appearance shared, data path separate.
- **Alternatives considered:** B (zone as a `kind` entry in a unified card list) — rejected: requires a UI view-model with kind discrimination and risks over-engineering; A keeps the flows obvious. C (separate "Zonen" area outside Automatisierung) — rejected: splits automation in two places for users.

### D5 — Two-layer effect authoring (fachlich + per-baustein `Erweitert`)

- Default surface: fachliche Bausteine — `Schaden`, `Zustand`, `Ilaris-Modifikator`, `Marker`, `Beschwörung (Gegenstand/Kreatur)`, `Bewaffneter Kampfeffekt`, `Widerstandsprobe`, `Zone` — each rendered as its own visual block with a summary.
- Each fachlicher Baustein has an `Erweitert` fold-out (default closed) exposing **its own** raw fields (`type`, `key`, `priority`, `diminishedValue`, `diminishedMaechtigBonus`, `armedCombat.inputs[0]`, …).
- `Benutzerdefinierte Änderung` stays a distinct block type = pure raw editor (escape hatch).
- Sheet-level `Erweitert` is reduced to a minimal set of leftovers that belong to no baustein; the big raw dump from the original draft is removed.
- **Rationale:** the original draft's global `Erweitert` dump would orphan raw fields (user cannot tell what belongs where); per-baustein fold-outs keep provenance, satisfy "reachable + understandable" (decision 6), and match the existing per-section `{{#if enabled}}` pattern.

### D6 — Derived summaries via pure functions

`scripts/items/sheets/summaries.js` (or `scripts/items/capabilities/…` adjacent): `summarizeDamage(change)`, `summarizeZone(zone)`, `summarizeResistance(avoidTest)`, `summarizeArmedCombat(armedCombat)`, `summarizeCondition(condition)` … each returns a German string with `·` separators and safe fallbacks (`—`) for missing values. `_prepareContext` attaches `summary` per card/zone/baustein.

- **Why not stored text:** no data-model change (non-goal); summaries stay derived and always current.
- **Why not Handlebars helpers:** pure functions are trivially unit-testable and reusable in chat/flash messages later.

### D7 — Inline add-flow (no new dialog)

`+ Automatisierung hinzufügen` renders an inline feature chooser limited to capabilities: small `<select>`/button list (Schaden, Zustand, Widerstandsprobe, …). Clicking a feature inserts the corresponding pre-effect entry (feature pre-enabled) or, for Zone, creates `system.zone` (D4). All buttons route through existing click handlers (`_onRender` listeners) + `Item#update`, same as today's add buttons.

- **Alternative considered:** Foundry `Menu`/`DataPicker`-based picker — rejected: heavier than needed, loses the "conscious choice with instant feedback" feel; inline list is testable in Playwright with plain locators.

### D8 — Tooltips via `data-tooltip` (verify before implementation)

Complex concepts (Widerstandsprobe, Bewegungswiderstand, Erweiterte Eingaben) get `data-tooltip` with rich HTML (pattern already used in `vorteil.hbs`). Tooltips answer: what does it do, when do I need it, what happens on activation, short example. **No tooltip API assumption is made here** — the exact attribute/manager behavior is verified against the v14 API docs (and the wiki) as an explicit task before writing tooltip markup, per the system's never-assume rule.

### D9 — Keep the shared form handler and normalization untouched

`PreEffectItemSheet.#onSubmitForm` (`normalizePreEffectFormData`/`normalizeSpellModificationFormData`) stays the only persistence path; refactored partials must produce identical `name` attributes for persisted fields (same keys, same indexes) to keep auto-submit and the `e2e-027`/unit specs' data expectations valid.

### D10 — Backwards-compatible rendering

Existing items may hold `preEffects` with mixed feature configs. Rendering gating is **derived from persisted data** (`enabled`, non-empty lists) — no data rewrite. A card with e.g. `armedCombat.enabled=false` renders no armed-combat block; an item authored before this change with active features renders them (this is what E2E-027's new assertions verify).

## API Surface

**(a) Foundry classes:**

- `HandlebarsApplicationMixin` (sheet mixin, partial rendering) — https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html
- `ItemSheetV2` (base sheet) — https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ItemSheetV2.html
- `ApplicationV2` (`_prepareContext`, `_onRender`, re-render) — https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html
- `Item` (`Item#update` for all add/remove operations) — https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html
- `Handlebars` (`registerPartial`, `loadTemplates` via `foundry.applications.handlebars`) — https://foundryvtt.com/api/v14/functions/foundry.applications.handlebars.loadTemplates.html
- Tooltips (`data-tooltip`): mechanism to be **verified** against v14 docs in the apply phase (no class assumed).

**(b) Hooks:** none — no new or changed Hook events (existing lifecycle hooks untouched).

**(c) `foundry.utils.*` helpers:**

- `foundry.utils.expandObject` (existing form handling) — https://foundryvtt.com/api/v14/functions/foundry.utils.expandObject.html
- `foundry.utils.deepClone` (clone-before-mutate in click handlers) — https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html
- `foundry.utils.randomID` (default feature ids) — https://foundryvtt.com/api/v14/functions/foundry.utils.randomID.html
- `foundry.applications.handlebars.loadTemplates` (partial preloading in `scripts/core/handlebars.js`).

## Risks / Trade-offs

- **[Hiding fields can hide data]** → Mitigation: gating is derived from persisted data (D10); the apply phase audits every `_source/` item with automation (grep over `comp_packs/*/ _source/`) to build the raw-field inventory (D5) before moving anything to `Erweitert`.
- **[E2E-027 assertions conflict with new visibility]** → Mitigation: adapt assertions to "appears when configured / visible when a compendium spell already contains it" (user decision 7); keep the outcome-panel reveal-behavior test; do not delete coverage.
- **[Partial refactor risk (name-path mistakes)]** → Mitigation: D9 — identical `name` attributes; unit specs cover the editor default factories and normalized update shapes; Playwright add-flow case asserts persisted data after `Item#update`.
- **[Form pre-effects lose fields if partials are trimmed]** → Mitigation: capability map defines the _exact_ field set per context; the old form editor fields are enumerated and mapped 1:1 into the partial before removing the inline copy.
- **[Accordions hide content]** → Mitigation: summary in every header (D6); `open` defaults: active cards without summary open, technical fold-outs closed (D1/D5).
- **[Tooltip API unknown]** → Mitigation: explicit verification task before markup; fallback to simple `<span title>` or self-explanatory labels if the rich-HTML path is not available.

## Migration Plan

- **No data migration.** All changes are template/JS/CSS; persisted paths identical.
- **Rollback:** revert the change; existing items and packs remain valid.
- **No `npm run pack-all`** (no compendium data change). After template/JS changes: `node utils/foundry-lifecycle.mjs Restart` before E2E.

## Testing Strategy

- **Unit (Jest, `scripts/items/sheets/_spec/` + new `scripts/items/capabilities/_spec/`):**
    - `getPreEffectCapabilities(itemType, context)` — all types/contexts (pure function).
    - `summaries.js` — each summarizer incl. missing-value fallbacks, German formatting (pure functions; no `jest.mock` needed beyond existing patterns).
    - Editor view-model builders (`_getEditorPreEffects`, new form/zone view models) — `pathPrefix` correctness.
- **Existing unit specs to update:** `pre-effect-item.spec.js`, `uebernatuerlich-talent.spec.js`, `manoever.spec.js` where editor context shape changes (behavioral assertions preserved).
- **E2E:**
    - Adapt `e2e-027` → new visibility rule (configured → appears; imported spell with features → visible).
    - New case candidates (e.g. `e2e-0NN`): add-flow `+ Automatisierung hinzufügen` → card appears + persists; Zone add/remove; capability gate (Manöver shows activation trigger, Zauber does not).
    - Environment: world `ilaris-e2e-world-v14363-r1`, port `30000`; `foundry-lifecycle.mjs Status` → `Restart` → run.

## Open Questions

1. **Exact fachliche Baustein list** (D5): confirm the final widget set (Schaden vs. generische Wert-Änderung, whether Zustand remains inside pre-effect or becomes own baustein, whether `Beherrschungsprobe`/`tableManagedDisplacement` stay inside Beschwörung/Widerstandsprobe). Resolved by the raw-field audit in apply — but the spec should fix the user-facing set.
2. **Partial file/naming & registration point:** `partials/` dir + register in `scripts/core/handlebars.js` (D2) — confirm naming `pre-effect-card.hbs` vs. `effect-card.hbs`.
3. **Sheet-level `Erweitert` content:** after per-baustein fold-outs, which leftovers remain (e.g. `spellModificationGroups` technical ids, LLM generation placement)? Needs one quick inventory pass.
4. **Tooltip mechanism** (D8): verify `data-tooltip` rich-HTML support in v14 before committing to it.
