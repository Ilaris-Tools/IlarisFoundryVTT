# Waffeneigenschaften System - Technical Specification

**Version:** 1.0.0  
**System Version:** 12.3.0+  
**Status:** Implemented  
**Date:** January 2026

## Abstract

This specification defines a modular weapon properties system (Waffeneigenschaften) for a Foundry VTT game system. The system allows weapons to have dynamic, composable properties that affect combat calculations through a processor-based architecture. Properties can be parameterized (e.g., "Schwer (4)" vs "Schwer (8)"), enabling flexible weapon configurations without proliferating item types.

The architecture follows separation of concerns: weapon items reference eigenschaft (property) items by key, a global cache preloads eigenschaft items for performance, and kategorie-specific processors apply eigenschaft effects to weapon computations. The system supports migration from legacy formats and provides UI components for property management.

This document serves as the authoritative specification for implementing or extending the system.

## Terminology

- **Eigenschaft** (plural: Eigenschaften): A weapon property/trait (e.g., "Schwer", "Zweihändig", "Umklammern")
- **Kategorie**: Processing category that determines how an eigenschaft modifies weapon stats (modifier, wielding, target_effect, actor_modifier, passive)
- **Processor**: Component that implements kategorie-specific logic to apply eigenschaft effects
- **Computed Object**: Transient object holding calculated weapon statistics (AT, VT, damage, etc.)
- **Parameter**: Runtime value passed to an eigenschaft (e.g., KK threshold 4 for "Schwer (4)")
- **Parameter Slot**: Schema definition for an eigenschaft parameter (name, type, usage path)
- **Cache**: Singleton storage for preloaded eigenschaft items

## Conventions

This specification uses RFC 2119 keywords:

- **MUST/REQUIRED**: Absolute requirement
- **SHOULD/RECOMMENDED**: Strong recommendation with valid exceptions
- **MAY/OPTIONAL**: Truly optional feature

Reference implementation paths use format `[file.js](path/to/file.js)` and are **normative** unless marked **informative**.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Parsing System](#parsing-system)
5. [Cache System](#cache-system)
6. [Processor System](#processor-system)
7. [Weapon Integration](#weapon-integration)
8. [UI Components](#ui-components)
9. [Migration Strategy](#migration-strategy)
10. [Implementation Guidelines](#implementation-guidelines)
11. [Conformance Requirements](#conformance-requirements)

---

## 1. System Overview

### 1.1 Goals

The Waffeneigenschaften system aims to:

1. **Modularity**: Weapons composed of reusable property items
2. **Flexibility**: Properties can be parameterized for variations (e.g., different weight thresholds)
3. **Performance**: Global cache minimizes database queries
4. **Extensibility**: New property types via processor plugins
5. **Migration**: Seamless transition from legacy formats

### 1.2 Core Principles

- **Single Source of Truth**: Eigenschaft items define behavior, weapons reference them
- **Lazy Loading with Preload**: Cache preloads on init, loads on-demand if needed
- **Immutable Processing**: Processors MUST NOT mutate eigenschaft items, only modify computed object
- **Graceful Degradation**: Missing eigenschaften log warnings but don't break calculations

### 1.3 Design Constraints

- **Foundry Data Model**: Arrays stored as objects `{0: {...}, 1: {...}}`, requiring `Object.values()` conversion
- **Async Preparation**: `WaffeItem.prepareWeapon()` MAY be async for cache loading
- **UI Reactivity**: Changes to eigenschaft items MUST trigger cache invalidation and re-render

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Weapon Item                            │
│  eigenschaften: [{key: "Schwer", parameters: [4]}, ...]     │
└────────────┬────────────────────────────────────────────────┘
             │
             │ prepareWeapon()
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Eigenschaft Cache                          │
│  Singleton: Preloads on 'ready', loads on-demand            │
│  globalCache Map: "Schwer" → EigenschaftItem                │
└────────────┬────────────────────────────────────────────────┘
             │
             │ get(key)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Processor Factory                          │
│  Routes by kategorie: modifier, wielding, target_effect...  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ process(kategorie, key, eigenschaft, parameters, computed, actor, weapon)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Category Processors                         │
│  ModifierProcessor: AT/VT/Schaden/RW adjustments            │
│  WieldingProcessor: Hand requirements, KK checks            │
│  TargetEffectProcessor: Combat effects on hit               │
│  ActorModifierProcessor: Passive actor stat mods            │
│  PassiveProcessor: Display-only properties                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Execution Flow

```mermaid
sequenceDiagram
    participant Hook as Foundry Hooks
    participant Cache as EigenschaftCache
    participant Actor
    participant Weapon as WaffeItem
    participant Factory as ProcessorFactory
    participant Processor

    Hook->>Cache: ready hook → preloadAllEigenschaften()
    Cache->>Cache: Load from world + compendiums
    Note over Cache: Global singleton populated

    Actor->>Actor: prepareData()
    Actor->>Weapon: prepareWeapon()
    Weapon->>Cache: isLoaded(eigenschaftKeys)?
    alt Not loaded
        Weapon->>Cache: await load(eigenschaftKeys)
    end
    Weapon->>Weapon: _calculateWeaponStats()
    loop For each eigenschaft
        Weapon->>Cache: get(key)
        Cache-->>Weapon: eigenschaftItem
        Weapon->>Factory: process(kategorie, key, eigenschaft, params, computed, actor, weapon)
        Factory->>Processor: process(...)
        Processor->>Processor: Modify computed object
    end
    Weapon-->>Actor: computed stats ready
```

### 2.3 Key Design Decisions

#### 2.3.1 Why Global Cache?

- **Performance**: Avoids repeated database queries for commonly used eigenschaften
- **Preload**: Ready before actor sheets render
- **Singleton Pattern**: Shared across all weapon instances

#### 2.3.2 Why Processor Pattern?

- **Separation of Concerns**: Each kategorie has isolated logic
- **Extensibility**: New processors without modifying existing code
- **Testability**: Processors can be unit tested in isolation

#### 2.3.3 Why Parameters Instead of Variants?

**Problem**: Legacy system had "Schwer (4)", "Schwer (8)", "Schwer (+4)", "Schwer (+8)" as separate items

**Solution**: One "Schwer" eigenschaft with parameterSlots:

```javascript
{
  key: "Schwer",
  parameters: [4]  // or [8]
}
```

**Benefits**:

- Reduces item proliferation
- Flexible: Can support any KK threshold without new items
- Migrateable: Parser converts legacy strings to new format

---

## 3. Data Models

### 3.1 Waffeneigenschaft Item Schema

**Source**: `template.json` waffeneigenschaft type

```typescript
interface WaffeneigenschaftItem {
    name: string // Display name (e.g., "Schwer")
    type: 'waffeneigenschaft'
    system: {
        kategorie: 'modifier' | 'wielding' | 'target_effect' | 'actor_modifier' | 'passive'
        beschreibung: string // MAY: Optional description
        parameterSlots: ParameterSlot[] // NEW: Parameter definitions

        // Kategorie-specific fields (one of):
        modifiers?: ModifiersSchema
        wieldingRequirements?: WieldingSchema
        targetEffect?: TargetEffectSchema
        actorModifiers?: ActorModifiersSchema
    }
}

interface ParameterSlot {
    name: string // Internal name (e.g., "kkThreshold")
    type: 'number' | 'string' // Data type
    label: string // UI label (e.g., "KK-Schwellenwert")
    usage: string // JSON path where parameter is used
    required: boolean // Is parameter mandatory?
    defaultValue: number | string | null // Default if not provided
}
```

### 3.2 Weapon Eigenschaften Storage

Weapons store eigenschaften as array of objects:

```typescript
interface Waffe {
    system: {
        eigenschaften: EigenschaftReference[]
    }
}

interface EigenschaftReference {
    key: string // Eigenschaft name (e.g., "Schwer")
    parameters: Array<number | string> // Runtime parameter values
}
```

**Example**:

```json
{
    "eigenschaften": [
        { "key": "Schwer", "parameters": [4] },
        { "key": "Zweihändig", "parameters": [] },
        { "key": "Umklammern", "parameters": [-2, 12] }
    ]
}
```

### 3.3 Kategorie-Specific Schemas

#### 3.3.1 Modifier Kategorie

```typescript
interface ModifiersSchema {
    at?: number | string // Attack modifier
    vt?: number | string // Defense modifier
    fk?: number | string // Ranged combat modifier
    schaden?: number | string // Damage modifier
    schadenFormula?: string // Formula for damage (e.g., "@weapon.pw + 2")
    rw?: number | string // Range modifier
    conditionalModifiers?: ConditionalModifier[]
    combatMechanics?: {
        // Special combat rules
        zweihandbonus?: boolean
        [key: string]: any
    }
}

interface ConditionalModifier {
    condition: {
        type: 'attribute_check' | 'skill_check' | 'custom'
        attribute?: string // e.g., "GE"
        operator: '>=' | '<=' | '>' | '<' | '==' | '!='
        value: number | string
    }
    modifiers: {
        at?: number
        vt?: number
        schaden?: number
    }
}
```

#### 3.3.2 Wielding Kategorie

```typescript
interface WieldingSchema {
    hands: 1 | 2 // Required hands
    ignoreNebenMalus?: boolean // Ignore off-hand penalty
    noRider?: boolean // Cannot use while mounted
    requiresRider?: boolean // Requires mount
    penalties?: {
        // Penalties if requirements not met
        at?: number
        vt?: number
        schaden?: number
    }
    condition?: {
        // Requirements (e.g., KK threshold)
        type: 'attribute_check'
        attribute: string // e.g., "KK"
        operator: '>=' | '<=' | '>' | '<'
        value: number // Can be overridden by parameter
        onFailure?: {
            at?: number
            vt?: number
            schaden?: number
        }
    }
}
```

#### 3.3.3 Target Effect Kategorie

```typescript
interface TargetEffectSchema {
    name: string // Effect identifier
    trigger: 'onHit' | 'onCrit' | 'onDamage'
    resistCheck?: {
        attribute: string
        difficulty: number
    }
    effect: {
        type: 'condition' | 'damage' | 'custom'
        duration?: number | string
        value?: any
    }
}
```

#### 3.3.4 Actor Modifier Kategorie

```typescript
interface ActorModifiersSchema {
    modifiers: ActorModifier[]
}

interface ActorModifier {
    property: string // e.g., "system.abgeleitete.ini"
    mode: 'add' | 'multiply' | 'override'
    value: number | string // Can be formula
}
```

### 3.4 Computed Weapon Object

Transient object holding calculated stats (MUST NOT be persisted):

```typescript
interface ComputedWeapon {
    at: number // Attack value
    vt: number // Defense value
    fk: number // Ranged combat value
    schadenBonus: number // Damage bonus
    rw: number // Range
    handsRequired: 1 | 2 // Hands needed
    ignoreNebenMalus: boolean // Ignore off-hand penalty
    noRider: boolean // Cannot use mounted
    modifiers: {
        // Applied modifiers
        at: number
        vt: number
        schaden: number
    }
    targetEffects: TargetEffect[] // Effects applied on hit
    combatMechanics: object // Special mechanics
    conditionalModifiers: ConditionalModifier[]
    hasActorModifiers: boolean // Has passive actor effects
    actorModifiers: ActorModifier[]
}
```

---

## 4. Parsing System

### 4.1 Purpose

Convert legacy string formats to structured objects:

- `"Schwer (4)"` → `{key: "Schwer", parameters: [4]}`
- `"Umklammern (-2; 12)"` → `{key: "Umklammern", parameters: [-2, 12]}`
- `"Zweihändig"` → `{key: "Zweihändig", parameters: []}`

### 4.2 Required Functions

Implementations MUST provide these functions:

#### `parseEigenschaftString(str: string): EigenschaftReference | null`

**Input**: String like "Schwer (4)" or "Fernkampfoption(Dolch (Kurze Wurfwaffen))"  
**Output**: `{key, parameters}` object or null if invalid

**Requirements**:

- MUST extract property name (trim whitespace)
- MUST support nested parentheses for complex parameters
- MUST split parameters by semicolon or comma
- MUST convert numeric strings to number type
- MUST preserve non-numeric strings as string type
- SHOULD log warning for invalid formats, return null

**Examples**:

```javascript
parseEigenschaftString('Schwer (4)')
// → {key: "Schwer", parameters: [4]}

parseEigenschaftString('Umklammern(-2;12)')
// → {key: "Umklammern", parameters: [-2, 12]}

parseEigenschaftString('Fernkampfoption(Dolch (Kurze Wurfwaffen))')
// → {key: "Fernkampfoption", parameters: ["Dolch (Kurze Wurfwaffen)"]}

parseEigenschaftString('Zweihändig')
// → {key: "Zweihändig", parameters: []}
```

#### `parseEigenschaftenArray(arr: string[]): EigenschaftReference[]`

**Input**: Array of eigenschaft strings  
**Output**: Array of parsed objects

**Requirements**:

- MUST call `parseEigenschaftString` for each element
- MUST filter out null results
- SHOULD preserve order

#### `normalizeEigenschaften(input: unknown): EigenschaftReference[]`

**Input**: Any format (string array, object array, legacy object)  
**Output**: Normalized object array

**Requirements**:

- MUST handle string arrays: `["Schwer (4)", "Zweihändig"]`
- MUST handle object arrays: `[{key: "Schwer", parameters: [4]}]` (pass-through)
- MAY handle legacy object format: `{schwer_4: true}` (via migration map)
- MUST return empty array for invalid input

#### `formatEigenschaftDisplay(eig: EigenschaftReference): string`

**Input**: Eigenschaft object  
**Output**: Human-readable string

**Format**: `"Key"` or `"Key(param1, param2)"`

**Requirements**:

- MUST use compact notation (comma-separated parameters)
- MUST omit parentheses if no parameters

**Example**:

```javascript
formatEigenschaftDisplay({ key: 'Schwer', parameters: [4] })
// → "Schwer(4)"

formatEigenschaftDisplay({ key: 'Umklammern', parameters: [-2, 12] })
// → "Umklammern(-2, 12)"
```

#### `extractEigenschaftKey(input: unknown): string | null`

**Input**: String, object, or eigenschaft reference  
**Output**: Base key without parameters

**Requirements**:

- MUST extract key from objects: `{key: "Schwer", ...}` → `"Schwer"`
- MUST parse strings: `"Schwer (4)"` → `"Schwer"`
- MUST return null for invalid input

### 4.3 Regex Pattern Recommendation

A suitable regex for parsing:

```javascript
const EIGENSCHAFT_PATTERN = /^([^(]+)(?:\(([^)]+(?:\([^)]+\))?)\))?$/
```

**Explanation**:

- `^([^(]+)`: Capture property name (everything before first `(`)
- `(?:\(([^)]+(?:\([^)]+\))?)\))?`: Optional parameters group
    - Supports one level of nested parentheses
    - Captures parameter string for further splitting

### 4.4 Implementation Notes

- **Type Conversion**: Use `parseFloat()` and check `!isNaN()` for number detection
- **Whitespace**: Always trim before and after extraction
- **Delimiters**: Support both semicolon `;` and comma `,` as parameter separators
- **Error Handling**: Log to console but don't throw exceptions

---

## 5. Cache System

### 5.1 Architecture

The cache MUST be implemented as a singleton with two-level storage:

1. **Global Cache Map**: Shared across all weapon instances
2. **Instance Loader State**: Tracks loading progress per cache instance

### 5.2 Required Methods

Implementations MUST provide:

#### `load(eigenschaftNames: string[]): Promise<void>`

**Purpose**: Load eigenschaft items into cache

**Requirements**:

- MUST extract base keys (e.g., "Schwer" from "Schwer (4)")
- MUST deduplicate keys before loading
- MUST search world items first
- MUST search configured compendiums if not in world
- MUST handle concurrent load calls (prevent duplicate loading)
- SHOULD complete within 5 seconds for reasonable item counts

#### `get(key: string): Item | undefined`

**Purpose**: Retrieve cached eigenschaft item (synchronous)

**Requirements**:

- MUST use base key (without parameters)
- MUST return undefined if not cached
- MUST NOT trigger async loading

#### `has(key: string): boolean`

**Purpose**: Check if key is cached

#### `isLoaded(eigenschaftNames: string[]): boolean`

**Purpose**: Check if all keys are already cached

**Requirements**:

- MUST extract base keys before checking
- MUST return true only if ALL keys are cached

#### `isLoading(): boolean`

**Purpose**: Check if async load is in progress

#### `clear(): void`

**Purpose**: Clear cache instance state (not global cache)

#### `size(): number`

**Purpose**: Return number of cached items

### 5.3 Preload System

Implementations MUST provide global preloading:

#### `preloadAllEigenschaften(): Promise<void>`

**Purpose**: Load all available eigenschaften on system init

**Requirements**:

- MUST run on Foundry 'ready' hook
- MUST load from world items (type='waffeneigenschaft')
- MUST load from configured compendiums
- MUST deduplicate by key
- SHOULD log progress/completion
- MUST complete before actor sheets render

**Hook Registration**:

```javascript
Hooks.on('ready', async () => {
    await preloadAllEigenschaften()
})
```

### 5.4 Cache Invalidation

Implementations MUST invalidate cache on:

- `Hooks.on('updateItem')` if item type is 'waffeneigenschaft'
- `Hooks.on('createItem')` if item type is 'waffeneigenschaft'
- `Hooks.on('deleteItem')` if item type is 'waffeneigenschaft'
- Settings change hook for eigenschaft compendium configuration

**Invalidation Strategy**: Clear global cache, trigger re-render of affected sheets

### 5.5 Compendium Configuration

System SHOULD provide settings for:

- Which compendiums to include in preload/search
- Default: System compendium `Ilaris.waffen-eigenschaften` (or similar)
- GM can add/remove compendium sources

### 5.6 Key Extraction

Cache MUST extract base keys using one of:

- Parser `extractEigenschaftKey()` function
- Regex pattern to remove parameters: `/^([^(]+)/`

**Example**:

```javascript
extractKey('Schwer (4)') // → "Schwer"
extractKey({ key: 'Schwer', parameters: [4] }) // → "Schwer"
```

### 5.7 Singleton Pattern

```typescript
// Pseudocode
const globalCache = new Map<string, Item>()
const loaderState = new WeakMap<Cache, boolean>()

class EigenschaftCache {
    async load(names) {
        if (loaderState.get(this)) return // Already loading
        loaderState.set(this, true)

        const keys = names.map(extractKey).filter(unique)
        const missing = keys.filter((k) => !globalCache.has(k))

        // Load missing keys...
        for (const key of missing) {
            const item = await findItem(key)
            if (item) globalCache.set(key, item)
        }

        loaderState.set(this, false)
    }

    get(key) {
        return globalCache.get(extractKey(key))
    }
}
```

---

## 6. Processor System

### 6.1 Architecture

Processors implement kategorie-specific logic to apply eigenschaft effects to weapon computed objects. The system uses:

1. **ProcessorFactory**: Routes to appropriate processor by kategorie
2. **BaseProcessor**: Abstract class defining processor contract
3. **Category Processors**: Implement specific logic (ModifierProcessor, WieldingProcessor, etc.)

### 6.2 ProcessorFactory

**Purpose**: Route eigenschaft processing to appropriate kategorie handler

**Required Methods**:

#### `process(kategorie, key, eigenschaft, parameters, computed, actor, weapon): void`

**Parameters**:

- `kategorie`: Processor category string
- `key`: Eigenschaft base name
- `eigenschaft`: Eigenschaft item object
- `parameters`: Array of parameter values
- `computed`: Weapon computed object (mutated)
- `actor`: Optional actor context
- `weapon`: Weapon item instance

**Requirements**:

- MUST maintain Map registry of `kategorie → ProcessorClass`
- MUST validate kategorie exists in registry
- MUST instantiate processor and call `process()` method
- SHOULD log warning if kategorie not found
- MUST NOT throw exceptions (graceful degradation)

**Registry Example**:

```javascript
const processors = new Map([
    ['modifier', ModifierProcessor],
    ['wielding', WieldingProcessor],
    ['target_effect', TargetEffectProcessor],
    ['actor_modifier', ActorModifierProcessor],
    ['passive', PassiveProcessor],
])
```

### 6.3 BaseProcessor Contract

All processors MUST extend BaseProcessor and implement:

#### `process(key, eigenschaft, parameters, computed, actor, weapon): void`

**Requirements**:

- MUST NOT mutate `eigenschaft` parameter
- MUST only modify `computed` parameter
- MAY read from `actor` and `weapon` contexts
- MUST handle invalid/missing data gracefully
- SHOULD log warnings for configuration errors

#### `validate(eigenschaft): boolean` (OPTIONAL)

**Purpose**: Validate eigenschaft schema before processing

**Requirements**:

- SHOULD return true if valid, false otherwise
- MAY be used for editor validation

### 6.4 ModifierProcessor

**Kategorie**: `modifier`

**Purpose**: Apply numeric modifiers and formulas to weapon stats

**Processing Logic**:

1. **Numeric Modifiers**: Add to computed properties

    ```javascript
    if (eigenschaft.system.modifiers.at) {
        computed.at += eigenschaft.system.modifiers.at
    }
    ```

2. **Formula Modifiers**: Evaluate with context

    ```javascript
    if (eigenschaft.system.modifiers.schadenFormula) {
        const context = buildContext(actor, weapon, parameters)
        computed.schadenBonus += evaluateFormula(schadenFormula, context)
    }
    ```

3. **Conditional Modifiers**: Check conditions before applying

    ```javascript
    for (const cond of eigenschaft.system.conditionalModifiers || []) {
        if (checkCondition(cond.condition, context)) {
            computed.at += cond.modifiers.at
        }
    }
    ```

4. **Combat Mechanics**: Merge special rules
    ```javascript
    Object.assign(computed.combatMechanics, eigenschaft.system.combatMechanics)
    ```

**Parameter Handling**:

Processors MUST build parameter context from parameterSlots:

```javascript
function buildParameterContext(eigenschaft, parameters) {
    const slots = Object.values(eigenschaft.system.parameterSlots || [])
    const context = {}

    slots.forEach((slot, index) => {
        const value = parameters[index] ?? slot.defaultValue
        context[slot.name] = value // Named access
        context[`$${index + 1}`] = value // Positional access
    })

    return context
}
```

**Formula Context**:

- `@actor.system.eigenschaften.GE`: Actor attribute
- `@weapon.system.at`: Weapon base stat
- `$1`, `$2`, ...: Parameter positional access
- Slot names: Parameter named access

### 6.5 WieldingProcessor

**Kategorie**: `wielding`

**Purpose**: Apply hand requirements and attribute checks

**Processing Logic**:

1. **Hand Requirements**:

    ```javascript
    computed.handsRequired = Math.max(
        computed.handsRequired,
        eigenschaft.system.wieldingRequirements.hands,
    )
    ```

2. **Special Flags**:

    ```javascript
    if (eigenschaft.system.wieldingRequirements.ignoreNebenMalus) {
        computed.ignoreNebenMalus = true
    }
    ```

3. **Attribute Checks with Parameter Override**:
    ```javascript
    const condition = buildEffectiveCondition(eigenschaft, parameters)
    if (!checkCondition(condition, actor)) {
        computed.modifiers.at += condition.onFailure.at
        computed.modifiers.vt += condition.onFailure.vt
    }
    ```

**Parameter Override Logic**:

```javascript
function buildEffectiveCondition(eigenschaft, parameters) {
    const slots = Object.values(eigenschaft.system.parameterSlots || [])
    const relevantSlot = slots.find((s) => s.usage === 'wieldingRequirements.condition.value')

    if (relevantSlot && parameters[slots.indexOf(relevantSlot)] !== undefined) {
        return {
            ...eigenschaft.system.wieldingRequirements.condition,
            value: parameters[slots.indexOf(relevantSlot)],
        }
    }

    return eigenschaft.system.wieldingRequirements.condition
}
```

**Example**: "Schwer (4)" sets KK threshold to 4, "Schwer (8)" sets it to 8

### 6.6 TargetEffectProcessor

**Kategorie**: `target_effect`

**Purpose**: Register effects to apply on hit

**Processing Logic**:

```javascript
if (eigenschaft.system.targetEffect) {
    computed.targetEffects.push({
        name: eigenschaft.system.targetEffect.name,
        trigger: eigenschaft.system.targetEffect.trigger,
        effect: eigenschaft.system.targetEffect.effect,
    })
}
```

**Integration**: Combat system checks `computed.targetEffects` after successful hit

### 6.7 ActorModifierProcessor

**Kategorie**: `actor_modifier`

**Purpose**: Flag passive actor modifiers for collection phase

**Processing Logic**:

```javascript
if (eigenschaft.system.actorModifiers) {
    computed.hasActorModifiers = true
    computed.actorModifiers.push(...eigenschaft.system.actorModifiers.modifiers)
}
```

**Actor Integration**: Actor preparation phase collects from equipped weapons:

```javascript
for (const weapon of equippedWeapons) {
    if (weapon.computed.hasActorModifiers) {
        applyModifiers(actor.system.abgeleitete, weapon.computed.actorModifiers)
    }
}
```

### 6.8 PassiveProcessor

**Kategorie**: `passive`

**Purpose**: Display-only properties (no mechanical effect)

**Processing Logic**: No-op (processor does nothing, eigenschaft only for display)

### 6.9 Critical Implementation Note: Object.values()

**Foundry Data Model Issue**: Foundry stores arrays as objects `{0: {...}, 1: {...}}`

**Solution**: MUST use `Object.values()` before array operations:

```javascript
// ❌ WRONG - will fail with .findIndex(), .forEach()
const slots = eigenschaft.system.parameterSlots
slots.findIndex((s) => s.name === 'kkThreshold') // ERROR

// ✅ CORRECT - convert to array first
const slots = Object.values(eigenschaft.system.parameterSlots || [])
slots.findIndex((s) => s.name === 'kkThreshold') // Works
```

**Affected Areas**:

- Reading parameterSlots from eigenschaft items
- Iterating over actorModifiers
- Any array property from Foundry documents

---

## 7. Weapon Integration

### 7.1 WaffeItem Preparation Flow

Weapons MUST integrate eigenschaften processing into their preparation phase:

```javascript
class WaffeItem extends Item {
    async prepareWeapon(actor) {
        // 1. Ensure cache has eigenschaft items
        const keys = this.system.eigenschaften.map((e) => e.key)
        if (!cache.isLoaded(keys)) {
            await cache.load(keys)
        }

        // 2. Calculate weapon stats
        const computed = this._calculateWeaponStats(actor)

        // 3. Store computed (non-persistent)
        this.computed = computed

        return computed
    }
}
```

### 7.2 Stat Calculation Sequence

```javascript
_calculateWeaponStats(actor) {
  // 1. Initialize computed object
  const computed = {
    at: this.system.at,
    vt: this.system.vt,
    fk: this.system.fk,
    schadenBonus: 0,
    rw: this.system.rw,
    handsRequired: 1,
    ignoreNebenMalus: false,
    noRider: false,
    modifiers: { at: 0, vt: 0, schaden: 0 },
    targetEffects: [],
    combatMechanics: {},
    conditionalModifiers: [],
    hasActorModifiers: false,
    actorModifiers: []
  }

  // 2. Apply base modifiers (weapon stats, PW bonus, etc.)
  this._applyBaseModifiers(computed, actor)

  // 3. Process eigenschaften
  const eigenschaften = Array.isArray(this.system.eigenschaften)
    ? this.system.eigenschaften
    : []

  for (const eig of eigenschaften) {
    this._processEigenschaft(eig.key, eig.parameters || [], computed, actor)
  }

  // 4. Apply conditional modifiers (wounds, BE, etc.)
  this._applyActorModifiers(computed, actor)

  // 5. Apply off-hand penalty if applicable
  if (this.isOffHand && !computed.ignoreNebenMalus) {
    computed.modifiers.at -= 4
    computed.modifiers.vt -= 4
  }

  return computed
}
```

### 7.3 Eigenschaft Processing

```javascript
_processEigenschaft(key, parameters, computed, actor) {
  // 1. Get eigenschaft item from cache
  const eigenschaft = cache.get(key)
  if (!eigenschaft) {
    console.warn(`Eigenschaft "${key}" not found in cache`)
    return
  }

  // 2. Route to processor
  try {
    processorFactory.process(
      eigenschaft.system.kategorie,
      key,
      eigenschaft,
      parameters,
      computed,
      actor,
      this
    )
  } catch (error) {
    console.error(`Error processing eigenschaft "${key}":`, error)
  }
}
```

### 7.4 Legacy Format Support

Implementations MAY support legacy formats during transition:

```javascript
const eigenschaften = normalizeEigenschaften(this.system.eigenschaften)
for (const eig of eigenschaften) {
    this._processEigenschaft(eig.key, eig.parameters || [], computed, actor)
}
```

### 7.5 Actor Integration

Actors MUST call `prepareWeapon()` for all weapons:

```javascript
class IlarisActor extends Actor {
    prepareData() {
        super.prepareData()
        this._calculateKampf()
    }

    async _calculateKampf() {
        const weapons = this.items.filter(
            (i) => i.type === 'nahkampfwaffe' || i.type === 'fernkampfwaffe',
        )

        for (const weapon of weapons) {
            await weapon.prepareWeapon(this)
        }

        // Collect actor modifiers from equipped weapons
        this._applyWeaponActorModifiers(weapons)
    }

    _applyWeaponActorModifiers(weapons) {
        const equipped = weapons.filter((w) => w.system.ausgeruestet)

        for (const weapon of equipped) {
            if (weapon.computed?.hasActorModifiers) {
                for (const mod of weapon.computed.actorModifiers) {
                    this._applyModifier(mod)
                }
            }
        }
    }

    _applyModifier(mod) {
        const target = foundry.utils.getProperty(this, mod.property)
        if (target === undefined) return

        switch (mod.mode) {
            case 'add':
                foundry.utils.setProperty(this, mod.property, target + mod.value)
                break
            case 'multiply':
                foundry.utils.setProperty(this, mod.property, target * mod.value)
                break
            case 'override':
                foundry.utils.setProperty(this, mod.property, mod.value)
                break
        }
    }
}
```

---

## 8. UI Components

### 8.1 Design Principles

**Lessons Learned from Implementation**:

1. **Avoid Inline Editing of Empty Objects**: Foundry removes empty eigenschaft objects on update before key is selected
2. **Dialog-Based Addition**: Modal dialogs provide better UX for complex parameter input
3. **Readonly Display**: Show properties as readonly text, only allow add/remove operations
4. **Compact Notation**: Use rulebook-style display like "Schwer(4)" instead of verbose labels
5. **Horizontal Layout**: Flex-wrap layout for space efficiency with many properties

### 8.2 Weapon Sheet - Eigenschaften Section

**Approach**: Dialog-based addition with readonly display

**Template Structure**:

```handlebars
<div class='eigenschaften-list' style='display: flex; flex-wrap: wrap; gap: 5px;'>
    {{#each enrichedEigenschaften as |eig|}}
        <div
            class='eigenschaft-row'
            style='display: inline-flex; align-items: center; padding: 3px 8px; background: #f5f5f5; border-radius: 4px;'
        >
            <span>
                <strong>{{eig.key}}</strong>
                {{#if eig.parameters.length}}
                    ({{#each eig.parameters as |param|}}{{#unless @first}},
                        {{/unless}}{{param}}{{/each}})
                {{/if}}
            </span>
            <button
                type='button'
                class='remove-eigenschaft'
                data-index='{{@index}}'
                style='margin-left: 6px; padding: 2px 4px; font-size: 0.8em;'
            >
                <i class='fas fa-times'></i>
            </button>
        </div>
    {{/each}}

    <button type='button' class='add-eigenschaft' style='padding: 3px 8px;'>
        <i class='fas fa-plus'></i>
        Eigenschaft hinzufügen
    </button>
</div>
```

**Display Format**:

- No parameters: "Zweihändig"
- Single parameter: "Schwer(4)"
- Multiple parameters: "Umklammern(-2, 12)"

**Sheet Class - getData()**:

```javascript
async getData() {
  const data = await super.getData()

  // Normalize and enrich eigenschaften
  data.enrichedEigenschaften = normalizeEigenschaften(
    this.item.system.eigenschaften || []
  )

  return data
}
```

**Sheet Class - Add Eigenschaft Dialog**:

```javascript
async _onAddEigenschaft(event) {
  event.preventDefault()
  const self = this

  // Load available eigenschaften
  const allEigenschaften = game.items.filter(i => i.type === 'waffeneigenschaft')
  // Or from compendium...

  new Dialog({
    title: "Eigenschaft hinzufügen",
    content: `
      <form>
        <div class="form-group">
          <label>Eigenschaft</label>
          <select id="eigenschaft-select" style="width: 100%;">
            <option value="">-- Auswählen --</option>
            ${allEigenschaften.map(e =>
              `<option value="${e.name}">${e.name}</option>`
            ).join('')}
          </select>
        </div>
        <div id="parameter-container" style="max-height: 300px; overflow-y: auto;">
          <!-- Dynamically populated -->
        </div>
      </form>
    `,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Hinzufügen",
        callback: async (html) => {
          const selectedKey = html.find('#eigenschaft-select').val()
          const eigenschaftItem = await self._loadEigenschaftItem(selectedKey)

          // Collect parameter values
          const parameters = []
          const slots = Object.values(eigenschaftItem.system.parameterSlots || [])

          for (let i = 0; i < slots.length; i++) {
            const value = html.find(`#param-${i}`).val()
            parameters.push(slots[i].type === 'number' ? Number(value) : value)
          }

          // Add to weapon
          const eigenschaften = [...(self.item.system.eigenschaften || [])]
          eigenschaften.push({ key: selectedKey, parameters })
          await self.item.update({ 'system.eigenschaften': eigenschaften })
        }
      },
      cancel: { label: "Abbrechen" }
    },
    render: (html) => {
      // When eigenschaft selected, show parameter fields
      html.find('#eigenschaft-select').on('change', async function() {
        const selectedKey = $(this).val()
        if (!selectedKey) return

        const eigenschaftItem = await self._loadEigenschaftItem(selectedKey)
        const paramContainer = html.find('#parameter-container')
        paramContainer.empty()

        const slots = Object.values(eigenschaftItem.system.parameterSlots || [])

        slots.forEach((slot, index) => {
          paramContainer.append(`
            <div class="form-group">
              <label>${slot.label}</label>
              <input type="${slot.type === 'number' ? 'number' : 'text'}"
                     id="param-${index}"
                     value="${slot.defaultValue || ''}"
                     ${slot.required ? 'required' : ''} />
            </div>
          `)
        })
      })

      // Trigger initial load after delay
      setTimeout(() => html.find('#eigenschaft-select').trigger('change'), 100)
    },
    default: "ok"
  }, { height: 500 }).render(true)
}
```

**Sheet Class - Remove Eigenschaft**:

```javascript
async _onRemoveEigenschaft(event) {
  event.preventDefault()
  const index = parseInt(event.currentTarget.dataset.index)
  const eigenschaften = [...(this.item.system.eigenschaften || [])]
  eigenschaften.splice(index, 1)
  await this.item.update({ 'system.eigenschaften': eigenschaften })
}
```

**Critical Fix**: Import path from sheets/ to items/:

```javascript
// ✅ CORRECT
import { normalizeEigenschaften } from '../../items/utils/eigenschaft-parser.js'

// ❌ WRONG
import { normalizeEigenschaften } from '../items/utils/eigenschaft-parser.js'
```

### 8.3 Waffeneigenschaft Sheet - Parameter Slots

**Template Structure**:

```handlebars
<div class="parameter-slots">
  <h3>Parameter-Definitionen</h3>

  {{#each item.system.parameterSlots as |slot|}}
  <div class="parameter-slot" data-index="{{@index}}">
    <div class="form-group">
      <label>Parameter Name</label>
      <input type="text" name="system.parameterSlots.{{@index}}.name"
             value="{{slot.name}}" placeholder="z.B. kkThreshold"/>
    </div>

    <div class="form-group">
      <label>Typ</label>
      <select name="system.parameterSlots.{{@index}}.type">
        <option value="number" {{#if (eq slot.type 'number')}}selected{{/if}}>Number</option>
        <option value="string" {{#if (eq slot.type 'string')}}selected{{/if}}>String</option>
      </select>
    </div>

    <div class="form-group">
      <label>Anzeige-Label</label>
      <input type="text" name="system.parameterSlots.{{@index}}.label"
             value="{{slot.label}}" placeholder="z.B. KK-Schwellenwert"/>
    </div>

    <div class="form-group">
      <label>Usage Path</label>
      <select name="system.parameterSlots.{{@index}}.usage">
        <option value="">-- Auswählen --</option>
        <optgroup label="Wielding">
          <option value="wieldingRequirements.condition.value">KK Threshold</option>
          <option value="wieldingRequirements.hands">Hand Requirements</option>
        </optgroup>
        <optgroup label="Modifier">
          <option value="modifiers.at">AT Modifier</option>
          <option value="modifiers.vt">VT Modifier</option>
          <option value="modifiers.schaden">Schaden Modifier</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label>
        <input type="checkbox" name="system.parameterSlots.{{@index}}.required"
               {{#if slot.required}}checked{{/if}}/>
        Pflichtfeld
      </label>
    </div>

    <div class="form-group">
      <label>Standard-Wert</label>
      <input type="text" name="system.parameterSlots.{{@index}}.defaultValue"
             value="{{slot.defaultValue}}" />
    </div>

    <button type="button" class="remove-slot" data-index="{{@index}}">
      <i class="fas fa-trash"></i> Entfernen
    </button>
  </div>
  {{/each}}

  <button type="button" class="add-parameter-slot">
    <i class="fas fa-plus"></i> Parameter hinzufügen
  </button>
</div>
```

**Sheet Class Methods**:

```javascript
activateListeners(html) {
  super.activateListeners(html)
  html.find('.add-parameter-slot').click(this._onAddParameterSlot.bind(this))
  html.find('.remove-slot').click(this._onRemoveParameterSlot.bind(this))
}

async _onAddParameterSlot(event) {
  event.preventDefault()
  const slots = [...(this.item.system.parameterSlots || [])]
  slots.push({
    name: '',
    type: 'number',
    label: '',
    usage: '',
    required: false,
    defaultValue: null
  })
  await this.item.update({ 'system.parameterSlots': slots })
}

async _onRemoveParameterSlot(event) {
  event.preventDefault()
  const index = parseInt(event.currentTarget.dataset.index)
  const slots = [...(this.item.system.parameterSlots || [])]
  slots.splice(index, 1)
  await this.item.update({ 'system.parameterSlots': slots })
}
```

**Critical Fix**: Remove duplicate activateListeners methods if present

### 8.4 Usage Path Recommendations

Common usage paths for parameterSlots:

| Usage Path                             | Category | Purpose      | Example        |
| -------------------------------------- | -------- | ------------ | -------------- |
| `wieldingRequirements.condition.value` | wielding | KK threshold | Schwer(4)      |
| `wieldingRequirements.hands`           | wielding | Hand count   | Variabel(1)    |
| `modifiers.at`                         | modifier | AT bonus     | Bonus(2)       |
| `modifiers.vt`                         | modifier | VT bonus     | Malus(-2)      |
| `modifiers.schaden`                    | modifier | Damage mod   | Stark(4)       |
| `modifiers.rw`                         | modifier | Range mod    | Reichweite(10) |

### 8.5 Handlebars Helper Recommendations

Use built-in selectOptions helper:

```handlebars
<!-- ✅ Recommended -->
<select name="property">
  {{selectOptions options selected=value nameAttr="name" labelAttr="name"}}
</select>

<!-- ❌ Deprecated -->
<select name="property">
  {{#each options}}
  <option value="{{name}}" {{#if (eq name ../value)}}selected{{/if}}>{{name}}</option>
  {{/each}}
</select>
```

---

## 9. Migration Strategy

### 9.1 Legacy Formats

Three legacy formats MUST be supported during migration:

1. **Object Format (very old)**:

    ```json
    { "schwer_4": true, "zweihaendig": true }
    ```

2. **String Array (old)**:

    ```json
    ["Schwer (4)", "Zweihändig", "Umklammern (-2; 12)"]
    ```

3. **Object Array (new)**:
    ```json
    [
        { "key": "Schwer", "parameters": [4] },
        { "key": "Zweihändig", "parameters": [] },
        { "key": "Umklammern", "parameters": [-2, 12] }
    ]
    ```

### 9.2 Migration Mapping

Implementations MUST provide a migration map for known legacy keys:

```javascript
const EIGENSCHAFT_MIGRATION_MAP = {
    // Object keys
    schwer_4: { key: 'Schwer', parameters: [4] },
    schwer_8: { key: 'Schwer', parameters: [8] },
    zweihaendig: { key: 'Zweihändig', parameters: [] },

    // String variants
    'Schwer (4)': { key: 'Schwer', parameters: [4] },
    'Schwer (+4)': { key: 'Schwer', parameters: [4] },
    'Schwer (8)': { key: 'Schwer', parameters: [8] },
    'Schwer (+8)': { key: 'Schwer', parameters: [8] },

    'Niederwerfen (+4)': { key: 'Niederwerfen', parameters: [4] },
    'Niederwerfen (+8)': { key: 'Niederwerfen', parameters: [8] },

    'Umklammern (-2; 12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (±2/12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (-4; 16)': { key: 'Umklammern', parameters: [-4, 16] },

    // Simple properties
    Zweihändig: { key: 'Zweihändig', parameters: [] },
    Leicht: { key: 'Leicht', parameters: [] },
    // ... etc
}
```

### 9.3 Migration Function

```javascript
function migrateWeaponEigenschaften(weapon) {
    let eigenschaften = weapon.system.eigenschaften

    // Already migrated (object array)
    if (
        Array.isArray(eigenschaften) &&
        eigenschaften.length > 0 &&
        eigenschaften[0].key !== undefined
    ) {
        return eigenschaften
    }

    let migrated = []

    // Object format
    if (!Array.isArray(eigenschaften) && typeof eigenschaften === 'object') {
        for (const [key, value] of Object.entries(eigenschaften)) {
            if (value === true && EIGENSCHAFT_MIGRATION_MAP[key]) {
                migrated.push(EIGENSCHAFT_MIGRATION_MAP[key])
            }
        }
    }

    // String array
    else if (Array.isArray(eigenschaften)) {
        for (const str of eigenschaften) {
            // Try migration map first
            if (EIGENSCHAFT_MIGRATION_MAP[str]) {
                migrated.push(EIGENSCHAFT_MIGRATION_MAP[str])
            }
            // Fallback to parser
            else {
                const parsed = parseEigenschaftString(str)
                if (parsed) migrated.push(parsed)
            }
        }
    }

    return migrated
}
```

### 9.4 Migration Execution

Migrations SHOULD run on:

- System version upgrade hook
- Actor first load (cached check)
- Manual migration utility

```javascript
Hooks.on('ready', async () => {
    const currentVersion = game.system.version
    const lastMigration = game.settings.get('system', 'lastMigrationVersion')

    if (needsMigration(currentVersion, lastMigration)) {
        await migrateAllWeapons()
        await game.settings.set('system', 'lastMigrationVersion', currentVersion)
    }
})
```

### 9.5 Compendium Migration

Compendiums MUST be migrated separately:

```javascript
async function migrateCompendiumWeapons(packName) {
    const pack = game.packs.get(packName)
    const documents = await pack.getDocuments()

    for (const doc of documents) {
        if (doc.type === 'nahkampfwaffe' || doc.type === 'fernkampfwaffe') {
            const migrated = migrateWeaponEigenschaften(doc)
            await doc.update({ 'system.eigenschaften': migrated })
        }
    }
}
```

### 9.6 Eigenschaft Consolidation

After migration, consolidate redundant eigenschaft items:

**Mapping**:

```javascript
const CONSOLIDATION_MAP = {
    'Schwer (4)': { base: 'Schwer', deleteAfter: true },
    'Schwer (8)': { base: 'Schwer', deleteAfter: true },
    'Schwer (+4)': { base: 'Schwer', deleteAfter: true },
    'Schwer (+8)': { base: 'Schwer', deleteAfter: true },
    // ... etc
}
```

**Process**:

1. Create or update base eigenschaft ("Schwer") with parameterSlots
2. Verify all weapons reference base key
3. Delete redundant eigenschaft items

### 9.7 Migration Verification

After migration, verify:

- [ ] All weapons have object array eigenschaften
- [ ] All eigenschaft keys exist in world or compendiums
- [ ] Parameters match expected types (number vs string)
- [ ] Weapon stat calculations unchanged
- [ ] No console errors during actor preparation

---

## 10. Implementation Guidelines

### 10.1 Critical Implementation Notes

#### 10.1.1 Foundry Data Model Quirk

**Problem**: Foundry stores arrays as objects `{0: {...}, 1: {...}}`

**Solution**: ALWAYS use `Object.values()` before array operations:

```javascript
// ❌ WRONG - will fail
const slots = eigenschaft.system.parameterSlots
slots.findIndex((s) => s.name === 'kkThreshold') // ERROR

// ✅ CORRECT
const slots = Object.values(eigenschaft.system.parameterSlots || [])
slots.findIndex((s) => s.name === 'kkThreshold') // Works
```

**Affected Areas**:

- Reading parameterSlots from eigenschaft items
- Iterating actorModifiers
- Any array property from Foundry documents

#### 10.1.2 Import Path Correction

When importing from sheets/ to items/:

```javascript
// ✅ CORRECT (two levels up)
import { normalizeEigenschaften } from '../../items/utils/eigenschaft-parser.js'

// ❌ WRONG (one level up)
import { normalizeEigenschaften } from '../items/utils/eigenschaft-parser.js'
```

#### 10.1.3 Dialog setTimeout Trigger

When dynamically populating dialog fields:

```javascript
render: (html) => {
    html.find('#select').on('change', loadFields)

    // ✅ Trigger after render complete
    setTimeout(() => html.find('#select').trigger('change'), 100)
}
```

#### 10.1.4 Avoid Inline Editing Empty Objects

**Problem**: Foundry removes `{key: '', parameters: []}` on update

**Solution**: Use dialog-based addition where object is complete before adding

### 10.2 Performance Considerations

1. **Cache Preload**: Run on 'ready' hook, complete before sheets render
2. **Deduplicate Loads**: Multiple weapons may request same eigenschaft
3. **Batch Updates**: Migrate multiple weapons in one transaction
4. **Lazy Formula Evaluation**: Only evaluate formulas when actor context available

### 10.3 Testing Strategy

#### Unit Tests

- Parser: All format combinations
- Processors: Each kategorie with various inputs
- Cache: Load, get, invalidation
- Migration: All legacy formats

#### Integration Tests

- Weapon preparation with eigenschaften
- Actor stat calculation with weapon eigenschaften
- UI: Add/remove eigenschaften, parameter input

#### Manual Tests

- Create weapon with parametrized eigenschaft
- Verify KK threshold calculation (Schwer 4 vs 8)
- XML import with properties
- Migration from old save file

### 10.4 Error Handling

Implementations SHOULD:

- Log warnings for missing eigenschaften
- Log warnings for invalid parameters
- Continue processing on eigenschaft errors
- Never throw exceptions in processors

Example:

```javascript
try {
  processorFactory.process(...)
} catch (error) {
  console.error(`Error processing eigenschaft "${key}":`, error)
  // Continue with next eigenschaft
}
```

### 10.5 Extensibility Patterns

#### Adding New Processor Kategorie

1. Create processor class extending `BaseProcessor`
2. Register in `ProcessorFactory.processors` Map
3. Add kategorie schema to `template.json`
4. Update `WaffeneigenschaftSheet` template with form section
5. Add unit tests
6. Document in this specification

#### Adding New Parameter Usage

1. Define usage path in `parameterSlots.usage`
2. Implement override logic in relevant processor
3. Add to usage path dropdown in UI
4. Document in Usage Path Recommendations table

---

## 11. Conformance Requirements

### 11.1 MUST Requirements

Implementations MUST:

- [ ] Support all three data formats (parsing + migration)
- [ ] Implement global cache singleton
- [ ] Preload cache on 'ready' hook
- [ ] Provide all five processor kategorien
- [ ] Use `Object.values()` before array operations on Foundry properties
- [ ] Validate kategorie before processing
- [ ] Handle missing eigenschaften gracefully
- [ ] NOT mutate eigenschaft items in processors
- [ ] Initialize computed object with all required fields
- [ ] Support parameter override in WieldingProcessor
- [ ] Provide migration mapping for known legacy keys
- [ ] NOT persist computed objects to database

### 11.2 SHOULD Requirements

Implementations SHOULD:

- [ ] Complete cache preload within 5 seconds
- [ ] Log warnings for missing/invalid data
- [ ] Provide UI for parameter input via dialog
- [ ] Use compact display notation for eigenschaften
- [ ] Implement cache invalidation hooks
- [ ] Provide settings for compendium configuration
- [ ] Include unit tests for parser and processors
- [ ] Document new processor kategorien
- [ ] Batch weapon migrations
- [ ] Verify migration results

### 11.3 MAY Requirements

Implementations MAY:

- [ ] Support formula evaluation in modifiers
- [ ] Provide validation in eigenschaft editor
- [ ] Implement conditional modifiers
- [ ] Add actor modifier collection
- [ ] Support target effects on hit
- [ ] Provide migration utility UI
- [ ] Include eigenschaft templates/presets

### 11.4 Test Checklist

- [ ] Parser handles all format variations
- [ ] Cache preload completes successfully
- [ ] Cache invalidates on item update/create/delete
- [ ] Processors apply effects to computed object
- [ ] Parameters override processor defaults
- [ ] Migration preserves semantic meaning
- [ ] UI dialog loads parameters dynamically
- [ ] Weapon stats calculate correctly
- [ ] Actor modifiers apply to equipped weapons only
- [ ] No console errors during normal operation
- [ ] Object.values() used consistently
- [ ] Import paths correct for module structure

---

## 12. Examples

### 12.1 Complete Example: "Schwer" with KK Threshold

**Eigenschaft Item**:

```json
{
    "name": "Schwer",
    "type": "waffeneigenschaft",
    "system": {
        "kategorie": "wielding",
        "beschreibung": "Waffe erfordert hohe Körperkraft",
        "parameterSlots": [
            {
                "name": "kkThreshold",
                "type": "number",
                "label": "KK-Schwellenwert",
                "usage": "wieldingRequirements.condition.value",
                "required": true,
                "defaultValue": 4
            }
        ],
        "wieldingRequirements": {
            "hands": 1,
            "condition": {
                "type": "attribute_check",
                "attribute": "KK",
                "operator": "<",
                "value": 0,
                "onFailure": {
                    "at": -4,
                    "vt": -4,
                    "schaden": -4
                }
            }
        }
    }
}
```

**Weapon with "Schwer (4)"**:

```json
{
    "name": "Großschwert",
    "type": "nahkampfwaffe",
    "system": {
        "at": 14,
        "vt": 12,
        "eigenschaften": [
            { "key": "Schwer", "parameters": [4] },
            { "key": "Zweihändig", "parameters": [] }
        ]
    }
}
```

**Processing**:

1. WaffeItem.prepareWeapon() called
2. Cache.load(["Schwer", "Zweihändig"])
3. For "Schwer":
    - WieldingProcessor.process()
    - Build effective condition with KK threshold = 4
    - If actor.system.eigenschaften.KK < 4:
        - computed.modifiers.at -= 4
        - computed.modifiers.vt -= 4
        - computed.modifiers.schaden -= 4

**Result**: Character with KK 3 has -4 penalty, character with KK 5 has no penalty

### 12.2 Complete Example: "Umklammern" with Two Parameters

**Eigenschaft Item**:

```json
{
    "name": "Umklammern",
    "type": "waffeneigenschaft",
    "system": {
        "kategorie": "modifier",
        "parameterSlots": [
            {
                "name": "malus",
                "type": "number",
                "label": "AT/VT Malus",
                "usage": "modifiers.at",
                "required": true,
                "defaultValue": -2
            },
            {
                "name": "kkCheck",
                "type": "number",
                "label": "KK-Voraussetzung",
                "usage": "wieldingRequirements.condition.value",
                "required": true,
                "defaultValue": 12
            }
        ],
        "modifiers": {
            "at": 0,
            "vt": 0
        },
        "wieldingRequirements": {
            "condition": {
                "type": "attribute_check",
                "attribute": "KK",
                "operator": "<",
                "value": 0
            }
        }
    }
}
```

**Weapon**:

```json
{
    "eigenschaften": [{ "key": "Umklammern", "parameters": [-2, 12] }]
}
```

**Processing**:

1. ModifierProcessor: computed.modifiers.at += -2, computed.modifiers.vt += -2
2. WieldingProcessor: If actor KK < 12, apply additional penalties

---

## 13. Revision History

| Version | Date       | Changes                                                               |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.0.0   | 2026-01-07 | Initial specification consolidating parametrized eigenschaften system |

---

## 14. References

- Foundry VTT Documentation: https://foundryvtt.com/api/
- RFC 2119 Keywords: https://www.ietf.org/rfc/rfc2119.txt
- Reference Implementation: Ilaris System v12.3.0+

---

**END OF SPECIFICATION**
