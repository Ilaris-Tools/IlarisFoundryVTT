## Context

`actor.profan.fertigkeiten` is a prepared array of embedded profane skill Items. The hero-sheet template currently puts its Handlebars iteration index into the roll control. `wuerfelwurf()` forwards that value as `fertigkeitKey`, and `FertigkeitDialog` uses it to read PW/PWT. The resistance handler repeats this contract after matching an `avoidTest.fertigkeit` name on the target.

## Goals / Non-Goals

**Goals:**

- Use the profane skill's stable embedded Item ID from each normal or resistance roll entry point until dialog calculation.
- Retain existing PW/PWT and talent-selection behavior.
- Leave configured resistance skill and talent data backward compatible.

**Non-Goals:**

- Do not change the `avoidTest` data model, compendium references, roll formulas, dialog hooks, or the attribute/free-skill paths.
- Do not add a migration or edit compendium source data.

## Decisions

### Keep `fertigkeitKey` as the dialog option name, change its profane-skill value to an ID

The option already carries an actor-local reference for profane checks, while attribute checks use an attribute key and other check types use `null`. Retaining the option name avoids a broad API rename. For `probeType: 'fertigkeit'`, its value becomes the selected embedded skill Item ID.

An alternative is a new `fertigkeitId` option. It is clearer in isolation but requires duplicative/transition state across all dialog consumers without improving runtime correctness.

### Resolve against the Actor's embedded Item collection

The dialog will retrieve the skill via `actor.items.get(fertigkeitKey)` and use the retrieved Item's current `system.pw`/`system.pwt`. The v14 [EmbeddedCollection#get](https://foundryvtt.com/api/classes/foundry.abstract.EmbeddedCollection.html) contract is explicitly ID-based, unlike the prepared array.

The alternative—finding the skill again by name—would keep normal rolls dependent on mutable display names and would not address issue #494.

### Resolve resistance configuration at its boundary, then pass the ID

`avoidTest.fertigkeit` remains a configured skill name because talent parent references and existing pre-effects use that domain value. The resistance handler finds the target's prepared profane skill by name, validates optional talent ownership, and passes `skill.id` to the common dialog. The target actor remains authoritative for its current PW/PWT and talents.

### Reset declared E2E setting defaults before baseline validation

The shared login fixture will restore only the settings explicitly listed in `E2E_BASELINE.settingDefaults` after Foundry is ready, then run the normal baseline assertion. This repairs a test world after a timed-out process bypasses an individual test's `afterEach` cleanup while retaining checks for world identity, users, actors, ownership, and active scene.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): supplies the target's embedded Item collection and prepared profane skill list.
- [EmbeddedCollection#get](https://foundryvtt.com/api/classes/foundry.abstract.EmbeddedCollection.html): retrieves the selected embedded Item by stable ID.
- Existing system hooks `Ilaris.preSkillDialog(actor, options)`, `Ilaris.preSkillRoll(dialog, payload)`, and `Ilaris.postSkillRoll(dialog, payload)` are not redefined or newly listened to.
- No `foundry.utils.*` helper is needed; the collection lookup covers the required stable-reference behavior. The [Foundry community API guidance](https://foundryvtt.wiki/en/development/api) was checked for a helper requirement.

## Risks / Trade-offs

- **[A stale or deleted item ID is passed to the dialog]** → Fall back to the already supplied `pw`, matching current defensive behavior, and do not throw.
- **[A caller still passes a numeric index]** → Update every `probeType: 'fertigkeit'` caller and its tests within this change; attribute/free-skill callers are explicitly unchanged.
- **[Prepared talent data and embedded Item state differ]** → Preserve the existing target-side prepared talent validation and use the resolved skill Item only for live PW/PWT lookup.
- **[A non-E2E user changes a declared baseline setting]** → Startup deliberately restores it because the named E2E world is test-owned; settings outside the declared baseline remain untouched.

## Migration Plan

1. Deploy the coordinated template, normal-roll, resistance, and dialog changes together.
2. No persisted data stores an array index, so no world or compendium migration is required.
3. Rollback is a code-only revert; existing pre-effects retain their configured skill names and talents.

## Open Questions

None.

## Testing Strategy

- Extend `scripts/skills/_spec_/skills-api.spec.js`, using its existing `new FertigkeitDialog(...)` and mocked actor patterns, to assert specific talent and no-talent calculation retrieve PW/PWT from an Item ID.
- Extend `scripts/effects/pre-effects/_spec_/resist-handler.spec.js` to assert a matched skill passes its ID, retains the configured talent when owned, and falls back without it.
- Update E2E-006 to open a hero's profane skill from the rendered sheet after the `data-fertigkeit` value becomes its Item ID.
- Extend E2E-026's resistance prompt flow to verify a skill-based resistance dialog still opens with correct PW/PWT and optional talent selection.
