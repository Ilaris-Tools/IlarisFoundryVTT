## ADDED Requirements

### Requirement: Melee outcome resolution activates selected maneuver pre-effects

The melee combat dialogs SHALL evaluate selected maneuver pre-effects only at
their final attack-versus-defense resolution. They SHALL pass the dialog's
existing selected targets and the maneuver user's Actor to the generic
pre-effect service. They SHALL not invoke maneuver effects from an intermediate
attack roll that can still be defeated by a defense.

#### Scenario: A confirmed melee hit dispatches offensive pre-effects once

- **WHEN** a melee attacker wins a final resolution with a selected
  `onConfirmedHit` maneuver pre-effect
- **THEN** the dialog SHALL dispatch that maneuver pre-effect once for the
  resolved defender

#### Scenario: A successful defense dispatches defensive pre-effects once

- **WHEN** a melee defender wins a final resolution with a selected
  `onSuccessfulDefense` maneuver pre-effect
- **THEN** the defense flow SHALL dispatch that maneuver pre-effect once for
  the attacking actor
