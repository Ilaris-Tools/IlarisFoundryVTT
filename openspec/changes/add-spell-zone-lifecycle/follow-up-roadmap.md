# Follow-up Proposal Roadmap

This document preserves the zone features intentionally outside the first vertical slice. Each section is sized as a future OpenSpec change proposal rather than an implementation task hidden inside the current change.

## 1. Persistent Passive Zone Effects

**Suggested change name:** `add-persistent-zone-effects`

### Problem

Some zones continuously affect actors while they are inside them. The current vertical slice handles instant zones and triggered resistance zones, but it does not maintain effects as actors enter and leave.

### Proposed scope

- Apply a zone's non-instant pre-effects when a token enters or re-enters.
- Remove only the effects owned by that zone when the token leaves.
- Keep independent applications for multiple zones and multiple casts of the same spell.
- Preserve `zoneId`, `tokenId`, `spellUuid`, and `applicationId` in effect flags.
- Reconcile occupants when a persistent zone is created, a scene is loaded, or a token is moved.
- Keep resistance-based zones on the triggered-resistance path instead of treating them as passive effects.

### Acceptance examples

- A beneficial aura applies its ActiveEffect to a token entering the area.
- The effect is removed when the token leaves without deleting effects from another zone.
- Re-entering creates a fresh application according to the spell's stacking policy.
- A token already inside when the scene is loaded is reconciled exactly once.

### Dependencies and risks

- Depends on the first slice's persistent template metadata and membership tracker.
- Requires careful effect-origin matching so cleanup cannot remove manually created or unrelated spell effects.
- Requires a decision about whether a resistance success suppresses only the current application or remembers immunity until leaving.

## 2. Beginning-of-Turn Zone Triggers

**Suggested change name:** `add-zone-turn-triggers`

### Problem

Some zones affect occupants once on entry and then again at the beginning of every turn. This timing must cooperate with the existing GM-only owner-turn ActiveEffect timing and must not fire during combat rewinds.

### Proposed scope

- Add `onTurnStart` as an independent trigger from `onEnter`.
- Dispatch one trigger for each eligible occupant at the beginning of their turn.
- Process only forward combat transitions and only on the GM client.
- Reconcile occupants before dispatching so tokens that moved outside the zone are skipped.
- Track zone ID, token ID, combat ID, round, and turn to deduplicate a trigger window.
- Route resistance prompts and instant damage through existing handlers.

### Acceptance examples

- An occupant receives one turn-start trigger per turn.
- A token entering midway through a round receives no retroactive turn-start trigger until its next turn.
- A token leaving before its turn receives no trigger.
- Rewinding the combat tracker does not repeat a trigger.
- Multiple active GMs do not produce duplicate effects or prompts.

### Dependencies and risks

- Depends on verified v14 `combatTurn` and `updateCombat` hook signatures.
- Must align with the existing `ownerTurns` effect timing rules without reusing internal pending-expiry state for zones.
- Requires explicit behavior when a zone is created during a token's turn.

## 3. Periodic Zone Effects

**Suggested change name:** `add-periodic-zone-effects`

### Problem

Some zones cause repeated damage or resistance checks on a cadence that is neither simple entry nor every turn. The system needs a general trigger schedule without embedding spell-specific timers in hooks.

### Proposed scope

- Add a periodic trigger definition with cadence, phase, and per-token cooldown.
- Support cadences such as every turn, every N turns, and every N initiative phases where Foundry timing permits.
- Evaluate current membership at trigger time using the measured template as the spatial source of truth.
- Apply instant damage, resistance prompts, or ActiveEffects through existing pipelines.
- Persist enough trigger state to survive scene refreshes and avoid duplicate processing.
- Define whether a successful resistance suppresses only one tick or the whole zone application.

### Acceptance examples

- A poison cloud damages each occupant once per round.
- A token that enters after the last tick is affected at the next valid cadence.
- A token leaving before the next cadence is not affected.
- A token cannot receive two ticks because of duplicate movement or combat hooks.

### Dependencies and risks

- Depends on beginning-of-turn zone triggers and reliable zone membership reconciliation.
- Requires a single authoritative scheduler, likely GM-scoped, to avoid multiplayer duplication.
- Needs performance limits for scenes with many templates and tokens.

## 4. Precise Wall-Crossing Triggers

**Suggested change name:** `refine-zone-crossing-triggers`

### Problem

For Wand aus Dornen, entering the rectangle is an approximation. The rules may require a resistance check when a token crosses the wall rather than whenever it overlaps the template.

### Proposed scope

- Distinguish `enter`, `cross`, `leave`, and `reenter` triggers.
- Track the token's previous and current position relative to the rectangle's two faces.
- Trigger a crossing only when movement passes through the wall's thickness, not when a token moves along it.
- Define behavior for tokens that start inside the wall, teleport, are pushed, or change size.
- Retain standard Foundry measured-template intersection for ordinary shapes; add crossing logic only for wall profiles.

### Acceptance examples

- A token moving from one side of the wall to the other receives one resistance prompt.
- A token moving parallel to the wall does not receive a prompt.
- A token already overlapping the wall when it is created follows an explicit initial-state rule.
- Teleporting across the wall follows the same crossing policy as ordinary movement.

### Dependencies and risks

- Depends on persistent rectangle zones and token movement membership state.
- May require grid-aware movement data beyond the final token position.
- Must be specified separately from generic entry triggers to avoid changing existing zone behavior.

## 5. Zone Administration and Cleanup

**Suggested change name:** `add-zone-administration`

### Problem

Persistent zones need predictable cleanup, visibility, ownership, and recovery when their source actor, scene, or spell item changes.

### Proposed scope

- Add a zone registry or adapter for finding Ilaris-owned measured templates.
- Clean up expired zones and their zone-owned effects.
- Handle deletion of the source actor or token without deleting the zone unless the spell specifies caster dependence.
- Add GM-facing controls to inspect, dismiss, or force-reconcile a zone.
- Validate and migrate legacy or incomplete zone flags defensively.
- Keep zones scene-local and prevent cross-scene trigger processing.

### Acceptance examples

- Expired zones disappear without leaving orphaned effects.
- Deleting a template stops future triggers immediately.
- Reloading a scene restores active zone behavior from flags.
- A GM can dismiss a zone and remove only effects originating from that zone.
- A zone on Scene A never reacts to tokens on Scene B.

### Dependencies and risks

- Depends on persistent zone metadata and effect-origin flags.
- Requires explicit ownership and permission rules for player-created zones.
- Cleanup must be idempotent so a deleted template, expired template, and manual dismissal cannot race destructively.

## Decision Register

The following decisions are already settled for future proposals:

- Placement occurs before the roll.
- No effects, energy payment, or persistent template remain after cancellation or failure.
- The supernatural dialog can redo placement.
- Free placement range is measured from the caster token center.
- Maneuver placement modifiers are included before placement begins.
- Re-entry triggers again after leaving and returning.
- Beginning-of-turn triggers are optional per zone.
- Foundry's standard measured-template intersection behavior is preferred.

The following decisions remain intentionally open until the relevant follow-up proposal:

- Whether a resistance success suppresses one event, one entry, or the full zone application.
- Whether Wand aus Dornen triggers on overlap, entering, or crossing its thickness.
- Whether caster deletion or movement ends a zone.
- How zones created during a combatant's turn handle that same turn's trigger.
- Which periodic cadences are supported and which client is authoritative.
