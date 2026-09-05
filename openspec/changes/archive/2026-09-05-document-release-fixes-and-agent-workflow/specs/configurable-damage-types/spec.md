## ADDED Requirements

### Requirement: Consumers retain configured damage-type keys

Any consumer that selects a configured damage type SHALL retain its registry `value` key for downstream behavior resolution; it SHALL use the `label` only for display. This includes `CHANGE_DAMAGE_TYPE` maneuver modifications consumed by the combat damage pipeline.

#### Scenario: Maneuver applies configured behavior by key

- **WHEN** a maneuver's `CHANGE_DAMAGE_TYPE` modification selects configured type `{"value":"STUMPF","label":"Stumpf (Erschöpfung)","behavior":{"targetsErschoepfung":true}}`
- **THEN** the combat pipeline SHALL receive `damageType: 'STUMPF'`
- **AND** [`getDamageTypeBehavior`](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html#get) SHALL resolve `targetsErschoepfung: true`

#### Scenario: Label changes do not change behavior lookup

- **WHEN** a GM changes the label of a configured damage type while preserving its `value`
- **THEN** downstream damage behavior SHALL continue to resolve by the unchanged `value`
