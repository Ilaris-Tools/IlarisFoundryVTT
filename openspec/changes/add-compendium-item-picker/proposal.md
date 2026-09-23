## Why

[Issue #256](https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues/256) identifies that actor-sheet add controls immediately create empty items, while advantages open one hard-coded compendium. A shared picker should first offer relevant items across accessible system, world, and module compendiums, including house rules, while preserving explicit blank creation.

## What Changes

- Modify existing actor-sheet item creation to open a contextual compendium picker before creating anything.
- Add combined name and compendium filters, source-labelled results, single selection, item-sheet preview, and explicit import.
- Preserve existing German blank-item defaults through a separate creation action; creature own advantage creation explicitly maps to Eigenschaft, consistent with the existing guidance to use Eigenschaften.
- Integrate creature skill conversion through one awaitable import adapter, creating exactly one freiesTalent.
- Match existing target-selection/settings windows using AppV2, Handlebars, native controls, and scoped styles. ActiveEffect creation retains its current direct flow.

## Capabilities

### New Capabilities

- `compendium-item-picker`: Contextual compendium discovery, filtering, preview, import, cancellation, blank creation, and actor-sheet integration.

### Modified Capabilities

None. Existing actor-sheet and item-sheet requirements remain valid; the new capability specifies the added creation workflow.

## Impact

Changes affect shared and creature actor-sheet creation handlers, new item-dialog JavaScript/templates/styles, stylesheet registration, user documentation, and unit/E2E coverage. No persistent schema, compendium source, dependency, or migration changes.

Foundry APIs touched:

- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html): window configuration, actions, render/context/close lifecycle.
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html): feature templates and partial rendering.
- [ActorSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActorSheetV2.html): existing actor-sheet action integration.
- [CompendiumCollection](https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html): documentName, visible, testUserPermission, collection/title, getIndex, getDocument.
- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): full source extraction with toObject and sheet preview.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): ownership checks and createEmbeddedDocuments.
- [DocumentSheetV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DocumentSheetV2.html): item preview rendered without editing the source.
- [SearchFilter](https://foundryvtt.com/api/v14/classes/foundry.applications.ux.SearchFilter.html): cleanQuery for name normalization.
- [Notifications](https://foundryvtt.com/api/v14/classes/foundry.applications.ui.Notifications.html): German recoverable error reporting.
- [foundry.utils](https://foundryvtt.com/api/v14/modules/foundry.utils.html): reuse deepClone/mergeObject where source or existing default handling needs them; evaluate debounce before introducing custom event scheduling.
- Hooks: no new listeners or direct dispatches; Foundry continues its standard application/document lifecycle.

## Testing Impact

- New unit coverage for accessible Item packs, contextual types, combined filters, duplicate names with distinct sources, index failures, no eager full-document loading, stale selection/access, cancellation, explicit blank defaults, duplicate-click prevention, source preservation, and creature conversion.
- Use existing Jest Foundry stubs/dynamic-import patterns; add focused actor-sheet creation coverage and preserve existing active-effect/drop coverage.
- Update `e2e/cases/e2e-013-inventar-geld-gegenstaende/e2e-013-inventar-geld-gegenstaende.spec.ts` to choose explicit blank creation.
- Add a dedicated picker E2E case for filters, preview without import, import once, cancel/close, blank creation, advantages and creature conversion. Exercise both GM and an actor-owning player with readable and inaccessible compendiums.
- Use the configured E2E world and existing shared login/actor snapshot fixtures. Use deterministic existing compendium candidates and actor snapshots; temporarily change one existing pack permission and restore the exact core.compendiumConfiguration afterward; promote reusable picker/compendium setup helpers to `e2e/shared/` only when shared.

## Proposal Self-Review

Decision: PASS_WITH_NOTES

Reviewed proposal, design, delta requirements and tasks on 2026-09-08 before application implementation.

- Scope: matches issue #256 and the approved shared picker. Includes actor/creature entry points and explicit own creation; excludes broad drag/drop refactoring and compendium/schema changes.
- Affected requirements: the new compendium-item-picker capability covers contextual discovery, filtering/source identity, preview, single import, safe cancellation, defaults, creature conversion and consistent UI. Existing actor/item sheet requirements remain valid.
- API evidence: official v14 AppV2/mixin, CompendiumCollection, SearchFilter, Actor and Item documentation verified; no new Hook signatures. Community wiki access returned no readable content, so official documentation and existing helpers are the implementation authority.
- Testing impact: focused test-first Jest coverage plus updated E2E-013 and dedicated GM/player picker scenarios. User explicitly deferred E2E setup/execution; author tests and check discovery only, recording live verification as outstanding evidence rather than an implementation blocker.
- Migration/rollback: no migration, persistent schema or compendium changes. Revert integration and new files to restore prior entry behavior; embedded imports remain normal items.
- UI ordering: contextual heading, labelled search/source filters, status and scrollable result rows, then persistent own creation/Abbrechen/Hinzufügen footer. Native controls, scoped theme styles and input-focus preservation support consistency.
- Note: creature own Vorteil creation is a new explicit Eigenschaft action consistent with the prior instruction to use Eigenschaften; it is not a previously existing automatic fallback.
