## Purpose

Reusable charged supernatural effects which apply to a later eligible weapon attack.

## Requirements

### Requirement: Armed combat effect definition and lifecycle

An übernatürlich pre-effect MAY declare `armedCombat` with the `nextSuccessfulAttack` trigger, scope (`melee`, `ranged`, or `any`), an attack or damage contribution, bounded integer inputs, and optional charges. Matching attacks SHALL snapshot the effect, consume one charge after every outcome, and apply armed damage only on a confirmed hit.

#### Scenario: Miss consumes without damage

- **WHEN** a matching armed attack misses or is successfully defended
- **THEN** its effect SHALL lose one charge and SHALL not add armed damage

#### Scenario: Final charge retains hit damage

- **WHEN** a matching attack hits with the final charge
- **THEN** the snapshot damage SHALL remain in that attack's damage roll and the source ActiveEffect SHALL be removed

### Requirement: Cast-time inputs are independent

Submitted armed input values SHALL be normalized and persisted in the generated ActiveEffect without changing the source Item.

#### Scenario: Bounded input is clamped

- **WHEN** a `0..8` input receives a value above eight
- **THEN** the stored value and resulting per-unit damage SHALL use eight
