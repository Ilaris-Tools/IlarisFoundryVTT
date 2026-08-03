## ADDED Requirements

### Requirement: Pre-effects support a generic summon-item operation

An übernatürlich Item pre-effect SHALL optionally define a `summonItem`
configuration containing a source Item UUID, owner-turn base duration, and
optional clone-data overrides. The configured source SHALL resolve only from
the Item compendium packs selected by the existing `waffenPacks` world setting.
Successful pre-effect processing SHALL apply the operation to every selected
target and SHALL reject a missing, invalid, or unavailable source without
creating a clone or marker.

#### Scenario: Pre-effect sheet offers configured source Items

- **WHEN** a GM configures a summon-item pre-effect
- **THEN** the sheet SHALL offer Item sources from the selected `waffenPacks` compendia
- **AND** it SHALL persist the chosen source UUID rather than a display name

#### Scenario: Invalid source prevents a partial summon

- **WHEN** a successful summon-item pre-effect references an Item outside the configured catalog or a missing source
- **THEN** the system SHALL notify the user of the unavailable source
- **AND** it SHALL create neither an owned Item nor an expiry marker

### Requirement: Summon-item overrides materialize Mächtige Magie on the clone

Each configured summon-item data override SHALL support `value`,
`amplifiedByMaechtigeMagie`, and `maechtigBonus`. The processor SHALL
materialize the override once per Mächtige Magie quality stage before creating
the clone, without applying that override to the target Actor or unrelated
Items.

#### Scenario: Clone receives materialized damage override

- **WHEN** a summon-item TP override has value `2W20`, Mächtige Magie bonus `+1W20`, and two quality stages
- **THEN** the clone SHALL receive `2W20+1W20+1W20` as its configured TP value
- **AND** the target Actor's other Item data SHALL remain unchanged
