## ADDED Requirements

### Requirement: Falkenauge Meisterschuss uses an armed ranged attack effect

The Falkenauge Meisterschuss source Item SHALL define a non-instant,
self-targeted armed pre-effect for the next eligible ranged attack. The
effect SHALL contribute its stated attack bonus, start with one charge, and
expire after that charge is expended by the matching ranged attack.

#### Scenario: Falkenauge is consumed by a missed ranged attack

- **WHEN** Falkenauge's next eligible ranged attack misses or is defended
- **THEN** its armed effect SHALL expend its charge and expire

### Requirement: Neun Streiche in einem uses an armed count-based damage effect

The Neun Streiche in einem source Item SHALL define a non-instant, self-targeted
armed pre-effect with the cast-time input `Bisherige Treffer auf Ziel`. On the
next eligible attack, the effect SHALL expend one charge; if that attack is
confirmed as a hit, it SHALL add one `W6` damage per stored input unit, capped
at `8W6`. Its source
configuration SHALL make any Mächtige-Liturgie charge amplification explicit.

#### Scenario: Entered hit count determines charged damage

- **WHEN** the caster enters `5` while successfully invoking Neun Streiche in
  einem and the next eligible attack is confirmed as a hit
- **THEN** that attack's damage roll SHALL include `5W6`
- **AND** the armed ActiveEffect SHALL lose one charge and remain active unless
  that was its final charge

#### Scenario: Hit count is capped at eight

- **WHEN** a submitted or persisted Neun-Streiche hit count exceeds `8`
- **THEN** the stored value and resulting damage contribution SHALL be capped at
  `8W6`
