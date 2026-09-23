## Context

The system already resolves structured supernatural spell modifications into an effective pre-effect list and dispatches that list after a successful cast. `summonItem` is an existing pre-effect branch which resolves a configured compendium document, clones it, and records provenance. Creature summoning needs a different persistence boundary: the source Actor remains in the compendium, while the result becomes a token embedded in the current Scene.

Creature Actors already use `type: "kreatur"` and expose `system.kreaturentyp`. The world settings dialog already discovers packs from `game.packs`, groups them by document content, and stores selected pack collections as JSON strings. The implementation must remain Foundry VTT v14-compatible and use the existing AppV2/Handlebars and TypeDataModel patterns.

## Goals / Non-Goals

**Goals:**

- Add a reusable `summonCreature` pre-effect payload for normal and structured supernatural spell forms.
- Discover and filter Actor compendium entries by configured pack and `system.kreaturentyp`.
- Present a dependent creature-type and creature selector during casting.
- Keep the normal and structured supernatural talent Handlebars templates context-sensitive by hiding unrelated configuration fields when their parent option is disabled.
- Use the selected creature's `summoningDifficulty` and `summoningCost`, defaulting missing values to 12, as the effective spell profile.
- Create an unlinked TokenDocument adjacent to the caster on the current Scene, expanding the search ring when necessary.
- Open the generated creature sheet and leave the token available for manual GM cleanup.
- Reserve and later release spell-defined gAsP/gKaP binding costs on the held summoner Actor.
- Preserve existing item summoning, resistance, provenance, and structured-form behavior.
- Document the setup in the existing tutorial/quick-reference compendium so GMs can configure the feature without reverse-engineering the sheet.

**Non-Goals:**

- Automatically deleting summoned creatures or introducing a duration-based summon lifecycle.
- Creating permanent World-level Actors from compendium entries.
- Implementing multiple simultaneous creatures from one selection.
- Replacing the existing pre-effect dispatcher. A lifecycle listener for token deletion is in scope solely to release a recorded bound-resource reservation.
- Changing the underlying creature compendium entries except for explicitly reviewed spell source payloads.

## Decisions

### Use a creature-specific pre-effect beside summonItem

The payload is `preEffect.summonCreature` and contains an enabled flag, allowed `kreaturentyp` values, and the selected creature UUID at runtime. This keeps authoring data explicit, allows structured spell forms to inherit/extend/replace it with existing resolver semantics, and avoids overloading item-specific fields. A separate summon subsystem or a second spell execution path was rejected because it would duplicate successful-cast dispatch and provenance handling.

### Store configured Actor packs as a world JSON setting

Add `IlarisGameSettingNames.kreaturenPacks` and register it with `config: false`, `scope: "world"`, and default `['Ilaris.kreaturen']` serialized as JSON. The custom settings dialog discovers packs whose index contains `type: "kreatur"` Actors and persists checked collections using the existing compendium group workflow. This matches the current setting contract and avoids requiring a core Foundry settings menu.

### Resolve the selector in two stages

The authoring UI stores allowed creature types. At cast time, the dialog first selects one allowed type and then builds a second list from all Actors in selected creature packs whose `system.kreaturentyp` equals that type. The selected entry is carried through the effective pre-effect context by UUID. A direct UUID-only authoring field was rejected because it would prevent one spell form from offering a useful set of alternatives.

### Use Actor#getTokenDocument and Scene#createEmbeddedDocuments

The runtime resolves the selected Actor from a configured pack, validates that it is an Actor of type `kreatur`, and calls `Actor#getTokenDocument` with a position candidate. The resulting TokenDocument is persisted with `Scene#createEmbeddedDocuments("Token", [tokenData])`. This creates a scene-bound unlinked token without copying the source into `game.actors`; directly creating a World Actor was rejected because it would leave persistent summon records and require extra cleanup.

### Find placement through a bounded expanding ring

The first candidates are the grid spaces directly adjacent to the caster token, then successive rings. Candidate positions are generated in scene coordinates and rejected when they overlap existing scene tokens or fall outside scene dimensions. The first valid candidate is used. If no candidate is found within the configured search bound, the cast remains successful but the system warns that the creature could not be placed. This preserves the spell result while making a crowded scene recoverable by the GM.

### Treat creature profile values as replacement values

Once a creature is selected, `summoningDifficulty` replaces the normal spell difficulty and `summoningCost` replaces the normal energy cost. The normalized creature model supplies 12 for omitted or invalid legacy values. Addition was rejected because it would make the requested actor-level values difficult to author and would make the default 12 unexpectedly punitive when combined with ordinary spell values.

### Keep manual lifecycle and open the creature sheet after creation

No ActiveEffect marker or automatic deletion is added for the token. The created TokenDocument is returned to the caller, and its represented Actor/sheet is rendered after successful creation. This directly implements the requested manual cleanup behavior and avoids inventing a duration contract not present in the rules request.

### Reserve spell-defined bound resources

The spell may define a reusable `boundResourceCost` object on `summonCreature`:

```js
boundResourceCost: {
	resource: 'gasp', // 'gasp' or 'gkap'
	amount: 4
}
```

The resource type and amount belong to the spell, not the selected creature Actor, so future spell effects can reuse the same property with different binding costs. For the current scope, the held Actor performing the summon is always the summoner. After the normal summon cost is paid and before the summon is finalized, the system reserves the configured amount by updating the summoner's bound resource field. The reservation is recorded on the created TokenDocument with the summoner UUID, resource type, and amount. If the token is manually deleted, the recorded amount is released from that same held Actor. The release operation is idempotent and does not create an orphan Actor or depend on the summoned creature still being resolvable.

The authoring UI exposes the resource selector and amount only when a bound-resource cost is enabled. No bound-resource entry means no gAsP/gKaP reservation.

### Make domination checks optional and spell-configured

The `summonCreature` payload may contain a global `dominationChecks` configuration. Its `enabled` flag controls the feature for the complete spell, while each configured `kreaturentyp` entry contains a fixed difficulty and either an attribute check or a skill/talent check, following the existing skill-dialog conventions. The check is optional at both levels: if the global flag is false, or if the selected type has no entry, no check is shown or rolled. A type entry does not activate the feature when the global flag is disabled.

The shape is conceptually:

```js
dominationChecks: {
	enabled: true,
	daemon: {
		difficulty: 16,
		probeType: 'fertigkeit',
		fertigkeit: 'Willenskraft',
		talent: 'Beschwörung'
	},
	geist: {
		difficulty: 12,
		probeType: 'attribut',
		attribut: 'MU'
	}
}
```

The token is created and the creature sheet is opened before the domination check starts. The check result is presented only as success or failure. A failed check does not delete, delay, or otherwise alter the already-created token, its sheet, the summoning cost, or the spell result; it is informational and represents whether the creature follows the summoner's orders. This keeps domination separate from the successful-cast and token-persistence paths.

### Keep summon authoring fields context-sensitive

The shared `pre-effects.hbs` template and the structured `uebernatuerlich_talent.hbs` form SHALL hide or disable fields that do not apply to the currently enabled option. Creature-specific fields appear only when creature summoning is enabled; domination fields appear only when `dominationChecks.enabled` is enabled; attribute fields and skill/talent fields are mutually contextual to the selected probe type. This prevents unrelated item, resistance, or domination controls from appearing as one undifferentiated form.

### Explain setup in a tutorial compendium entry

Add a German tutorial or quick-reference entry to the existing tutorial-oriented compendium under `comp_packs/` (using the repository's established tutorial entry pattern). It SHALL explain selecting the `Ilaris.kreaturen` pack, configuring allowed creature types, enabling and configuring `dominationChecks`, and the resulting post-cast token and sheet behavior. The entry is documentation data, not a second configuration path.

## API Surface

### Foundry classes and methods

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): compendium Actor validation, `getTokenDocument`, `type`, `system`, and sheet access.
- [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html): token data and position validation.
- [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html): `createEmbeddedDocuments("Token", ...)` for persistence in the active Scene.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): existing pre-effect behavior remains unchanged; no new summon lifecycle effect is introduced.
- `game.settings.get`, `game.settings.set`, and `game.packs`: existing client APIs used for world configuration and pack discovery.
- `canvas.tokens`, `canvas.scene`, and `canvas.grid`: existing canvas collections and grid coordinate/measurement services used for placement.
- `fromUuid`: resolves the selected compendium Actor UUID.
- Existing skill/attribute probe dialog APIs: resolve the configured domination check and display only its success/failure outcome after token creation.

### Hooks

No new Hook is listened to or triggered. Existing successful-cast dispatch continues to call `applyPreEffects`; the new branch performs its work from that call path.

### Utilities

- [foundry.utils.deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html): clone authoring and effective pre-effect data before injecting runtime selector values.
- `foundry.utils.mergeObject`: preserve structured spell modification merge semantics when the selected creature is added to the effective context.

The API choices are checked against the [Foundry VTT v14 API](https://foundryvtt.com/api/v14/) and the [community API documentation](https://foundryvtt.wiki/en/development/api), including the documented document, compendium, settings, canvas, and utility patterns.

## Risks / Trade-offs

- **[Compendium packs can be unloaded or deleted]** -> Validate the configured collection and selected UUID at both authoring and runtime; show a warning and do not create a token when the source is unavailable.
- **[A pack can contain malformed or non-creature Actors]** -> Filter by Actor document type and `type: "kreatur"`, then validate `system.kreaturentyp` before presenting or resolving entries.
- **[Large creature packs can make selector preparation expensive]** -> Read pack indexes for type/name filtering and fetch only the selected document when creating the token.
- **[Token sizes can overlap adjacent spaces]** -> Build placement candidates through the TokenDocument dimensions and reject candidates that intersect existing token occupied spaces.
- **[Players may lack permission to create Scene tokens]** -> Reuse the normal Scene document permission workflow; report the Foundry failure as a user notification rather than silently claiming success.
- **[The actor sheet may be synthetic after token creation]** -> Open the created token's represented Actor/sheet after Scene persistence, not the compendium source document.
- **[Domination configuration may be incomplete]** -> Require the global `dominationChecks.enabled` flag and a matching selected-`kreaturentyp` entry; if either is absent or disabled, do not invent a fallback difficulty or force a roll.
- **[Conditional fields could leave stale values]** -> Hide irrelevant fields in the templates and normalize disabled branches on save so stale item, domination, attribute, or skill/talent values cannot affect runtime behavior.

## Migration Plan

1. Register the new setting with the default `Ilaris.kreaturen`; existing worlds receive the default through Foundry's setting registration without a data migration.
2. Add model defaults so existing creature Actors without the new fields resolve to 12.
3. Add the new pre-effect schema and UI without rewriting existing pre-effects.
4. Update only reviewed summoning spell source JSON where the feature is intended, then run `npm run pack-all`.
5. Validate with focused unit tests, E2E scenarios, `npm test`, and `npm run lint`.

Rollback is additive: remove or disable the new pre-effect payloads and setting usage. Existing item summoning and existing supernatural pre-effects remain valid. No generated LevelDB data should be edited manually; regenerated packs can be rebuilt from `_source/`.

## Testing Strategy

- Pure unit tests cover pack-index filtering, creature-type option generation, UUID validation, model fallback values, and deterministic expanding-ring candidate generation.
- Processor tests use mocked `fromUuid`, `Scene#createEmbeddedDocuments`, and actor sheets to verify successful creation, invalid-source warnings, and no-placement behavior.
- Dialog tests use the existing AppV2/dialog test patterns to verify dependent selector updates and replacement difficulty/cost profile values.
- Domination-check tests verify attribute and skill/talent configurations, fixed per-type difficulty, post-creation ordering, disabled missing configuration, and informational failure handling.
- Settings tests verify registration, default JSON, discovery of Actor packs, save/reset persistence, and the existing pack groups' regression behavior.
- E2E coverage uses a GM and player caster in an active world with `Ilaris.kreaturen` enabled, a creature summoning spell, a controlled caster token, and at least one occupied adjacent field. It verifies both selector stages, successful placement in the nearest available ring, sheet opening, and the optional domination result. It also covers the disabled/no-configuration case. Existing item-summoning E2E coverage remains a regression gate.
- Template tests verify that unrelated fields are hidden or disabled for inactive summon, domination, and probe-type branches. Tutorial-compendium data is checked for the setup steps and linked behavior.
