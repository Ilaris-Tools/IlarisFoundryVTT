## MODIFIED Requirements

### Requirement: Damage spells have instant pre-effects

Direct damage spells (elemental rays, single-target projectiles) in the `zauberspruche-und-rituale` compendium SHALL include pre-effect configurations that apply instant damage to the target's wounds. A spell whose rule text declares it ballistic SHALL also author the normalized ballistic source marker; that marker SHALL cause no elemental side effect by itself.

#### Scenario: Ignifaxius applies 4W6 fire damage

- **WHEN** a GM casts Ignifaxius and the spell succeeds against an undefended target
- **THEN** the target SHALL receive `4W6` instant damage to `system.gesundheit.wunden` via `_applyDamageDirectly` with `damageType: FEUER`

#### Scenario: Mächtige Magie amplifies damage

- **WHEN** Ignifaxius is cast with Mächtige Magie QS 2
- **THEN** the damage formula SHALL evaluate `4W6+2W6+2W6` (base + maechtigBonus × QS)

#### Scenario: All \*faxius spells share the same pre-effect structure

- **WHEN** any \*faxius spell (Ignifaxius, Frigifaxius, Aquafaxius, Humofaxius, Archofaxius, Orcanofaxius) is examined
- **THEN** each SHALL have `preEffects[0].instant: true`, `changes[0].key: "system.gesundheit.wunden"`, `changes[0].amplifiedByMaechtigeMagie: true`, and `damageType` matching the spell's element

#### Scenario: Ballistic source is explicit

- **WHEN** Ignifaxius or another reviewed ballistic source is examined
- **THEN** it SHALL declare the ballistic marker without encoding a spell-name-specific resolution branch
