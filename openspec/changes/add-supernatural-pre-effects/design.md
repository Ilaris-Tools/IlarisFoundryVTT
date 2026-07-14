## Context

Currently, übernatürlich items (Zauber, Liturgien, Anrufungen) have no automated effect application. When a spell succeeds, the GM must manually apply effects like "Brennend", "Versteinerung", or stat penalties. The legacy plan at `docs/_specs/2026_06_28_uebernatuerlich_pre_effect/` (dated June 2026) describes a complete pre-effects system modeled after the existing defense prompt pattern.

The system already has:

- **IlarisActiveEffect** with owner-scoped turn timing (`scripts/effects/`)
- **Defense prompt routing** via socket (`scripts/combat/hooks/combat_dialog_handlers.js`)
- **UebernatuerlichDialog** with energy cost deduction (`scripts/combat/dialogs/uebernatuerlich.js`)
- **FertigkeitDialog** for skill/attribute checks (`scripts/dice/`)
- **Item data model helpers** (`scripts/items/model-data/models.js`)

## Goals / Non-Goals

**Goals:**

- Enable übernatürlich items to define pre-effects that automatically apply on successful cast
- Support avoid/resist tests with diminished-only mode
- Support Mächtige Magie/Liturgie amplification with per-spell formulas
- Self-cast duration bonus (+1 turn)
- Multi-target: one effect per target per preEffect
- Socket routing for resist prompts (following existing defense prompt pattern)

**Non-Goals:**

- DOT pre-effects (DOT is handled by the existing active-effects system with `change.type === "dot"`)
- GUI for editing pre-effects on items (this change creates the data model; a sheet editor can follow)
- Migration of existing spells (all existing spells have no preEffects; this is additive)
- Auto-inclusion of caster in targets (caster must explicitly target themselves)

## Decisions

### Decision 1: Pre-effects stored as item data, not embedded ActiveEffect documents

**Chosen**: Store pre-effect configuration as a plain `preEffects` array on the item data model, not as embedded ActiveEffect documents on the item.

**Alternatives considered**:

- **Embedded ActiveEffects on item**: Rejected — items don't have the right owner context at definition time. Pre-effects need per-target instantiation at cast time, not pre-built documents.

**Rationale**: The pre-effect is a template/configuration. At cast time, the system instantiates real ActiveEffect documents on each target actor from this template.

### Decision 2: Avoid/resist test via chat prompt + hook (same pattern as defense)

**Chosen**: Follow the existing defense prompt pattern: socket-routed whispered ChatMessage with click-delegated buttons, resolved via FertigkeitDialog + hook (`Ilaris.postResistTest`).

**Rationale**: Proven pattern in this codebase. Avoids polling, keeps resolution event-driven, works with multiplayer socket routing.

### Decision 3: Fire-and-forget effect creation

**Chosen**: `_applyPreEffects()` is called after energy deduction but NOT awaited. Each pre-effect resolves asynchronously as resist tests complete.

**Rationale**: Energy cost and effect application are independent — one should not block the other. Multiple targets may have varying resist resolution times.

### Decision 4: Per-preEffect amplification control

**Chosen**: Each pre-effect has `amplifiedByMaechtigeMagie: boolean`. When true and the caster has Mächtige Magie/Liturgie active, `maechtigBonus` is appended to `value`.

**Rationale**: Not all effects should scale with power — some are binary (on/off). The legacy plan's compendium research (30+ spells analyzed) confirms this is the correct Ilaris behavior.

## API Surface

### Foundry classes extended or used

- `ActiveEffect` — https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html
- `ChatMessage` — https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html
- `foundry.dice.Roll` — https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html

### Hook events

- `Ilaris.postPreEffectResist` (new) — fires when resist prompt is built
- `Ilaris.postResistTest` (new) — fires when resist test completes; triggers effect creation
- `renderChatMessageHTML` — https://foundryvtt.com/api/v14/types/foundry.hooks.HooksEventLookup.html (existing, used for `.resist-button` click delegation)

### foundry.utils.\* helpers

- `foundry.utils.deepClone` — for copying pre-effect config before mutation
- `foundry.utils.mergeObject` — for merging effect data into target actor

## Risks / Trade-offs

- **[Risk] Multi-target resist prompts could flood chat** → Mitigation: Whispered messages (only target sees their own prompt). Each target gets one message per preEffect.
- **[Risk] Resist resolution race conditions with multiple targets** → Mitigation: Each resist is independent. Effect creation happens per-target as their resist resolves. No shared state between targets.
- **[Risk] Mächtige Magie formula evaluation could throw** → Mitigation: Wrap `Roll` evaluation in try/catch; on error, use base value without amplification.
- **[Trade-off] Fire-and-forget means no feedback to caster about resist outcomes** → Acceptable for v1. Future could add a summary chat message.

## Open Questions

None. All design decisions are resolved from the legacy plan.
