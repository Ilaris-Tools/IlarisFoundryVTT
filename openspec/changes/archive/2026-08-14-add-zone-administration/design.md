## Context

The existing zone lifecycle already expires persistent Regions, reconciles
passive occupants on `canvasReady`, and cleans passive effects plus traversal
markers from the `deleteRegion` path. Those lifecycle mechanics must remain
the sole ownership authority. This change supplies the missing GM-facing
administration surface and a deliberately non-triggering recovery boundary.

Foundry V14's Region layer already supports generic canvas selection, movement,
shape editing, native Region configuration, individual deletion, and deleting
all owned Regions. Replacing those controls would duplicate core behavior and
would make the system responsible for general Region geometry. Instead, the
Ilaris manager identifies Ilaris-owned Zones and hands geometry work back to
Foundry.

## Goals / Non-Goals

**Goals:**

- Provide a GM-only, current-scene overview of durable Ilaris Zones.
- Make duration extension and single-Zone dismissal safe, explicit, and
  immediately visible.
- Make it easy to select a Zone on the canvas and continue with Foundry's
  ordinary Region move/resize/configuration workflow.
- Rebuild Zone membership and missing passive applications without firing
  gameplay triggers.
- Make malformed legacy metadata observable and non-destructive.

**Non-Goals:**

- Recreate Foundry's Region creation, drag, resize, shape, delete-all, or
  core Region configuration UI.
- Manage zones on non-active Scenes, introduce a world-wide zone directory, or
  change Zone ownership/permission rules.
- End Zones because their caster moves or is deleted; that remains a separate
  caster-dependence feature.
- Make `infinite` Zones editable as though they had scene-round duration.
- Dispatch entry, traversal, turn, round, damage, or resistance effects from
  the administration reconciliation action.

## Decisions

### A Scene Controls tool opens a current-scene manager

Register a GM-only `Zonen verwalten` tool with the documented
[`getSceneControlButtons(controls)`](https://foundryvtt.com/api/v14/modules/hookEvents.html#getSceneControlButtons)
Hook. It belongs with the existing Region/scene controls rather than an Item
sheet: its subject is a persisted Scene Region, not a spell definition.

The manager is a small standalone
[ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
using
[HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html).
It owns its template and actions; shared Zone helpers own data lookup and
mutations. This follows the community AppV2 guidance: rendered markup remains
in Handlebars and click actions are declared/handled by the application rather
than injecting document markup into core UI.

**UI acceptance contract**

The window is titled **Ilaris-Zonen verwalten** and renders in this fixed
top-to-bottom order:

1. Current Scene name and a concise statement that movement/shape editing uses
   Foundry's Region tools.
2. A toolbar with **Abgleich durchführen** and an empty-state message when the
   Scene has no valid Ilaris Zones.
3. A warning block for malformed/legacy Ilaris Zone flags, if any.
4. One row per valid persistent Zone, in stable visible-name order. Each row
   shows the Zone name, spell/caster provenance, trigger/lifecycle summary,
   remaining scene rounds or **Permanent**, and membership/effect summary.
5. The row's actions in this order: **Auf Karte auswählen**,
   **Region bearbeiten**, the `Verbleibende Szenenrunden` input plus save
   action for scene-round Zones only, then destructive **Zone aufheben**.

**Auf Karte auswählen** calls public
[RegionLayer#activate](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html#activate)
then the Region placeable's public
[control](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Region.html#control)
with panning. The GM can then move/resize through Foundry's native Region
controls. **Region bearbeiten** opens the Region's native document sheet. The
manager does not implement drag or shape inputs itself.

The manager uses system CSS variables/current Foundry application styling, so
the same hierarchy and readable controls are required in both light and dark
mode. It must not assume a specific core theme class.

### The registry distinguishes valid, malformed, and ordinary Regions

Introduce a pure zone-administration registry helper around the existing
`flags.Ilaris.zone` schema:

- an ordinary core Region has no Ilaris zone flag and is invisible to the
  manager;
- a valid entry has the minimum persistent Zone profile, application identity,
  and lifecycle state required by existing lifecycle functions;
- an Ilaris-scoped but incomplete entry is listed as malformed with its Region
  identity and an actionable warning, but is not reconciled or silently
  migrated.

The registry reads the active [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html)'s
embedded [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
collection. Flags are the correct extension point for this metadata, as
document flags are namespaced and persisted with the Region; neither a new
world setting nor an out-of-band registry is necessary.

### Duration update and dismissal use existing document/lifecycle paths

`sceneRounds` duration is stored in the Zone's existing `remaining` flag. The
manager accepts only a finite integer of at least one and persists it with
[RegionDocument#update](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html#update).
It updates remaining duration only; it neither rewinds trigger windows nor
creates a replacement Region. `infinite` zones expose no editor.

**Zone aufheben** confirms the exact named Region and calls public
[RegionDocument#delete](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html#delete).
It deliberately does not delete actor effects itself. The existing
`deleteRegion(region, options, userId)` lifecycle hook invokes zone-owned
passive/traversal cleanup, preserving the current exact ownership matching.
This is safer than scanning effects from the UI or invoking Foundry's
`RegionLayer#deleteAll`.

### Reconciliation is a maintenance operation, never an effect trigger

Add a `reconcileZoneAdministration(scene)` service that processes only valid
Ilaris Zones on the active GM client. It recomputes current membership from
Foundry containment and persists a corrected membership flag. For passive
Zones it delegates only to the existing missing-application reconciliation
path. For trigger-based Zones it records membership but intentionally performs
no trigger dispatch. It therefore repairs restart/manual-edit drift without
producing a new ChatMessage, resistance prompt, damage roll, ActiveEffect, or
traversal marker.

This explicit maintenance function is preferred over calling
`updatePersistentZoneMembership`: that live movement function correctly
dispatches new `enter` effects, which is unsafe when a GM is merely repairing
state.

## API Surface

| Surface                                                                                                                                                                                                                                 | Use                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)                                                                                                                                          | Read Ilaris flags; update remaining duration; delete one dismissed Zone; open its native sheet.                 |
| [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html)                                                                                                                                                            | Obtain the active Scene's embedded `regions` collection; no direct LevelDB/data-layer access.                   |
| [RegionLayer](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html)                                                                                                                                            | Activate the native Region layer before selecting a manager row's Region.                                       |
| [Region placeable](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Region.html)                                                                                                                                        | Public `control({ pan: true })` selection handoff for Foundry-native move/resize.                               |
| [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html) and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html) | Render the GM manager as an AppV2 Handlebars surface.                                                           |
| [`getSceneControlButtons`](https://foundryvtt.com/api/v14/modules/hookEvents.html#getSceneControlButtons)                                                                                                                               | `controls` is the sole hook argument; add the GM-only manager tool without modifying Foundry controls directly. |
| Existing `deleteRegion(region, options, userId)`                                                                                                                                                                                        | Continue exact effect cleanup when a manager dismissal deletes its Region.                                      |
| `foundry.utils.deepClone`                                                                                                                                                                                                               | Clone editable flag snapshots only when building an update; do not mutate a document's sealed source object.    |

The community wiki confirms that AppV2 applications render through
`HandlebarsApplicationMixin(ApplicationV2)` and that flags are the supported
namespaced extension point on existing Documents.

## Risks / Trade-offs

- **A reconcile action accidentally damages actors or repeats prompts** → Keep
  reconciliation separate from live movement dispatch and unit-test that no
  trigger/materializer is called.
- **A broad cleanup removes unrelated effects** → Dismiss only via
  `RegionDocument#delete`; retain existing full ownership matching and test
  same-spell/other-Region isolation.
- **A stale manager row targets a deleted Region** → Resolve the Region from
  the active Scene immediately before each action, show a German notification,
  and rerender rather than acting on a cached document.
- **Core Region tools and Ilaris manager conflict** → The manager only selects
  and opens the native sheet; it does not create geometry controls or hook
  private canvas APIs.
- **Malformed flags are unsafe to repair automatically** → Show them separately
  and offer only selection/native editing or dismissal, never automated
  migration in this change.

## Migration Plan

No compendium or schema migration is needed. Existing valid Zones become
visible automatically because their current `flags.Ilaris.zone` metadata is the
registry input. Existing ordinary Regions remain untouched. Existing malformed
Ilaris flags remain persisted and receive a visible warning; no automatic
rewrite occurs.

Rollback removes the manager/tool and registry helpers. It does not alter
existing Regions or their effect ownership metadata.

## Open Questions

None. The Scene Controls manager, native Region movement handoff, exact
duration editor, and non-triggering reconciliation boundary are settled.

## Testing Strategy

- Pure Jest tests in `scripts/combat/zones/_spec/` cover valid/malformed/core
  Region classification, sorted row summaries, duration validation, only-valid
  reconciliation, passive repair, and the absence of trigger/materializer
  calls for triggered Zones.
- Dynamic-import/Jest mocks cover document `update`/`delete`, scene Region
  collections, and active-GM gating. Follow the existing zone lifecycle test
  fixtures rather than creating synthetic Foundry documents by hand.
- AppV2 manager tests use the project’s DOM/action pattern to verify GM-only
  controls, row/action order, stale Region handling, native canvas handoff,
  confirmation before dismissal, and no duration input for permanent Zones.
- A focused Playwright E2E in `ilaris-e2e-world-v14363-r1` creates one
  persistent scene-round Zone and a separately owned comparison effect/Zone;
  an active GM opens the real Scene Controls manager, selects the row on the
  visible map, extends duration, runs reconciliation without a new chat/effect
  trigger, then dismisses it. It asserts visible removal and preservation of
  the comparison ownership. Existing zone lifecycle and wall traversal E2E
  cases are regression-run.
- Capture and inspect manager screenshots in light and dark mode. Teardown
  removes only created Regions/effects/messages/tokens and restores selection,
  settings, and the initial scene state even after termination.
