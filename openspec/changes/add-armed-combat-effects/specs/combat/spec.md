## ADDED Requirements

### Requirement: Combat provides a shared confirmed-hit resolution path

Melee and ranged combat SHALL pass a serializable attack context through their
existing direct-success and defense-resolution paths. The common confirmed-hit
helper SHALL receive the attacking Actor, the resolved target, the attack type,
and the attack-context snapshot before damage is resolved. This system helper
shall resolve armed combat effects without using a Foundry core hook.

#### Scenario: Direct successful attack confirms an armed effect

- **WHEN** a matching attack succeeds where no defense result is required
- **THEN** the shared confirmed-hit helper SHALL resolve its armed attack
  context before the follow-up damage roll

#### Scenario: Failed defense confirms an armed effect

- **WHEN** a target fails a melee or ranged defense against a matching attack
- **THEN** the shared confirmed-hit helper SHALL resolve the original
  attack-context snapshot for the attacker

#### Scenario: Successful defense does not confirm an armed effect

- **WHEN** a target successfully defends against an attack
- **THEN** the system SHALL not invoke armed-effect charge expenditure for that
  attack
