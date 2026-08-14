## 1. API and lifecycle foundation

- [x] 1.1 Verify against Foundry API docs (v14) the exact public signatures and permissions for `getSceneControlButtons(controls)`, `RegionLayer#activate`, Region placeable `control`, `RegionDocument#update`, `RegionDocument#delete`, and the existing `deleteRegion(region, options, userId)` Hook before implementation.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and AppV2/Handlebars patterns; use `deepClone` only for editable flag snapshots and do not mutate Region source objects.
- [x] 1.3 Trace `scripts/combat/zones/zone-lifecycle.js`, `zone-effect-ownership.js`, zone target resolution, and existing deletion/reconciliation hooks; document the single ownership cleanup path used by manager dismissal.

## 2. Zone registry and safe administration services

- [x] 2.1 Add a pure `scripts/combat/zones/` registry helper that classifies active-Scene Regions as valid persistent Ilaris Zones, malformed Ilaris Zone metadata, or ordinary core Regions, and produces stable sorted row summaries with provenance, lifecycle/trigger, duration, membership, and effect context.
- [x] 2.2 Implement validated `sceneRounds` remaining-duration updates through `RegionDocument#update`; preserve all other flags and Zone trigger/application state, and expose permanent Zones as non-editable.
- [x] 2.3 Implement safe single-Zone dismissal through `RegionDocument#delete` after confirmation, relying on the existing `deleteRegion` cleanup hook rather than scanning/deleting actor effects from UI code.
- [x] 2.4 Add a GM-authoritative administrative reconciliation service that corrects valid Zone membership and restores only missing passive applications without invoking live enter/traversal/turn/round dispatch or creating chat/resistance/damage outcomes.
- [x] 2.5 Make every action resolve its Region from the active Scene immediately before mutation; handle stale/deleted/malformed Regions with German notifications and no destructive fallback.

## 3. Scene Controls manager UI

- [x] 3.1 Add a standalone AppV2 `Ilaris-Zonen verwalten` application and its feature-specific Handlebars template/CSS, keeping manager layout ownership out of Item and combat-dialog templates.
- [x] 3.2 Implement the agreed visual hierarchy: Scene context, reconciliation toolbar/empty state, malformed warning block, then stable Zone rows with provenance/context and actions ordered as **Auf Karte auswählen**, **Region bearbeiten**, duration editor when applicable, **Zone aufheben**.
- [x] 3.3 Register the GM-only **Zonen verwalten** Scene Controls tool through `getSceneControlButtons`; ensure non-GMs cannot open or execute manager actions.
- [x] 3.4 Implement **Auf Karte auswählen** using the public RegionLayer/placeable selection handoff so GMs use existing Foundry Region tools to move/reshape Zones, and implement **Region bearbeiten** by opening the native Region sheet.
- [x] 3.5 Use theme-aware system CSS variables and verify that light and dark presentation remains readable, unclipped, and visually subordinate to Foundry's normal Region controls.

## 4. Unit Tests

- [x] 4.1 Create or extend `scripts/combat/zones/_spec/zone-administration.spec.js` for registry classification, malformed isolation, stable summaries, duration validation, stale Region handling, and GM gating.
- [x] 4.2 Extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for administrative reconciliation: membership repair/passive restoration is allowed, while entry/traversal/turn/round materializers, prompts, chat, and damage are not called.
- [x] 4.3 Extend `scripts/effects/_spec/zone-effect-ownership.spec.js` and relevant zone lifecycle tests to prove manager dismissal retains exact Region/cast/token ownership isolation and delegates cleanup through the deletion lifecycle.
- [x] 4.4 Add manager AppV2/context/action tests for the fixed row/control order, Region layer handoff, native sheet action, permanent Zone display, confirmation path, and light/dark-safe template structure.

## 5. Runtime verification and E2E tests

- [x] 5.1 Create `openspec/changes/add-zone-administration/runtime-verification.md` using the `foundry-runtime-verification` skill. Derive cases for the manager's visible hierarchy, native selection/movement handoff, duration extension, non-triggering reconciliation, safe dismissal, malformed metadata, and both themes.
- [x] 5.2 Use `node utils/foundry-lifecycle.mjs Restart --world ilaris-e2e-world-v14363-r1 --port 30000` after code/template/CSS work. Record baseline active Scene Regions, effects, messages, targets, selection, and relevant settings before runtime mutation.
- [x] 5.3 Add a focused Playwright manager case in `e2e/cases/` using an active GM and two independently owned persistent Zones. Drive the visible Scene Controls manager flow: select the target Region on the map, extend its duration, reconcile without gameplay output, and dismiss it while asserting the comparison Zone/effect remains.
- [x] 5.4 Capture and inspect real light- and dark-mode screenshots of the manager against the UI acceptance contract; collect browser console/page errors and investigate unexpected diagnostics.
- [x] 5.5 Make E2E teardown idempotently remove only recorded Regions/effects/messages/tokens and restore Scene/selection/settings even after failure or termination. Regression-run the existing zone lifecycle and wall traversal E2E cases.

## 6. Validation and handoff

- [x] 6.1 Run `npm install`, focused tests, then the complete `npm test` and `npm run lint`; investigate and resolve regressions attributable to this change.
- [x] 6.2 Run `openspec.cmd validate add-zone-administration --strict`, review `git diff --check`, and reconcile proposal, design, specs, tasks, and runtime evidence with the final implementation.
- [x] 6.3 Review the final diff and commit only this change's files with an imperative commit message after all required runtime/E2E cases pass.
