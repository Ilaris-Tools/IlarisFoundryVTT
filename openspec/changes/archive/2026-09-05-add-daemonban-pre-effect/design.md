## Context

`system.spellModificationPreset: "antiMagic"` supplies four in-memory forms
for ten anti-magic spell sources. Its normalizer deliberately prefers that
preset over `system.spellModificationGroups` and `system.spellModifications`;
consequently no source can adapt a form, including the Zone and Pre-Effect
required by _Dämonenbann: Magie unterdrücken_. The existing passive Zone path
already creates one Region-owned, target-owned modifier effect for each
contained Token and removes it on membership loss or Region cleanup.

This change is source-data only. It replaces the preset marker in all ten
current consumers with equivalent explicit form data, then adds the reviewed
suppression data to _Dämonenbann_'s _Magie unterdrücken_ form.

## Goals / Non-Goals

**Goals:**

- Make every anti-magic spell's four forms editable source data while
  preserving its current selection and profiles.
- Make _Dämonenbann: Magie unterdrücken_ apply the rule-defined `-8` penalty
  to future `Dämonisch` rolls in its persistent Zone.
- Preserve the table-managed treatment of every other anti-magic form.
- Reuse current structured form, persistent Zone, passive ownership, and
  Ilaris-modifier semantics without adding a new rules mechanism.

**Non-Goals:**

- No compatibility path for `spellModificationPreset`: the feature has not
  been released, so no user data requires it.
- No automation for counterspells, dispelling, creature banishment,
  Magieresistenz, or generic spell applicability.
- No new Zone scheduler, target filter, user interface, setting, condition,
  or migration.

## Decisions

### Make the four forms explicit for every current anti-magic source

Remove `spellModificationPreset` from every current anti-magic spell source
and author an equivalent required `antiMagicForm` group plus its four choices
in `spellModificationGroups` and `spellModifications`. This is necessary
because the existing preset intentionally overrides authored form arrays.

All unaffected forms retain their current profile and German table-managed
description. Each selected form uses `effectMode: "replace"`, matching the
preset's behavior. Remove the preset constants, resolver branches,
`spellModificationPreset` model field, and preset-specific test because the
unreleased feature has no compatibility obligation.

### Represent suppression as a passive circle and a skill selector

The _Magie unterdrücken_ form owns a freely placed circle with:

- `distance: 16`, `placement.range: 8`, and `targeting.includeCaster: true`;
- persistent/passive lifecycle, 960 scene rounds (one hour), and create/entry
  triggers;
- one non-instant Pre-Effect with `durationType: "infinite"` and a normal
  roll-phase `probe` modifier scoped by `selector.fertigkeit: "Dämonisch"`.

The base value is `-8`; `amplifiedByMaechtigeMagie` plus
`maechtigBonus: "-4"` makes the authored increase visible through the existing
modifier materializer. `includeCaster` is explicitly enabled because the rule
applies to every future `Dämonisch` cast in the Zone, including a caster who
is standing in it. A temporary effect on the casting actor or a global roll
hook would either omit other occupants or outlive Region membership.

### Keep cleanup owned by the Zone lifecycle

No duration is placed on the individual Pre-Effect beyond the existing
infinite passive-zone timing. The Region membership lifecycle is the sole
owner of application and cleanup, so leaving the area, dismissal, deletion,
or expiry removes only that Region's modifier application.

## API Surface

- Existing [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html)
  source data is changed; no Item method is added or overridden.
- Existing [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html),
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html),
  and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  runtime paths consume the data unchanged.
- No Foundry Hook event is added, listened to, or triggered by this change.
- No `foundry.utils.*` helper is newly used. The community API reference was
  checked; no data-cloning or document helper is required for source authoring.

## Risks / Trade-offs

- **Repeated source forms drift between anti-magic spells** → source data is
  deliberately the adaptable authority; add a data test that asserts all ten
  form IDs, group constraints, and shared profiles.
- **A pre-release world happens to contain the preset field** → this branch is
  intentionally breaking for that unreleased data shape; recreating the Item
  from the refreshed compendium restores the canonical source data.
- **Caster does not receive the penalty** → author `targeting.includeCaster:
true` and cover it in E2E.
- **A modifier leaks after leaving the Zone** → rely only on the established
  passive ownership path and regression-test entry/leave/dismissal cleanup.
- **A non-`Dämonisch` roll is penalized** → scope the authored modifier by
  `selector.fertigkeit`, not merely by its broad `probe` target.

## Migration Plan

1. Edit the ten authoritative `_source` JSON files and run `npm run pack-all`.
2. Remove the obsolete preset constants, branches, model field, and test.
3. No user-data migration is needed because this feature has not been released.
   Rollback restores the preset implementation and source markers together.

## Open Questions

None.

## Testing Strategy

- Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` with
  source-data assertions for every migrated source and the concrete
  _Dämonenbann_ Zone. This is a pure Jest data test and needs no Foundry client.
- Run existing structured-form resolution, modifier-resolver, and Zone-profile
  unit suites to ensure the authored fields resolve without new code.
- Use the standard local E2E world with an active GM, a caster, and an owned
  target Token. The scenario verifies Region placement, in/out membership,
  caster inclusion, Mächtige-Magie scaling, and cleanup. Inspect the existing
  dialog/map/chat surfaces in the supported current UI theme; there is no
  changed sheet layout.
- Keep the shared E2E baseline limited to stable world dependencies. Individual
  setting scenarios remain owned by the tests that exercise them, so unrelated
  optional settings cannot prevent this runtime verification from starting.
