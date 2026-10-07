## MODIFIED Requirements

### Requirement: Avoid/resist test

When a pre-effect has `avoidTest.enabled: true`, the target SHALL receive a whispered chat prompt with a resist button after the spell succeeds. The `avoidTest.fertigkeit`, `avoidTest.talent`, and `avoidTest.attribut` fields on the item sheet SHALL be populated from profane compendium data and fixed config respectively.

#### Scenario: Resist prompt sent to target

- **WHEN** a spell with avoidTest succeeds against a target
- **THEN** a whispered ChatMessage with `.resist-button` SHALL be sent to the target's controlling client via socket routing

#### Scenario: Resist test uses FertigkeitDialog with a stable skill reference

- **WHEN** the target clicks the resist button and `avoidTest.fertigkeit` is set to a profane skill name such as "Athletik"
- **THEN** the resist handler SHALL find the skill in `actor.profan.fertigkeiten` by `name`, extract its `id`, `system.pw`, and `system.talente`
- **AND** FertigkeitDialog SHALL be opened with `probeType: 'fertigkeit'`, `fertigkeitKey: <resolved skill ID>`, `pw: <resolved PW>`, and `talentList: <resolved talents>`

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
- **AND** FertigkeitDialog SHALL be opened with `probeType: 'attribut'`, `fertigkeitKey: "KO"`, `fertigkeitName: "Konstitution"`, and `pw: <computed PW>`

#### Scenario: Resist test warns when skill not found on actor

- **WHEN** the configured `avoidTest.fertigkeit` name is not found in `actor.profan.fertigkeiten`
- **THEN** the resist handler SHALL show a warning notification and SHALL NOT open FertigkeitDialog

#### Scenario: Successful resist avoids effect

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `false`
- **THEN** the pre-effect SHALL NOT be applied

#### Scenario: Successful resist with diminishedOnly

- **WHEN** the target succeeds their resist test and `diminishedOnly` is `true`
- **THEN** the effect SHALL be applied with `diminishedValue` replacing `change.value` and `diminishedMaechtigBonus` replacing `change.maechtigBonus` (or `''` if not set)

#### Scenario: Failed resist applies full effect

- **WHEN** the target fails their resist test
- **THEN** the pre-effect SHALL be applied with full `change.value`
