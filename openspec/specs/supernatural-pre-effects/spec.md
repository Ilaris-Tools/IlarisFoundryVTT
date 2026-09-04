## Purpose

Automatic pre-effect system for übernatürlich items (Zauber, Liturgie, Anrufung). When a spell succeeds, pre-effects apply automatically: instant damage via the existing damage pipeline, or duration-based ActiveEffects with Ilaris turn timing. Supports resist tests via FertigkeitDialog, Mächtige Magie amplification, and maneuver duration bonuses.

## Requirements

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

Each pre-effect entry SHALL contain: `baseDuration` (integer turns), `instant` (boolean: skip ActiveEffect creation), `changes` (array of change objects, each with: `key`, `type`, `value`, `amplifiedByMaechtigeMagie` boolean, `maechtigBonus` string, `damageType` string, `diminishedValue` string, `diminishedMaechtigBonus` string, `priority` number), and optional `avoidTest` (enabled, fertigkeit, talent, attribut, diminishedOnly, resistDifficulty). `avoidTest.talent` SHALL be an optional profane talent name associated with `avoidTest.fertigkeit`. `resistDifficulty` SHALL default to 12 (system default difficulty) when not explicitly set. `damageType` SHALL be `"PROFAN"` (wounds) or `"STUMPF"` (Erschöpfung), only used for instant pre-effects targeting health.

A non-instant Pre-Effect MAY define optional `resistanceOutcomes.success` and `resistanceOutcomes.failure` payloads. An enabled payload SHALL contain replacement `changes`, `ilarisModifiers`, `marker`, and `condition` fields. A marker SHALL contain `enabled`, `id`, and `label`; new enabled marker authoring SHALL require its stable id and German label, while legacy enabled markers without them remain valid.

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

#### Scenario: Omitted talent remains a skill-only resistance check

- **WHEN** an existing pre-effect has avoidTest.fertigkeit but omits avoidTest.talent
- **THEN** the pre-effect SHALL remain valid and the resistance dialog SHALL open without a preselected talent

#### Scenario: Legacy Pre-Effect omits resistance outcomes

- **WHEN** an existing Pre-Effect has no `resistanceOutcomes` object
- **THEN** it SHALL remain valid without source migration
- **AND** the system SHALL retain its current root-result and `diminishedOnly` behavior

### Requirement: Avoid/resist test

When a pre-effect has `avoidTest.enabled: true`, the target SHALL receive a whispered chat prompt with a resist button after the spell succeeds. The `avoidTest.fertigkeit`, `avoidTest.talent`, and `avoidTest.attribut` fields on the item sheet SHALL be populated from profane compendium data and fixed config respectively. The sheet SHALL present the ordinary Pre-Effect configuration before resistance controls, followed by optional, clearly labelled success and failure result panels.

#### Scenario: Resist prompt sent to target

- **WHEN** a spell with avoidTest succeeds against a target
- **THEN** a whispered ChatMessage with `.resist-button` SHALL be sent to the target's controlling client via socket routing

#### Scenario: Resist test uses FertigkeitDialog with correct skill resolution

- **WHEN** the target clicks the resist button and `avoidTest.fertigkeit` is set to a profane skill name such as "Athletik"
- **THEN** the resist handler SHALL find the skill in `actor.profan.fertigkeiten` by `name`, extract its array index, `system.pw`, and `system.talente`
- **AND** `FertigkeitDialog` SHALL be opened with `probeType: 'fertigkeit'`, `fertigkeitKey: <index>`, `pw: <resolved PW>`, and `talentList: <resolved talents>`

#### Scenario: Configured possessed talent is auto-selected

- **WHEN** avoidTest.fertigkeit is "Athletik", avoidTest.talent is "Akrobatik", and the target's resolved Athletik skill owns a talent named "Akrobatik"
- **THEN** FertigkeitDialog SHALL open with "Akrobatik" selected
- **AND** the dialog SHALL use the skill's PWT for preview and roll resolution

#### Scenario: Missing configured talent falls back to no talent

- **WHEN** avoidTest.fertigkeit is configured and avoidTest.talent is absent from the target's resolved skill talents
- **THEN** FertigkeitDialog SHALL open for the configured skill with ohne Talent selected
- **AND** the dialog SHALL use the skill's PW for preview and roll resolution
- **AND** the handler SHALL NOT show a warning solely because the optional talent is missing

#### Scenario: Resist test uses FertigkeitDialog with correct attribute resolution

- **WHEN** the target clicks the resist button and `avoidTest.attribut` is set (e.g., "KO") with no `avoidTest.fertigkeit`
- **THEN** the resist handler SHALL compute `pw` from `actor.system.attribute["KO"].pw`
- **AND** `FertigkeitDialog` SHALL be opened with `probeType: 'attribut'`, `fertigkeitKey: "KO"`, `fertigkeitName: "Konstitution"`, and `pw: <computed PW>`

#### Scenario: Resist test warns when skill not found on actor

- **WHEN** the configured `avoidTest.fertigkeit` name is not found in `actor.profan.fertigkeiten`
- **THEN** the resist handler SHALL show a warning notification and SHALL NOT open FertigkeitDialog

#### Scenario: Successful resist avoids effect

- **WHEN** the target succeeds their resist test, no enabled success outcome is authored, and `diminishedOnly` is `false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly

- **WHEN** the target succeeds their resist test, no enabled success outcome is authored, and `diminishedOnly` is `true`
- **THEN** the effect SHALL be applied with `diminishedValue` replacing `change.value` and `diminishedMaechtigBonus` replacing `change.maechtigBonus` (or `''` if not set)

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test and no enabled failure outcome is authored
- **THEN** the pre-effect SHALL be applied with full `change.value`

#### Scenario: Explicit outcome panels are ordered after resistance configuration

- **WHEN** a GM edits a spell or maneuver Pre-Effect with resistance enabled
- **THEN** the shared card SHALL show normal effect controls first, followed by Widerstand controls
- **AND** it SHALL show optional panels labelled `Bei misslungener Widerstandsprobe` and `Bei gelungener Widerstandsprobe` after those controls

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

Each created [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) SHALL record its origin using Foundry V14's `origin` field plus Ilaris-specific flags. Every non-instant Pre-Effect SHALL additionally record its source component index and the application identity shared by all persistent effects from that target and cast. An outcome-created effect SHALL retain the same source metadata and additionally record its resolved resistance outcome. A marker outcome SHALL also record its stable marker id. Every supernatural outcome effect SHALL record `sourceItemUuid` and the concrete `castSkill` selected before its originating roll; `spellUuid` SHALL remain for compatibility.

#### Scenario: Origin records caster UUID

- **WHEN** an ActiveEffect is created from a pre-effect
- **THEN** `origin` SHALL be set to the caster's actor UUID

#### Scenario: Flags record spell metadata and application identity

- **WHEN** a non-instant ActiveEffect is created from Pre-Effect entry `N`
- **THEN** `flags.ilaris` SHALL contain `sourceType: "uebernatuerlich"`, `spellName`, `spellUuid`, `casterUuid`, `fertigkeiten`, `preEffectIndex: N`, and an `applicationId`
- **AND** it SHALL contain `sourceItemUuid` equal to the source spell Item UUID
- **AND** it SHALL contain the exact resolved `castSkill` for that cast

#### Scenario: Outcome flags extend rather than replace spell provenance

- **WHEN** an explicit resistance outcome creates an ActiveEffect
- **THEN** `flags.ilaris` SHALL retain every spell metadata and application field required for its parent Pre-Effect
- **AND** it SHALL add `resistanceOutcome: "success"` or `"failure"`
- **AND** it SHALL add `markerId` when the selected result is a marker

### Requirement: Persistent same-spell recasts follow the world stacking mode

Before a non-instant Pre-Effect creates its ActiveEffect, the processor SHALL
read the world `supernaturalEffectStacking` setting. The policy SHALL apply at
the common creation path used by both direct casts and resolved resistance
tests.

#### Scenario: Ilaris mode retains same-spell effects

- **WHEN** the world uses `ilaris` mode and a target receives the same
  non-instant spell Pre-Effect component more than once
- **THEN** the processor SHALL create an additional ActiveEffect for every
  successful application
- **AND** it SHALL NOT delete an existing effect
- **AND** those semantic modifiers SHALL remain subject to normal
  strongest-effect resolution

#### Scenario: Foundry mode replaces a prior source application

- **WHEN** the world uses `foundry` mode and a target receives a non-instant
  Pre-Effect from a spell or liturgy source with a new `applicationId`
- **THEN** the processor SHALL delete all existing embedded
  [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  documents on that target whose `flags.ilaris.sourceType` is
  `"uebernatuerlich"`, whose `spellUuid` matches the source, and whose
  `applicationId` differs or is absent
- **AND** it SHALL use
  [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments)
  before it creates the new effect
- **AND** the new effect SHALL contain the current duration and materialized
  amplification or diminished-resistance values

#### Scenario: Components from one new application remain together

- **WHEN** a spell has two non-instant Pre-Effect components with the same
  `applicationId` in `foundry` mode
- **THEN** the processor SHALL retain both components
- **AND** it SHALL NOT delete a component created earlier by that same
  application

#### Scenario: Previous legacy effects are replaced with their source

- **WHEN** an existing supernatural effect has the same spell UUID but lacks
  `flags.ilaris.applicationId`
- **THEN** the processor SHALL delete that effect during a Foundry-mode recast
  from the same source

### Requirement: Resist resolution via FertigkeitDialog

Resist tests SHALL be resolved by opening FertigkeitDialog with resist metadata attached as `_resistContext`, then listening for the existing `Ilaris.postSkillRoll` hook. `avoidTest.resistDifficultySource` SHALL select the difficulty source: a missing or invalid value is `fixed`, while `triggeringRoll` uses the serialized final triggering-roll total. In `fixed` mode, `resistDifficulty` SHALL default to 12 only when it is absent or null; its explicit numeric value, including `0`, SHALL be retained. Each Mächtige Magie/Liturgie quality stage (QS) the caster has active SHALL increase a fixed-source difficulty by 4 and SHALL NOT alter a triggering-roll difficulty. The dialog SHALL display the resolved target difficulty (`Erschwernis`) and a resist-specific title.

#### Scenario: Fixed difficulty defaults to 12 and receives Mächtige Magie

- **WHEN** a resist test uses the `fixed` source and `resistDifficulty` is absent or null
- **THEN** FertigkeitDialog SHALL be opened with `options.success_val = 12 + (QS × 4)`

#### Scenario: Explicit fixed zero is not a source sentinel

- **WHEN** a resist test uses the `fixed` source and `resistDifficulty` is `0`
- **THEN** FertigkeitDialog SHALL use `options.success_val = 0 + (QS × 4)`
- **AND** the system SHALL NOT substitute the default merely because the value is zero

#### Scenario: Triggering roll supplies the exact difficulty

- **WHEN** a resist test uses `resistDifficultySource: "triggeringRoll"` and its prompt contains a finite triggering-roll total
- **THEN** FertigkeitDialog SHALL use that total as `options.success_val`
- **AND** the system SHALL NOT add a fixed difficulty or a Mächtige Magie/Liturgie QS bonus

#### Scenario: Missing triggering roll falls back safely

- **WHEN** a resist test uses `resistDifficultySource: "triggeringRoll"` but its prompt does not contain a finite triggering-roll total
- **THEN** the system SHALL show a localized warning
- **AND** FertigkeitDialog SHALL use the documented default difficulty of 12

#### Scenario: Resist context attached to dialog

- **WHEN** a resist button is clicked and FertigkeitDialog is opened
- **THEN** `dialog._resistContext` SHALL be set to `{eventId, preEffectData, spellUuid}` after dialog construction

#### Scenario: Resist dialog shows difficulty in preview

- **WHEN** FertigkeitDialog is opened for a resist test with `success_val` set
- **THEN** the preview summary SHALL include an "Erschwernis" row showing `success_val`

#### Scenario: Resist dialog shows spell context in title

- **WHEN** FertigkeitDialog is opened for a resist test with `resistAgainst` set to the spell name
- **THEN** the dialog title SHALL read `"Widerstandsprobe: <skill> (gegen <spellName>)"`

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

The übernatürlich item sheet SHALL render the `preEffects` array as an editable list with inline form fields by extending the shared `PreEffectItemSheet` and supplying its supernatural `form` Handlebars part. The shared base SHALL provide the Pre-Effect named part and editor lifecycle; the resulting authoring controls and persisted data SHALL remain the standard Pre-Effect structure.

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
- **THEN** the avoidTest sub-fields (fertigkeit/talent/attribut, diminishedOnly, diminishedValue) SHALL be displayed

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

### Requirement: Table-visible spell-named marker convention

The existing [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)-based pre-effect flow SHALL permit reviewed compendium entries to use a timed spell-named ActiveEffect as a table-visible marker when the rules require a condition identifier but no automatic enforcement.

#### Scenario: Marker requires no new actor schema

- **WHEN** a reviewed pre-effect records handlungsunfähig as a marker
- **THEN** it SHALL use the existing spell-named ActiveEffect and a no-op numeric change
- **AND** it SHALL NOT write an arbitrary actor-system field or introduce a generic marker schema

#### Scenario: Marker mechanics remain manual

- **WHEN** a spell-named marker ActiveEffect is present
- **THEN** the table SHALL be able to see its duration and source spell
- **AND** the system SHALL NOT claim that it automatically prevents actions

### Requirement: Pre-effects can declare semantic Ilaris modifiers

Non-instant pre-effects SHALL support a separate `ilarisModifiers` array in
addition to their existing native `changes` array. The pre-effect editor SHALL
let a GM configure the modifier phase, target, value, stacking policy,
comparison value, selectors, and the same amplification/diminished-value
fields available to native changes. On a successful cast, the processor SHALL
copy native changes into the created ActiveEffect's `changes` and semantic
modifiers into `system.ilarisModifiers`, except that a mappable native
main-attribute change SHALL be redirected to its semantic roll-phase form.

#### Scenario: Spell pre-effect creates a semantic attack modifier

- **WHEN** a non-instant Zauber pre-effect contains an AT Ilaris modifier
- **THEN** casting it SHALL create a native ActiveEffect whose
  `system.ilarisModifiers` contains that modifier
- **AND** the modifier SHALL not be duplicated in `changes`

#### Scenario: Existing non-attribute path change remains compatible

- **WHEN** a non-instant pre-effect contains only a classical Foundry change
  that does not target a main attribute
- **THEN** casting it SHALL continue to create the same `changes` entry on the
  ActiveEffect

### Requirement: Semantic modifiers use native Pre-Effect value transformations

When a non-instant pre-effect is applied, its semantic Ilaris modifiers SHALL
use the same Mächtige Magie/Liturgie and diminished-resist value selection as
native changes. The processor SHALL materialize the selected full or diminished
value, including the appropriate bonus once per QS, in the newly created
ActiveEffect. It SHALL apply the same transformation to an explicitly authored
comparison-value formula when one exists, so stacking compares the applied
effect rather than the unamplified pre-effect definition.

#### Scenario: Amplification is materialized when creating a semantic effect

- **WHEN** an Ilaris modifier has `amplifiedByMaechtigeMagie: true` and the
  caster applies it with Mächtige Magie/Liturgie QS greater than zero
- **THEN** the created ActiveEffect SHALL contain the modifier's value with
  `maechtigBonus` appended once per QS
- **AND** its stacking comparison SHALL use that applied amplified value

#### Scenario: Diminished resist materializes a semantic diminished value

- **WHEN** a target succeeds a diminished-only resist test against a semantic
  Ilaris modifier
- **THEN** the created ActiveEffect SHALL contain `diminishedValue` and, when
  amplified, `diminishedMaechtigBonus` using the same rules as a native change

### Requirement: Spell effects are classified as supernatural sources

The pre-effect processor SHALL classify ActiveEffects created from Zauber,
Liturgien, and Anrufungen as übernatürlich for the rule-aware resolver, while
preserving the existing origin metadata used to identify spell, caster, and
source item.

#### Scenario: Competing spell effects enter the supernatural comparison

- **WHEN** two active effects were created by successful spell pre-effects
  and both have matching `strongest-supernatural` modifiers
- **THEN** they SHALL be eligible for strongest-effect resolution in Ilaris
  rule mode

#### Scenario: Vorteil effect is not reclassified

- **WHEN** an ActiveEffect from any Vorteil, including a magical or karmic
  Vorteil, has an ordinary Ilaris modifier
- **THEN** it SHALL remain additive even if it matches a spell modifier's
  output context

### Requirement: Pre-effects support armed combat configuration

An übernatürlich pre-effect MAY define `armedCombat` input, scope, contribution, and charges. The item sheet and cast dialog SHALL author and collect its bounded numeric inputs; a successful cast SHALL materialize them in the generated ActiveEffect.

#### Scenario: Armed configuration materializes a consumable effect

- **WHEN** a successful cast uses a pre-effect with configured `armedCombat` inputs, scope, contribution, and charges
- **THEN** the system SHALL materialize those bounded values in the generated ActiveEffect

### Requirement: Pre-effect authoring exposes resistance difficulty sources

The übernatürlich item-sheet Pre-Effect editor SHALL persist `avoidTest.resistDifficultySource` with `fixed` as its default. When an avoid test is enabled, it SHALL present the German selector `Schwierigkeit aus` with the choices `Fester Wert` (`fixed`) and `Ergebnis der auslösenden Probe` (`triggeringRoll`). The numeric `resistDifficulty` field SHALL remain available for the fixed source and show its default value of 12.

#### Scenario: New avoid test defaults to a fixed difficulty

- **WHEN** a GM creates a Pre-Effect with an avoid test
- **THEN** its `avoidTest.resistDifficultySource` SHALL be `fixed`
- **AND** its `avoidTest.resistDifficulty` SHALL be 12

#### Scenario: GM selects triggering-roll difficulty

- **WHEN** a GM selects `Ergebnis der auslösenden Probe` for an enabled avoid test
- **THEN** the sheet SHALL persist `avoidTest.resistDifficultySource: "triggeringRoll"`
- **AND** the numeric fixed field SHALL not be presented as the active source of that test's difficulty

### Requirement: Resistance prompts carry a triggering-roll snapshot

The pre-effect processor SHALL serialize the finite total of the roll supplied to `applyPreEffects` as `triggeringRollTotal` in the existing resistance prompt. The prompt SHALL continue to use the existing [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html) transport and shall not re-evaluate or look up the source roll when the target clicks its button.

#### Scenario: Supernatural roll total is copied into the prompt

- **WHEN** a successful supernatural pre-effect with an avoid test receives a roll result containing `roll.total`
- **THEN** its resistance prompt data SHALL contain that total as `triggeringRollTotal`

#### Scenario: Calls without a roll do not invent a triggering total

- **WHEN** a pre-effect caller supplies no Roll or a non-finite `roll.total`
- **THEN** the resistance prompt data SHALL omit `triggeringRollTotal`
- **AND** fixed-source resistance behaviour SHALL remain available

### Requirement: Pre-effects support a generic summon-item operation

An übernatürlich Item pre-effect SHALL optionally define a `summonItem`
configuration containing a source Item UUID, `sourceKind`, owner-turn base
duration, and optional clone-data overrides. The configured source SHALL
resolve only from the catalog selected by `sourceKind`: `waffe` uses
`waffenPacks` and a weapon Item, while `gegenstand` uses `gegenstandPacks` and
a Gegenstand Item. Successful pre-effect processing SHALL apply the operation
to every selected target and SHALL reject a missing, invalid, or unavailable
source without creating a clone or marker.

#### Scenario: Pre-effect sheet offers configured source Items

- **WHEN** a GM configures a summon-item pre-effect
- **THEN** the GM SHALL choose whether the source is a `Waffe` or `Gegenstand`
- **AND** the sheet SHALL offer only matching Item sources from that selected catalog
- **AND** it SHALL persist the chosen source UUID rather than a display name

#### Scenario: Invalid source prevents a partial summon

- **WHEN** a successful summon-item pre-effect references an Item outside the configured catalog or a missing source
- **THEN** the system SHALL notify the user of the unavailable source
- **AND** it SHALL create neither an owned Item nor an expiry marker

### Requirement: Summon-item overrides materialize Mächtige Magie on the clone

Each configured summon-item data override SHALL support `value`,
`amplifiedByMaechtigeMagie`, and `maechtigBonus`. The processor SHALL
materialize the override once per Mächtige Magie quality stage before creating
the clone, without applying that override to the target Actor or unrelated
Items.

#### Scenario: Clone receives materialized damage override

- **WHEN** a summon-item TP override has value `2W20`, Mächtige Magie bonus `+1W20`, and two quality stages
- **THEN** the clone SHALL receive `2W20+1W20+1W20` as its configured TP value
- **AND** the target Actor's other Item data SHALL remain unchanged

### Requirement: Pre-effect processor materializes passive Zone applications

The Pre-Effect processor SHALL accept explicit passive-Zone context from the Region lifecycle service. For a valid non-instant, non-resistance Pre-Effect it SHALL create an infinite-timing ActiveEffect with passive Zone provenance and SHALL preserve token-safe target context.

#### Scenario: Passive Pre-Effect creates an infinite ActiveEffect

- **WHEN** a persistent passive Zone applies a valid non-instant Pre-Effect to a contained Token
- **THEN** the processor SHALL create an ActiveEffect with `system.ilarisTiming.durationType: "infinite"`
- **AND** it SHALL retain the originating Region and Token identifiers

#### Scenario: Passive mode does not route a resistance prompt

- **WHEN** a passive Zone encounters a Pre-Effect with `avoidTest.enabled: true`
- **THEN** the processor SHALL not create an ActiveEffect or resistance prompt for it
- **AND** the existing triggered-resistance Zone behavior SHALL remain available for a triggered Zone

### Requirement: Explicit marker-only Pre-Effects are visible ActiveEffects

The Pre-Effect processor SHALL treat `marker.enabled: true` as an explicit request to create a visible ActiveEffect even when the Pre-Effect has no mechanical changes. It SHALL retain `system.ilarisMarker: true` on the created effect. An otherwise empty Pre-Effect without the marker flag SHALL remain a no-op.

#### Scenario: Marker-only passive Zone effect is created

- **WHEN** a passive Zone applies a non-instant Pre-Effect with `marker.enabled: true` and no mechanical changes
- **THEN** the processor SHALL create one visible infinite-timing ActiveEffect with passive Zone provenance
- **AND** the effect SHALL carry `system.ilarisMarker: true`

### Requirement: Zone targets enter the existing pre-effect pipeline after success

The supernatural pre-effect processor SHALL accept token-aware targets resolved from an instant Region and SHALL apply each pre-effect once per resolved target only after the originating spell succeeds. Non-zone target behavior SHALL remain unchanged.

#### Scenario: Instant zone uses token actors

- **WHEN** a successful instant zone resolves two intersecting tokens
- **THEN** `applyPreEffects` SHALL process two targets carrying `tokenId`, `actorId`, and `actorLink`

#### Scenario: Zone effects remain deferred on failure

- **WHEN** an instant or persistent zone spell fails
- **THEN** the processor SHALL not apply pre-effects and no persistent zone SHALL be created

### Requirement: Persistent zone triggers reuse resistance routing

Persistent zone creation, entry, and re-entry events SHALL invoke the existing pre-effect and resist-handler paths with serialized source zone context. A resistance result SHALL affect only the triggering token actor.

#### Scenario: Entry resistance resolves for one token

- **WHEN** one token enters a persistent zone with `avoidTest.enabled === true`
- **THEN** the existing resist prompt flow SHALL be used with the zone's spell and token metadata

### Requirement: Pre-effects resolve from the effective spell form

After a successful supernatural cast, the processor SHALL apply the effective pre-effect list resolved from selected structured forms rather than unconditionally reading the source Item's `system.preEffects`. Existing resistance, timing, Ilaris modifier, provenance, and [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) behavior SHALL apply unchanged to each resolved entry.

#### Scenario: Attributo applies selected form effects

- **WHEN** a player successfully casts Attributo with an attribute replacement form
- **THEN** the processor SHALL apply that form's effective pre-effects

#### Scenario: Form identity is retained in provenance

- **WHEN** a structured form creates a persistent ActiveEffect
- **THEN** Ilaris source metadata SHALL record the source spell and selected form id

### Requirement: Pre-Effect failure materialization dispatches table-managed notices

When a selected resistance failure result contains an enabled `tableManagedDisplacement`, the Pre-Effect processor SHALL materialize its normal condition and marker result first, then create the outcome's one whispered manual-displacement notice. It SHALL use the resolved target Token context and preserve the source Item, selected form, caster, application, and cast-skill metadata used by the marker.

#### Scenario: Zone-triggered failure retains Token-safe notice context

- **WHEN** a Zone target with an unlinked Token Actor fails a qualifying resistance
- **THEN** the marker and instruction SHALL refer to that Token Actor
- **AND** the system SHALL not resolve a world Actor merely because it shares the source Actor ID
