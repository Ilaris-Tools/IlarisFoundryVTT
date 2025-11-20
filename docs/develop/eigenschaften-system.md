# Eigenschaften System - Design Documentation

## Overview

The Eigenschaften System is a data-driven architecture for managing item properties (Waffeneigenschaften, Zaubereigenschaften, etc.) in the Ilaris FoundryVTT system. This replaces the previous hardcoded boolean property system with a flexible, extensible approach.

**Status**: Waffeneigenschaften implementation in progress (template.json and WaffeItem class complete)

**Branch**: `feature/29-waffeneigenschaften-als-lsite`

---

## Goals

1. **Eliminate Hardcoded Logic**: Remove all hardcoded property checks scattered throughout the codebase
2. **Data-Driven Design**: All effects defined in item data, not in code
3. **Performance**: Calculate only when data changes using `prepareDerivedData()`
4. **Extensibility**: Architecture works for weapons, spells, armor, and any future item types
5. **Maintainability**: Single source of truth for property effects

---

## Architecture Decisions

### Why Derived Data Instead of Active Effects?

**Decision**: Use `prepareDerivedData()` pattern, NOT Active Effects system

**Rationale**:

-   **Item-to-Item Modifications**: Active Effects can only target actors, not other items. We need weapon properties to modify weapon stats.
-   **Performance**: Derived Data only recalculates when source data changes, not on every render
-   **Control**: More direct control over calculation order and conditional logic
-   **Complexity**: Active Effects would require complex application types and conditionals that don't map well to our needs

**Research**: Examined WFRP4e's sophisticated effect system but found it over-engineered for our requirements. Their conditional modifiers and application types inspired our simpler design.

---

## Data Structure

### Template.json Schema

Location: `template.json` → `Item.types` → `waffeneigenschaft`

```json
{
    "waffeneigenschaft": {
        "templates": ["base"],
        "kategorie": "modifier",
        "modifiers": {
            "at": 0,
            "vt": 0,
            "schaden": 0,
            "schadenFormula": "",
            "rw": 0
        },
        "conditions": [],
        "wieldingRequirements": {
            "hands": 1,
            "penalties": {
                "hauptOnly": null,
                "nebenOnly": null,
                "nebenWithoutExemption": null
            }
        },
        "targetEffect": {
            "name": "",
            "trigger": "",
            "resistCheck": {
                "attribute": "",
                "difficulty": 0
            },
            "effect": {
                "type": "",
                "duration": "",
                "value": ""
            }
        },
        "combatMechanics": {
            "fumbleThreshold": null,
            "critThreshold": null,
            "ignoreCover": false,
            "ignoreArmor": false,
            "additionalDice": 0
        },
        "conditionalModifiers": [],
        "actorModifiers": {
            "initiative": 0,
            "movement": 0,
            "conditions": []
        },
        "customScript": ""
    }
}
```

### Weapon Data Changes

**Before** (hardcoded object):

```json
{
    "eigenschaften": {
        "kopflastig": false,
        "niederwerfen": false,
        "zweihaendig": false
        // ... 15+ boolean properties
    }
}
```

**After** (dynamic array):

```json
{
    "eigenschaften": ["Kopflastig", "Zweihandwaffe", "Unberechenbar"]
}
```

---

## Kategorie Types

The `kategorie` field routes processing logic. Each kategorie has specific fields and behaviors:

### 1. `modifier` - Simple Stat Changes

**Purpose**: Direct modifications to weapon stats  
**Examples**: Kopflastig (adds SB to damage), Präzise (adds +2 FK)

**Fields Used**:

-   `modifiers.at`: Attack value modifier
-   `modifiers.vt`: Defense value modifier
-   `modifiers.schaden`: Flat damage bonus
-   `modifiers.schadenFormula`: Dynamic formula (e.g., `@actor.system.attribute.KK.wert` for Kopflastig)
-   `modifiers.rw`: Range modifier
-   `conditions`: Array of conditional checks

**Condition Structure**:

```json
{
    "type": "attribute_check",
    "attribute": "KK",
    "operator": "<",
    "value": 4,
    "onFailure": {
        "at": -2,
        "vt": -2,
        "message": "KK zu niedrig: -2 AT/VT"
    }
}
```

**Example - Schwer (4)**:

```json
{
    "kategorie": "modifier",
    "modifiers": {},
    "conditions": [
        {
            "type": "attribute_check",
            "attribute": "KK",
            "operator": "<",
            "value": 4,
            "onFailure": {
                "at": -2,
                "vt": -2,
                "message": "KK < 4: -2 AT/VT"
            }
        }
    ]
}
```

**Example - Kopflastig**:

```json
{
    "kategorie": "modifier",
    "modifiers": {
        "schadenFormula": "@actor.system.attribute.KK.wert"
    }
}
```

---

### 2. `wielding` - Wielding Requirements

**Purpose**: Handle hand requirements and usage penalties  
**Examples**: Zweihändig, Einhändig

**Fields Used**:

-   `wieldingRequirements.hands`: Number of hands required (1 or 2)
-   `wieldingRequirements.penalties.hauptOnly`: Penalty when used as hauptwaffe only
-   `wieldingRequirements.penalties.nebenOnly`: Penalty when used as nebenwaffe only
-   `wieldingRequirements.penalties.nebenWithoutExemption`: Penalty when used as nebenwaffe without proper training

**Example - Zweihändig**:

```json
{
    "kategorie": "wielding",
    "wieldingRequirements": {
        "hands": 2,
        "penalties": {
            "hauptOnly": {
                "at": -2,
                "vt": -2,
                "schaden": -4,
                "message": "Einhändig geführt"
            },
            "nebenOnly": {
                "at": -6,
                "vt": -6,
                "schaden": -4,
                "message": "Nur als Nebenwaffe"
            }
        }
    }
}
```

**Logic**:

-   Checks if weapon is hauptwaffe, nebenwaffe, or both
-   Applies appropriate penalties based on wielding configuration
-   Interacts with "kein Malus als Nebenwaffe" eigenschaft for exemptions

---

### 3. `target_effect` - Effects on Target

**Purpose**: Effects that trigger on successful hit and may require resist checks  
**Examples**: Niederwerfen, Umklammern

**Fields Used**:

-   `targetEffect.name`: Display name
-   `targetEffect.trigger`: When effect triggers (e.g., "on_hit", "on_crit")
-   `targetEffect.resistCheck.attribute`: Attribute for resist check (e.g., "KK")
-   `targetEffect.resistCheck.difficulty`: Difficulty threshold
-   `targetEffect.effect`: The actual effect applied

**Example - Niederwerfen**:

```json
{
    "kategorie": "target_effect",
    "targetEffect": {
        "name": "Niederwerfen",
        "trigger": "on_hit",
        "resistCheck": {
            "attribute": "KK",
            "difficulty": 0
        },
        "effect": {
            "type": "condition",
            "duration": "until_standup",
            "value": "prone"
        }
    }
}
```

**Usage**:

-   Stored in `weapon.system.computed.targetEffects[]`
-   Combat dialogs check this array and offer trigger buttons
-   Resist checks handled by dialog system

---

### 4. `combat_mechanic` - Combat Rule Changes

**Purpose**: Alter fundamental combat mechanics  
**Examples**: Unberechenbar (fumble on 1-2, +4 vs shields)

**Fields Used**:

-   `combatMechanics.fumbleThreshold`: Highest value that counts as fumble (default: 1)
-   `combatMechanics.critThreshold`: Lowest value that counts as critical (default: 20)
-   `combatMechanics.ignoreCover`: Ignore cover bonuses
-   `combatMechanics.ignoreArmor`: Ignore armor (for Stumpf)
-   `combatMechanics.additionalDice`: Add dice to damage
-   `conditionalModifiers`: Context-dependent bonuses

**Conditional Modifier Structure**:

```json
{
    "condition": "target_has_shield",
    "modifiers": {
        "at": 4
    },
    "description": "+4 AT gegen Schildträger"
}
```

**Example - Unberechenbar**:

```json
{
    "kategorie": "combat_mechanic",
    "combatMechanics": {
        "fumbleThreshold": 2
    },
    "conditionalModifiers": [
        {
            "condition": "target_has_shield",
            "modifiers": {
                "at": 4
            },
            "description": "+4 AT gegen Schildträger"
        }
    ]
}
```

**Implementation Note**: Conditional modifiers are stored in `weapon.system.computed.conditionalModifiers[]` and checked by combat dialogs at attack time.

---

### 5. `actor_modifier` - Actor-Level Effects

**Purpose**: Properties that affect the actor, not just the weapon  
**Examples**: INI bonus from daggers, movement penalties

**Fields Used**:

-   `actorModifiers.initiative`: INI modifier (can be conditional)
-   `actorModifiers.movement`: Movement speed modifier
-   `actorModifiers.conditions`: Status conditions applied to actor

**Example - INI Bonus (Dolch)**:

```json
{
    "kategorie": "actor_modifier",
    "actorModifiers": {
        "initiative": 2
    }
}
```

**Special Handling**:

-   Weapons set `computed.hasActorModifiers = true`
-   Actor's `prepareData()` checks all equipped weapons
-   Only applies INI bonus from weapon with highest INI value
-   Prevents stacking issues

**Implementation**:

```javascript
// In actor.js prepareData()
let highestINI = 0
for (let weapon of actor.allWeapons) {
    if (weapon.system.computed?.hasActorModifiers) {
        const ini = weapon.system.actorModifiers?.initiative || 0
        highestINI = Math.max(highestINI, ini)
    }
}
actor.system.ini += highestINI
```

---

### 6. `passive` - No Active Effects

**Purpose**: Properties that are just checked by name, no calculations  
**Examples**: Unzerstörbar, Zerbrechlich, Reittier

**Implementation**: Simply having the eigenschaft in the array is enough. Other code checks for presence:

```javascript
if (weapon.system.eigenschaften.includes('Unzerstörbar')) {
    // Don't allow breaking
}
```

---

## Implementation

### WaffeItem Class

**Location**: `scripts/items/waffe.js`

**Key Methods**:

#### `prepareDerivedData()`

Entry point, called by Foundry when item data changes.

-   Only runs for weapons equipped on an actor
-   Triggers eigenschaft loading if not cached
-   Calls `_calculateWeaponStats()` when ready

#### `_calculateWeaponStats()`

Main computation engine.

-   Initializes `system.computed` object
-   Processes each eigenschaft by name
-   Applies actor-wide modifiers (BE, wounds)
-   Results stored for later use

**Computed Object Structure**:

```javascript
system.computed = {
  at: 15,                    // Total AT including all modifiers
  vt: 12,                    // Total VT including all modifiers
  fk: 10,                    // Total FK (for ranged weapons)
  schadenBonus: 8,           // Total damage bonus
  rw: 20,                    // Range with modifiers
  penalties: [               // UI display of active penalties
    "BE: -2",
    "KK zu niedrig: -2 AT/VT"
  ],
  targetEffects: [           // Effects that can trigger in combat
    {
      name: "Niederwerfen",
      trigger: "on_hit",
      resistCheck: {...},
      effect: {...}
    }
  ],
  combatMechanics: {         // Special combat rules
    fumbleThreshold: 2,
    ignoreCover: false,
    ignoreArmor: true
  },
  conditionalModifiers: [    // Context-dependent bonuses
    {
      condition: "target_has_shield",
      modifiers: { at: 4 },
      description: "+4 AT gegen Schildträger"
    }
  ],
  hasActorModifiers: true    // Flag for actor-level processing
}
```

#### `_processEigenschaft(name, computed, actor)`

Router method that delegates to specific processors based on kategorie.

#### Category Processors

-   `_applyModifiers()`: Handles modifiers kategorie
-   `_applyWieldingRequirements()`: Handles wielding kategorie
-   `_registerTargetEffect()`: Handles target_effect kategorie
-   `_applyCombatMechanics()`: Handles combat_mechanic kategorie
-   Conditional modifiers also registered here

#### Helper Methods

-   `_checkCondition()`: Evaluates condition objects (attribute checks, custom scripts)
-   `_compareValues()`: Comparison operators (<, >, ==, etc.)
-   `_evaluateFormula()`: Parses formulas with @actor references
-   `_executeCustomScript()`: Runs custom JavaScript (escape hatch)

#### Caching System

-   `_getEigenschaftItem()`: Async loader, searches world and compendiums
-   `_getCachedEigenschaftItem()`: Synchronous getter from cache
-   `_loadEigenschaften()`: Preloads all weapon's eigenschaften
-   `_queueEigenschaftLoad()`: Queues async load and triggers actor refresh
-   Cache cleared on eigenschaft changes via `_preUpdate()`

---

## Migration from Old System

### Old Code Pattern (Actor.js)

**Before** (lines 449-580):

```javascript
let kopflastig = nwaffe.system.eigenschaften.kopflastig
let niederwerfen = nwaffe.system.eigenschaften.niederwerfen
// ... 15+ boolean extractions

if (kopflastig) {
    schaden += sb
}

if (schwer_4 && KK < 4) {
    at -= 2
    vt -= 2
}

if (zweihaendig) {
    if (hauptwaffe && !nebenwaffe) {
        at -= 2
        vt -= 2
        schaden -= 4
    }
    // ... more wielding logic
}
```

### New Code Pattern

**After**:

```javascript
// Weapons calculate themselves in prepareDerivedData()
// Actor just uses the results:
nwaffe.system.at = nwaffe.system.computed.at
nwaffe.system.vt = nwaffe.system.computed.vt
nwaffe.system.schaden = `${nwaffe.system.tp}+${nwaffe.system.computed.schadenBonus}`

// Display penalties in UI
if (nwaffe.system.computed.penalties.length > 0) {
    // Show penalty list
}
```

### Data Migration

**Required Migration**:

1. Convert `eigenschaften` object to array in all weapon items
2. Create waffeneigenschaft items in compendium for each property
3. Update actor.js to remove hardcoded calculations
4. Update combat dialogs to check `computed` values
5. Update weapon-utils.js helper functions

**Migration Script** (TODO):

```javascript
// Pseudocode for migration
for (let weapon of allWeapons) {
    const oldProps = weapon.system.eigenschaften
    const newProps = []

    if (oldProps.kopflastig) newProps.push('Kopflastig')
    if (oldProps.zweihaendig) newProps.push('Zweihändig')
    // ... convert all properties

    await weapon.update({
        'system.eigenschaften': newProps,
    })
}
```

---

## Files Modified

### Completed

-   ✅ `template.json`: Updated waffeneigenschaft structure, changed weapon eigenschaften to arrays
-   ✅ `scripts/items/waffe.js`: Implemented WaffeItem class with full calculation engine
-   ✅ `scripts/items/proxy.js`: Already routes nahkampfwaffe/fernkampfwaffe to WaffeItem
-   ✅ `templates/sheets/nahkampfwaffe.hbs`: Changed to multiselect dropdown
-   ✅ `templates/sheets/fernkampfwaffe.hbs`: Changed to multiselect dropdown
-   ✅ `scripts/sheets/waffe-base.js`: Created base class for weapon sheets
-   ✅ `scripts/sheets/nahkampfwaffe.js`: Extends WaffeBaseSheet
-   ✅ `scripts/sheets/fernkampfwaffe.js`: Extends WaffeBaseSheet
-   ✅ `scripts/common/handlebars.js`: Added `includes()` helper

### TODO

-   ⏳ `scripts/actors/actor.js`: Remove hardcoded weapon calculations (lines 449-580)
-   ⏳ `scripts/actors/weapon-utils.js`: Update dual-wielding checks
-   ⏳ `scripts/sheets/dialogs/angriff.js`: Update for computed values and conditional modifiers
-   ⏳ Create waffeneigenschaft compendium items
-   ⏳ Create migration script for existing weapons
-   ⏳ Update tests

---

## Extending to Spells

The exact same architecture will work for spells with minimal changes:

### Zaubereigenschaft Structure

```json
{
    "zaubereigenschaft": {
        "templates": ["base"],
        "kategorie": "modifier",
        "modifiers": {
            "castingTime": 0,
            "range": 0,
            "duration": "",
            "zfBonus": 0,
            "apCost": 0
        },
        "conditions": [],
        "targetEffect": {
            "name": "",
            "trigger": "on_cast",
            "resistCheck": {
                "attribute": "WI",
                "difficulty": 0
            },
            "effect": {
                "type": "",
                "duration": "",
                "value": ""
            }
        },
        "spellMechanics": {
            "requiresConcentration": false,
            "canBeMaintained": false,
            "areaOfEffect": "",
            "additionalTargets": 0
        },
        "castingModifiers": [],
        "actorModifiers": {
            "apRegeneration": 0,
            "conditions": []
        },
        "customScript": ""
    }
}
```

### ZauberItem Class

Similar to WaffeItem but with spell-specific logic:

-   `_calculateSpellStats()` instead of `_calculateWeaponStats()`
-   Processors for spell-specific categories
-   Different computed object structure

**Example Computed Object**:

```javascript
system.computed = {
    zf: 12, // Total casting roll bonus
    apCost: 8, // Total AP cost with modifiers
    range: 20, // Range with modifiers
    duration: '5 rounds', // Duration string
    penalties: [], // UI display
    targetEffects: [], // On-target effects
    spellMechanics: {
        // Special rules
        requiresConcentration: true,
        areaOfEffect: '5m radius',
    },
    castingModifiers: [], // Conditional modifiers
    hasActorModifiers: false,
}
```

---

## Testing Checklist

### Waffeneigenschaften to Test

-   [ ] **Kopflastig**: Adds SB to damage using formula
-   [ ] **Schwer (4)**: -2 AT/VT if KK < 4 (conditional)
-   [ ] **Schwer (8)**: -2 AT/VT if KK < 8 (conditional)
-   [ ] **Zweihändig**: Correct penalties based on wielding (hauptOnly, nebenOnly)
-   [ ] **Kein Malus als Nebenwaffe**: Exemption from nebenwaffe penalty
-   [ ] **Niederwerfen**: Registers target effect with KK resist check
-   [ ] **Umklammern**: Registers target effect with appropriate values
-   [ ] **Unberechenbar**:
    -   [ ] Fumble threshold = 2
    -   [ ] +4 AT vs shield bearers (conditional modifier)
-   [ ] **INI Bonus (Dolch)**:
    -   [ ] Adds to actor INI
    -   [ ] Only highest weapon counts
-   [ ] **Parierwaffe**: +1 VT (simple modifier)
-   [ ] **Wendig**: Bonus to defensive maneuvers
-   [ ] **Stumpf**: Ignores armor (combat mechanic)
-   [ ] **Unzerstörbar**: Just presence check (passive)
-   [ ] **Zerbrechlich**: Just presence check (passive)

### Edge Cases

-   [ ] Multiple Schwer conditions (should only apply highest)
-   [ ] Zweihändig + Kein Malus als Nebenwaffe interaction
-   [ ] Multiple weapons with INI bonus (only highest applies)
-   [ ] Dual-wielding with different eigenschaften
-   [ ] BE penalties stack correctly with eigenschaft penalties
-   [ ] Conditional modifiers display in combat dialog
-   [ ] Target effects trigger correctly
-   [ ] Custom scripts execute safely with error handling
-   [ ] Formula evaluation handles missing attributes gracefully
-   [ ] Cache invalidation on eigenschaft changes

---

## Performance Considerations

1. **Lazy Loading**: Eigenschaften only loaded when weapon is equipped
2. **Caching**: Results cached in `system.computed`, eigenschaft items cached in Map
3. **Synchronous Execution**: `prepareDerivedData()` is synchronous after initial load
4. **Minimal Recalculation**: Only runs when:
    - Weapon eigenschaften change
    - Weapon equipped/unequipped
    - Actor attributes change (triggers full actor prepareData)
5. **No Runtime Lookups**: Combat dialogs use pre-computed values

---

## Custom Script Escape Hatch

For truly unique eigenschaften that don't fit any kategorie:

```json
{
    "kategorie": "modifier",
    "customScript": "if (actor.system.misc.ist_beritten) { computed.at += 2; }"
}
```

**Security**: Scripts run in isolated Function context with limited scope (weapon, computed, actor). No access to game globals or dangerous APIs.

**Best Practice**: Avoid custom scripts unless absolutely necessary. Prefer adding new fields to kategorie structures.

---

## Future Enhancements

### Planned

1. **Spell System**: Use same architecture for Zaubereigenschaften
2. **Armor System**: Extend to Rüstungseigenschaften
3. **Vorteil System**: Migrate advantages/disadvantages to similar pattern
4. **Effect Library**: Pre-built common effects (damage types, conditions, etc.)

### Possible

1. **Visual Effect Editor**: UI for creating eigenschaften without editing JSON
2. **Effect Stacking Rules**: Define how multiple instances of same property interact
3. **Effect Templates**: Pre-built templates for common property types
4. **Effect Dependencies**: Properties that require/exclude other properties
5. **Dynamic Compendium**: Auto-generate eigenschaft items from simplified definitions

---

## Known Limitations

1. **Async Loading Delay**: First render may not show computed values (fixed after 1 tick)
2. **Compendium Search**: Searches all Item compendiums on first load (can be slow with many packs)
3. **No Type Safety**: JSON structure not validated at compile time
4. **Custom Scripts**: Limited error handling, can break silently
5. **Migration Required**: All existing weapons must be migrated manually or via script

---

## Questions & Decisions

### Q: Why not use Active Effects for everything?

**A**: Active Effects can't target item properties (only actor properties), and we need weapons to modify their own stats. Also, performance concerns with many effects.

### Q: Why sync + cache instead of just async?

**A**: `prepareDerivedData()` must be synchronous per Foundry architecture. Async loading + caching gives us best of both worlds.

### Q: What about very complex interactions?

**A**: Use `customScript` escape hatch, but prefer extending kategorie structures where possible for maintainability.

### Q: How to handle properties that interact with each other?

**A**: Processing order matters. Current order: modifiers → wielding → target effects → combat mechanics. May need coordination for complex cases.

### Q: Performance with many eigenschaften?

**A**: Caching mitigates this. Each eigenschaft item loaded once, then cached. Calculation is fast (simple conditionals and math).

---

## References

-   **WFRP4e Effects**: `/systems/wfrp4e/modules/system/effect.js` - Complex conditional system
-   **Foundry Derived Data**: https://foundryvtt.com/article/system-data-models/
-   **Template.json Spec**: https://foundryvtt.com/article/system-data-models/#template
-   **Active Effects**: https://foundryvtt.com/article/active-effects/

---

## Changelog

-   **2024-11-09**: Initial design and implementation of waffeneigenschaft system
    -   Created template.json structure
    -   Implemented WaffeItem class with full calculation engine
    -   Updated weapon sheets to use multiselect dropdowns
    -   Created WaffeBaseSheet to eliminate duplication
    -   Documented architecture and design decisions
