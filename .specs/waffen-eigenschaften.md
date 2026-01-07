# Plan: RFC-Style Waffeneigenschaften System Specification

Create a comprehensive RFC-style technical specification document for the waffeneigenschaften system as the authoritative reference for developers and coding agents. The specification will use RFC 2119 keywords, mark the current codebase as the reference implementation, and include conformance requirements.

## Steps

### 1. Create RFC-style specification header

Create the document at `docs/develop/waffeneigenschaften-system.md` with:

-   **Document metadata**

    -   Specification Version: 1.0.0
    -   System Version: 12.2.6+
    -   Status: Implemented
    -   Date: January 2026
    -   Authors: System Development Team

-   **Abstract** - 2-3 paragraph summary of the modular weapon properties architecture

-   **Table of contents** - Auto-generated or manual section listing

-   **Terminology section**

    -   eigenschaft (weapon property)
    -   kategorie (processor category)
    -   processor (eigenschaft processing logic)
    -   computed object (calculated weapon stats)
    -   cache (eigenschaft item storage)

-   **Conventions**
    -   RFC 2119 keywords (MUST/REQUIRED, SHOULD/RECOMMENDED, MAY/OPTIONAL)
    -   Reference implementation notation

### 2. Define system requirements and architecture

-   **Functional requirements**

    -   Weapons MUST support modular eigenschaften arrays
    -   Cache MUST preload on initialization
    -   Processors MUST route by kategorie
    -   Calculations MUST be deterministic

-   **Non-functional requirements**

    -   Async operations MUST complete before stat usage
    -   Cache MUST use singleton pattern
    -   UI MUST reflect computed stats

-   **Architectural constraints**

    -   Processors MUST extend `BaseProcessor` ([scripts/items/eigenschaft-processors/base-processor.js](scripts/items/eigenschaft-processors/base-processor.js))
    -   Items MUST have kategorie property
    -   Weapons store eigenschaften as string arrays

-   **High-level mermaid flowchart** showing:
    -   Initialization → Preparation → Calculation → Application phases
    -   Timing guarantees at each phase

### 3. Specify cache system contract

Define `EigenschaftCache` ([scripts/items/utils/eigenschaft-cache.js](scripts/items/utils/eigenschaft-cache.js)) as normative reference implementation:

-   **Required methods**

    -   `load(eigenschaftNames)` - Load eigenschaft items
    -   `get(name)` - Retrieve cached item (sync)
    -   `has(name)` - Check if cached (sync)
    -   `isLoaded(eigenschaftNames)` - Check if all loaded
    -   `isLoading()` - Check loading state
    -   `clear()` - Clear instance state
    -   `size()` - Number of cached items

-   **Global cache singleton requirements**

    -   MUST persist across weapon instances
    -   MUST use Map internally for storage
    -   MUST track loading state with WeakMap

-   **Preload initialization** ([preloadAllEigenschaften](scripts/items/utils/eigenschaft-cache.js#L150-L180))

    -   MUST run on 'ready' hook
    -   MUST load from world + configured compendiums
    -   MUST complete before actor sheets render

-   **Hook registration requirements**

    -   MUST invalidate on updateItem/createItem/deleteItem
    -   MUST refresh on settings change (ilarisWaffeneigenschaftenPacksChanged)

-   **Code snippet** - Show globalCache/loaderState singleton implementation pattern

-   **Compendium configuration** via [EigenschaftSettings](scripts/settings/eigenschaft-settings.js)
    -   MUST allow GM to select source compendiums
    -   MUST provide default configuration
    -   MUST trigger cache refresh on change

### 4. Specify processor system architecture

-   **ProcessorFactory requirements** ([scripts/items/eigenschaft-processors/processor-factory.js](scripts/items/eigenschaft-processors/processor-factory.js))

    -   MUST maintain kategorie → class Map registry
    -   MUST validate kategorie exists before processing
    -   MUST instantiate processors per-call

-   **BaseProcessor contract** ([scripts/items/eigenschaft-processors/base-processor.js](scripts/items/eigenschaft-processors/base-processor.js))

    -   MUST implement `process(name, eigenschaft, computed, actor, weapon)` returning void
    -   SHOULD implement `validate(eigenschaft)` returning boolean
    -   MUST NOT mutate eigenschaft input
    -   MUST only modify computed parameter

-   **Individual processor specifications** for each kategorie:

    1. **modifier** ([scripts/items/eigenschaft-processors/modifier-processor.js](scripts/items/eigenschaft-processors/modifier-processor.js))

        - JSON schema for modifiers object
        - Processing requirements (numeric, formula, conditional)
        - Side effects on computed.at/vt/fk/schaden/rw

    2. **wielding** ([scripts/items/eigenschaft-processors/wielding-processor.js](scripts/items/eigenschaft-processors/wielding-processor.js))

        - JSON schema for wieldingRequirements
        - Hand requirements (1/2 hands)
        - Penalty application logic

    3. **target_effect** ([scripts/items/eigenschaft-processors/target-effect-processor.js](scripts/items/eigenschaft-processors/target-effect-processor.js))

        - JSON schema for targetEffect
        - Registration requirements
        - Combat integration contract

    4. **actor_modifier** ([scripts/items/eigenschaft-processors/actor-modifier-processor.js](scripts/items/eigenschaft-processors/actor-modifier-processor.js))

        - JSON schema for actorModifiers
        - Flag setting requirements
        - Collection phase integration

    5. **passive** ([scripts/items/eigenschaft-processors/passive-processor.js](scripts/items/eigenschaft-processors/passive-processor.js))
        - No-op processor specification
        - Name-checking requirements

-   **Code snippet** - Show ModifierProcessor complex formula evaluation with `evaluateFormulaInContext` ([scripts/items/utils/eigenschaft-utils.js](scripts/items/utils/eigenschaft-utils.js)) and conditional modifier handling with `checkCondition`

-   **High-level mermaid class diagram**
    -   BaseProcessor inheritance hierarchy
    -   Factory registration pattern
    -   Processor relationships

### 5. Specify data models and schemas

-   **Normative JSON schemas from template.json** ([template.json](template.json#L435-L501))

-   **Waffeneigenschaft item schema**

    -   MUST have `kategorie` field
    -   MUST have type-specific properties by kategorie
    -   MAY have optional `beschreibung` field

-   **Complete schemas for each kategorie**

    1. **modifier** - `modifiers` object with at/vt/fk/schaden/schadenFormula/rw/conditionalModifiers/combatMechanics
    2. **wielding** - `wieldingRequirements` object with hands/ignoreNebenMalus/noRider/requiresRider/penalties/condition
    3. **target_effect** - `targetEffect` object with name/trigger/resistCheck/effect
    4. **actor_modifier** - `actorModifiers` object with modifiers array
    5. **passive** - No required properties

-   **Weapon computed object specification**

    -   MUST initialize all fields in `_calculateWeaponStats` ([scripts/items/waffe.js](scripts/items/waffe.js#L108-L129))
    -   MUST reset on each calculation
    -   MUST NOT persist to database
    -   Field listing: at, vt, fk, schadenBonus, rw, handsRequired, ignoreNebenMalus, noRider, modifiers, targetEffects, combatMechanics, conditionalModifiers, hasActorModifiers, actorModifiers

-   **Actor integration fields**

    -   `hasActorModifiers` - Boolean flag
    -   `actorModifiers` - Array structure with property/mode/value

-   **Validation requirements**

    -   Formulas MUST be valid JS expressions
    -   Attribute refs MUST use `@actor.system` prefix
    -   Operators MUST be from allowed set (>=, <=, >, <, ==, !=)

-   **Migration specification**
    -   Reference [migrate-waffen-source.mjs](utils/migrate-waffen-source.mjs) EIGENSCHAFT_MAPPING as authoritative
    -   Old object format MUST convert to array format
    -   Null-mapped eigenschaften MUST be dropped
    -   Migration MUST preserve semantic meaning

### 6. Document execution flow and timing

-   **High-level mermaid sequence diagram** covering:

    1. **Initialization phase**

        - `Hooks.on('ready')` triggers preload
        - `preloadAllEigenschaften()` parallel compendium loads
        - Cache populated and ready

    2. **Weapon preparation phase**

        - `Actor.prepareData()` called
        - `Actor._calculateKampf()` iterates weapons
        - `WaffeItem.prepareWeapon()` called per weapon
        - `cache.isLoaded()` check
        - `await cache.load()` if needed
        - `_calculateWeaponStats()` called

    3. **Stat calculation sequence**

        - Initialize computed object
        - `_applyModifiers()` - base weapon + PW
        - `_applyActorModifiers()` - BE, wounds
        - For each eigenschaft: `_processEigenschaft()`
            - `factory.process()` routes by kategorie
            - `processor.process()` modifies computed
        - `_applyNebenwaffeMalus()` if applicable

    4. **Actor modifier collection phase**
        - `Actor._applyWeaponActorModifiers()` called
        - Collect from equipped weapons with `hasActorModifiers`
        - Apply to `actor.system.abgeleitete`

-   **Timing guarantees**

    -   Preload MUST complete within 5 seconds
    -   `cache.load()` MUST complete before calculations proceed
    -   Stat calculations MUST be synchronous after cache load

-   **Code snippet** - Show processor invocation loop from [WaffeItem.\_calculateWeaponStats](scripts/items/waffe.js#L103-L229) with error handling pattern

### 7. Specify integration contracts, conformance, and extensions

-   **Actor integration requirements**

    -   Actor MUST call `prepareWeapon()` for all weapons in `_calculateKampf()`
    -   Actor MUST collect actor modifiers via `_applyWeaponActorModifiers()`
    -   Actor MUST apply collected modifiers to `system.abgeleitete`

-   **UI integration requirements**

    -   `WaffeneigenschaftSheet` MUST show kategorie-dependent form sections
    -   `WaffenSheet` MUST detect old format and show migration option
    -   Settings MUST allow compendium configuration with checkboxes

-   **Conformance checklist**

    -   [ ] Implementation MUST pass all unit tests in `coverage/` directory
    -   [ ] Cache MUST respond to `get()` within 10ms after preload
    -   [ ] Processors MUST NOT throw errors for invalid data (graceful degradation)
    -   [ ] Migrations MUST preserve semantic meaning of eigenschaften
    -   [ ] Formula evaluation MUST handle missing properties gracefully
    -   [ ] Conditional modifiers MUST check conditions before applying
    -   [ ] Actor modifiers MUST only apply when weapon is equipped
    -   [ ] UI MUST update when eigenschaft items are modified

-   **Extension specification for new processors**

    -   MUST extend `BaseProcessor` abstract class
    -   MUST register in `ProcessorFactory.processors` Map
    -   MUST update `template.json` with new kategorie schema
    -   MUST update `WaffeneigenschaftSheet` UI with new form section
    -   SHOULD provide `validate()` method for schema validation
    -   SHOULD add unit tests in `__tests__/` directory
    -   SHOULD document in this specification

-   **Reference implementation declaration**

    -   Mark [scripts/items/](scripts/items/) as **normative**
    -   Mark [scripts/items/eigenschaft-processors/](scripts/items/eigenschaft-processors/) as **normative**
    -   Mark [scripts/items/utils/eigenschaft-cache.js](scripts/items/utils/eigenschaft-cache.js) as **normative**
    -   Mark [scripts/items/utils/eigenschaft-utils.js](scripts/items/utils/eigenschaft-utils.js) as **normative**
    -   Mark templates and UI as **informative** (implementation examples)

-   **High-level mermaid class diagram** showing:
    -   WaffeItem orchestration
    -   EigenschaftCache singleton
    -   ProcessorFactory routing
    -   Processor implementations
    -   Actor integration points

## Further Considerations

### 1. Document maintenance

Should we specify review/update frequency for the specification (e.g., MUST update on breaking changes, SHOULD review quarterly)?

### 2. Deprecation policy

Include specification for deprecating processor types or eigenschaft properties with version requirements?

### 3. Performance requirements

Add specific performance benchmarks to conformance (e.g., "MUST calculate 100 weapons in <500ms", "cache preload MUST complete in <5s")?

## Additional Notes

-   This specification documents the **existing, working implementation** as of System Version 12.2.6+
-   The specification uses RFC 2119 keywords for clarity on requirements vs recommendations
-   Code snippets are provided only for complex implementation patterns
-   Diagrams remain high-level (sequence, class, flow) for clarity
-   The document serves as the single source of truth for developers and coding agents
-   Future extensions should reference and update this specification
