## ADDED Requirements

### Requirement: Missing registry references warn and use Profan fallback

All damage-type consumers SHALL resolve a configured type key against the `damageTypes` world setting through [`foundry.Game`](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings). If the requested key is absent, the system SHALL notify the user in German and use `PROFAN` behavior and label for that resolution.

#### Scenario: Missing maneuver key falls back once

- **WHEN** a selected maneuver references `STUMPF` and the current registry no longer contains `STUMPF`
- **THEN** the system SHALL display `Schadenstyp "STUMPF" existiert nicht in den Einstellungen. Standard (Profan / Wunden) wird verwendet.` once for that key and registry state
- **AND** the damage SHALL affect Wunden without armor bypass

#### Scenario: A changed registry can warn for a newly missing key

- **WHEN** a damage type was available during an earlier resolution and is subsequently removed from the world setting
- **THEN** the next resolution referencing that key SHALL produce the missing-type warning
