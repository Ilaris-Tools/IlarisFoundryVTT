## Context

Shared actor-sheet item creation currently builds blank items immediately; advantages open Ilaris.vorteile. Creature creation and drop handling additionally adapt skills to freiesTalent, with a legacy drop path capable of creating twice. The approved issue #256 design replaces these entry points with one contextual picker while retaining blank defaults and German UI language.

## Goals / Non-Goals

Goals: searchable suggestions from readable Item compendiums, type filtering from the clicked control, source provenance, preview, explicit single import, blank creation, cancellation, and familiar window styling.

Non-goals: a general compendium browser, bulk import, persistent filters, schema migrations, changes to compendium source data, replacement of ActiveEffect creation, or broad drag/drop refactoring. The user explicitly deferred E2E environment setup and live E2E execution; author and statically discover tests only.

## Decisions

### Shared AppV2 picker

Place a reusable application in scripts/items/dialogs with feature-specific Handlebars templates and scoped styles registered through the existing stylesheet entry. The sheet passes actor, itemclass and profan to the picker. A focused context/data helper reads configured itemTemplates, derives compatible source types and German labels, preserves blank defaults, and prepares ordinary/creature import data. The picker awaits one embedded creation operation. Compared with opening one existing pack, this gives house-rule packs equal visibility; a full browser adds unnecessary scope.

Use separate template parts where useful to update results/footer without replacing the search input. Search remains focused while typing. Every markup fragment stays in Handlebars; JavaScript prepares structured state.

### Discovery and filtering

Enumerate game.packs, restrict to documentName Item, and require visibility and sufficient read permission. Use getIndex({fields: ['type', 'img', 'system.profan']}) for each eligible pack; keep successful indexes when another fails and show a German partial-failure message. Render initial loading state before asynchronous discovery. Do not use eager getDocuments. Pack indexes are cached by Foundry.

Represent each row using pack collection id plus entry id, name, image, and source title. Preserve same-named rows from different packs. Context fixes the source type set; a trimmed case-insensitive name filter combines with the selected pack. Prefer Foundry SearchFilter.cleanQuery normalization. Sort deterministically by German name, source, then stable identity. Invalidated selection clears when filters hide the chosen row.

### Window ordering and actions

Order: contextual heading; labelled Suche and Kompendium controls; result count/loading/error; scrollable rows with native radios, small images, clickable preview names and visible source; fixed footer with own-item creation, Abbrechen, Hinzufügen. Add is disabled without visible selection and while a creation operation is pending.

Follow the target-selector and settings window spacing, native controls, subtle borders and theme variables, keyboard focus, and compact footer. Scope styles to the picker so combat layout rules cannot leak in. Results scroll independently; narrow widths wrap footer controls.

### Safe preview and import

Preview fetches the chosen full Item on demand, rechecks pack permissions and source type, and opens a small subclass of the resolved source-sheet constructor with public isEditable returning false. Set canImport, canCreate, ownershipConfig and sheetConfig false using documented DocumentSheetConfiguration; do not assume an editable render option. Preview never creates an actor item. Import independently resolves and checks the full source, verifies actor ownership, extracts source via Item.toObject(), and passes data through the focused import-data adapter, preserving image, system, effects and flags while discarding source document identity/folder as appropriate for an embedded copy.

Await a single createEmbeddedDocuments('Item', [data]) operation and guard against repeated clicks. Capture selection before awaiting. Close only after successful creation; a recoverable failure keeps the picker open and allows retry. Closing while a document fetch is pending prevents subsequent creation; closing after the authorized database operation has started cannot undo that operation.

### Existing creation semantics

Extract/reuse current blank defaults and render the created blank item's sheet. Advantages use the picker across accessible packs; a creature's explicit own-advantage action creates Eigenschaft, following the existing user guidance to use Eigenschaften; this is a new explicit action.

Creature skill sources that already convert through drop handling use one explicit conversion adapter for picker imports. Produce exactly one freiesTalent with appropriate category and mapped fields; never call the legacy double-creating drop handler from the picker. Keep unrelated drag/drop paths out of scope. ActiveEffect buttons continue their existing direct behavior.

## API Surface

Verified official v14 documentation on 2026-09-08:

- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html): DEFAULT_OPTIONS, \_prepareContext, \_onRender, render(options), close(options), and action dispatch.
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html) and [HandlebarsApplication](https://foundryvtt.com/api/v14/classes/foundry.HandlebarsApplication.html): PARTS and supported template-part rendering.
- [ActorSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html): existing sheet integration.
- [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html): getIndex(options?: {fields?: string[]}), getDocument(id), testUserPermission(user, permission, options?), visible, documentName, collection, title.
- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): toObject(source = true), sheet, type, document source.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): isOwner and createEmbeddedDocuments(embeddedName, data, operation?).
- [DocumentSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DocumentSheetV2.html): public isEditable getter for read-only preview; [DocumentSheetConfiguration](https://foundryvtt.com/api/v14/interfaces/foundry.DocumentSheetConfiguration.html) supplies canImport/canCreate/ownershipConfig/sheetConfig restrictions.
- [SearchFilter](https://foundryvtt.com/api/v14/classes/foundry.applications.ux.SearchFilter.html): cleanQuery for search normalization.
- [Notifications](https://foundryvtt.com/api/v14/classes/foundry.applications.ui.Notifications.html): warn/error for failures.
- [foundry.utils](https://foundryvtt.com/api/v14/modules/foundry.utils.html): deepClone/mergeObject for existing defaults/source adaptation if required; prefer documented helpers over bespoke cloning.

Hooks: no custom listeners or direct dispatches. Existing Foundry document/application operations own their lifecycle hooks; no new hook signature assumptions.

The [community API wiki](https://foundryvtt.wiki/en/development/api) was consulted but returned no readable page content to the tool. Official v14 API evidence and existing repository helpers govern implementation.

## Risks / Trade-offs

- Many packs or an unavailable index -> render loading state, use indexes only, isolate pack errors, retain successful results.
- Permission or document changes after discovery -> recheck before preview/import and fail without creating.
- Duplicate import or stale asynchronous completion -> busy guard and closed-state checks around awaited retrieval.
- Creature conversion data loss/duplication -> focused mapped-source tests and exactly-one-create assertions.
- UI/theme regressions -> native elements, scoped rules, responsive layout, keyboard-focus preservation, and separate review; live E2E deferred by user.

## Migration Plan

No data migration or compendium packing required. Ship application/templates/styles together. Reverting the integration and new files restores previous creation behavior; already imported embedded items remain normal actor items.

## Testing Strategy

Use Jest dynamic imports with Foundry stubs for the application and Object.create/prototype invocation where appropriate for sheets. Write focused failing tests before corresponding implementation, then validate behavior with source-shaped data and focused context/import helpers.

New picker tests cover filtering, read-access exclusion, failures, lazy retrieval, preview, cancellation, busy guards, stale selection/permission, preservation, and own creation. New actor integration tests cover blank defaults, advantages, direct ActiveEffects, and single creature conversion.

Update E2E-013 for the explicit own-item action. Author a separate picker E2E spec from delta scenarios using shared login, actor snapshots, and deterministic existing compendium candidates, with an owning-player permission case that temporarily denies access to one existing pack and restores the exact core.compendiumConfiguration afterward. Do not set up or start an E2E runtime and do not execute browser tests in this task; only check test discovery. Run npm install before tests, npm test and npm run lint, plus OpenSpec validation.

## Open Questions

None blocking implementation. Live E2E verification is intentionally deferred by the user.
