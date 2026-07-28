## ADDED Requirements

### Requirement: Pre-effects can declare semantic Ilaris modifiers

Non-instant pre-effects SHALL support a separate `ilarisModifiers` array in
addition to their existing native `changes` array. The pre-effect editor SHALL
let a GM configure the modifier phase, target, value, stacking policy,
comparison value, and selectors. On a successful cast, the processor SHALL
copy native changes into the created ActiveEffect's `changes` and semantic
modifiers into `system.ilarisModifiers` without converting one form into the
other.

#### Scenario: Spell pre-effect creates a semantic attack modifier

- **WHEN** a non-instant Zauber pre-effect contains an AT Ilaris modifier
- **THEN** casting it SHALL create a native ActiveEffect whose
  `system.ilarisModifiers` contains that modifier
- **AND** the modifier SHALL not be duplicated in `changes`

#### Scenario: Existing path change remains compatible

- **WHEN** a non-instant pre-effect contains only a classical Foundry change
- **THEN** casting it SHALL continue to create the same `changes` entry on the
  ActiveEffect

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

#### Scenario: Ordinary effect is not reclassified

- **WHEN** an ActiveEffect from a mundane Vorteil has an ordinary Ilaris
  modifier
- **THEN** it SHALL remain additive even if it matches a spell modifier's
  output context
