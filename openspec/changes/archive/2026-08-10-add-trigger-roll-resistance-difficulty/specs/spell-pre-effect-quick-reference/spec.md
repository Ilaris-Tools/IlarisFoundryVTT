## ADDED Requirements

### Requirement: The guide documents resistance-difficulty source modes

The German `Übersicht: Zauber, Liturgien & Pre-Effects` JournalEntry SHALL
document resistance difficulties as an explicit authoring choice. It SHALL
explain that `Fester Wert` uses the numeric value and defaults to 12, while
`Ergebnis der auslösenden Probe` uses the completed triggering roll's result.
It SHALL state that the latter is appropriate for reviewed combat maneuvers
such as _Entwaffnen_ and _Niederwerfen_, rather than assigning a magic value of
0 to the fixed-difficulty field.

#### Scenario: A GM authors a maneuver resistance

- **WHEN** a GM opens the Pre-Effect quick reference to configure a maneuver
  resistance
- **THEN** the guide SHALL identify `Ergebnis der auslösenden Probe` as the
  appropriate source when the defender rolls against the maneuver user's
  completed result
- **AND** it SHALL state that a numeric zero remains a fixed value, not a
  source selector
