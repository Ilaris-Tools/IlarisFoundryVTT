## MODIFIED Requirements

### Requirement: Damage spells have instant pre-effects

Direct damage spells (elemental rays, single-target projectiles) in the `zauberspruche-und-rituale` compendium SHALL include pre-effect configurations that apply instant damage to the target's wounds. A configured elemental side effect SHALL be resolved only through the damage type after direct damage succeeds.

#### Scenario: Ignifaxius applies 4W6 fire damage

- **WHEN** a GM casts Ignifaxius and the spell succeeds against an undefended visible target
- **THEN** the target SHALL receive `4W6` instant damage to `system.gesundheit.wunden` via `_applyDamageDirectly` with `damageType: FEUER`
- **AND** the configured FEUER side effect SHALL resolve Nachbrennen independently of the ballistic gate

#### Scenario: Mächtige Magie amplifies damage

- **WHEN** Ignifaxius is cast with Mächtige Magie QS 2
- **THEN** the damage formula SHALL evaluate `4W6+2W6+2W6` (base + maechtigBonus × QS)

#### Scenario: All \*faxius spells share the same pre-effect structure

- **WHEN** any \*faxius spell (Ignifaxius, Frigifaxius, Aquafaxius, Humofaxius, Archofaxius, Orcanofaxius) is examined
- **THEN** each SHALL have `preEffects[0].instant: true`, `changes[0].key: "system.gesundheit.wunden"`, `changes[0].amplifiedByMaechtigeMagie: true`, and `damageType` matching the spell's element
