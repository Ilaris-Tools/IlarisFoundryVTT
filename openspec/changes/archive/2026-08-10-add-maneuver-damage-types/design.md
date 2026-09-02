## Context

The `damageTypes` world setting is already the behavioral registry for instant spell damage: each entry has a stable `value`, a GM-visible `label`, and behavior flags. Maneuver changes predate that registry. Their sheet reads the static `CONFIG.ILARIS.schadenstypen` map, and `CHANGE_DAMAGE_TYPE` converts the stored key into a display label before damage is applied. That breaks lookup for `STUMPF`; melee Rüstungsbrecher is not automated at all, and ranged Rüstungsbrecher bypasses armor through a separate hard-coded flag.

This change makes the registry the single source of truth for maneuver type selection, display, and damage behavior. It deliberately does not add a second maneuver-specific registry or new effect model.

## Goals / Non-Goals

**Goals:**

- Carry damage-type keys, never labels, from maneuver source data through combat resolution to damage application.
- Use the same world setting options and missing-type fallback/warning path for maneuver and spell damage.
- Express the two built-in mechanics through configurable behavior: `STUMPF` for Stumpfer Schlag and `TRUE_DAMAGE` for both Rüstungsbrecher variants.
- Keep combat summaries readable by looking up the current world-configured label only when rendering summary text.
- Make unmodified weapon damage registry-valid by starting melee and ranged flows at `PROFAN`.

**Non-Goals:**

- Do not add new behavior flags or alter the GM damage-type settings editor.
- Do not migrate arbitrary user-created maneuvers or rewrite their stored keys.
- Do not change rule text, maneuver prerequisites, damage dice, resistance rules, or target-selection behavior.
- Do not remove `CONFIG.ILARIS.schadenstypen` from unrelated legacy consumers in this change.

## Decisions

### Canonical values are registry keys

`CHANGE_DAMAGE_TYPE.value` and `rollValues.damageType` will contain keys such as `STUMPF`, `TRUE_DAMAGE`, and `PROFAN`. The registry resolves a current label only for chat/summary text. This keeps a renamed label functional and lets behavior lookups use the correct identity.

The alternative—using labels as identifiers—would make localization, label editing, and duplicate labels unsafe. Duplicating behavior in maneuver types would again split rule ownership.

### Resolve validity, behavior, and display through one shared registry boundary

The existing cached setting reader and once-per-key notification path in `shared-dialog-helpers.js` will be extended or wrapped so both modification rendering and `_applyDamageDirectly` receive a single resolved view: canonical effective key, label, behavior, and whether the requested key exists. A missing key emits the existing German warning once per current registry state and resolves to `PROFAN` behavior/label.

The resolver must reset its missing-key notification memory when the underlying setting value changes, so deleting a type after it was previously restored still produces a warning. This avoids a misleading silent fallback during long-lived Foundry sessions.

### Built-in maneuvers express their rules through behavior flags

- Stumpfer Schlag retains `CHANGE_DAMAGE_TYPE: STUMPF`. With the default registry this selects `targetsErschoepfung`; a GM may redefine it.
- Both Rüstungsbrecher items use `CHANGE_DAMAGE_TYPE: TRUE_DAMAGE`. With the default registry this selects `bypassesArmor`.
- The previous melee `SPECIAL_TEXT` and ranged `ARMOR_BREAKING` entries are removed so a missing or altered `TRUE_DAMAGE` registry entry cannot continue bypassing armor invisibly.

This favors a single extension point over retaining the old hard-coded behavior as a fallback. A deleted key must be safely profane, exactly like spell damage.

### Maneuver authoring reuses the existing sheet option provider

`ManoeverSheet` already inherits from `UebernatuerlichTalentSheet`, whose `_getDamageTypeOptions()` reads and parses the world setting. Its context will expose that same `damageTypeOptions` collection, and `manoever.hbs` will consume it for `CHANGE_DAMAGE_TYPE`. No additional setting parser is introduced.

### `PROFAN` replaces the legacy normal-damage marker

Melee and ranged dialogs will initialize their unmodified damage type as `PROFAN`. `NORMAL` remains available in static presentation configuration only where existing legacy UI requires it, but is no longer passed to the registry-backed damage pipeline.

## API Surface

- [`foundry.Game`](https://foundryvtt.com/api/v14/classes/foundry.Game.html) via `game.settings.get(namespace, key)` reads the registered world-scoped `damageTypes` value. No new setting is registered or written.
- The existing AppV2 `ManoeverSheet` rendering context is extended; no Foundry Document class is created, updated, or deleted by this change.
- No Foundry Hook event is listened to or triggered. Registry cache invalidation is driven by comparing the `game.settings.get` value at the existing resolver boundary.
- No new `foundry.utils.*` helper is required. The community wiki settings guidance confirms that world settings are the suitable shared registry and must be registered before access; implementation will check the relevant helper guidance before adding any normalization utility.

## Risks / Trade-offs

- [A world intentionally removed `STUMPF` or `TRUE_DAMAGE`] → The associated maneuver falls back to Profan/Wunden and shows the localized warning; this is safer than silently preserving stale special behavior.
- [A custom maneuver stores a label instead of a key] → It follows the same missing-key warning/fallback. No destructive migration changes user data.
- [Registry labels change during a running session] → Resolver cache detects changed raw settings and uses the new label/behavior on the next resolution.
- [Existing non-maneuver callers still use static labels] → They are explicitly out of this scoped migration; tests guard the maneuver and direct-damage paths.

## Migration Plan

1. Update the three built-in maneuver `_source/` documents to canonical keys and remove obsolete modifications.
2. Run `npm run pack-all` while Foundry is stopped, then restart/reload Foundry so the updated compendium and JavaScript are used together.
3. Existing world copies of the built-in maneuvers are not silently altered; GMs can update/reimport them or retain their current data. Missing references remain safe through runtime fallback.
4. Rollback consists of restoring the prior compendium data and static modifier behavior; no persistent world schema changes are introduced.

## Open Questions

None. The existing default registry already provides `STUMPF` and `TRUE_DAMAGE` with the required flags.

## Testing Strategy

- Extend the existing Jest mocks in `scripts/combat/_spec/shared_dialog_helpers.test.js` to test key preservation, label resolution, cache refresh, warning/fallback, `STUMPF`, and `TRUE_DAMAGE` behavior.
- Extend `scripts/items/sheets/_spec/manoever.spec.js` with the existing sheet-context/mocked-settings pattern to prove custom registry options reach the maneuver selector.
- Extend compendium source-data tests using direct JSON reads to lock the three built-in maneuver records to their canonical keys and prohibit the removed hard-coded modifiers.
- Add a dedicated E2E case alongside the existing maneuver combat cases. It runs as GM in the baseline world against `HatAlles` and `Testlauf-Npc`, restores the world setting after each case, and covers selected maneuver behavior and the stale-key warning/fallback. No helper is promoted to `e2e/shared/` unless setting snapshot/restore is needed by another suite.
