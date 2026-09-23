## Purpose

Define the shared roll-condition catalogue and dialog controls that let
ordinary, contextual Vorteil effects resolve through the Ilaris modifier
lifecycle.

## Requirements

### Requirement: Central roll-condition catalogue

The system SHALL define one central, localized catalogue of stable condition
IDs that is shared by dialog controls and `selector.situation` authoring. It
SHALL define the parent relation for `sozialesDuellAbwartend` to
`sozialesDuell`, and it SHALL define mutually exclusive Kraftlinie strength
conditions for +2, +3, and +4.

#### Scenario: Waiting in a social duel retains the general context

- **WHEN** a roll selects `sozialesDuellAbwartend`
- **THEN** its resolver context SHALL contain both `sozialesDuellAbwartend` and
  `sozialesDuell`

#### Scenario: Kraftlinie strength is exclusive

- **WHEN** a supernatural roll selects the Kraftlinie +3 tier
- **THEN** its resolver context SHALL contain the +3 condition only
- **AND** it SHALL NOT contain the +2 or +4 condition

### Requirement: FertigkeitDialog selects a primary roll situation

The system SHALL render a localized situation dropdown in the existing
`HandlebarsApplicationMixin`-based FertigkeitDialog. It SHALL offer no special
situation, social duel, waiting in a social duel, investigation/research, and
destroying/breaking an object. A caller-supplied known situation SHALL
initialize the selection.

#### Scenario: Changing the situation updates the visible probe result

- **WHEN** a user changes the FertigkeitDialog situation dropdown
- **THEN** the dialog SHALL re-resolve matching Ilaris modifiers before the
  roll is confirmed
- **AND** the normal modifier breakdown SHALL show any applied effect source
  and value

#### Scenario: No special situation has no contextual tags

- **WHEN** a user selects “Keine besondere Situation”
- **THEN** the resolver context SHALL contain no selected situation tag

### Requirement: Supernatural roll conditions are player/GM managed

The system SHALL render a session-local **Situative Vorteile und Traditionen**
control group in UebernatuerlichDialog for relevant owned Vorteil effects. It
SHALL use independent checkboxes for boolean conditions and an exclusive
control for magnitude-tier conditions. It SHALL not infer or persist location,
target, spell-modification, resource, or other world state.

#### Scenario: Selected condition applies its owned Vorteil modifier

- **WHEN** a user selects a condition matching an owned transferred Vorteil
  effect for the current supernatural probe
- **THEN** the dialog SHALL pass the selected tag set to the normal Ilaris
  modifier resolver
- **AND** the resolved ordinary contribution SHALL be included in the visible
  probe summary and final roll

#### Scenario: Unselected condition does not apply

- **WHEN** a relevant owned Vorteil condition is left unselected
- **THEN** its situation-bound modifier SHALL NOT affect the supernatural
  probe

#### Scenario: Unrelated conditions are not globally enabled

- **WHEN** a user selects one boolean condition
- **THEN** the system SHALL NOT treat another condition selector as matched
  unless that other condition is also explicitly selected

### Requirement: Initial contextual Vorteil effects use ordinary additive modifiers

The selected Vorteil compendium sources SHALL use transferred ActiveEffects
with ordinary, roll-phase `Probe` Ilaris modifiers and selectors appropriate
to their textual rule. Their active effects are consumed through
`Actor.allApplicableEffects()` and SHALL not participate in supernatural
strongest-effect selection.

#### Scenario: Social-duel Vorteil effects add when their skills match

- **WHEN** an actor owns Eindrucksvoll I/II or Vorausschauend I/II and makes a
  matching skill roll in a social duel
- **THEN** each owned matching effect SHALL add its +2 contribution

#### Scenario: Investigation and object-destruction effects remain contextual

- **WHEN** an actor owns Scharfsinnig I/II or Zerstörerisch I/II
- **THEN** its +2 or +4 contribution SHALL apply only to its documented
  investigation/research or object-destruction situation
- **AND** it SHALL not apply to an ordinary roll outside that situation
