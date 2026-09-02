## ADDED Requirements

### Requirement: GM can discover Ilaris Zones in the active Scene

The system SHALL provide a GM-only current-Scene registry for persistent
Ilaris Zones stored in
[RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html)
flags. The registry SHALL distinguish valid Ilaris Zones, malformed
Ilaris-scoped Zone metadata, and ordinary core Regions. Ordinary core Regions
SHALL not be administered or modified by this capability.

#### Scenario: Manager lists only valid persistent Ilaris Zones

- **WHEN** an active GM opens the Zone manager on a Scene containing valid
  Ilaris Zones and ordinary core Regions
- **THEN** it SHALL list each valid Ilaris Zone once in stable visible-name
  order and SHALL not list an ordinary core Region

#### Scenario: Malformed Zone metadata is visible but inert

- **WHEN** a Region has an `Ilaris.zone` flag but lacks required persistent
  Zone metadata
- **THEN** the manager SHALL render a German warning identifying that Region
- **AND** reconciliation SHALL not dispatch or mutate it automatically

### Requirement: GM can administer a Zone through the Scene Controls manager

The system SHALL add a GM-only **Zonen verwalten** tool through the documented
[`getSceneControlButtons`](https://foundryvtt.com/api/v14/modules/hookEvents.html#getSceneControlButtons)
Hook. It SHALL open an AppV2 manager titled **Ilaris-Zonen verwalten** for the
active Scene. Each valid Zone row SHALL show visible Zone, spell/caster,
lifecycle/trigger, duration, and membership/effect context.

#### Scenario: GM selects a Zone for native movement

- **WHEN** a GM presses **Auf Karte auswählen** on a valid Zone row
- **THEN** the system SHALL activate the public
  [RegionLayer](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.RegionLayer.html)
  and control the matching public
  [Region placeable](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Region.html)
  with panning
- **AND** the GM SHALL use Foundry's native Region controls to move or reshape
  it

#### Scenario: Manager preserves the agreed hierarchy in both themes

- **WHEN** the manager renders in Foundry light or dark mode
- **THEN** it SHALL show Scene context, reconciliation toolbar, malformed-zone
  warnings, then Zone rows in that order
- **AND** each scene-round row SHALL show its duration editor before its
  destructive **Zone aufheben** action without clipping or unreadable text

### Requirement: Duration changes and dismissal preserve Zone ownership

For a valid `sceneRounds` Zone, the manager SHALL persist only a finite integer
remaining duration of at least one through
[RegionDocument#update](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html#update).
It SHALL label an infinite Zone as **Permanent** and SHALL not expose a
scene-round duration editor for it. After explicit confirmation, the manager
SHALL dismiss one Zone through
[RegionDocument#delete](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html#delete),
preserving the existing Region-deletion ownership cleanup path.

#### Scenario: GM extends a scene-round Zone

- **WHEN** a GM changes a Zone from 3 to 6 remaining scene rounds and saves it
- **THEN** the Region's Ilaris Zone remaining value SHALL be 6
- **AND** its trigger history, application identity, membership, shape, and
  unrelated effect ownership SHALL remain unchanged

#### Scenario: GM dismisses only the selected Zone

- **WHEN** a GM confirms **Zone aufheben** for one Ilaris Zone
- **THEN** that Region SHALL be deleted and only its owned passive effects,
  condition sources, and traversal markers SHALL be cleaned
- **AND** a different Region's effects, a different cast's effects, and manual
  effects SHALL remain

### Requirement: Administrative reconciliation does not create gameplay events

The manager's **Abgleich durchführen** action SHALL process only valid Ilaris
Zones in the active Scene. It SHALL rebuild persisted membership from current
Foundry Region containment and restore missing passive applications through the
existing ownership-aware lifecycle. It SHALL not dispatch entry, traversal,
turn, round, damage, resistance, or ChatMessage behavior.

#### Scenario: GM reconciles a moved token without triggering a Zone

- **WHEN** a GM runs administrative reconciliation after a token's Zone
  membership became stale
- **THEN** the Zone membership SHALL match current containment and a missing
  passive application SHALL be restored where applicable
- **AND** no new trigger-based ActiveEffect, resistance prompt, damage roll,
  traversal marker, or ChatMessage SHALL be created
