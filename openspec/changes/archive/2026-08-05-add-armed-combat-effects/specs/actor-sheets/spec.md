## ADDED Requirements

### Requirement: Held effect rows display remaining duration and armed charges

The Held Effekte tab SHALL display each effect's authoritative remaining
duration and, for armed effects, its remaining charges. For an
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
using `system.ilarisTiming.durationType: "ownerTurns"`, the row SHALL display
`system.ilarisTiming.remaining` as its duration. For every other timed effect,
the row SHALL display the prepared native duration maintained by
`ActiveEffect#updateDuration`. An armed effect SHALL additionally display
`Ladungen: <remaining>` from its persisted armed runtime state.

#### Scenario: Owner-turn effect shows its Ilaris duration

- **WHEN** an applied effect uses owner-turn timing with `remaining: 3`
- **THEN** the Held Effekte tab SHALL display `Dauer: 3 Runden` for that effect

#### Scenario: Native timed effect shows its prepared duration

- **WHEN** an applied effect has a finite native remaining duration and does
  not use owner-turn timing
- **THEN** the Held Effekte tab SHALL display its prepared native duration

#### Scenario: Armed effect shows charges independently from duration

- **WHEN** an applied armed effect has two remaining charges and a remaining
  duration
- **THEN** its row SHALL display both the duration and `Ladungen: 2`

#### Scenario: Non-armed indefinite effect omits lifecycle labels

- **WHEN** an applied effect has neither a finite remaining duration nor armed
  charge state
- **THEN** its row SHALL display neither a duration nor a charge label
