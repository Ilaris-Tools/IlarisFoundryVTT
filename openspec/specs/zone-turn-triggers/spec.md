# zone-turn-triggers Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Persistent Zones author an optional turn-start trigger

A normalized persistent Zone profile SHALL support `trigger.onTurnStart`. It SHALL default to `false`, remain independent of `triggerOnCreate` and `onEnter`, and SHALL not change existing Zone behavior when omitted. Passive Zones SHALL not dispatch a turn-start trigger because their ActiveEffect lifetime is controlled by Region membership.

#### Scenario: Existing Zone does not gain a turn trigger

- **WHEN** a persistent Zone omits `trigger.onTurnStart`
- **THEN** its normalized profile SHALL set `onTurnStart` to `false`
- **AND** a combat turn transition SHALL not dispatch that Zone

#### Scenario: Trigger timing combines explicitly

- **WHEN** a persistent triggered Zone sets `triggerOnCreate`, `onEnter`, and `onTurnStart` to `true`
- **THEN** it SHALL retain its creation and entry behavior
- **AND** it SHALL also become eligible at the beginning of an occupant's forward combat turn

### Requirement: Active GM dispatches eligible Zones at the destination turn

On the documented [`combatTurn`](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html) or [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html) event, the active GM SHALL process only a positive `updateOptions.direction`. It SHALL use the destination `updateData.turn` to resolve the entering [`Combatant`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combatant.html) from [`Combat#turns`](https://foundryvtt.com/api/v14/classes/foundry.documents.Combat.html), then evaluate current [`RegionDocument`](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html) containment for that combatant's Token on the combat Scene.

#### Scenario: Current occupant receives one turn-start trigger

- **WHEN** an active-GM forward combat transition starts a Token's turn while that Token is inside a persistent triggered Zone with `onTurnStart: true`
- **THEN** the Zone SHALL dispatch its existing pre-effect/resistance pipeline once for that Token

#### Scenario: Departed Token is skipped

- **WHEN** the entering combatant's Token left the Region before its forward turn begins
- **THEN** the Zone SHALL not dispatch a turn-start trigger even if prior Region membership data still listed the Token

#### Scenario: Round boundary reaches the new first turn

- **WHEN** a forward combat round transition selects the first combatant of the new round
- **THEN** the same turn-start processing SHALL evaluate that combatant without depending on the old `combat.combatant`

#### Scenario: Zone created during a turn does not backfill

- **WHEN** a persistent Zone with `onTurnStart: true` is created while an eligible Token's turn is already active
- **THEN** the system SHALL not dispatch a retroactive trigger
- **AND** the Token SHALL next be eligible at the beginning of its following forward turn

### Requirement: Turn-start Zone dispatch is idempotent and scene-local

The active GM SHALL persist a bounded last trigger-window identity containing the Combat ID, round, turn, Region ID, and Token ID before dispatching. It SHALL coalesce concurrent local work for the same window and SHALL not dispatch it again after a refresh or duplicate hook event. It SHALL permit the next distinct forward turn to dispatch again and SHALL not process Regions from another Scene.

#### Scenario: Duplicate event produces one result

- **WHEN** the same Combat/round/turn/Region/Token window is observed through repeated or overlapping combat hook callbacks
- **THEN** the Zone SHALL create exactly one pre-effect application, resistance prompt, or chat outcome for that window

#### Scenario: Later turn triggers again

- **WHEN** the same Token remains inside an eligible Zone until its next forward turn in a later round or turn index
- **THEN** the Zone SHALL dispatch one new trigger for the new window

#### Scenario: Rewind does not trigger a Zone

- **WHEN** `updateOptions.direction` indicates a rewind or non-forward transition
- **THEN** the Zone SHALL not dispatch a turn-start trigger or change its stored last trigger window

#### Scenario: Another Scene is not processed

- **WHEN** a Combat advances on one Scene
- **THEN** a persistent Zone on another Scene SHALL not dispatch a turn-start trigger

### Requirement: Turn-start triggers preserve token-aware pre-effect context

Turn-start dispatch SHALL reuse the existing Zone trigger pipeline and SHALL preserve the selected Token's `tokenId`, `actorId`, and `actorLink`. For an unlinked Token Actor, it SHALL resolve that Token Actor before a world Actor with the same source Actor ID.

#### Scenario: Resistance prompt keeps its token context

- **WHEN** a turn-start Zone Pre-Effect requires resistance for an unlinked Token Actor
- **THEN** the existing resistance prompt SHALL target that Token Actor once and retain the originating Region context
