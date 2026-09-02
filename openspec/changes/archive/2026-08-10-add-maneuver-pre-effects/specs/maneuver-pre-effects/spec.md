## ADDED Requirements

### Requirement: Maneuvers author the established pre-effect payload

A `manoever` Item SHALL support an optional `system.preEffects` array using the
same effect payload as an übernatürlich Item. Each maneuver pre-effect SHALL
declare `activation` as either `onConfirmedHit` or
`onSuccessfulDefense`, and MAY declare native changes, Ilaris modifiers,
duration, an `avoidTest`, and a supported structured ending. The maneuver Item
sheet SHALL render and persist this configuration without changing the
immediate `modifications` array.

The maneuver input model SHALL support `SELECTOR` with an ordered list of
author-configured choices. Combat dialogs SHALL render the selector as a
dropdown with an empty default. A non-empty selector choice SHALL activate the
maneuver, make its raw selected value available to its pre-effects, and apply
ordinary maneuver modifications once rather than numerically multiplying them
by the chosen string.

Runtime-generated maneuver objects parsed from a spell or liturgy
`system.modifikationen` property SHALL remain outside this capability. They
SHALL retain their existing immediate-modification behavior and SHALL not gain
pre-effects or selector input semantics.

#### Scenario: A maneuver pre-effect is persisted

- **WHEN** a GM configures an `onConfirmedHit` pre-effect on a maneuver
- **THEN** reopening the maneuver Item SHALL show the same activation and
  pre-effect data
- **AND** the maneuver's existing roll modifications SHALL remain unchanged

#### Scenario: A selector input activates a maneuver once

- **WHEN** a GM configures a maneuver selector with Hauptwaffe and Nebenwaffe
  and a player chooses Nebenwaffe in the combat dialog
- **THEN** the maneuver SHALL be selected once
- **AND** its pre-effect SHALL receive `Nebenwaffe` as the selected input value

#### Scenario: Generated spell modification maneuver remains unchanged

- **WHEN** a spell or liturgy produces a runtime maneuver from
  `system.modifikationen`
- **THEN** that generated maneuver SHALL retain its existing immediate
  modification behavior
- **AND** it SHALL not expose maneuver pre-effects or selector choices

### Requirement: Selected maneuver pre-effects use final combat outcomes

The system SHALL dispatch a selected maneuver pre-effect only after the
relevant attack-versus-defense result is final. An `onConfirmedHit` pre-effect
SHALL apply only when the attacker wins; an `onSuccessfulDefense` pre-effect
SHALL apply only when the defender wins. The dispatcher SHALL use the combat
dialog's selected targets without a separate target-mapping field.

#### Scenario: Attack maneuver uses selected defenders

- **WHEN** a selected offensive maneuver has an `onConfirmedHit` pre-effect
  and an attack against a selected defender is confirmed
- **THEN** the system SHALL apply the pre-effect to that defender

#### Scenario: Defense maneuver uses the attacker target

- **WHEN** a defender selects a maneuver with an `onSuccessfulDefense`
  pre-effect and wins the defense
- **THEN** the system SHALL apply the pre-effect to the defense dialog's
  automatically selected attacker

#### Scenario: Negated attack does not apply hit effects

- **WHEN** a selected offensive maneuver has an `onConfirmedHit` pre-effect
  and the defender wins the resolution
- **THEN** the system SHALL not create its ActiveEffect or resistance prompt

### Requirement: Maneuver effects reuse resistance and ActiveEffect materialization

Maneuver pre-effects SHALL use the same resistance selection and effect
materialization behavior as supernatural pre-effects. A failed resistance SHALL
create the configured embedded [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
on the target through the established Actor embedded-document flow. The
created effect SHALL record `sourceType: "maneuver"`, the source maneuver UUID,
the maneuver user's Actor UUID, and an application ID.

#### Scenario: Niederwerfen applies Liegend after failed resistance

- **WHEN** Niederwerfen is selected, the attack is confirmed, and the target
  fails its configured KK resistance
- **THEN** the target SHALL receive the configured Liegend ActiveEffect
- **AND** the effect SHALL retain maneuver provenance

#### Scenario: Successful resistance avoids Niederwerfen

- **WHEN** Niederwerfen is selected, the attack is confirmed, and the target
  succeeds its configured KK resistance
- **THEN** the system SHALL not create the Liegend ActiveEffect

### Requirement: Reviewed maneuvers use persistent effects where their rules require them

Binden, Niederwerfen, Umreißen, and Umklammern SHALL be authored as reviewed
maneuver pre-effect data. Binden SHALL create its VT penalty on a successful
defense for one owner turn through the end of the attacker's next initiative
phase. Niederwerfen and Umreißen SHALL use their configured resistance gates
and create Liegend on failure. Umklammern SHALL create its configured penalties
and opposed-escape ending after a confirmed hit.

#### Scenario: Binden lasts through the attacker's next phase

- **WHEN** Binden is selected during a successful defense
- **THEN** the attacker SHALL receive the configured VT penalty ActiveEffect
- **AND** it SHALL remain active through that attacker's next initiative phase
- **AND** it SHALL expire at the end of that phase

#### Scenario: Umklammern creates a resistant persistent hold

- **WHEN** Umklammern is selected and the attack is confirmed
- **THEN** the defender SHALL receive its configured persistent hold effect
- **AND** the effect SHALL expose the configured opposed-escape ending

#### Scenario: Umreißen applies Liegend through the shared resistance flow

- **WHEN** Umreißen is selected, the attack is confirmed, and the target fails
  its configured resistance
- **THEN** the target SHALL receive its configured Liegend ActiveEffect

### Requirement: Entwaffnen uses a bounded equipped-weapon operation

The system SHALL support the `deselectEquippedWeapon` maneuver pre-effect
operation after its configured resistance gate. Entwaffnen SHALL pass its
selected `Hauptwaffe` or `Nebenwaffe` input to that operation. The operation
SHALL clear only the target weapon's corresponding selected slot flag. It SHALL
not delete, move, or otherwise alter the weapon in this iteration.

#### Scenario: Failed KK resistance deselects the chosen weapon

- **WHEN** Entwaffnen is selected with Hauptwaffe, the attack is confirmed,
  and the target fails its KK resistance
- **THEN** the system SHALL clear that weapon's Hauptwaffe selection
- **AND** it SHALL leave the weapon owned by the target

#### Scenario: No equipped target weapon performs no update

- **WHEN** Entwaffnen resolves with a selected slot after a failed KK
  resistance but the target has no weapon in that selected slot
- **THEN** the system SHALL notify the user
- **AND** it SHALL not update or delete any Item
