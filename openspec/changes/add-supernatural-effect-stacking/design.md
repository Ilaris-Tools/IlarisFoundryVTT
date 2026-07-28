## Context

Native Foundry Active Effects provide persistence, duration, transfer, and the existing configuration workflow for Ilaris buffs and debuffs. Their `changes` array is appropriate for unconditional Actor paths but cannot express weapon Fertigkeit, Talent, or situation contexts.

The Ilaris rule suppresses a weaker supernatural contribution only where it overlaps a stronger one. An ActiveEffect can therefore remain partly effective. Global `isSuppressed` is not suitable because it disables the whole document. Ordinary Vorteile must continue to add normally.

This change spans effect data/configuration, Actor preparation, combat and skill rolls, settings, Pre-Effect authoring, compendium data, and LLM generation. Existing native `changes` remain compatible and preparing data must not persist an Actor update.

## Goals / Non-Goals

**Goals:**

- Keep all buffs and debuffs as native Foundry ActiveEffects.
- Add declarative Ilaris modifiers for contextual and non-stacking rule values.
- Add ordinary components, but select only the strongest matching supernatural component regardless of whether components share an ActiveEffect document.
- Resolve explicit prepare modifiers in the Actor lifecycle and roll modifiers in a complete roll context; keep semantic main-attribute modifiers out of prepared Actor data.
- Let each world select Ilaris rules or normal Foundry-style addition.

**Non-Goals:**

- Reinterpret arbitrary pre-existing native `changes`.
- Model an individual suppressed component by setting `disabled` or `isSuppressed`.
- Introduce freely executable effect scripts.
- Let a later maneuver change the strength or resolved contribution of an Ilaris effect.
- Require multiplayer coverage for this feature.

## Decisions

### Separate semantic modifiers from native changes

`IlarisActiveEffectDataModel` retains Foundry's `changes` array for unconditional data paths and adds validated `system.ilarisSource` and `system.ilarisModifiers` data. A modifier has `phase` (`prepare` or `roll`), a canonical `target`, additive `value`, `mode`, `stacking` (`add` or `strongest-supernatural`), optional numeric `comparisonValue`, and optional `selector.fertigkeit`, `selector.talent`, and `selector.situation` lists.

The initial canonical target registry covers explicit prepared values such as GS, roll-only attribute targets such as KK or GE, AT, VT, a shared damage output for TP/Waffenschaden effects, and general probe/talent outputs. Semantic attribute targets are never prepare-capable: they resolve only when a skill or talent probe actually uses that attribute. A modifier requiring Ilaris stacking uses a canonical target, rather than an arbitrary path, so suppression is resolved before an uncontrolled derived-value cascade occurs.

Source classification belongs to the effect so the resolver can identify a supernatural origin. `stacking` belongs to components because comparison occurs at the matching modifier contribution: matching supernatural components compete even when they are stored on the same effect document. Vorteil/manual effects default to `ordinary`; Pre-Effects from Zauber, Liturgien, and Anrufungen set `uebernatuerlich`.

The alternatives were selectors inside native `changes`, untyped flag payloads, and executable scripts. They were rejected because native changes lack roll context, untyped data has no reliable editing/validation contract, and scripts are unsafe and harder to maintain.

### Resolve ordinary and supernatural components by context

`resolveIlarisModifiers(context)` is a pure service accepting Actor, phase, canonical target, and optional weapon, Fertigkeit, Talent, and situation context. It collects active effects with `Actor#allApplicableEffects()` and filters matching components. It adds every ordinary `add` contribution. In Ilaris mode it selects one strongest matching `strongest-supernatural` component from all eligible supernatural effects, including components held by the same ActiveEffect document; in Foundry mode it adds all contributions. It returns the result and a compact ledger of selected and component-locally suppressed values.

Components compete only when they resolve to the same output context and mode. TP and Waffenschaden semantic modifiers share the damage comparison group. Strength is the absolute raw `comparisonValue`; if absent, a fixed or linear W6 value uses expected value (`XW6 = X × 3.5`). The selected signed value is applied as a terminal effect-derived damage contribution after maneuvers. Later maneuvers therefore neither alter the comparison nor multiply, halve, or otherwise change that contribution.

This means that, when both modifiers are supernatural, an effect granting +1 AT generally and +2 AT/Klingenwaffen contributes only +2 for Klingenwaffen; the general +1 remains effective for other Fertigkeiten. If the general +1 is ordinary instead, it adds to the selected +2 supernatural component. A general +4 effect remains active outside the Klingenwaffen overlap where a +8 effect wins. Likewise, a +3 TP effect beats a +2 Waffenschaden effect even if Hammerschlag is selected later; the maneuver changes neither +3 nor +2.

Adding every matching supernatural component, persisting suppression on a losing effect, and using `isSuppressed` were rejected. The first violates the non-stacking rule for overlapping supernatural changes; the latter choices disable unrelated contributions.

### Integrate at two explicit lifecycle boundaries

Prepare modifiers resolve inside the Ilaris Actor implementation of Foundry's `Actor#applyActiveEffects(phase)`: the system calls the core implementation first, then applies explicitly prepare-capable semantic results at the established pre-derived-data boundary. It changes only prepared data and never calls `update()` or persists a derived value. Semantic main-attribute modifiers are explicitly excluded from this path, so a GE effect does not alter GS, INI, or any other derived actor value.

Roll modifiers resolve only once `AngriffDialog`, `FernkampfAngriffDialog`, defense handling, or `FertigkeitDialog` has the actor, weapon, Fertigkeit, Talent, tested attributes, and optional situation. For a main-attribute modifier, `FertigkeitDialog` requests the matching attribute contribution only for the relevant check; it does not read or write a modified Actor attribute. The caller adds the resolved result to the existing formula and passes the ledger to Handlebars context for a visible effect-derived breakdown. For damage, the effect-derived contribution is appended after maneuver transformations, so a maneuver has no effect on an Ilaris effect's strength or value.

The implementation must confirm the exact v14 phase name and existing Ilaris preparation order before overriding code. A separate Hook is deliberately not used because the Actor lifecycle gives a deterministic order relative to native changes.

### Read the world setting during resolution

`supernaturalEffectStacking` is a world-scoped setting with `ilaris` as default and `foundry` as alternative. The resolver reads it for every preparation or roll. In `foundry` mode every matching modifier is additive, including `strongest-supernatural` entries.

Reading at resolution time makes a GM's change effective for existing permanent and timed effects immediately. No effect document, duration, or ownership state is modified.

### Author both modifier forms explicitly

`IlarisActiveEffectConfig` gains a German Ilaris-Modifikatoren part/tab beside the native Changes UI. The Pre-Effect editor gains a separate modifier list. The processor copies `changes` unchanged, writes `ilarisModifiers` to the created effect's system data, and marks spell effects `uebernatuerlich` while preserving existing spell/caster/origin flags.

The LLM schema documents both forms and directs contextual or supernatural non-stacking bonuses to `ilarisModifiers`. It retains native changes for an unconditional path change.

Axxeleratus is the reference compendium migration: +4 GS is a prepare modifier, +2 AT and +2 VT are general roll modifiers, and each uses supernatural strongest-effect stacking. Only `_source/` JSON is edited; `npm run pack-all` regenerates the packs.

## API Surface

| API                                                                                                              | Use in this change                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)                       | Active state, system data, `isSuppressed` boundary, and review of `shouldApplyChange(change, { phase })`.                      |
| [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)                                     | `allApplicableEffects()` collects direct/transferred effects; `applyActiveEffects(phase)` supplies the prepared-data boundary. |
| [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html) | AppV2 parts, `_prepareContext`, and form processing for the modifier editor.                                                   |
| Foundry data fields / existing effect TypeDataModel                                                              | Validate source and modifier data in the existing schema after verifying exact v14 field signatures.                           |
| `game.settings`                                                                                                  | Register and read the world stack-mode setting through the existing Ilaris settings infrastructure.                            |

No new Foundry Hook is introduced. Existing `combatTurn` and `updateCombat` hooks remain duration-only mechanisms. No new `foundry.utils.*` dependency is planned; implementation must check the [community API guide](https://foundryvtt.wiki/en/development/api) for a supported helper such as `deepClone` before adding a local equivalent.

## Risks / Trade-offs

- **[Prepared-data ordering differs from the assumed flow]** → Verify v14 signatures and Ilaris `prepareBaseData`/`prepareDerivedData` order first; add a focused Actor test.
- **[Selector names drift from weapon data]** → Reuse existing Fertigkeit/Talent values, normalize only in the resolver, and test exact matches.
- **[A formula cannot be compared safely]** → Require `comparisonValue` for formulas without a raw fixed or linear W6 magnitude and show editor validation feedback.
- **[Legacy and semantic buffs double count]** → Do not auto-convert native changes; migrate each affected compendium component exactly once and test it.
- **[Transferred Item effects are missed]** → Use `allApplicableEffects()` and add a transferred-effect unit test.

## Migration Plan

1. Add the data fields, resolver, and setting while retaining every existing native change behavior.
2. Add effect and Pre-Effect authoring, then migrate affected spell `_source/` documents beginning with Axxeleratus.
3. Run `npm run pack-all` after modifying the source compendium JSON.
4. Existing world ActiveEffects remain valid because their `changes` are not rewritten; newly created semantic effects use the current world mode.
5. Rollback restores the prior system and compendium source. There is no destructive automatic world-data migration; unknown semantic data is inert to an older system version.

## Testing Strategy

Unit tests isolate the resolver and cover selector matching, competing supernatural components from the same effect, partial overlap, ordinary plus supernatural totals, reactivation after expiry, both world modes, signed values, `XW6` expected comparison, unsupported formulas, source classification, and transferred effects. Attribute tests prove that a GE or KK effect changes only matching probe calculations and never prepared attributes or derived values such as GS. Damage tests prove that TP/Waffenschaden comparisons and terminal effect contributions remain unchanged when a later maneuver modifies ordinary weapon damage. Further tests cover prepare application without Actor persistence, Pre-Effect payload mapping, combat formulas, and skill dialog integration.

E2E tests extend the existing GM baseline world: configure a semantic Pre-Effect, cast it, assert the resulting ActiveEffect data and source classification, then exercise an overlapping combat or probe bonus in both setting modes. Existing effect-tab, Pre-Effect sheet/buff, melee, ranged, and skill-dialog cases remain regression coverage. No additional player account is needed.

## Open Questions

- Confirm the initial canonical target IDs against current combat and Actor data models; public editor labels remain German regardless of stored identifiers.
- Decide after reviewing current dialog templates whether detailed suppression ledger entries are always visible or behind a details disclosure. This does not change resolution semantics.
