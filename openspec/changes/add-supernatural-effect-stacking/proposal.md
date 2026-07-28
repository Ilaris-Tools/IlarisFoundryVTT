## Why

Ilaris does not allow a value to be strengthened or weakened by two supernatural effects at the same time. The stronger effect suppresses the weaker one only for the overlapping part of its effect. Current Foundry `ActiveEffect` changes cannot represent this: they primarily modify Actor paths, have no roll or weapon context, and global suppression would be incorrect for partially overlapping effects.

For example, an AT bonus and an additional AT bonus for Klingenwaffen can currently neither be compared according to the rule nor be suppressed only in their overlap. Permanent and mundane Vorteile must still add normally. This implements the rule described in [#490](https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues/490).

## What Changes

- Native Foundry ActiveEffects gain a declarative, Ilaris-specific modifier list alongside the unchanged `changes` array. Entries support preparation and roll phases, targets, selectors (Fertigkeit, Talent, situation), source classification, and stacking policy.
- A central resolver decides per output context whether ordinary modifier contributions add or competing supernatural modifier contributions select the strongest result. This comparison includes matching supernatural components from the same ActiveEffect as well as from different effects. Weaker effects remain active; only their overlapping modifier contribution is suppressed.
- Actor preparation resolves only prepare-capable Ilaris modifiers, such as an explicit GS modifier, in the same ActiveEffect lifecycle phase as Foundry changes. Semantic main-attribute modifiers resolve only in the matching skill or talent roll and never alter prepared Actor attributes or dependent derived values. Attack, defense, damage, skill, and talent rolls resolve their remaining contextual modifiers at roll time.
- A world setting switches between Ilaris rule mode (default) and Foundry mode. In Foundry mode, all active Ilaris modifiers add like normal ActiveEffect changes without recreating existing effects.
- ActiveEffect and supernatural Pre-Effect configuration distinguish classic Foundry changes from Ilaris modifiers. Generated data, LLM-assisted Pre-Effect generation, and existing spell data are prepared for the new format; Axxeleratus is migrated as the reference example.
- Dice modifiers receive an explicit comparison magnitude. Linear `XW6` values use `X × 3.5`. An effect's strength and resolved contribution are determined before and independently of later maneuvers: Hammerschlag, Unaufhaltsam, and comparable maneuvers must neither influence the comparison nor subsequently change an effect contribution.

## Capabilities

### New Capabilities

- `rule-aware-active-effect-modifiers`: Declarative, context-aware Ilaris modifiers on native ActiveEffects, including component-local suppression of supernatural effects.

### Modified Capabilities

- `active-effects`: ActiveEffect data model, configuration, and preparation lifecycle support Ilaris modifiers in addition to classic Foundry `changes`.
- `combat`: Melee and ranged rolls consume resolved contextual AT, VT, and damage modifiers.
- `dice`: Skill and talent rolls consume resolved contextual Ilaris modifiers, including social-duel contexts.
- `settings`: A world setting selects Ilaris suppression or normal Foundry additive behavior.
- `supernatural-pre-effects`: Supernatural Pre-Effects can create declarative Ilaris modifiers and classify their effects as supernatural sources.
- `spell-pre-effect-data`: Existing spell Pre-Effect data uses the new modifier format for rule-relevant bonuses.
- `llm-pre-effect-generation`: The LLM prompt describes the extended Pre-Effect schema and its selectors.
- `pre-effect-e2e-tests`: Pre-Effect E2E coverage verifies the new ActiveEffect data form and its rule resolution.

## Impact

Affected implementation areas include `scripts/effects/`, `scripts/actors/`, `scripts/combat/`, `scripts/dice/`, `scripts/items/`, `scripts/settings/`, corresponding compendium sources, and tests. Existing classic `ActiveEffect#changes` remain compatible. The change adds a separate semantic data channel so bonuses are not applied twice.

Implementation uses the documented Foundry v14 abstractions [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), and [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html). In particular, it uses `Actor#allApplicableEffects`, `Actor#applyActiveEffects`, and the ActiveEffect type-data extension. It does not disable a document through global `isSuppressed`, because suppression affects only individual output contexts. No new Foundry Hooks are planned; existing timing and duration hooks remain unchanged. Implementation will recheck v14 signatures and applicable `foundry.utils.*` helpers against the official API and community wiki.

Testing Impact: New unit tests cover selection of competing components (including components from the same effect), partial overlaps, `XW6` comparison values, maneuver-independent damage contributions, and both world-setting modes. Existing Pre-Effect, combat, and dice tests are extended. E2E tests cover configuring and applying a contextual buff as well as competing supernatural buffs in the existing GM baseline world; no multiplayer scenario is required.
