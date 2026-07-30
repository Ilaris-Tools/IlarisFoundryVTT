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
- Support maneuver-based duration extension (maneuvers that extend spell duration also extend pre-effect duration)
- Self-cast duration bonus (+1 turn)
- Multi-target: one effect per target per preEffect
- Socket routing for resist prompts (following existing defense prompt pattern)
- GUI on the übernatürlich item sheet for creating and editing pre-effects (add/edit/delete list with form fields)

**Non-Goals:**

- DOT-specific pre-effect logic (DOT behavior — turn timing, damage ticks, chat messages — is already handled by `IlarisActiveEffect.getDotEffects()` and `applyDotDamage()`; pre-effects just create the ActiveEffect with the right `change` properties and the existing DOT infrastructure handles the rest)
- Migration of existing spells (all existing spells have no preEffects; this is additive)
- Auto-inclusion of caster in targets (caster must explicitly target themselves)

## Decisions

### Decision 1: Pre-effects stored as item data, not embedded ActiveEffect documents

**Chosen**: Store pre-effect configuration as a plain `preEffects` array on the item data model, not as embedded ActiveEffect documents on the item.

**Alternatives considered**:

- **Embedded ActiveEffects on item**: Rejected — items don't have the right owner context at definition time. Pre-effects need per-target instantiation at cast time, not pre-built documents.

**Rationale**: The pre-effect is a template/configuration. At cast time, the system instantiates real ActiveEffect documents on each target actor from this template.

### Decision 2: Avoid/resist test via chat prompt + FertigkeitDialog (same pattern as defense)

**Chosen**: Follow the existing defense prompt pattern: socket-routed whispered ChatMessage with click-delegated buttons. On click, open FertigkeitDialog with the configured `fertigkeit` or `attribut` probe. Resist metadata (`eventId`, `preEffectData`) is attached to the dialog instance as `_resistContext` after construction. A listener on the existing `Ilaris.postSkillRoll` hook detects resist tests by checking `dialog._resistContext` and processes the outcome.

**Rationale**: Proven pattern in this codebase. Avoids polling, keeps resolution event-driven, works with multiplayer socket routing. Using the existing `Ilaris.postSkillRoll` hook (rather than a new `Ilaris.postResistTest`) requires zero changes to FertigkeitDialog — the dialog already supports `probeType: 'fertigkeit'` and `probeType: 'attribut'`.

### Decision 2a: FertigkeitDialog difficulty support

**Chosen**: Add `success_val` option to FertigkeitDialog's constructor (`this.success_val = options.success_val || null`) and pass it as the 4th argument to `evaluate_roll_with_crit()` in `_executeRoll()`. The resist handler computes the resist difficulty as `avoidTest.resistDifficulty + (Mächtige Magie QS × 4)`, where `resistDifficulty` defaults to 12 (system default difficulty) when not explicitly set.

**Rationale**: FertigkeitDialog currently calls `evaluate_roll_with_crit(formula, label, text)` without a difficulty — `success_val` is always `undefined`, so `isSuccess` is always `false`. Without this change, resist tests would never "succeed" and the resist mechanic would be broken. The fix is 2 lines and follows FertigkeitDialog's existing pattern of accepting configuration via constructor options.

### Decision 3: Fire-and-forget at two insertion points

**Chosen**: `_applyPreEffects(rollResult)` is called at two points, both guarded by `isSuccess && preEffects.length > 0`, and NOT awaited:

1. **Standard difficulty spells**: After `super._updateSchipsStern()` (line 373 in `_angreifenKlick`). At this point `isSuccess` is determined by the roll against the target difficulty, and energy has already been deducted inside the `if (difficulty)` block.
2. **Non-standard difficulty spells**: After `await this.applyEnergyCost(...)` in `_energieAbrechnenKlick()`. At this point `isSuccess` comes from the user clicking `✅ Erfolgreich gewirkt` / `❌ Misslungen`, and energy has just been deducted.

**Rationale**: `applyEnergyCost` is inside `if (difficulty)` — spells without `schwierigkeit` skip energy deduction entirely in `_angreifenKlick()` and defer to `_energieAbrechnenKlick()`. Placing `_applyPreEffects` at both insertion points ensures all spells trigger pre-effects on confirmed success, regardless of difficulty type. Fire-and-forget keeps energy cost and effect application independent; multiple targets may have varying resist resolution times.

### Decision 4: Per-change amplification with multi-change pre-effects

**Chosen**: Each pre-effect contains a `changes` array (not a single `change`). Each change entry has its own `amplifiedByMaechtigeMagie: boolean`, `maechtigBonus: string`, and `damageType: string` (`"PROFAN"` for wounds, `"STUMPF"` for Erschöpfung). When true and the caster has Mächtige Magie/Liturgie active, `maechtigBonus` is appended to that change's `value` before evaluation. The result is a single ActiveEffect with multiple changes, some amplified and some not. For instant pre-effects targeting health, damage is resolved via `_applyDamageDirectly()` — the same pipeline as weapon attacks (WS thresholds, PROFAN/STUMPF, LEP).

**Rationale**: One spell effect often has multiple consequences (e.g., -2 AT AND 2W6 damage). Creating one ActiveEffect with multiple changes is cleaner than creating multiple separate effects. Not all consequences should scale with power — some are binary (on/off), while others (damage) scale with Mächtige Magie. Moving the amplification flag to per-change level gives precise control. `maechtigBonus` is a free-form string (e.g., `"+2W6"`, `"+4"`, `"+1W20"`) appended to `value` when `amplifiedByMaechtigeMagie` is true and the caster has Mächtige Magie/Liturgie active. Since both are strings evaluated via `foundry.dice.Roll`, any formula pattern works — dice, flat bonuses, mixed. Additionally, each QS increases the resist test difficulty by 4. The legacy plan's compendium research (30+ spells analyzed) confirms this matches Ilaris rules.

### Decision 5: Pre-effects GUI as inline sheet section

**Chosen**: Add a new `PARTS` entry (`preEffects`) to `UebernatuerlichTalentSheet` and its template, rendering the `preEffects` array as editable form fields directly in the item sheet — not as a separate dialog.

**Alternatives considered**:

- **Separate ApplicationV2 dialog**: Rejected — overkill for an array of simple objects. The item sheet already hosts complex form data; pre-effects follow the same pattern.
- **Embedded ActiveEffect documents with the existing effects-manager mixin**: Rejected — pre-effects are not real ActiveEffects; they're templates instantiated at cast time. The effects manager creates/persists real ActiveEffects on actors, which is semantically different.

**Rationale**: An inline list with add/edit/delete keeps the workflow simple and follows the existing sheet pattern (form fields with `name="system.preEffects.N.property"` bindings). Each pre-effect renders as a collapsible card showing: `baseDuration`, `instant` toggle, a `changes` list (each with: `key`, `type`, `value`, `amplifiedByMaechtigeMagie` toggle, `maechtigBonus` shown when amplified, `priority`), and avoidTest fields (`enabled`, `fertigkeit`/`attribut`, `diminishedOnly`, `diminishedValue`). Only `avoidTest` fields are shown when `avoidTest.enabled` is true. Only `maechtigBonus` is shown when `amplifiedByMaechtigeMagie` is true for that change.

## API Surface

### Foundry classes extended or used

- `ActiveEffect` — https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html
- `ChatMessage` — https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html
- `foundry.dice.Roll` — https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html

### Hook events

- `Ilaris.postPreEffectResist` (new) — fires when a resist prompt is about to be built (before chat message creation); for world scripts/macros to intercept or augment resist prompts
- `Ilaris.postSkillRoll` — https://foundryvtt.com/api/v14/types/foundry.hooks.HooksEventLookup.html (existing FertigkeitDialog hook; resist handler listens for it and checks `dialog._resistContext` to identify resist tests)
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
