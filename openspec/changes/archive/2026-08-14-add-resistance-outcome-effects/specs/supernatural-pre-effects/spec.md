## MODIFIED Requirements

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
