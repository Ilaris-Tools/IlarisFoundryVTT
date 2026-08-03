## ADDED Requirements

### Requirement: Armed combat effect definition

An übernatürlich pre-effect SHALL optionally declare an `armedCombat` definition
for a later combat action. The definition SHALL identify the
`nextSuccessfulAttack` trigger, an eligible attack scope (`melee`, `ranged`, or
`any`), and at least one attack or damage contribution. It MAY declare bounded
integer cast-time inputs identified by stable keys and German labels. It MAY
declare `charges` with a positive integral base count and an opt-in,
non-negative integral Mächtige-Magie/Liturgie charge bonus per QS.

#### Scenario: Effect declares a reusable count-based damage contribution

- **WHEN** a pre-effect declares an armed `nextSuccessfulAttack` effect with
  input key `previousHits`, bounds `0..8`, and `1W6` damage per input unit
- **THEN** the configuration SHALL be valid without naming a particular spell or
  liturgy

#### Scenario: Charge amplification is opt-in

- **WHEN** an armed effect declares `charges.base: 2`,
  `charges.amplifiedByMaechtigeMagie: true`, and
  `charges.maechtigBonus: 1`
- **THEN** each Mächtige-Magie/Liturgie QS SHALL add one materialized charge
- **AND** an armed effect without `charges` or without the opt-in SHALL not gain
  additional charges

#### Scenario: Effect declares a fixed ranged attack contribution

- **WHEN** a pre-effect declares an armed ranged-only effect with a fixed attack
  bonus and no numeric input
- **THEN** the configuration SHALL be valid and SHALL apply only to ranged
  attacks

### Requirement: Cast-time input is persisted with its effect application

The system SHALL store the normalized armed definition and submitted input
values in the generated
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
after a successful cast. Submitted values SHALL be clamped to the declared
bounds and SHALL not change the source Item.

#### Scenario: Concurrent casts retain independent input values

- **WHEN** two successful casts submit different values for the same armed
  pre-effect input
- **THEN** each generated ActiveEffect SHALL retain its own normalized value

### Requirement: Armed effects resolve and expend charges on a confirmed hit

The system SHALL snapshot every active, scope-matching armed effect when its
owner begins an attack. The snapshot SHALL contribute its attack value to that
attack and retain its materialized damage contribution for the same attack.
The system SHALL expend one charge only from the snapshot's source effects after
that attack is confirmed as a hit. It SHALL update an effect that has remaining
charges and SHALL remove an effect only when its remaining charges reach zero.

#### Scenario: Failed attack leaves effect armed

- **WHEN** an attack with a matching armed effect fails or is successfully
  defended
- **THEN** the effect SHALL remain active and SHALL be eligible for a later
  matching attack with its charge count unchanged

#### Scenario: Confirmed hit decrements but retains a charged effect

- **WHEN** a matching attack is confirmed as a hit and its armed effect has two
  remaining charges
- **THEN** the effect SHALL retain one remaining charge
- **AND** it SHALL remain eligible for a later matching attack

#### Scenario: Final charge retains damage and expires

- **WHEN** a matching attack is confirmed as a hit
- **THEN** its stored damage contribution SHALL be included in that attack's
  damage roll
- **AND** an effect whose remaining charge count reaches zero SHALL be removed
  exactly once from the owning
  [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  with `Actor#deleteEmbeddedDocuments`

#### Scenario: Manual damage does not expend armed charges

- **WHEN** a damage roll is made without a preceding matching confirmed hit
- **THEN** it SHALL NOT expend an armed combat effect charge
