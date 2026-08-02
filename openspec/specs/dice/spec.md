## Purpose

Dice rolling system with unified dispatch, crit/fumble evaluation (real and generous modes), and chat result rendering.

## Requirements

### Requirement: Dice roll dispatch

The system SHALL provide `wuerfelwurf()` as the single entry point for all dice roll initiation, dispatching clicks on rollable HTML elements to the appropriate dialog.

#### Scenario: Weapon attack dispatches to combat dialog

- **WHEN** a rollable element with weapon context is clicked
- **THEN** `wuerfelwurf()` SHALL open the appropriate combat dialog (AngriffDialog, FernkampfAngriffDialog, or UebernatuerlichDialog)

#### Scenario: Skill check dispatches to FertigkeitDialog

- **WHEN** a rollable element with skill/attribute/free-skill context is clicked
- **THEN** `wuerfelwurf()` SHALL open the unified `FertigkeitDialog`

### Requirement: Crit and fumble evaluation

The system SHALL evaluate critical successes and fumbles according to Ilaris rules, supporting both "real" and "generous" modes.

#### Scenario: Real crit mode — nat 20 must succeed

- **WHEN** `realFumbleCrits` setting is enabled and a nat 20 is rolled
- **THEN** it SHALL only be a critical success if the total roll would succeed against the target difficulty

#### Scenario: Real fumble mode — nat 1 must fail

- **WHEN** `realFumbleCrits` setting is enabled and a nat 1 is rolled
- **THEN** it SHALL only be a fumble if the total roll would fail against the target difficulty

#### Scenario: Generous mode — nat 20 always crit

- **WHEN** `realFumbleCrits` setting is disabled and a nat 20 is rolled
- **THEN** it SHALL always be a critical success regardless of total

### Requirement: Roll result posting

The system SHALL render dice roll results to chat via `postRollToChat()`, using Handlebars templates for display.

#### Scenario: d20 result rendered

- **WHEN** a d20-based roll completes
- **THEN** the result SHALL be posted to chat using the `dreid20.hbs` template via `roll.toMessage()`

#### Scenario: Attribute check result rendered

- **WHEN** an attribute check completes
- **THEN** the result SHALL use the `probendiag_attribut.hbs` template

#### Scenario: Spell cost displayed

- **WHEN** a spell's energy cost needs to be shown
- **THEN** the cost SHALL render via the `spell_cost.hbs` template

### Requirement: Status effect checks

The system SHALL provide `get_statuseffect_by_id()` to look up status effects on an actor by `statusId`.

#### Scenario: Status effect found by ID

- **WHEN** an actor has an ActiveEffect with `flags.Ilaris.statusId` matching the queried ID
- **THEN** `get_statuseffect_by_id()` SHALL return that effect

#### Scenario: No matching status effect

- **WHEN** no effect on the actor matches the queried `statusId`
- **THEN** `get_statuseffect_by_id()` SHALL return `undefined`

### Requirement: Skill and talent rolls resolve contextual effect modifiers

The unified FertigkeitDialog SHALL resolve roll-phase Ilaris modifiers for
its actor, Fertigkeit or Talent, and any explicitly supplied situation
context before calculating the probe value. It SHALL include the resolved
contribution in the displayed modifier breakdown.

#### Scenario: Social-duel talent bonus applies

- **WHEN** a social-duel roll uses Einschüchtern or Überreden
- **THEN** a matching ordinary `situation: ["sozialesDuell"]` modifier SHALL
  be added to that probe

#### Scenario: Situation-bound bonus does not leak

- **WHEN** the same talent is rolled without the `sozialesDuell` situation
- **THEN** the situation-bound modifier SHALL NOT be included

#### Scenario: Attribute modifier applies only to a tested attribute

- **WHEN** a FertigkeitDialog probe uses GE and the actor has a matching
  semantic GE modifier
- **THEN** the dialog SHALL include that modifier in the GE part of the probe
- **AND** it SHALL NOT modify the actor's prepared GE or GS values

### Requirement: Probe summaries expose suppression without hiding applied modifiers

FertigkeitDialog SHALL always show applied Ilaris effect modifiers and their
effect sources in its normal modifier breakdown. If matching modifiers were
suppressed, it SHALL show an accessible suppression icon or button that
reveals the suppression ledger only when activated.

#### Scenario: Applied probe modifier remains visible

- **WHEN** an Ilaris modifier contributes to a FertigkeitDialog probe
- **THEN** the dialog SHALL display the applied contribution and its effect
  source directly

#### Scenario: Suppressed probe modifier is disclosed on demand

- **WHEN** one or more matching Ilaris modifiers were suppressed for a probe
- **THEN** the dialog SHALL display the suppression indicator
- **AND** activating it SHALL reveal the suppressed modifiers and their reason

## Data Model

N/A — The dice system does not define its own data model. It consumes data models from combat, skills, and actors.

## Cross-References

- [combat](../combat/spec.md) — Combat dialogs that consume dice roll results
- [skills](../skills/spec.md) — Skill check data consumed by `wuerfelwurf()`
