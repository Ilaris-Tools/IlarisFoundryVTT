## ADDED Requirements

### Requirement: Explicit resistance result payloads

The system SHALL allow a non-instant Pre-Effect with `avoidTest.enabled` to
define optional `resistanceOutcomes.success` and
`resistanceOutcomes.failure` result payloads. Each enabled payload SHALL
replace the root Pre-Effect's `changes`, `ilarisModifiers`, `marker`, and
`condition` result fields for its named resistance result while inheriting its
target, duration, timing, source, and application context. The selected
payload SHALL be materialized through the existing
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
and [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
embedded-document flow.

#### Scenario: Explicit failure payload replaces the root result

- **WHEN** a target fails a resistance test for a Pre-Effect whose enabled
  `resistanceOutcomes.failure` has a marker and no modifiers
- **THEN** the target SHALL receive only the failure marker result
- **AND** the root Pre-Effect changes, modifiers, marker, and condition SHALL
  not also be materialized

#### Scenario: Explicit success payload applies a distinct modifier

- **WHEN** a target succeeds a resistance test for a Pre-Effect whose enabled
  `resistanceOutcomes.success` contains a global `-4` Ilaris modifier
- **THEN** the target SHALL receive that success modifier for the effective
  parent Pre-Effect duration
- **AND** the failure payload SHALL not be materialized

#### Scenario: Omitted failure payload retains the root result

- **WHEN** a target fails a resistance test and no enabled failure payload is
  authored
- **THEN** the system SHALL materialize the root Pre-Effect result exactly as
  it did before outcome payloads existed

#### Scenario: Omitted success payload retains legacy behavior

- **WHEN** a target succeeds a resistance test and no enabled success payload
  is authored
- **THEN** the system SHALL apply no effect unless legacy `diminishedOnly` is
  enabled

#### Scenario: Explicit success payload takes precedence over diminishedOnly

- **WHEN** legacy or hand-authored data has both `diminishedOnly: true` and an
  enabled success payload
- **THEN** the system SHALL materialize the explicit success payload
- **AND** the sheet authoring path SHALL prevent creating that ambiguous new
  configuration

### Requirement: Marker-only resistance results are visible and source-linked

An enabled result marker SHALL carry a stable `id` and German `label`. When a
marker-only result has no native changes, Ilaris modifiers, condition, armed
effect, or ending, the system SHALL still create a timed
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html).
Its visible name SHALL contain both the marker label and source spell name;
the document SHALL retain the standard spell origin/provenance and store the
resolved outcome plus marker id in `flags.ilaris`.

#### Scenario: Failure creates a visible Handlungsunfähig marker

- **WHEN** _Fluch des Gewürms_ fails its target's Willenskraft resistance
- **THEN** the target SHALL receive a timed effect visibly named
  `Handlungsunfähig — Fluch des Gewürms`
- **AND** it SHALL contain no invented numeric actor-data change

#### Scenario: Marker preserves complete spell provenance

- **WHEN** a marker-only resistance outcome is created for Pre-Effect index N
- **THEN** its `origin` and `flags.ilaris` SHALL retain the originating
  `spellName`, `spellUuid`, `casterUuid`, `preEffectIndex: N`, and
  `applicationId`
- **AND** `flags.ilaris` SHALL additionally record the selected
  `resistanceOutcome` and stable `markerId`

#### Scenario: Legacy marker remains readable

- **WHEN** an existing Pre-Effect has `marker.enabled: true` but no marker id
  or label
- **THEN** it SHALL remain valid and use the source spell name as its existing
  readable fallback

### Requirement: Condition outcomes preserve spell provenance

When a resistance result requests a configured condition, the system SHALL
route it through the canonical condition-source lifecycle rather than copying
native status changes. Its condition source record SHALL retain the source
spell, caster, Pre-Effect component, application, and resolved outcome so the
shared condition remains traceable to the spell.

#### Scenario: Condition source is traceable from the shared status effect

- **WHEN** an enabled resistance result applies a configured condition to an
  actor that already has another source for the same condition
- **THEN** the canonical condition effect SHALL retain one copy of the native
  status changes
- **AND** its source details SHALL identify the spell-created result separately
  from the other source

### Requirement: Outcome effects snapshot the concrete casting skill

Every outcome-created effect and condition source SHALL record the concrete
supernatural `castSkill` used for the originating roll, alongside a generic
`sourceItemUuid`, the legacy `spellUuid`, caster, component, and application
provenance. A source Item's candidate `fertigkeiten` list or literal `auto`
selection SHALL NOT be used as a substitute for that snapshot.

#### Scenario: Fixed skill is stored as the cast skill

- **WHEN** a supernatural Item has a non-`auto` selected skill and creates an
  outcome effect
- **THEN** the effect and any condition source SHALL record that selected skill
  as `castSkill`
- **AND** `sourceItemUuid` SHALL equal the source Item UUID and `spellUuid`
  SHALL retain the same value for compatibility

#### Scenario: Unique automatic skill is stored as the cast skill

- **WHEN** an automatic spell has one eligible supernatural skill with the
  highest casting value
- **THEN** the dialog SHALL use and snapshot that skill as `castSkill` before
  it rolls

#### Scenario: Tied automatic skills require a pre-roll selection

- **WHEN** an automatic spell has multiple eligible supernatural skills tied
  for its highest casting value
- **THEN** the casting dialog SHALL show a `Fertigkeit` selector before its
  roll actions
- **AND** it SHALL keep roll actions disabled until one tied skill is selected
- **AND** every resulting outcome effect SHALL record the selected skill as
  `castSkill`
