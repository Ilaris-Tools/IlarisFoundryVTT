## ADDED Requirements

### Requirement: Linear semantic modifier formulas support W3, W6, and W20

The semantic modifier parser SHALL accept additive, linear W3, W6, and W20
dice terms with optional numeric offsets. It SHALL calculate expected values
using 2 per W3, 3.5 per W6, and 10.5 per W20 term and SHALL continue to reject
unsupported syntax.

#### Scenario: W20 modifier parses and compares by expected value

- **WHEN** a semantic modifier value is `+1W20+2`
- **THEN** the parser SHALL retain `+1W20` as its dice formula
- **AND** it SHALL calculate expected value 12.5

#### Scenario: W3 modifier parses with other supported terms

- **WHEN** a semantic modifier value is `2W3+1W6-4`
- **THEN** the parser SHALL accept all three additive terms
- **AND** it SHALL calculate expected value 3.5

#### Scenario: Unsupported dice remain rejected

- **WHEN** a semantic modifier value contains a non-supported die such as `1W8`
- **THEN** the parser SHALL reject the value as unsupported
