## Context

Resistance configuration currently stores only avoidTest.fertigkeit. The item-sheet context indexes the configured skill packs and incorrectly accepts both fertigkeit and uebernatuerlicheFertigkeit. At roll time, the resistance handler correctly resolves only actor.profan.fertigkeiten and already supplies that skill's talents to FertigkeitDialog, but the dialog always starts with its default "ohne Talent" option.

Profane talents are distinct talent documents whose system.fertigkeit identifies their parent profane skill. A configured talent must therefore be stored separately from its parent skill and validated against the target actor at roll time.

## Goals / Non-Goals

**Goals:**

- Let a GM configure a profane base skill and an optional, compatible profane talent for each pre-effect resistance check.
- Exclude supernatural skills and supernatural spell/liturgy entries from the editor controls.
- Start a skill-based Widerstandsprobe with the configured talent selected when the target owns that talent under the selected skill.
- Use the same configured profane skill without talent when the target does not own the optional talent.
- Preserve all existing pre-effects and the current attribute-based resistance path.

**Non-Goals:**

- Do not support supernatural skills, Zauber, Liturgien, Anrufungen, or freie Fertigkeiten as resistance checks.
- Do not add a new roll dialog or alter Ilaris.postSkillRoll resolution.
- Do not modify compendium data or auto-populate resistance settings for existing spells.
- Do not fail or notify solely because an optional configured talent is unavailable to a target.

## Decisions

### Store the optional talent as avoidTest.talent

The pre-effect data will retain avoidTest.fertigkeit as the profane parent skill and add avoidTest.talent as an optional talent name. This mirrors the existing actor relationship: a profane talent belongs to a profane skill through talent.system.fertigkeit.

This is preferable to overloading avoidTest.fertigkeit with a talent name because the resistance handler must first resolve a skill's PW and its talent list. It also keeps existing pre-effect JSON compatible: an omitted talent means no preselection.

### Prepare separate profane option collections for the editor

The item sheet will index Ilaris.fertigkeitenPacks for entries whose type is exactly fertigkeit and Ilaris.talentePacks for entries whose type is exactly talent. Talent options will retain their parent skill name so the UI can present only compatible choices for the selected base skill and preserve an unavailable stored value visibly.

This is preferable to using a combined list because the existing default skill-pack setting deliberately includes a supernatural pack, and because a talent name alone is not enough to establish its compatible base skill.

### Validate the optional talent against the target at roll time

After resolving avoidTest.fertigkeit in actor.profan.fertigkeiten, the resistance handler will find avoidTest.talent in that skill's system.talente. Only a successful match is passed to FertigkeitDialog as its initial talent selection. A missing match leaves the dialog at ohne Talent, using PW.

The target actor is authoritative for eligibility. This avoids granting PWT merely because a spell author configured a talent that the target does not own.

### Reuse FertigkeitDialog's existing talent state

FertigkeitDialog will accept an optional initial talent identifier/name, derive the matching entry from its existing talentList, and render that option selected. Its existing modifier calculation already uses PWT for a specific talent and PW for ohne Talent; no new roll calculation is needed.

This is preferable to setting PW/PWT in the resistance handler because the dialog remains the single source of truth for live preview and roll execution.

## API Surface

- [ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html): the existing FertigkeitDialog continues to render through its AppV2 lifecycle and prepared context.
- [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html): existing Handlebars parts render the pre-effect selectors and dialog's initial selected value.
- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): existing actor data provides the selected profane skill and its owned system.talente.
- Ilaris.postSkillRoll is an existing system hook. Its current (dialog, payload) handling remains unchanged and is not redefined by this change.
- No new Foundry lifecycle hook, Document mutation method, or foundry.utils.\* helper is required. The implementation uses the current AppV2/Handlebars context and DOM form-state patterns, consistent with the [community ApplicationV2 guidance](https://foundryvtt.wiki/en/development/api/applicationv2).

## Risks / Trade-offs

- **[Stored talent no longer exists in configured packs]** → Render the stored value as unavailable and do not silently replace it; the runtime still falls back to PW if the target cannot match it.
- **[Talent belongs to a different selected skill]** → Restrict editor options to the selected skill and revalidate at runtime before preselection.
- **[An actor's prepared profane talent list is stale]** → Resolve from the same prepared actor.profan.fertigkeiten collection already used by the resistance handler, preserving existing actor-sheet semantics.
- **[Initial selection bypasses preview refresh]** → Initialize the actual select state before the dialog's initial preview calculation so preview and roll use the same value.

## Migration Plan

1. Add the optional avoidTest.talent field with an empty-string default.
2. Treat absent fields in existing world and compendium pre-effects as no-talent configurations.
3. Deploy without compendium migration or rebuild requirement because no \_source data changes are required.
4. Roll back by ignoring or removing the optional field; existing skill-only resistance checks continue to function.

## Open Questions

- None. The configured talent is intentionally optional, and the approved fallback is a normal PW skill check without talent.

## Testing Strategy

- **Unit tests:** use the existing dynamic-import and Jest mock style in scripts/effects/pre-effects/_spec_/resist-handler.spec.js to assert the dialog options contain a matching initial talent, and omit it when the actor lacks it. Add focused FertigkeitDialog state tests for initial specific talent → PWT and no matching initial talent → PW.
- **Template/context tests:** test option builders as pure data where feasible, proving exact type filtering (fertigkeit / talent) and parent-skill compatibility.
- **E2E:** extend E2E-026's existing cast → prompt → resistance-dialog flow with a profane skill and talent; assert the selected option and PW/PWT behavior for both possession and absence. Extend the pre-effect sheet flow to assert no uebernatuerlicheFertigkeit option appears and the optional talent survives save/reopen.
- **Regression:** keep the current attribute-based E2E scenario, success/failure resolution cases, and diminished-only cases unchanged.
