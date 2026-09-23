## Why

All ten anti-magic spells currently obtain their four mutually exclusive forms
from an in-memory `antiMagic` preset. That prevents source-level adaptation of
a spell form and caused _Dämonenbann: Magie unterdrücken_ to leave both its
Zone and its `-8` difficulty penalty to the table. The existing structured
form, persistent passive-Zone, and skill-scoped Ilaris modifier mechanisms can
represent the required source data.

## What Changes

- Replace the hard-coded preset usage in all ten anti-magic spell sources with
  equivalent, explicit structured form data. Every source retains the four
  mutually exclusive anti-magic choices and their existing profiles.
- Author _Magie unterdrücken_ as a freely placed, persistent 16-step-radius
  passive Zone lasting one hour. It applies an infinite, Zone-owned `-8` roll
  modifier to the `Dämonisch` skill for every contained token, including the
  caster when contained.
- Author the rule's Mächtige-Magie increase as an additional `-4` penalty per
  configured stage. The Zone must use the existing placement, membership, and
  cleanup lifecycle; no new scheduler, status condition, setting, or generic
  anti-magic code is introduced.
- Preserve table-managed/manual resolution for the three other _Dämonenbann_
  forms and all non-_Dämonenbann_ anti-magic forms. This change makes their
  form data adaptable but does not expand their automation.
- Remove the in-memory `antiMagic` preset, its source-schema field, and the
  preset-specific resolver branches and tests. Structured source data becomes
  the sole form representation.

The change modifies compendium Item data and removes the unreleased
in-memory-only anti-magic preset path. It is additive to existing Zone and
modifier mechanisms and removes no released system capability.

## Capabilities

### New Capabilities

- `antimagic-spell-modification-source-data`: All anti-magic spells author
  their mutually exclusive forms in compendium source data; _Dämonenbann_
  additionally resolves _Magie unterdrücken_ as a persistent, skill-scoped
  suppression Zone.

### Modified Capabilities

- None.

## Impact

- Modify the ten current `antiMagic` spell sources in
  `comp_packs/zauberspruche-und-rituale/_source/` and rebuild the
  corresponding compendium pack. Each source remains a
  [Foundry Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html)
  and uses existing system data fields.
- At runtime, existing code creates a Scene-owned
  [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
  and target-owned
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  applications. This change adds no Foundry class usage, Hook listener, Hook
  dispatch, or `foundry.utils.*` call; it also removes the obsolete
  in-memory preset resolver path and `spellModificationPreset` schema field.
- No dependency, migration, world setting, or UI-layout change is required.

## Testing Impact

- Unit/data: extend existing supported-spell source-data coverage to validate
  that all ten anti-magic sources have the four explicit, required forms and
  no longer use the preset. Replace the preset-resolver unit test with a
  structured-form equivalent. Validate the reviewed _Dämonenbann: Magie
  unterdrücken_ profile, Zone, `Dämonisch` selector, `-8` base penalty, and
  `-4` Mächtige-Magie increment. Existing structured-form, passive-Zone, and
  modifier-resolver unit suites remain regression coverage.
- E2E/runtime: in `ilaris-e2e-world-v14363-r1`, use an active GM, caster, and
  one owned non-caster Token on an active Scene. Cast the form, place the Zone,
  and verify its visible Region plus a `-8` modifier on a contained
  _Dämonisch_ roll; verify a non-contained Token is unaffected, the caster is
  affected when contained, Mächtige Magie adds `-4`, and removing/expiring the
  Zone cleans up the modifier. Existing Zone placement, passive ownership, and
  structured anti-magic-form cases require regression verification. Promote
  shared E2E helpers only if a second case needs them.
