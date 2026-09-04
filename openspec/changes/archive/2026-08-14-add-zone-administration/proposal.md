## Why

Foundry V14 already provides the generic Region layer for selecting, moving,
resizing, editing, and deleting Regions. It does not show which Regions are
Ilaris spell zones, their spell/caster provenance, scene-round duration,
trigger configuration, or zone-owned effects. A GM therefore has no safe
scene-level way to inspect, extend, reconcile, or deliberately dismiss an
automated Zone without reading document flags or risking unrelated effects.

## What Changes

- Add a GM-only Scene Controls tool, **Zonen verwalten**, that opens a
  current-scene Ilaris Zone manager. It lists only persistent Regions carrying
  the Ilaris zone flag and does not replace Foundry's normal Region controls.
- Show each Zone's visible name, source spell and caster where resolvable,
  lifecycle/trigger summary, remaining scene rounds (or permanent state), and
  current membership/effect summary.
- Let a GM select a Zone on the canvas through Foundry's Region layer, then use
  the existing Region tools to move or reshape it; provide an explicit action
  to open Foundry's native Region configuration sheet for ordinary Region
  editing.
- Let a GM change the remaining duration of a `sceneRounds` Zone through a
  validated **Verbleibende Szenenrunden** value. Permanent Zones remain
  labelled as permanent and have no misleading duration editor.
- Let a GM dismiss exactly one Zone after confirmation. The action shall use
  the Region document deletion path so existing passive-effect and traversal
  marker cleanup remains authoritative and cannot remove another Zone's,
  cast's, token's, or manually authored effect.
- Add a manager-level **Abgleich durchführen** action that rebuilds the
  displayed membership and repairs missing passive applications without
  dispatching damage, resistance, entry, traversal, round, or turn triggers.
- Defensively identify incomplete/legacy Ilaris zone flags in the manager and
  expose them as a recoverable warning rather than throwing or treating an
  arbitrary core Region as an Ilaris Zone.

This is additive. Core Foundry Region editing and deletion behavior remains
unchanged, and Zone effects are never moved or recreated merely because a GM
opens the manager.

## Capabilities

### New Capabilities

- `zone-administration`: GM-only current-scene discovery, inspection,
  selection, duration management, safe dismissal, and non-triggering
  reconciliation of Ilaris-owned persistent Regions.

### Modified Capabilities

- None.

## Impact

- **UI:** a new German Scene Controls tool and a dedicated
  [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)
  manager template. Its concrete layout is owned by the manager template, not
  shared Item or combat-dialog templates.
- **Foundry VTT V14 APIs:**
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
  for flags, `update`, and `delete`;
  [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html)
  for the embedded Region collection;
  [RegionLayer](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html)
  and [Region placeables](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Region.html)
  for native canvas selection/movement; and the documented
  [`getSceneControlButtons`](https://foundryvtt.com/api/v14/modules/hookEvents.html#getSceneControlButtons)
  Hook for the GM tool.
- **Ilaris integration:** extend `scripts/combat/zones/` with an explicit
  registry/reconciliation boundary and use the existing zone-effect ownership
  cleanup rather than adding a second deletion implementation. Reuse
  `foundry.utils.deepClone` only where an editable duration/flag snapshot is
  needed; no custom clone helper.
- **Tests:** add pure registry, malformed-zone, duration-validation,
  reconciliation-without-trigger, and ownership-isolation tests beside
  `scripts/combat/zones/_spec/`. Add manager context/action tests following the
  AppV2 patterns already used by system sheets. Add a focused Playwright case
  in `ilaris-e2e-world-v14363-r1` with an active GM and a persistent Zone: open
  the visible manager, inspect its row, select the Region on the map, extend
  its duration, reconcile it without a new chat/effect trigger, and dismiss it
  while proving only its zone-owned effects are cleaned. Capture the light and
  dark manager surfaces and restore created Regions, effects, messages,
  settings, targets, and canvas selection in teardown. Existing zone lifecycle
  and wall-traversal E2E cases require regression verification.
