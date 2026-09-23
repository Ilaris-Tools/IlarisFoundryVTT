## ADDED Requirements

### Requirement: Explicit target-Magieresistenz source data

Übernatürlich Items SHALL expose optional `system.magicResistance` data with
an `enabled` field. Only `{ enabled: true }` SHALL activate automatic
target-Magieresistenz. The system SHALL retain manual behavior for missing,
malformed, or disabled data.

#### Scenario: Audited single-Actor source is marked

- **WHEN** an authoritative spell source has an unconditional single-Actor
  Magieresistenz difficulty
- **THEN** it SHALL author `magicResistance.enabled: true`

#### Scenario: Conditional or area Magieresistenz remains manual

- **WHEN** a source has conditional, Zone, multi-target, object, or otherwise
  non-single-Actor Magieresistenz wording
- **THEN** it SHALL NOT receive the automatic single-Actor marker

#### Scenario: Item-sheet author can edit the marker

- **WHEN** a GM edits a Zauber, Liturgie, or Anrufung Item
- **THEN** the normal supernatural authoring surface SHALL expose the enabled
  state without requiring raw JSON editing

### Requirement: One selected Actor defines an MR challenge

The system SHALL create a target-Magieresistenz challenge only for exactly one selected Actor.

When target selection automation is enabled and an effective spell profile has
automatic single-Actor Magieresistenz, the supernatural dialog SHALL require
exactly one selected target that resolves to an
[Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).
It SHALL create an in-memory challenge containing a unique request ID, target
Actor UUID, derived MR snapshot, and target-roll result. It SHALL invalidate
the challenge when the target selection changes or the dialog closes.

#### Scenario: Missing target blocks the automated roll

- **WHEN** a marked spell has no selected target, more than one target, or a
  target that does not resolve to an Actor
- **THEN** the dialog SHALL show a localized target instruction
- **AND** it SHALL not expose an enabled spell-roll control

#### Scenario: Current target MR is snapshotted

- **WHEN** exactly one eligible target is selected for a marked spell
- **THEN** the challenge SHALL read that Actor's current prepared derived MR
- **AND** it SHALL retain that value for the displayed and evaluated challenge

#### Scenario: New selection invalidates an old result

- **WHEN** a target selection changes after an MR D20 result was received
- **THEN** the prior request result SHALL be ignored
- **AND** the new selected target SHALL require a new MR challenge

### Requirement: Target rolls the Magieresistenz D20

The responsible active controller for the selected target SHALL roll one D20
through [Roll](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html).
The system SHALL calculate `difficulty = MR snapshot + D20 total`, protect the
request from duplicate delivery, and create a corresponding
[ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html)
for the target controller and active GMs. For an unowned or GM-owned target,
an active GM SHALL perform the same action.

#### Scenario: Remote target controller resolves the request

- **WHEN** the selected target has an active non-GM owner different from the
  caster
- **THEN** only that designated controller and active GMs SHALL receive the
  target-roll prompt
- **AND** its completed D20 SHALL resolve the caster dialog's matching request

#### Scenario: GM resolves an unowned target

- **WHEN** the selected target lacks an active non-GM owner
- **THEN** an active GM SHALL receive the target-roll prompt
- **AND** the result SHALL use the same MR snapshot and D20 calculation

#### Scenario: Duplicate result has no second effect

- **WHEN** the same request ID is delivered or activated more than once
- **THEN** only the first valid D20 result SHALL be accepted
- **AND** no second chat result or casting-difficulty update SHALL occur

### Requirement: Casting dialog presents and uses the resolved difficulty

The existing supernatural casting dialog SHALL visibly present and use the current target-Magieresistenz difficulty.

The existing supernatural casting
[ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
SHALL display the selected target and a target-MR subsection after target
selection and before maneuvers. It SHALL show `Magieresistenz: <MR> + <W20> =
<difficulty>` once resolved. The caster's existing spell roll SHALL use that
numeric difficulty before existing energy and Pre-Effect resolution.

#### Scenario: Pending challenge is visible

- **WHEN** one target is selected but its D20 has not been accepted
- **THEN** the dialog SHALL visibly show the target, its MR snapshot, and the
  action needed to request the target roll
- **AND** its spell roll SHALL remain disabled

#### Scenario: Resolved challenge supplies numeric difficulty

- **WHEN** the target D20 is accepted for the current challenge
- **THEN** the normal roll summary SHALL show the complete MR calculation
- **AND** the caster's spell evaluator SHALL receive its total as the numeric
  difficulty

#### Scenario: Manual path remains unchanged

- **WHEN** target selection automation is disabled or the effective profile is
  not marked for automatic single-Actor Magieresistenz
- **THEN** the existing numeric and manual casting flows SHALL remain available
- **AND** no target-MR request SHALL be created
