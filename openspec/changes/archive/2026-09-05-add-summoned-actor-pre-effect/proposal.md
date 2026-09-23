## Why

The generic `summonCreature` pre-effect now resolves a configured compendium
creature and creates an unlinked Scene Token. _Skelettarius Totenherr_ is
therefore already covered as a permanent selection from the creature pack.
_Krähenruf_ still needs its concrete Krähenschwarm source, spell-defined
statistic overrides, and a 16-phase token lifecycle.

## What Changes

- Extend `summonCreature`, rather than introducing a parallel `summonActor`
  operation, with an optional fixed source UUID, token lifetime, and numeric
  or formula overrides amplified by Mächtige Magie.
- Add caster-turn cleanup for a timed summoned Token. Permanent creature
  summons remain on the Scene until the GM deletes them.
- Add a reviewed _Krähenschwarm_ creature source and configure _Krähenruf_
  to summon it at the nearest free grid position, preferring adjacency, for 16
  initiative phases with its WS/AT/TP Mächtige-Magie increases.
- Keep _Skelettarius Totenherr_ as the existing permanent `untot` selection.
  It deliberately gets neither material-token placement nor an action delay.

## Explicitly Out of Scope

- Per-cast World-Actor cloning, linked Tokens, GM socket routing, and a second
  `summonActor` payload. A managed, reused World Actor import of a configured
  compendium source is in scope because Foundry v14 requires it for an
  unlinked Token Actor.
- Corpse/material-token rules and an `einsatzfähig` readiness delay.
- Action enforcement, combatant creation, and concentration lifecycle.

## Capabilities

### New Capabilities

- `timed-creature-summons`: Track and remove only a timed unlinked summoned
  Token on the caster's turn.

### Modified Capabilities

- `supernatural-pre-effects`: Extend `summonCreature` with source restriction,
  lifetime, and value overrides.
- `pre-effect-item-sheet-base`: Author the additional creature-summon fields.
- `spell-pre-effect-data`: Add Krähenschwarm and reviewed Krähenruf data.
- `pre-effect-unit-tests` and `pre-effect-e2e-tests`: Cover the lifecycle and
  preserve generic creature/item-summoning regression coverage.

## Impact

This follows the committed generic creature-summoning runtime. It touches the
pre-effect processor, duration handling, a managed reusable world-Actor base,
the existing pre-effect sheet, compendium source data, and tests. It does not
add a socket route or a per-cast Actor clone.

### Testing Impact

- Unit coverage: fixed-source validation, managed base-Actor import/reuse,
  numeric/formula overrides, timed cleanup, permanent retention, and no
  cross-summon deletion.
- E2E: a Krähenruf cast creates a nearby non-overlapping Krähenschwarm with amplified
  values and removes only that token after its caster-turn duration.
- Regression: generic creature selection and existing item summoning.
