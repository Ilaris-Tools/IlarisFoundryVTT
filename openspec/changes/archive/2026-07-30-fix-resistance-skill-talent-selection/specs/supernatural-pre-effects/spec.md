## MODIFIED Requirements

### Requirement: Pre-effect schema

Each pre-effect entry SHALL contain: baseDuration (integer turns), instant (boolean: skip ActiveEffect creation), changes (array of change objects, each with: key, type, value, amplifiedByMaechtigeMagie boolean, maechtigBonus string, damageType string, diminishedValue string, diminishedMaechtigBonus string, priority number), and optional avoidTest (enabled, fertigkeit, talent, attribut, diminishedOnly, resistDifficulty). avoidTest.talent SHALL be an optional profane talent name associated with avoidTest.fertigkeit. resistDifficulty SHALL default to 12 (system default difficulty) when not explicitly set. damageType SHALL be "PROFAN" (wounds) or "STUMPF" (Erschöpfung), only used for instant pre-effects targeting health.

#### Scenario: Instant pre-effect resolves damage via existing pipeline

- **WHEN** a pre-effect has instant: true
- **THEN** all changes MUST target system.gesundheit.wunden or system.gesundheit.erschoepfungen (instant is only for direct damage); the damage SHALL be resolved via \_applyDamageDirectly(targetActor, damage, damageType, false, speaker) — the same pipeline used by weapon attacks, including WS threshold calculation, PROFAN/STUMPF handling, and LEP system support

#### Scenario: Non-instant pre-effect creates one ActiveEffect with all changes

- **WHEN** a pre-effect has instant: false with one or more changes
- **THEN** a single IlarisActiveEffect SHALL be created on the target containing ALL changes (including stat/skill changes that cannot be instant), with system.ilarisTiming.durationType: "ownerTurns"

#### Scenario: Per-change amplification flag controls Mächtige Magie

- **WHEN** a change within changes has amplifiedByMaechtigeMagie: true and the caster has Mächtige Magie/Liturgie active with QS > 0
- **THEN** that change's maechtigBonus SHALL be appended to its value once per QS before evaluation via foundry.dice.Roll; maechtigBonus without a leading sign SHALL be prefixed with + automatically; other changes are unaffected

#### Scenario: No amplification when flag is false

- **WHEN** a change has amplifiedByMaechtigeMagie: false
- **THEN** its value SHALL be used as-is regardless of Mächtige Magie

#### Scenario: Omitted talent remains a skill-only resistance check

- **WHEN** an existing pre-effect has avoidTest.fertigkeit but omits avoidTest.talent
- **THEN** the pre-effect SHALL remain valid and the resistance dialog SHALL open without a preselected talent

### Requirement: Avoid/resist test

When a pre-effect has avoidTest.enabled: true, the target SHALL receive a whispered chat prompt with a resist button after the spell succeeds. The avoidTest.fertigkeit, avoidTest.talent, and avoidTest.attribut fields on the item sheet SHALL be populated from profane compendium data and fixed config respectively.

#### Scenario: Resist prompt sent to target

- **WHEN** a spell with avoidTest succeeds against a target
- **THEN** a whispered ChatMessage with .resist-button SHALL be sent to the target's controlling client via socket routing

#### Scenario: Resist test uses FertigkeitDialog with correct skill resolution

- **WHEN** the target clicks the resist button and avoidTest.fertigkeit is set to a profane skill name such as "Athletik"
- **THEN** the resist handler SHALL find the skill in [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) profan.fertigkeiten by name, extract its array index, system.pw, and system.talente
- **AND** FertigkeitDialog SHALL be opened with probeType: 'fertigkeit', fertigkeitKey: <index>, pw: <resolved PW>, and talentList: <resolved talents>

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

- **WHEN** the target clicks the resist button and avoidTest.attribut is set (e.g., "KO") with no avoidTest.fertigkeit
- **THEN** the resist handler SHALL compute pw from actor.system.attribute["KO"].pw
- **AND** FertigkeitDialog SHALL be opened with probeType: 'attribut', fertigkeitKey: "KO", fertigkeitName: "Konstitution", and pw: <computed PW>

#### Scenario: Resist test warns when skill not found on actor

- **WHEN** the configured avoidTest.fertigkeit name is not found in actor.profan.fertigkeiten
- **THEN** the resist handler SHALL show a warning notification and SHALL NOT open FertigkeitDialog

#### Scenario: Successful resist avoids effect

- **WHEN** the target succeeds their resist test and diminishedOnly is false
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly

- **WHEN** the target succeeds their resist test and diminishedOnly is true
- **THEN** the effect SHALL be applied with diminishedValue replacing change.value and diminishedMaechtigBonus replacing change.maechtigBonus (or an empty string if not set)

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test
- **THEN** the pre-effect SHALL be applied with full change.value
