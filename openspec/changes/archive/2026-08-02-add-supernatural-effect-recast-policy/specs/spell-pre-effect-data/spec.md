## MODIFIED Requirements

### Requirement: Buff spells have duration-based pre-effects

Simple buff spells and liturgies with fully representable numeric modifiers and non-instant duration SHALL include pre-effect configurations that
create ActiveEffects using Ilaris owner-turn timing. Durations stated in
minutes, hours, or days SHALL be converted at one minute = 16
Initiativephasen. Many buff spells require careful key path mapping â€” some
effects map to derived/computed values not directly addressable as data model
fields.

Rule-aware bonuses SHALL use semantic `ilarisModifiers` where a raw actor path
cannot express their scope or their non-stacking behavior; classical Foundry
changes remain available for ordinary path changes. During the reviewed
duration-aware iteration, every source Item named in the selected-coverage
scenario SHALL be migrated in its `_source/` data to the appropriate native
change or semantic Ilaris modifier representation.

#### Scenario: Axxeleratus creates rule-aware GS, AT, and VT modifiers

- **WHEN** a GM casts Axxeleratus and the spell succeeds
- **THEN** it SHALL create an ActiveEffect with `durationType: "ownerTurns"`
- **AND** its GS bonus (+4) and its AT (+2) and VT (+2) bonuses SHALL be
  represented as Ilaris modifiers with Ã¼bernatÃ¼rlicher strongest-effect
  stacking semantics
- **AND** the AT and VT bonuses SHALL retain a general combat scope rather
  than being stored as duplicate `system.modifikatoren` path changes

#### Scenario: Psychostabilis creates an owner-turn semantic MR ActiveEffect

- **WHEN** a GM casts Psychostabilis and the spell succeeds
- **THEN** an ActiveEffect with `baseDuration: 960` SHALL be created
- **AND** it SHALL contain a prepare-phase `mr` Ilaris modifier with
  Ã¼bernatÃ¼rlicher strongest-effect stacking semantics
- **AND** it SHALL not contain a native `system.abgeleitete.mr` change
- **AND** the effect SHALL use `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: Buff spells with minutes duration use Initiativephasen

- **WHEN** a reviewed buff spell has `wirkungsdauer: "4 Minuten"`
- **THEN** its pre-effect SHALL use `baseDuration: 64`

#### Scenario: Selected converted-duration source Items are migrated

- **WHEN** the duration-aware iteration is prepared for packing
- **THEN** `Tanz der Schwerter`, `Adlerauge Luchsenohr`, `Adlerauge
Luchsenohr (Tiergeist)`, `Innere Ruhe`, `Mondsilberzunge`, `Rahjas
Wohlgefallen`, `Psychostabilis`, `Psychostabilis (Tiergeist)`, and `Tanz
des Ungehorsams` SHALL each have the reviewed `_source/` pre-effect
  representation

#### Known key path mappings

| Concept              | Representation                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| AT (Angriff)         | Ilaris roll modifier targeting AT                                                  |
| VT (Verteidigung)    | Ilaris roll modifier targeting VT                                                  |
| GS (Geschwindigkeit) | Ilaris prepare modifier targeting GS                                               |
| MR (Magieresistenz)  | Ilaris prepare modifier targeting MR                                               |
| INI (Initiative)     | `system.abgeleitete.ini`                                                           |
| RS (RÃ¼stungsschutz) | âŒ Derived from armor, no direct field                                             |
| Elemental resist     | âŒ No resistance field exists                                                      |
| Attribut bonus       | Ilaris roll modifier matched to the tested attribute; never changes derived values |
