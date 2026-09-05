## ADDED Requirements

### Requirement: Creature summoning is dispatched as a successful pre-effect

The existing supernatural pre-effect processor SHALL recognize `summonCreature` alongside `summonItem` when processing the effective pre-effect list passed by `UebernatuerlichDialog`. It SHALL preserve the existing successful-cast guard, structured spell-form resolution, and all existing Item, instant, resistance, ActiveEffect, and provenance behavior.

#### Scenario: Effective creature pre-effect is dispatched

- **WHEN** `UebernatuerlichDialog` dispatches an effective pre-effect list after a successful cast
- **THEN** an enabled `summonCreature` entry SHALL be sent to the creature summoning runtime
- **AND** the selected creature type and source UUID from the dialog context SHALL be available to that runtime

#### Scenario: Failed cast does not summon

- **WHEN** the supernatural roll fails
- **THEN** the existing pre-effect dispatcher SHALL not invoke creature summoning
- **AND** no TokenDocument SHALL be created

#### Scenario: Existing item summoning remains unchanged

- **WHEN** an effective pre-effect contains summonItem without summonCreature
- **THEN** the existing item-summoning branch SHALL execute with its current target, provenance, and cleanup behavior
- **AND** the new creature branch SHALL not alter the embedded Item result

### Requirement: Creature summon context follows structured spell forms

When a structured spell form supplies the effective pre-effect list, the processor SHALL use that resolved list rather than reading only the source Item's `system.preEffects`. A selected creature runtime value SHALL be attached to the effective context without mutating the persisted source Item or structured form.

#### Scenario: Replace mode selects creature payload

- **WHEN** a structured form uses `replace` mode and provides a summonCreature pre-effect
- **THEN** only the effective replacement payload SHALL be dispatched for creature summoning
- **AND** source Item pre-effects that were replaced SHALL not create an additional creature

#### Scenario: Runtime selection is not persisted

- **WHEN** the caster selects a creature UUID during a cast
- **THEN** the selected UUID SHALL be used for that cast's processor context
- **AND** the source Item and structured form data SHALL remain unchanged
