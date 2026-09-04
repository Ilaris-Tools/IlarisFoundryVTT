## ADDED Requirements

### Requirement: Pre-effects can declare semantic Ilaris modifiers

Non-instant pre-effects SHALL support a separate `ilarisModifiers` array in
addition to their existing native `changes` array. The pre-effect editor SHALL
let a GM configure the modifier phase, target, value, stacking policy,
comparison value, selectors, and the same amplification/diminished-value
fields available to native changes. On a successful cast, the processor SHALL
copy native changes into the created ActiveEffect's `changes` and semantic
modifiers into `system.ilarisModifiers`, except that a mappable native
main-attribute change SHALL be redirected to its semantic roll-phase form.

#### Scenario: Spell pre-effect creates a semantic attack modifier

- **WHEN** a non-instant Zauber pre-effect contains an AT Ilaris modifier
- **THEN** casting it SHALL create a native ActiveEffect whose
  `system.ilarisModifiers` contains that modifier
- **AND** the modifier SHALL not be duplicated in `changes`

#### Scenario: Existing non-attribute path change remains compatible

- **WHEN** a non-instant pre-effect contains only a classical Foundry change
  that does not target a main attribute
- **THEN** casting it SHALL continue to create the same `changes` entry on the
  ActiveEffect

### Requirement: Semantic modifiers use native Pre-Effect value transformations

When a non-instant pre-effect is applied, its semantic Ilaris modifiers SHALL
use the same Mächtige Magie/Liturgie and diminished-resist value selection as
native changes. The processor SHALL materialize the selected full or diminished
value, including the appropriate bonus once per QS, in the newly created
ActiveEffect. It SHALL apply the same transformation to an explicitly authored
comparison-value formula when one exists, so stacking compares the applied
effect rather than the unamplified pre-effect definition.

#### Scenario: Amplification is materialized when creating a semantic effect

- **WHEN** an Ilaris modifier has `amplifiedByMaechtigeMagie: true` and the
  caster applies it with Mächtige Magie/Liturgie QS greater than zero
- **THEN** the created ActiveEffect SHALL contain the modifier's value with
  `maechtigBonus` appended once per QS
- **AND** its stacking comparison SHALL use that applied amplified value

#### Scenario: Diminished resist materializes a semantic diminished value

- **WHEN** a target succeeds a diminished-only resist test against a semantic
  Ilaris modifier
- **THEN** the created ActiveEffect SHALL contain `diminishedValue` and, when
  amplified, `diminishedMaechtigBonus` using the same rules as a native change

### Requirement: Spell effects are classified as supernatural sources

The pre-effect processor SHALL classify ActiveEffects created from Zauber,
Liturgien, and Anrufungen as übernatürlich for the rule-aware resolver, while
preserving the existing origin metadata used to identify spell, caster, and
source item.

#### Scenario: Competing spell effects enter the supernatural comparison

- **WHEN** two active effects were created by successful spell pre-effects
  and both have matching `strongest-supernatural` modifiers
- **THEN** they SHALL be eligible for strongest-effect resolution in Ilaris
  rule mode

#### Scenario: Vorteil effect is not reclassified

- **WHEN** an ActiveEffect from any Vorteil, including a magical or karmic
  Vorteil, has an ordinary Ilaris modifier
- **THEN** it SHALL remain additive even if it matches a spell modifier's
  output context
