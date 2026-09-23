## MODIFIED Requirements

### Requirement: The guide accurately explains Ilaris modifiers and stacking

The guide SHALL distinguish unconditional native Foundry Änderungen from
context-sensitive Ilaris-Modifikatoren. It SHALL document preparation and roll
phases, targets, selectors, applied/suppressed component visibility, and both
world-setting stacking modes. It SHALL state that main attributes only modify
matching rolls and do not change prepared values or derived values such as GS.
It SHALL distinguish retaining/suppressing same-spell effects in Ilaris mode
from replacing all ActiveEffects from the same supernatural source in Foundry
mode.

#### Scenario: A GM checks a specific AT modifier against a general modifier

- **WHEN** a GM reads the guide's general and Klingenwaffen-specific AT example
- **THEN** the guide SHALL state that in Ilaris mode an applicable specific
  supernatural `+2 AT` suppresses an applicable general supernatural `+1 AT`
  rather than contributing `+3`
- **AND** it SHALL state that the strongest positive and strongest negative
  components apply independently, so `-5` suppresses `-3`

#### Scenario: A GM selects Foundry stacking mode

- **WHEN** a GM reads the guide's description of the `Foundry` world setting
- **THEN** it SHALL state that distinct Ilaris-Modifikatoren add in that mode
- **AND** it SHALL state that recasting the same persistent spell or liturgy
  replaces all prior ActiveEffects from that source and refreshes their
  duration

#### Scenario: A GM selects Ilaris stacking mode

- **WHEN** a GM reads the guide's description of the `Ilaris` world setting
- **THEN** it SHALL state that a same-spell recast remains as a separate
  effect document
- **AND** it SHALL state that the currently weaker component becomes effective
  again when the stronger component expires
