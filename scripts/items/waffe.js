import { CombatItem } from './combat.js'

/**
 * Base class for weapon items (Nahkampfwaffe and Fernkampfwaffe)
 * Handles weapon stat calculations based on eigenschaften
 */
export class WaffeItem extends CombatItem {
    getTp() {
        return this.system.schaden?.replace(/[Ww]/g, 'd') || ''
    }

    /**
     * Prepare derived data for the weapon
     * Calculates combat stats based on eigenschaften and actor context
     */
    prepareDerivedData() {
        super.prepareDerivedData()

        // Only calculate if embedded in an actor
        if (!this.parent || this.parent.documentName !== 'Actor') return

        // Only calculate if weapon is selected (hauptwaffe or nebenwaffe)
        if (!this.system.hauptwaffe && !this.system.nebenwaffe) {
            return
        }

        // Ensure eigenschaft items are loaded
        if (!this._eigenschaftsLoaded) {
            // Queue loading for next tick
            this._queueEigenschaftLoad()
            return
        }

        this._calculateWeaponStats()
    }

    /**
     * Queue eigenschaft loading
     * @private
     */
    _queueEigenschaftLoad() {
        if (this._loadingEigenschaften) return

        this._loadingEigenschaften = true
        this._loadEigenschaften().then(() => {
            this._loadingEigenschaften = false
            this._eigenschaftsLoaded = true
            // Trigger recalculation
            if (this.parent) {
                this.parent.prepareData()
            }
        })
    }

    /**
     * Load all eigenschaft items for this weapon
     * @private
     */
    async _loadEigenschaften() {
        const eigenschaften = this.system.eigenschaften || []

        for (const name of eigenschaften) {
            await this._getEigenschaftItem(name)
        }
    }

    /**
     * Calculate weapon combat statistics (synchronous)
     * @private
     */
    _calculateWeaponStats() {
        const actor = this.parent
        const system = this.system

        // Initialize computed values
        system.computed = {
            at: Number(system.wm_at) || 0,
            vt: Number(system.wm_vt) || 0,
            fk: Number(system.wm_fk) || 0,
            schadenBonus: 0,
            rw: Number(system.rw) || 0,
            penalties: [],
            targetEffects: [],
            combatMechanics: {},
            conditionalModifiers: [],
            hasActorModifiers: false,
        }

        // Process each eigenschaft
        const eigenschaften = system.eigenschaften || []

        for (const eigenschaftName of eigenschaften) {
            this._processEigenschaft(eigenschaftName, system.computed, actor)
        }

        // Apply actor-wide modifiers (BE, wounds, etc.)
        const be = actor.system.abgeleitete?.be || 0
        system.computed.at -= be
        system.computed.vt -= be
        system.computed.fk -= be

        if (be > 0) {
            system.computed.penalties.push(`BE: -${be}`)
        }
    }

    /**
     * Process a single waffeneigenschaft (synchronous)
     * @param {string} name - Name of the eigenschaft
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @private
     */
    _processEigenschaft(name, computed, actor) {
        // Get the eigenschaft item from cache
        const eigenschaftItem = this._getCachedEigenschaftItem(name)

        if (!eigenschaftItem) {
            console.warn(`Waffeneigenschaft "${name}" not found`)
            return
        }

        const eigenschaft = eigenschaftItem.system

        // Process based on kategorie
        switch (eigenschaft.kategorie) {
            case 'modifier':
                this._applyModifiers(eigenschaft, computed, actor)
                break

            case 'wielding':
                this._applyWieldingRequirements(eigenschaft, computed, actor)
                break

            case 'target_effect':
                this._registerTargetEffect(eigenschaft, computed)
                break

            case 'combat_mechanic':
                this._applyCombatMechanics(eigenschaft, computed)
                this._applyConditionalModifiers(eigenschaft, computed)
                break

            case 'actor_modifier':
                // These are processed at actor level, not weapon level
                computed.hasActorModifiers = true
                break

            case 'passive':
                // Passive eigenschaften are just checked by name elsewhere
                break

            default:
                // Try custom script if present
                if (eigenschaft.customScript) {
                    this._executeCustomScript(eigenschaft.customScript, computed, actor)
                }
        }
    }

    /**
     * Apply basic modifiers from eigenschaft
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @private
     */
    _applyModifiers(eigenschaft, computed, actor) {
        const mods = eigenschaft.modifiers || {}

        // Simple numeric modifiers
        computed.at += mods.at || 0
        computed.vt += mods.vt || 0
        computed.schadenBonus += mods.schaden || 0
        computed.rw += mods.rw || 0

        // Formula-based modifiers (e.g., "@actor.system.attribute.KK.wert")
        if (mods.schadenFormula) {
            const value = this._evaluateFormula(mods.schadenFormula, actor)
            computed.schadenBonus += value
        }

        // Check conditions
        if (eigenschaft.conditions && eigenschaft.conditions.length > 0) {
            for (const condition of eigenschaft.conditions) {
                if (!this._checkCondition(condition, actor)) {
                    // Condition failed, apply penalties
                    const penalties = condition.onFailure || {}
                    computed.at += penalties.at || 0
                    computed.vt += penalties.vt || 0
                    computed.schadenBonus += penalties.schaden || 0

                    if (penalties.message) {
                        computed.penalties.push(penalties.message)
                    }
                }
            }
        }
    }

    /**
     * Apply wielding requirements (e.g., Zweihändig)
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @param {Actor} actor - The owning actor
     * @private
     */
    _applyWieldingRequirements(eigenschaft, computed, actor) {
        const req = eigenschaft.wieldingRequirements

        if (!req || req.hands !== 2) return

        const isHauptOnly = this.system.hauptwaffe && !this.system.nebenwaffe
        const isNebenOnly = !this.system.hauptwaffe && this.system.nebenwaffe
        const isBothHands = this.system.hauptwaffe && this.system.nebenwaffe

        let penalty = null

        if (req.hands === 2) {
            if (isHauptOnly && req.penalties.hauptOnly) {
                penalty = req.penalties.hauptOnly
            } else if (isNebenOnly && req.penalties.nebenOnly) {
                penalty = req.penalties.nebenOnly
            } else if (!isBothHands && req.penalties.nebenWithoutExemption) {
                // Check if weapon has exemption from nebenwaffe penalty
                const hasExemption = this.system.eigenschaften.includes('kein Malus als Nebenwaffe')
                if (!hasExemption) {
                    penalty = req.penalties.nebenWithoutExemption
                }
            }
        }

        if (penalty) {
            computed.at += penalty.at || 0
            computed.vt += penalty.vt || 0
            computed.schadenBonus += penalty.schaden || 0

            if (penalty.message) {
                computed.penalties.push(penalty.message)
            }
        }
    }

    /**
     * Register target effect (e.g., Niederwerfen) for use in combat
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @private
     */
    _registerTargetEffect(eigenschaft, computed) {
        if (!eigenschaft.targetEffect) return

        // Store target effects that can be triggered during combat
        computed.targetEffects.push({
            name: eigenschaft.targetEffect.name,
            trigger: eigenschaft.targetEffect.trigger,
            resistCheck: eigenschaft.targetEffect.resistCheck,
            effect: eigenschaft.targetEffect.effect,
        })
    }

    /**
     * Apply combat mechanics (e.g., fumble threshold)
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @private
     */
    _applyCombatMechanics(eigenschaft, computed) {
        const mechanics = eigenschaft.combatMechanics

        if (!mechanics) return

        if (mechanics.fumbleThreshold !== null && mechanics.fumbleThreshold !== undefined) {
            computed.combatMechanics.fumbleThreshold = mechanics.fumbleThreshold
        }

        if (mechanics.critThreshold !== null && mechanics.critThreshold !== undefined) {
            computed.combatMechanics.critThreshold = mechanics.critThreshold
        }

        if (mechanics.ignoreCover) {
            computed.combatMechanics.ignoreCover = true
        }

        if (mechanics.ignoreArmor) {
            computed.combatMechanics.ignoreArmor = true
        }

        if (mechanics.additionalDice) {
            computed.combatMechanics.additionalDice =
                (computed.combatMechanics.additionalDice || 0) + mechanics.additionalDice
        }
    }

    /**
     * Register conditional modifiers (e.g., +4 vs shields)
     * @param {Object} eigenschaft - The eigenschaft system data
     * @param {Object} computed - Computed stats object to modify
     * @private
     */
    _applyConditionalModifiers(eigenschaft, computed) {
        const conditionalMods = eigenschaft.conditionalModifiers

        if (!conditionalMods || conditionalMods.length === 0) return

        // Store conditional modifiers to be checked during combat
        computed.conditionalModifiers.push(...conditionalMods)
    }

    /**
     * Check if a condition is met
     * @param {Object} condition - The condition to check
     * @param {Actor} actor - The owning actor
     * @returns {boolean} True if condition is met
     * @private
     */
    _checkCondition(condition, actor) {
        switch (condition.type) {
            case 'attribute_check':
                const attrPath = `system.attribute.${condition.attribute}.wert`
                const attrValue = foundry.utils.getProperty(actor, attrPath) || 0
                return this._compareValues(attrValue, condition.operator, condition.value)

            case 'custom_script':
                return this._executeCustomScript(condition.script, {}, actor)

            default:
                return true
        }
    }

    /**
     * Compare two values with an operator
     * @param {number} a - First value
     * @param {string} operator - Comparison operator
     * @param {number} b - Second value
     * @returns {boolean} Result of comparison
     * @private
     */
    _compareValues(a, operator, b) {
        switch (operator) {
            case '<':
                return a < b
            case '<=':
                return a <= b
            case '>':
                return a > b
            case '>=':
                return a >= b
            case '==':
                return a == b
            case '!=':
                return a != b
            default:
                return true
        }
    }

    /**
     * Evaluate a formula string with actor context
     * @param {string} formula - Formula with @actor references
     * @param {Actor} actor - The owning actor
     * @returns {number} Evaluated result
     * @private
     */
    _evaluateFormula(formula, actor) {
        // Replace @actor references with actual values
        const replaced = formula.replace(/@actor\.([^\s]+)/g, (match, path) => {
            return foundry.utils.getProperty(actor, path) || 0
        })

        try {
            // eslint-disable-next-line no-eval
            return eval(replaced) || 0
        } catch (e) {
            console.error('Error evaluating formula:', formula, e)
            return 0
        }
    }

    /**
     * Execute a custom script
     * @param {string} script - JavaScript code to execute
     * @param {Object} computed - Computed stats object
     * @param {Actor} actor - The owning actor
     * @returns {*} Result of script execution
     * @private
     */
    _executeCustomScript(script, computed, actor) {
        try {
            const func = new Function('weapon', 'computed', 'actor', script)
            return func(this, computed, actor)
        } catch (e) {
            console.error('Error executing custom script:', e)
            return false
        }
    }

    /**
     * Get cached eigenschaft item (synchronous)
     * @param {string} name - Name of the eigenschaft
     * @returns {Item|null} The eigenschaft item or null
     * @private
     */
    _getCachedEigenschaftItem(name) {
        if (!this._eigenschaftCache) {
            return null
        }

        return this._eigenschaftCache.get(name) || null
    }

    /**
     * Get eigenschaft item from world or compendiums (async loader)
     * @param {string} name - Name of the eigenschaft
     * @returns {Promise<Item|null>} The eigenschaft item or null
     * @private
     */
    async _getEigenschaftItem(name) {
        // Initialize cache
        if (!this._eigenschaftCache) {
            this._eigenschaftCache = new Map()
        }

        // Check cache first
        if (this._eigenschaftCache.has(name)) {
            return this._eigenschaftCache.get(name)
        }

        // Search world items
        let item = game.items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)

        // Search compendiums if not found
        if (!item) {
            for (const pack of game.packs) {
                if (pack.metadata.type === 'Item') {
                    const items = await pack.getDocuments()
                    item = items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)
                    if (item) break
                }
            }
        }

        // Cache the result
        this._eigenschaftCache.set(name, item)
        return item
    }

    /**
     * Clear eigenschaft cache when item updates
     * @param {Object} changed - Changed data
     * @param {Object} options - Update options
     * @param {string} userId - User ID performing update
     * @private
     */
    async _preUpdate(changed, options, userId) {
        await super._preUpdate(changed, options, userId)

        // Clear cache if eigenschaften changed
        if (changed.system?.eigenschaften) {
            this._eigenschaftCache = null
            this._eigenschaftsLoaded = false
        }
    }
}
