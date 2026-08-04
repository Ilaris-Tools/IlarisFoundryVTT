## ADDED Requirements

### Requirement: Combat provides a shared armed-attack resolution path

Melee and ranged combat SHALL pass a serializable attack context through their
existing direct-success, failed-attack, and defense-resolution paths. The common
armed-attack helper SHALL receive the attacking Actor, the resolved target when
available, the attack type, and the attack-context snapshot. It SHALL consume a
matching armed effect charge after every matching attack resolution, but SHALL
apply armed damage only before the follow-up damage roll for a confirmed hit.
This system helper shall resolve armed combat effects without using a Foundry
core hook.

#### Scenario: Direct successful attack resolves an armed effect

- **WHEN** a matching attack succeeds where no defense result is required
- **THEN** the shared armed-attack helper SHALL consume its charge and resolve
  the armed damage context before the follow-up damage roll

#### Scenario: Failed defense resolves an armed effect

- **WHEN** a target fails a melee or ranged defense against a matching attack
- **THEN** the shared armed-attack helper SHALL consume the original
  attack-context snapshot for the attacker and resolve its damage contribution

#### Scenario: Successful defense consumes without resolving armed damage

- **WHEN** a target successfully defends against an attack
- **THEN** the system SHALL consume the matching armed-effect charge
- **AND** it SHALL not apply that effect's armed damage contribution
