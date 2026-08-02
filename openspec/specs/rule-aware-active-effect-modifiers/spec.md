## Purpose

Define declarative Ilaris rule modifiers on native Foundry ActiveEffects and
resolve their context-sensitive stacking without disabling whole effects.

## Requirements

### Requirement: Native ActiveEffects store semantic Ilaris modifiers

An Ilaris ActiveEffect SHALL store context-sensitive rule modifiers in
`system.ilarisModifiers`, separately from Foundry's native `changes` array.
Each modifier SHALL declare its `phase` (`prepare` or `roll`), canonical
target, additive value, stacking policy, and optional selector. A selector
SHALL support at least `fertigkeit`, `talent`, and `situation`; an omitted
selector dimension SHALL match every value of that dimension. A modifier that
needs a non-numeric magnitude comparison SHALL declare `comparisonValue`.

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

### Requirement: All Vorteile are permanently additive

The system SHALL treat an Ilaris modifier originating from any Vorteil,
including magical and karmic Vorteile, as ordinary additive behavior. It SHALL
never allow that modifier to participate in supernatural strongest-effect
selection while it remains active.

#### Scenario: Magical Vorteil adds to a supernatural modifier

- **WHEN** a character has an active magical or karmic Vorteil modifier and a
  matching supernatural modifier
- **THEN** the Vorteil modifier SHALL add to the resolved result
- **AND** it SHALL not be suppressed or selected as a supernatural candidate

### Requirement: Semantic main-attribute modifiers are roll-only

A semantic modifier for a main attribute such as KK or GE SHALL resolve only
for a probe that uses that attribute. It SHALL NOT change the prepared Actor
attribute path and SHALL NOT implicitly change a derived value that depends on
the attribute.

#### Scenario: GE bonus affects a matching skill check but not GS

- **WHEN** an active effect grants a semantic +2 GE modifier and a skill check
  uses GE
- **THEN** the skill check SHALL use the +2 resolved GE contribution
- **AND** the actor's prepared GE and derived GS values SHALL remain unchanged

#### Scenario: GE bonus does not affect a non-GE check

- **WHEN** the same active effect is present and a skill check does not use GE
- **THEN** the semantic GE modifier SHALL NOT contribute to that skill check

### Requirement: Resolver selects competing supernatural components by context

The system SHALL resolve modifiers from the active effects returned by
[Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects),
using one resolved target context and comparison group at a time. TP and
Waffenschaden semantic modifiers SHALL use the same damage comparison group.
It SHALL add every matching ordinary contribution. In Ilaris rule mode, it
SHALL separately select the strongest positive component and the strongest
negative component whose modifier uses `strongest-supernatural` and whose
effect is classified as übernatürlich. The selection SHALL compare matching
components from the same ActiveEffect as well as from different ActiveEffects,
but only against components of the same sign. It SHALL determine strength from
`comparisonValue`, or from the linear value if no explicit comparison value is
needed.

#### Scenario: Specific supernatural component wins inside one effect

- **WHEN** one übernatürlicher ActiveEffect grants +1 AT generally and +2 AT
  for Klingenwaffen
- **THEN** its contribution for a Klingenwaffen attack SHALL be +2
- **AND** the general +1 component SHALL be suppressed for that Klingenwaffen
  attack
- **AND** its contribution for another Fertigkeit SHALL be +1

#### Scenario: Stronger overlapping effect suppresses only its overlap

- **WHEN** a +4 übernatürlicher AT modifier applies generally and a +8
  übernatürlicher Klingenwaffen modifier applies to a Klingenwaffen attack
- **THEN** the resolved AT bonus for that Klingenwaffen attack SHALL contain
  +8 instead of +4
- **AND** the +4 modifier SHALL remain available in non-overlapping contexts

#### Scenario: Ordinary contribution survives supernatural suppression

- **WHEN** a character has a +2 ordinary contribution, a +4 übernatürlicher
  contribution, and a +8 übernatürlicher contribution for the same output
  context
- **THEN** the resolved bonus in Ilaris rule mode SHALL be +10

#### Scenario: Strongest positive and negative contributions both apply

- **WHEN** matching supernatural modifiers provide +8, -3, and -5 for the
  same output context
- **THEN** the resolver SHALL select +8 as the strongest positive contribution
- **AND** it SHALL select -5 as the strongest negative contribution
- **AND** the resolved supernatural total SHALL be +3 before ordinary
  contributions are added

#### Scenario: Dice comparison uses expected value

- **WHEN** competing values include a linear `2W6` modifier
- **THEN** the resolver SHALL use `7` as its comparison magnitude unless an
  explicit `comparisonValue` is configured

#### Scenario: Damage comparison ignores later maneuvers

- **WHEN** a +3 TP effect and a +2 Waffenschaden effect compete and a later
  maneuver such as Hammerschlag or Unaufhaltsam modifies ordinary weapon
  damage
- **THEN** the resolver SHALL select +3 from the raw effect magnitudes
- **AND** the later maneuver SHALL NOT alter either effect's comparison value
  or resolved contribution

### Requirement: Suppression is component-local and reversible

The resolver SHALL NOT set `disabled`, `isSuppressed`, or a persisted
equivalent on an ActiveEffect merely because one of its modifiers loses a
comparison. It SHALL return resolved contributions and optional suppression
metadata for the current preparation or roll only.

#### Scenario: Expiry restores a weaker effect

- **WHEN** the strongest applicable übernatürlicher effect expires
- **THEN** a previously weaker active effect SHALL contribute again without
  requiring an update to that effect document

#### Scenario: Unrelated component remains effective

- **WHEN** an effect loses the comparison for AT but has another matching
  ordinary or non-overlapping modifier
- **THEN** the unrelated modifier SHALL continue to resolve normally

### Requirement: Foundry stack mode bypasses Ilaris suppression

When the world uses Foundry stack mode, the resolver SHALL add every matching
active Ilaris modifier according to its normal additive mode and SHALL NOT
select a strongest übernatürlicher contribution.

#### Scenario: Mode change takes effect for existing effects

- **WHEN** a GM changes the world from Ilaris rule mode to Foundry stack mode
- **THEN** two existing competing übernatürliche effects SHALL both add on the
  next preparation or roll
- **AND** no ActiveEffect document SHALL need to be recreated

### Requirement: Semantic prepare modifiers support MR

The semantic modifier model SHALL support canonical target `mr` for
Magieresistenz. The Actor preparation lifecycle SHALL resolve matching
prepare-phase MR modifiers through
[Actor#allApplicableEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#allApplicableEffects)
and add the result only to prepared `system.abgeleitete.mr` data.

#### Scenario: Semantic MR modifies prepared MR

- **WHEN** an active effect has a matching prepare-phase `mr` modifier
- **THEN** the actor's prepared `system.abgeleitete.mr` SHALL include its
  resolved contribution
- **AND** the system SHALL NOT persist an actor update during preparation

#### Scenario: Ilaris mode selects strongest MR components

- **WHEN** matching supernatural MR modifiers with `strongest-supernatural`
  provide `+4`, `+2`, and `-3`
- **THEN** Ilaris mode SHALL apply `+4` and `-3`
- **AND** it SHALL suppress the `+2` component without disabling its effect

#### Scenario: Foundry mode adds MR components

- **WHEN** the world uses Foundry stack mode and matching supernatural MR
  modifiers provide `+4` and `+2`
- **THEN** prepared MR SHALL include `+6`
