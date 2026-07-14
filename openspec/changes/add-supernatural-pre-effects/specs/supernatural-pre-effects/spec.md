## ADDED Requirements

### Requirement: Pre-effects stored on übernatürlich items

Übernatürlich items (Zauber, Liturgie, Anrufung) SHALL support a `preEffects` array field in their data model, defined via the shared `createUebernatuerlichTalentFields()` helper.

#### Scenario: Zauber item has preEffects

- **WHEN** a Zauber item data model is defined
- **THEN** it SHALL include `system.preEffects` as an ArrayField of SchemaField objects

#### Scenario: Liturgie item has preEffects

- **WHEN** a Liturgie item data model is defined
- **THEN** it SHALL include `system.preEffects` identically to Zauber (same shared helper)

#### Scenario: Anrufung item has preEffects

- **WHEN** an Anrufung item data model is defined
- **THEN** it SHALL include `system.preEffects` identically to Zauber (same shared helper)

### Requirement: Pre-effect schema

Each pre-effect entry SHALL contain: `baseDuration` (integer turns), `instant` (boolean: skip ActiveEffect creation), `amplifiedByMaechtigeMagie` (boolean), `change` (key, type, value, maechtigBonus, priority), and optional `avoidTest` (enabled, fertigkeit, attribut, diminishedOnly, diminishedValue).

#### Scenario: Instant pre-effect applies directly

- **WHEN** a pre-effect has `instant: true`
- **THEN** the change value SHALL be applied directly to the target without creating an ActiveEffect

#### Scenario: Non-instant pre-effect creates ActiveEffect

- **WHEN** a pre-effect has `instant: false`
- **THEN** an IlarisActiveEffect SHALL be created on the target with `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: Amplification flag controls Mächtige Magie

- **WHEN** a pre-effect has `amplifiedByMaechtigeMagie: true` and the caster has Mächtige Magie/Liturgie active
- **THEN** `change.maechtigBonus` SHALL be appended to `change.value` before evaluation

#### Scenario: No amplification when flag is false

- **WHEN** a pre-effect has `amplifiedByMaechtigeMagie: false`
- **THEN** `change.value` SHALL be used as-is regardless of Mächtige Magie

### Requirement: Avoid/resist test

When a pre-effect has `avoidTest.enabled: true`, the target SHALL receive a whispered chat prompt with a resist button after the spell succeeds.

#### Scenario: Resist prompt sent to target

- **WHEN** a spell with avoidTest succeeds against a target
- **THEN** a whispered ChatMessage with `.resist-button` SHALL be sent to the target's controlling client via socket routing

#### Scenario: Resist test uses FertigkeitDialog

- **WHEN** the target clicks the resist button
- **THEN** `FertigkeitDialog` SHALL open with the configured `fertigkeit` or `attribut` probe

#### Scenario: Successful resist avoids effect

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `true`
- **THEN** the effect SHALL be applied with `diminishedValue` replacing `change.value`

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test
- **THEN** the pre-effect SHALL be applied with full `change.value`

### Requirement: Effect creation flow in UebernatuerlichDialog

After a successful spell cast, `UebernatuerlichDialog` SHALL first deduct energy cost (await), then fire pre-effects (fire-and-forget, no await).

#### Scenario: Energy deducted before effects

- **WHEN** a spell succeeds and has energy cost + preEffects
- **THEN** energy SHALL be deducted before `_applyPreEffects()` is called

#### Scenario: Effects fire-and-forget

- **WHEN** `_applyPreEffects()` is called
- **THEN** the method SHALL NOT be awaited — effects resolve asynchronously as resist tests complete

#### Scenario: Multi-target creates independent effects

- **WHEN** a spell targets 3 actors and has 2 preEffects
- **THEN** up to 6 ActiveEffects SHALL be created, one per target per preEffect (excluding avoided effects)

### Requirement: Self-cast duration bonus

When the caster is also the target, +1 turn SHALL be added to the pre-effect duration.

#### Scenario: Self-cast gets +1 duration

- **WHEN** the caster explicitly targets themselves with a spell that has `baseDuration: 5`
- **THEN** the created ActiveEffect SHALL have `remaining: 6` (baseDuration + 1)

#### Scenario: Enemy target gets base duration

- **WHEN** a spell with `baseDuration: 5` targets an enemy
- **THEN** the created ActiveEffect SHALL have `remaining: 5` (no bonus)

### Requirement: Effect origin tracking

Each created ActiveEffect SHALL record its origin using Foundry V14's `origin` field plus Ilaris-specific flags.

#### Scenario: Origin records caster UUID

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `origin` SHALL be set to the caster's actor UUID

#### Scenario: Flags record spell metadata

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `flags.ilaris` SHALL contain `sourceType: "uebernatuerlich"`, `spellName`, `spellUuid`, `casterUuid`, and `fertigkeiten`

### Requirement: Resist hooks

The system SHALL fire `Ilaris.postPreEffectResist` when building resist prompts and `Ilaris.postResistTest` when a resist test completes.

#### Scenario: postResistTest hook fires on resist resolution

- **WHEN** a target completes their resist test (success or failure)
- **THEN** `Ilaris.postResistTest` SHALL fire with `{rollResult, preEffectData}`

#### Scenario: postResistTest triggers effect creation

- **WHEN** `Ilaris.postResistTest` fires
- **THEN** the pre-effects system SHALL apply or skip the effect based on the resist outcome
