## Why

Supernatural items (Zauber, Liturgien, Anrufungen) currently have no mechanism to automatically apply effects to targets after a successful casting. Effects like "Brennend" (burning), "Versteinerung" (petrification), or direct stat penalties must be manually applied by the GM. This change adds a **pre-effects system** that defines effects on the item itself and automatically applies them (as ActiveEffects with Ilaris turn timing, or as instant changes) when the spell succeeds against a target. Each pre-effect has its own amplification rules and optional avoid/resist test, matching the Ilaris tabletop rules.

## What Changes

- **ADDED**: `preEffects` array field on übernatürlich item data models (Zauber, Liturgie, Anrufung) via shared `createUebernatuerlichTalentFields()`
- **ADDED**: Avoid/resist test system — target gets whispered chat prompt with resist button; resolves via FertigkeitDialog + `Ilaris.postResistTest` hook
- **ADDED**: Effect creation in `UebernatuerlichDialog._angreifenKlick()` — fire-and-forget after energy cost deduction
- **ADDED**: Mächtige Magie / Mächtige Liturgie amplification per pre-effect, with per-spell `maechtigBonus` formula
- **ADDED**: Self-cast duration bonus (+1 turn) to compensate for immediate turn-end tick
- **ADDED**: Socket routing for resist prompts (same pattern as defense prompt routing)
- **MODIFIED**: `UebernatuerlichDialog` to call `_applyPreEffects()` after successful cast

## Capabilities

### New Capabilities

- `supernatural-pre-effects`: Pre-effect definition on übernatürlich items, avoid/resist tests, effect creation on hit, Mächtige Magie/Liturgie amplification, self-cast duration bonus

### Modified Capabilities

- `combat`: `UebernatuerlichDialog` modified to call `_applyPreEffects()` after successful cast and energy deduction
- `active-effects`: Pre-effects create `ownerTurns`-timed ActiveEffects on targets using the existing `IlarisActiveEffect` system

## Impact

- **Files modified**: `scripts/items/model-data/models.js` (`createUebernatuerlichTalentFields`), `scripts/combat/dialogs/uebernatuerlich.js` (`_angreifenKlick`)
- **Files created**: `scripts/effects/pre-effects/` (new subsystem directory with processor, socket handler, resist hook handler)
- **New hooks**: `Ilaris.postPreEffectResist`, `Ilaris.postResistTest` (triggers effect creation after resist resolution)
- **Foundry APIs touched**:
    - `ActiveEffect` — https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html (creating effects on targets)
    - `ChatMessage` — https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html (whispered resist prompts)
    - `foundry.dice.Roll` — https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html (maechtigBonus formula evaluation)
    - `game.socket` — https://foundryvtt.com/api/v14/classes/foundry.server.SocketInterface.html (resist prompt routing)
    - `renderChatMessageHTML` hook — https://foundryvtt.com/api/v14/types/foundry.hooks.HooksEventLookup.html (click delegation for resist buttons)
