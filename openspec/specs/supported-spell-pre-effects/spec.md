## Purpose

Structured pre-effect coverage for reviewed spell compendium source entries, including explicitly bounded damage-only approximations and the documented deferred-mechanics boundary.

## Requirements

### Requirement: Reviewed supported spells provide structured pre-effects

The compendium source Items for Axxeleratus Blitzgeschwind (Tiergeist), Fulminictus Donnerkeil, Plumbumbarum schwerer Arm, Tlalucs Odem Pestgestank, Hexengalle, and Fluch des Gewürms SHALL define `system.preEffects` matching their reviewed immediate-damage, timed-modifier, and resistance behavior.

#### Scenario: Direct damage uses the shared damage pipeline

- **WHEN** Fulminictus Donnerkeil, Hexengalle, or Tlalucs Odem Pestgestank succeeds against a selected target
- **THEN** its direct damage pre-effect SHALL use `TRUE_DAMAGE`
- **AND** its Mächtige Magie bonus SHALL be configured per QS where the spell text grants one

#### Scenario: Timed modifiers use the spell duration

- **WHEN** Axxeleratus Blitzgeschwind (Tiergeist) or Plumbumbarum schwerer Arm succeeds
- **THEN** its pre-effect SHALL create the reviewed modifier changes for its stated Initiativephase duration

#### Scenario: Explicit profane resistance guards the reviewed branch

- **WHEN** Tlalucs Odem Pestgestank, Hexengalle, or Fluch des Gewürms requires its stated profane resistance
- **THEN** the relevant pre-effect SHALL use the existing avoid-test configuration
- **AND** damage that is not contingent on that resistance SHALL remain a separate immediate pre-effect

### Requirement: Spell-named marker convention remains data-only

The failed-resistance handlungsunfähig outcomes for Hexengalle and Fluch des Gewürms SHALL be represented by timed spell-named ActiveEffects with no numeric modifier, using a zero-value change solely because the current processor requires at least one change.

#### Scenario: Marker has no numeric effect

- **WHEN** a target fails the configured resistance for Hexengalle or Fluch des Gewürms
- **THEN** the created ActiveEffect SHALL retain the spell name as the table-visible marker
- **AND** its zero-value change SHALL not alter the actor's global modifier

#### Scenario: Fluch des Gewürms successful resistance uses its alternate modifier

- **WHEN** a target succeeds the configured Willenskraft resistance against Fluch des Gewürms
- **THEN** the diminished-only branch SHALL apply a timed global `-4` modifier instead of the marker-only branch

### Requirement: Accepted partial damage remains explicitly bounded

_Seelenfeuer_ and _Wand aus Flammen_ SHALL define one-time direct-damage
Pre-Effects only. Their ongoing zone, contact, crossing, and per-Initiativephase
behavior SHALL remain documented as manual/deferred. _Pandämonium_ SHALL
instead use the reviewed persistent passive-Zone lifecycle defined by the
`pandemonium-zone-spell` capability; its _Unheilig_ exception SHALL remain
explicitly documented as manual until generic Vorteil applicability exists.

#### Scenario: Remaining damage-only approximation is applied once

- **WHEN** _Seelenfeuer_ or _Wand aus Flammen_ succeeds against selected
  targets
- **THEN** the configured direct damage SHALL be applied once through the shared damage pipeline
- **AND** the system SHALL not claim to automate its omitted trigger or repeating behavior

#### Scenario: Pandämonium is no longer a one-time approximation

- **WHEN** a contributor reviews the supported spell inventory after this
  change
- **THEN** _Pandämonium_ SHALL be identified as a persistent passive Zone
- **AND** it SHALL not be described as a one-time damage-only approximation

### Requirement: Deferred candidates are separated from active inventory

The spell/liturgy effect inventory SHALL remove candidates requiring unsupported mechanics from its active lists and SHALL point to the deferred-mechanics documentation for their rationale. The corresponding compendium `_source` Items SHALL remain unchanged.

#### Scenario: Deferred mechanics remain discoverable

- **WHEN** a contributor reviews the inventory after this change
- **THEN** it SHALL identify that moving zones, delayed triggers, repeated damage, conditional modifiers, resource drains, and next-roll-only effects are deferred
- **AND** it SHALL link to the deferred-mechanics note
- **AND** the deferred spell and liturgy `_source` JSON SHALL remain present and unchanged

### Requirement: Selected numeric spell and liturgy effects receive complete coverage

The nine reviewed source Items in seven effect families SHALL receive one complete non-instant pre-effect each. Their numeric changes SHALL be limited to mechanics already supported by native ActiveEffects or semantic Ilaris modifiers; no partial, contact, zone, or ambiguous mechanics shall be implied.

Each selected source Item's stated Mächtige Magie/Liturgie increase SHALL be represented through the existing `amplifiedByMaechtigeMagie` and `maechtigBonus: "+2"` fields on its affected change or Ilaris modifier.

#### Scenario: Tanz der Schwerter applies its complete combat modifier

- **WHEN** Tanz der Schwerter succeeds against a selected target
- **THEN** it SHALL create one 16-owner-turn übernatürlicher ActiveEffect containing +4 GS, +2 AT, and +2 VT semantic Ilaris modifiers
- **AND** each semantic modifier SHALL use `strongest-supernatural` stacking

#### Scenario: Named-skill effects use exact talent selectors and converted duration

- **WHEN** Adlerauge Luchsenohr, Innere Ruhe, Mondsilberzunge, or Rahjas Wohlgefallen succeeds against a selected target
- **THEN** it SHALL create one owner-turn ActiveEffect with +4 `talent` Ilaris modifiers restricted respectively to `Sinnenschärfe`/`Wachsamkeit`, `Selbstbeherrschung`, `Überreden`, or `Menschenkenntnis`/`Betören`
- **AND** the effect duration SHALL be respectively 64, 7,680, 960, or 960 Initiativephasen

#### Scenario: MR effects use the native MR path and converted duration

- **WHEN** Psychostabilis, Psychostabilis (Tiergeist), or Tanz des Ungehorsams succeeds against a selected target
- **THEN** it SHALL create one owner-turn ActiveEffect with a +4 additive `system.abgeleitete.mr` native change
- **AND** the effect duration SHALL be 960 Initiativephasen for either Psychostabilis source Item and 23,040 Initiativephasen for Tanz des Ungehorsams

#### Scenario: Deferred mechanics remain out of selected coverage

- **WHEN** a contributor reviews this coverage set
- **THEN** source Items requiring contact/crossing triggers, zones, repeated damage, resource changes, next-roll consumption, direct main-attribute changes, derived armor protection, condition enforcement, or ambiguous blessings SHALL remain without a new pre-effect from this change
- **AND** the inventory documentation SHALL identify those categories as deferred or manual

### Requirement: Armed source Items are configured declaratively

Falkenauge Meisterschuss SHALL arm one ranged attack with +4 AT and consume on its next matching attack. Neun Streiche in einem SHALL collect `Bisherige Treffer auf Ziel` (`0..8`), add one W6 per stored hit only when its next matching attack hits, and consume its charge on that attack.
