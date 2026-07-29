## Context

The existing pre-effect processor reads structured data from supernatural Item documents, applies immediate damage through the shared damage pipeline, and creates timed embedded ActiveEffects for modifiers. The curated inventory now distinguishes compatible spell data from mechanics that need a later state/trigger model.

This change is deliberately data-first: it adds reviewed source data and documentation without extending the runtime schema, dialog, or processor.

## Goals / Non-Goals

**Goals:**

- Add exact or deliberately documented partial pre-effects for the nine accepted spells.
- Preserve the current manual targeting and non-numeric `Magieresistenz` workflow.
- Encode `handlungsunfähig` as a timed spell-named marker where the table only needs a visible identifier.
- Move deferred candidates out of the active inventory and document their deferred mechanics, without deleting or changing their compendium source data.

**Non-Goals:**

- No new generic marker, status, outcome-branch, zone, trigger, or resource-drain API.
- No automatic enforcement of `handlungsunfähig`.
- No automatic spatial selection, per-Initiativephase damage, distance scaling, or contact/crossing resolution.
- No attempt to model effects deliberately excluded in `docs/develop/pre-effect-deferred-mechanics.md`, including Fluch der Verwirrung's target Magieresistenz counter-check.

## Decisions

### Source-data-only implementation

Each accepted entry is edited only in its `_source` JSON. The current processor already deserializes `system.preEffects`; adding runtime logic would broaden the scope and risk changes to all existing effects. The packed compendium is rebuilt after the source edits.

### Damage-type and duration mapping

SP damage uses the configured `TRUE_DAMAGE` type so the existing shared damage pipeline bypasses armour. Persistent modifiers use the spell's stated Initiativephase duration. `Pandämonium`, `Seelenfeuer`, and `Wand aus Flammen` receive a one-time damage approximation only; their missing trigger/repetition rules are documented beside the data.

### Marker convention without a new schema

`Hexengalle` and the failed-resistance branch of `Fluch des Gewürms` create a timed ActiveEffect named after the spell. A zero-value `system.modifikatoren.manuellermod` change satisfies the current processor's non-empty-change requirement without changing a numeric outcome. The spell-named ActiveEffect is the table-visible identifier for handlungsunfähig; the system does not claim to enforce the condition.

For `Fluch des Gewürms`, one `diminishedOnly` pre-effect encodes the two existing branches: a failed Willenskraft resistance creates the marker (full value `0`); a successful resistance creates the diminished global `-4` modifier. This uses existing behavior rather than adding an outcome schema.

Alternative considered: adding `markerId`, `effectName`, and distinct success/failure payloads. This is clearer and more general, but is intentionally deferred in the design note.

### Existing resistance workflow

Where a spell names an explicit profane resistance (Zähigkeit or Willenskraft), the current avoid-test flow is used. `Magieresistenz` remains the spell's non-numeric difficulty and is manually confirmed in the existing dialog; it is not encoded as a profane avoid test.

## API Surface

- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): source compendium Items provide `system.preEffects`; no Item API method is added or overridden.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): existing processor behavior creates timed embedded effects from the supplied source data; no ActiveEffect API method is added or overridden.
- Foundry Hook events: none are added or changed. Existing system events `Ilaris.postAngriff` and `Ilaris.postSkillRoll` are exercised by regression tests only.
- `foundry.utils.*`: none are introduced. The community API documentation was checked; this data-only change reuses the processor's existing data flow.

## Risks / Trade-offs

- [Damage-only approximations can look complete] → Document the omitted zone/contact/repetition behavior in the inventory and test only the intentional one-time damage.
- [Spell-named marker is not a rules-enforced condition] → State that it is a table-visible convention and retain the generic marker proposal as deferred.
- [Zero modifier could be misunderstood] → Keep it confined to the two marker cases and assert in tests that it produces no global modifier.
- [Compendium source and packed data diverge] → Run `npm run pack-all` and review the generated pack diff.

## Migration Plan

1. Update only source JSON and documentation.
2. Rebuild compendium packs.
3. Roll back by removing the added `preEffects` objects and rebuilding packs; no actor migration is needed because existing owned Items tolerate absent pre-effects.

## Testing Strategy

- Data-focused unit tests validate each accepted JSON entry's effect shape, damage type, duration, amplification, and resistance configuration. Follow existing Jest dynamic-import and mocked-Foundry patterns in `scripts/effects/pre-effects/_spec/`.
- Extend processor/resist tests for zero-value marker creation and the diminished-only success branch only if current tests do not cover those observable outcomes.
- Extend the existing Playwright pre-effect/resistance flows with one direct-damage item, a timed modifier/marker item, and an explicit documentation of the damage-only approximation. Reuse the baseline world, GM account, and one-worker configuration; no extra client is needed.
- Run the full Jest suite, scoped non-mutating ESLint, `npm run pack-all`, and the affected E2E cases.

## Open Questions

None for this scoped data change. The deferred marker and outcome-payload architecture remains documented separately.
