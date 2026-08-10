## ADDED Requirements

### Requirement: Reviewed spells author structured forms

The source compendium SHALL author forms for Attributo, Tlalucs Odem Pestgestank, Fortifex arkane Wand, and generic anti-magic talents. Attributo SHALL require exactly one attribute and apply roll-only modifiers without changing raw attributes/derived values. Miasmafaxius SHALL inherit Pestgestank's outcome while overriding its profile. Schimmernder Schild SHALL replace Fortifex's outcome. Every generic anti-magic talent SHALL require exactly one of Gegenzauber, Magie unterdruecken, Zauber aufheben, and Wesenheit bannen.

#### Scenario: Attributo is roll-only

- **WHEN** the FF Attributo form succeeds
- **THEN** it SHALL create +2 FF attribute-test and +1 FF-selected skill-test semantic modifiers
- **AND** it SHALL not change `system.attribute.FF.wert` or a derived value

#### Scenario: Anti-magic outcome is transparently player-managed

- **WHEN** a generic anti-magic form succeeds
- **THEN** cast output SHALL identify the selected form and its configured profile
- **AND** no misleading automatic reaction, zone, target-effect, or entity outcome SHALL be created
