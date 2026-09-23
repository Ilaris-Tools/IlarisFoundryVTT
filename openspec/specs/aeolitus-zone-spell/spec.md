# Aeolitus Zone Spell Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Aeolitus Windgebraus has reviewed Zone automation

The _Aeolitus Windgebraus_ compendium source SHALL define an instant,
caster-anchored, 45-degree, 16-Schritt cone Zone with a tip pivot. On a
successful cast it SHALL resolve each current non-caster Token contained by
the Zone through the existing Pre-Effect pipeline. Each target SHALL receive
a fixed KK 16 resistance test; a failed test SHALL add the canonical
`Position4` condition source.

#### Scenario: Base cone applies Niederschmettern after failed KK resistance

- **WHEN** the base Aeolitus cast succeeds and a contained target fails KK 16
- **THEN** the target SHALL receive one canonical `Position4` source linked to
  Aeolitus and the selected casting skill
- **AND** the system SHALL not create a second copy of the condition's native
  changes

#### Scenario: Successful resistance leaves the target unaffected

- **WHEN** a contained target succeeds the base Aeolitus KK 16 resistance
- **THEN** the target SHALL receive neither `Position4` nor a marker

### Requirement: Aeolitus forms preserve their explicit rule split

The _Aeolitus Windgebraus_ compendium source SHALL use structured forms for
_Langer Atem_, _Sturm_, and _Winde der anderen Art_. Forms SHALL remain
independently optional and SHALL not write the selection back to the source
Item.

#### Scenario: Winde der anderen Art is a narrative inherited form

- **WHEN** the caster selects _Winde der anderen Art_
- **THEN** the effective cast difficulty SHALL be reduced by 4
- **AND** the base Zone and Pre-Effect behavior SHALL remain unchanged

#### Scenario: Langer Atem persists and repeats

- **WHEN** the caster selects _Langer Atem_ and casts successfully
- **THEN** the resulting cone SHALL be a persistent triggered Zone
- **AND** it SHALL dispatch for initial occupants, later entrants, and current
  occupants at each forward combat round start

#### Scenario: Sturm combines condition and displacement on failure

- **WHEN** the caster selects _Sturm_ and an affected target fails KK 16
- **THEN** the target SHALL receive both the canonical `Position4` source and
  the traceable table-managed `zurueckgestossen` marker
- **AND** no automatic Token movement SHALL occur
