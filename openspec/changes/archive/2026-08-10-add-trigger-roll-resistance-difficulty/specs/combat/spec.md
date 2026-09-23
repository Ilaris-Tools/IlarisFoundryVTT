## ADDED Requirements

### Requirement: Maneuver pre-effects retain their activating roll

The combat dialog SHALL pass the final result of the roll that satisfied a
maneuver pre-effect's activation to the common pre-effect processor when it
creates a resistance prompt. The processor SHALL make that result available as
the resistance prompt's `triggeringRollTotal`; it SHALL use the evaluated
[Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) total and
shall not repeat the roll.

#### Scenario: Confirmed-hit maneuver uses the attack total

- **WHEN** an `onConfirmedHit` maneuver Pre-Effect with a triggering-roll
  resistance source is dispatched after a confirmed hit
- **THEN** its target's resistance prompt SHALL contain the attack roll's final
  total

#### Scenario: Successful-defense maneuver uses the defense total

- **WHEN** an `onSuccessfulDefense` maneuver Pre-Effect with a
  triggering-roll resistance source is dispatched after a successful defense
- **THEN** its target's resistance prompt SHALL contain the defense roll's
  final total
