## MODIFIED Requirements

### Requirement: Native ActiveEffects store semantic Ilaris modifiers

An Ilaris ActiveEffect SHALL store context-sensitive rule modifiers in
`system.ilarisModifiers`, separately from Foundry's native `changes` array.
Each modifier SHALL declare its `phase` (`prepare` or `roll`), canonical
target, additive value, stacking policy, and optional selector. A selector
SHALL support at least `fertigkeit`, `talent`, and `situation`; an omitted
selector dimension SHALL match every value of that dimension. A `situation`
selector SHALL match any tag provided in the dialog's expanded condition set.
A modifier that needs a non-numeric magnitude comparison SHALL declare
`comparisonValue`.

#### Scenario: Core and semantic changes coexist

- **WHEN** an ActiveEffect contains both a native `changes` entry and an entry
  in `system.ilarisModifiers`
- **THEN** Foundry SHALL process the native change normally
- **AND** the Ilaris resolver SHALL process only the semantic modifier without
  duplicating either contribution

#### Scenario: Selector limits a bonus to one skill

- **WHEN** a roll-phase modifier targets AT and selects
  `fertigkeit: ["Klingenwaffen"]`
- **THEN** it SHALL match an attack made with Klingenwaffen
- **AND** it SHALL NOT match an attack made with another Fertigkeit

#### Scenario: Contextual advantage applies in a social duel

- **WHEN** an ordinary modifier selects the talents Einschüchtern and
  Überreden and `situation: ["sozialesDuell"]`
- **THEN** it SHALL add to those matching probes during a social duel
- **AND** it SHALL NOT be treated as an übernatürlicher competing modifier

#### Scenario: Specific contextual tag retains its parent match

- **WHEN** the dialog supplies `sozialesDuellAbwartend` with its expanded
  `sozialesDuell` parent tag
- **THEN** modifiers selecting either tag SHALL match according to their
  selector
