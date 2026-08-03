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

Each pre-effect entry SHALL contain: `baseDuration` (integer turns), `instant` (boolean: skip ActiveEffect creation), `changes` (array of change objects, each with: `key`, `type`, `value`, `amplifiedByMaechtigeMagie` boolean, `maechtigBonus` string, `damageType` string, `diminishedValue` string, `diminishedMaechtigBonus` string, `priority` number), and optional `avoidTest` (enabled, fertigkeit, attribut, diminishedOnly, resistDifficulty). `resistDifficulty` SHALL default to 12 (system default difficulty) when not explicitly set. `damageType` SHALL be `"PROFAN"` (wounds) or `"STUMPF"` (Erschöpfung), only used for instant pre-effects targeting health.

#### Scenario: Instant pre-effect resolves damage via existing pipeline

- **WHEN** a pre-effect has `instant: true`
- **THEN** all changes MUST target `system.gesundheit.wunden` or `system.gesundheit.erschoepfungen` (instant is only for direct damage); the damage SHALL be resolved via `_applyDamageDirectly(targetActor, damage, damageType, false, speaker)` — the same pipeline used by weapon attacks, including WS threshold calculation, PROFAN/STUMPF handling, and LEP system support

#### Scenario: Non-instant pre-effect creates one ActiveEffect with all changes

- **WHEN** a pre-effect has `instant: false` with one or more changes
- **THEN** a single IlarisActiveEffect SHALL be created on the target containing ALL changes (including stat/skill changes that cannot be instant), with `system.ilarisTiming.durationType: "ownerTurns"`

#### Scenario: Per-change amplification flag controls Mächtige Magie

- **WHEN** a change within `changes` has `amplifiedByMaechtigeMagie: true` and the caster has Mächtige Magie/Liturgie active with QS > 0
- **THEN** that change's `maechtigBonus` SHALL be appended to its `value` once per QS before evaluation via `foundry.dice.Roll` (e.g., QS=2, value="2W6", maechtigBonus="+10" → evaluates "2W6+10+10"); `maechtigBonus` without a leading sign SHALL be prefixed with `+` automatically; any formula pattern works (dice, flat, mixed); other changes are unaffected

#### Scenario: No amplification when flag is false

- **WHEN** a change has `amplifiedByMaechtigeMagie: false`
- **THEN** its `value` SHALL be used as-is regardless of Mächtige Magie

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
- **THEN** the effect SHALL be applied with `diminishedValue` replacing `change.value` and `diminishedMaechtigBonus` replacing `change.maechtigBonus` (or `''` if not set)

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test
- **THEN** the pre-effect SHALL be applied with full `change.value`

### Requirement: Effect creation flow in UebernatuerlichDialog

After `super._updateSchipsStern()`, `UebernatuerlichDialog` SHALL call `applyPreEffects(rollResult)` (fire-and-forget, no await) when the spell succeeded and has preEffects.

#### Scenario: Effects fire after Schips update

- **WHEN** `_angreifenKlick()` reaches line 373 (`super._updateSchipsStern()`)
- **THEN** `applyPreEffects(rollResult)` SHALL be called immediately after, guarded by `isSuccess && preEffects.length > 0`

#### Scenario: Standard difficulty effects fire after roll

- **WHEN** a spell with `schwierigkeit` succeeds (`isSuccess === true` from roll against difficulty)
- **THEN** `applyPreEffects(rollResult)` SHALL fire after `super._updateSchipsStern()`

#### Scenario: Non-standard difficulty effects fire after manual confirmation

- **WHEN** a spell has no `schwierigkeit` and the user clicks `✅ Erfolgreich gewirkt` → `_energieAbrechnenKlick(true)`
- **THEN** `applyPreEffects({ success: true })` SHALL fire from `_energieAbrechnenKlick()` after `applyEnergyCost()`, guarded by `isSuccess && preEffects.length > 0`

#### Scenario: Failed spell does not fire effects

- **WHEN** a spell fails (`isSuccess === false`)
- **THEN** `applyPreEffects` SHALL NOT be called

#### Scenario: Effects fire-and-forget

- **WHEN** `applyPreEffects()` is called
- **THEN** the method SHALL NOT be awaited — effects resolve asynchronously as resist tests complete

#### Scenario: Multi-target creates independent effects

- **WHEN** a spell targets 3 actors and has 2 preEffects
- **THEN** up to 6 ActiveEffects SHALL be created, one per target per preEffect (excluding avoided effects)

### Requirement: Self-cast and maneuver duration bonus

When the caster is also the target, +1 turn SHALL be added to the pre-effect duration. Additionally, maneuvers that extend spell duration SHALL add their bonus to `baseDuration` for all pre-effects.

#### Scenario: Maneuver extends pre-effect duration

- **WHEN** a maneuver with duration extension (e.g., "Verlängerte Wirkung") is active
- **THEN** the maneuver's duration bonus SHALL be added to each pre-effect's `baseDuration` before creating the effect

#### Scenario: Self-cast gets +1 duration

- **WHEN** the caster explicitly targets themselves with a spell that has `baseDuration: 5`
- **THEN** the created ActiveEffect SHALL have `remaining: 6` (baseDuration + maneuverBonus + 1)

#### Scenario: Enemy target gets base duration

- **WHEN** a spell with `baseDuration: 5` targets an enemy
- **THEN** the created ActiveEffect SHALL have `remaining: 5` (baseDuration + maneuverBonus, no self-cast bonus)

### Requirement: Effect origin tracking

Each created ActiveEffect SHALL record its origin using Foundry V14's `origin` field plus Ilaris-specific flags.

#### Scenario: Origin records caster UUID

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `origin` SHALL be set to the caster's actor UUID

#### Scenario: Flags record spell metadata

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `flags.ilaris` SHALL contain `sourceType: "uebernatuerlich"`, `spellName`, `spellUuid`, `casterUuid`, and `fertigkeiten`

### Requirement: Resist resolution via FertigkeitDialog

Resist tests SHALL be resolved by opening FertigkeitDialog with resist metadata attached as `_resistContext`, then listening for the existing `Ilaris.postSkillRoll` hook. Each Mächtige Magie quality stage (QS) the caster has active SHALL increase the resist difficulty by 4.

#### Scenario: Mächtige Magie increases resist difficulty

- **WHEN** a resist test is opened and the caster has Mächtige Magie/Liturgie with QS > 0
- **THEN** FertigkeitDialog SHALL be opened with `options.success_val = avoidTest.resistDifficulty + (QS × 4)`, where `resistDifficulty` defaults to 12 if not set

#### Scenario: Resist context attached to dialog

- **WHEN** a resist button is clicked and FertigkeitDialog is opened
- **THEN** `dialog._resistContext` SHALL be set to `{eventId, preEffectData, spellUuid}` after dialog construction

#### Scenario: Resist handler detects its test via \_resistContext

- **WHEN** `Ilaris.postSkillRoll` fires
- **THEN** the resist handler SHALL check `dialog._resistContext` to determine if this is a resist test

#### Scenario: Successful resist avoids effect

- **WHEN** the resist handler detects a resist test with `rollResult.success === true` and `diminishedOnly === false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly applies diminished value (still amplified)

- **WHEN** the resist handler detects a resist test with `rollResult.success === true` and `diminishedOnly === true`
- **THEN** each change in `changes` SHALL use `diminishedValue` instead of `value` and `diminishedMaechtigBonus` instead of `maechtigBonus` (falling back to `''` if not set); if `amplifiedByMaechtigeMagie` is true, `diminishedMaechtigBonus` SHALL still be appended to the diminished value

#### Scenario: Failed resist applies full effect

- **WHEN** the resist handler detects a resist test with `rollResult.success === false`
- **THEN** each change in `changes` SHALL be applied with its full `value` (plus `maechtigBonus` if `amplifiedByMaechtigeMagie` is true)

### Requirement: Pre-effects GUI on item sheet

The übernatürlich item sheet SHALL render the `preEffects` array as an editable list with inline form fields, using a new `PARTS` entry and Handlebars template.

#### Scenario: Pre-effects section renders on sheet

- **WHEN** a Zauber, Liturgie, or Anrufung item sheet is opened
- **THEN** the sheet SHALL render a "Pre-Effects" section listing all existing pre-effects

#### Scenario: Add pre-effect button

- **WHEN** the user clicks "Add Pre-Effect"
- **THEN** a new pre-effect entry SHALL be appended to the `preEffects` array with default values

#### Scenario: Delete pre-effect button

- **WHEN** the user clicks the delete button on a pre-effect entry
- **THEN** that entry SHALL be removed from the `preEffects` array

#### Scenario: Pre-effect fields are editable

- **WHEN** the user edits any field within a pre-effect entry (baseDuration, instant, amplifiedByMaechtigeMagie, change fields, avoidTest fields)
- **THEN** the values SHALL be persisted to `system.preEffects[N].<field>` on save

#### Scenario: Avoid test fields shown conditionally

- **WHEN** `avoidTest.enabled` is checked
- **THEN** the avoidTest sub-fields (fertigkeit/attribut, diminishedOnly, diminishedValue) SHALL be displayed

#### Scenario: Avoid test fields hidden when disabled

- **WHEN** `avoidTest.enabled` is unchecked
- **THEN** the avoidTest sub-fields SHALL be hidden

### Requirement: Instant pre-effects in resist flow

When a resist test is resolved for a pre-effect with `instant: true`, damage SHALL be applied directly via `applyInstantPreEffect` instead of creating an ActiveEffect.

#### Scenario: Failed resist on instant effect applies full damage

- **WHEN** the target fails their resist test against an `instant` pre-effect
- **THEN** `applyInstantPreEffect` SHALL be called with the full change values (plus Mächtige Magie amplification)

#### Scenario: Successful resist with diminishedOnly on instant effect applies diminished damage

- **WHEN** the target succeeds their resist test with `diminishedOnly: true` against an `instant` pre-effect
- **THEN** `applyInstantPreEffect` SHALL be called with diminished values (`diminishedValue` replacing `value`, `diminishedMaechtigBonus` replacing `maechtigBonus`)

---

## Runtime Bug Fixes (Discovered During Implementation)

### Fix 1: `fromUuid` is `foundry.utils.fromUuid` in V14

**Symptom:** Resist resolution silently did nothing — `fromUuid(...)` was undefined in V14, `await undefined` returned `undefined`, then `createActiveEffectFromPreEffect` returned early (`changes.length === 0` guard) before accessing `spellItem.name`, so no error was thrown.

**Fix:** Changed all bare `fromUuid(...)` calls to `foundry.utils.fromUuid(...)` in `resist-handler.js` (`applyPreEffectFromResist`, `applyDiminishedEffect`).

### Fix 2: `createActiveEffectFromPreEffect` not exported

**Symptom:** `TypeError: createActiveEffectFromPreEffect is not a function` when resist handler tried to dynamically import it.

**Fix:** Added `export` keyword to `createActiveEffectFromPreEffect` in `pre-effects-processor.js` (was defined as a plain `async function`).

### Fix 3: Roll mode setting key changed in V14

**Symptom:** `ChatMessage.applyMode` error in FertigkeitDialog — `game.settings.get('core', 'rollMode')` returned undefined because V14 renamed it to `'messageMode'`.

**Fix:** Changed both `defaultRollMode` in `_prepareContext` and the fallback in `_executeRoll` in `scripts/skills/dialogs/fertigkeit.js` from `game.settings.get('core', 'rollMode')` to `game.settings.get('core', 'messageMode')`.

### Fix 4: `CONFIG.Dice.rollModes` deprecated in V14

**Symptom:** Deprecation warning in console.

**Fix:** Changed `CONFIG.Dice.rollModes` to `CONFIG.ChatMessage?.modes || CONFIG.Dice.rollModes` in `fertigkeit.js`.

### Fix 5: Instant pre-effect applied as ActiveEffect in resist flow

**Symptom:** After a failed resist, an `instant` pre-effect (e.g., direct damage spell) created a 1-round ActiveEffect instead of applying damage immediately.

**Fix:** Added `instant` checks in `applyPreEffectFromResist` and `applyDiminishedEffect` in `resist-handler.js`, calling `applyInstantPreEffect` (newly exported) for instant effects. Also added `ChatMessage.getSpeaker()` for the damage chat message.
