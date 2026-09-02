# periodic-zone-effects Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Persistent Zones can author a round-start periodic trigger

A normalized persistent Zone profile SHALL support `trigger.onRoundStart`. It SHALL default to `false`, remain independent of `triggerOnCreate`, `onEnter`, and `onTurnStart`, and SHALL not alter existing Zone behaviour when omitted. A passive Zone SHALL not become eligible for this periodic trigger.

#### Scenario: Existing Zone does not gain periodic behaviour

- **WHEN** a persistent Zone omits `trigger.onRoundStart`
- **THEN** its normalized profile SHALL set `onRoundStart` to `false`
- **AND** a combat-round transition SHALL not dispatch it periodically

#### Scenario: Trigger types combine explicitly

- **WHEN** a persistent triggered Zone enables creation, entry, turn-start, and round-start triggers
- **THEN** it SHALL retain each corresponding independently timed behaviour

#### Scenario: Passive Zone is excluded

- **WHEN** a persistent Zone uses `effectMode: "passive"` and sets `trigger.onRoundStart` to `true`
- **THEN** the system SHALL not dispatch a periodic pre-effect or resistance event for that Zone

### Requirement: Active GM dispatches each eligible Zone once per forward combat round

On the documented [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html) event, only the active GM SHALL process a positive `updateOptions.direction`. For each eligible Zone on the [`Combat`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html)'s [`Scene`](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), it SHALL resolve current [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html) containment and dispatch the existing Zone pre-effect/resistance pipeline once for all currently eligible [`TokenDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html) targets.

#### Scenario: Current occupants receive one periodic event

- **WHEN** a forward combat round begins while two eligible Tokens are inside one persistent triggered Zone with `onRoundStart: true`
- **THEN** the Zone SHALL dispatch one periodic event through the existing pipeline for each of those Tokens

#### Scenario: Late entrant waits for the next round

- **WHEN** a Token enters an eligible Zone after its round-start event has been processed
- **THEN** the Token SHALL not receive a retroactive periodic event in that round
- **AND** it SHALL be eligible at the next forward combat round if it remains inside

#### Scenario: Departed Token is skipped

- **WHEN** a Token has left an eligible Zone before the current round-start target resolution
- **THEN** that Token SHALL not receive a periodic event even if older serialized membership data listed it

#### Scenario: Each resistance remains event-local

- **WHEN** an eligible periodic Zone Pre-Effect requires a resistance test and a target succeeds that test
- **THEN** the success SHALL resolve only that periodic event
- **AND** the target SHALL remain eligible for the next periodic event while it remains inside

### Requirement: Periodic Zone round windows are idempotent and scene-local

The active GM SHALL persist a bounded periodic-window identity containing the Combat ID, destination round, and Region ID before target dispatch. It SHALL coalesce concurrent local work for the same window, SHALL not dispatch on a non-forward transition, and SHALL not inspect Regions outside the advancing Combat's Scene.

#### Scenario: Duplicate callback produces one outcome

- **WHEN** the same Combat/round/Region window is observed through repeated or overlapping callbacks
- **THEN** the system SHALL produce at most one pre-effect application, resistance prompt, or chat outcome for that Region in the window

#### Scenario: Empty tick is not replayed for a later entrant

- **WHEN** an eligible Zone has no current targets when its forward round window is processed
- **THEN** the system SHALL record that window without dispatching an outcome
- **AND** a Token entering later in that same round SHALL wait until the next valid window

#### Scenario: Rewind does not process or mutate the window

- **WHEN** `updateOptions.direction` indicates a rewind or non-forward transition
- **THEN** the system SHALL not dispatch a periodic Zone event
- **AND** it SHALL not update the Zone's stored periodic window

#### Scenario: Other Scene remains unaffected

- **WHEN** a Combat advances on one Scene
- **THEN** an eligible persistent Zone on another Scene SHALL not receive a periodic event

### Requirement: Periodic dispatch precedes scene-round duration reduction

For a forward `combatRound`, the system SHALL dispatch all eligible round-start periodic Zones before it reduces the `sceneRounds` duration of persistent Zones. Existing turn-start behaviour at a round boundary SHALL otherwise retain its current lifecycle ordering.

#### Scenario: Final remaining round still triggers

- **WHEN** an eligible periodic Zone has exactly one remaining scene round at the beginning of a forward combat round
- **THEN** it SHALL dispatch its periodic event for current targets
- **AND** the Region SHALL then be removed by normal duration expiry

#### Scenario: Expired Zone is absent from later rounds

- **WHEN** a Zone is removed after its final periodic event
- **THEN** it SHALL not dispatch an event in a later combat round

### Requirement: The Zone editor exposes the round-start opt-in without relocating existing content

The concrete supernatural item sheet SHALL render a checkbox bound to `system.zone.trigger.onRoundStart` with the label `Zu Rundenbeginn ausloesen` in its **Zonenautomatisierung** section. It SHALL render immediately after `Beim Betreten ausloesen`; existing Zone controls, structured spell modification controls, and shared Pre-Effect content SHALL remain in their current concrete-sheet locations.

#### Scenario: GM enables round-start authoring

- **WHEN** a GM checks `Zu Rundenbeginn ausloesen` and saves a supernatural item
- **THEN** the item SHALL persist `system.zone.trigger.onRoundStart: true`

#### Scenario: Existing control order remains legible

- **WHEN** the GM opens a supernatural item with Zone automation enabled
- **THEN** the existing creation and entry trigger controls SHALL remain visible
- **AND** the round-start control SHALL appear immediately after the entry trigger control
- **AND** no unrelated sheet section SHALL be moved by the new control

### Requirement: Zone automation documentation explains periodic round triggers

The structured HTML Zone automation quick-reference journal SHALL document `trigger.onRoundStart`, its one-per-forward-combat-round current-membership semantics, event-local resistance, final-round-before-expiry ordering, and the absence of Initiativephase or every-N-round automation.

#### Scenario: Author reads the supported cadence

- **WHEN** a GM reads the Zone automation quick reference
- **THEN** it SHALL distinguish `onRoundStart` from per-actor `onTurnStart`
- **AND** it SHALL state that round-based periodic effects run only during forward combat rounds
