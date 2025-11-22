import { BaseEigenschaftProcessor } from './base-processor.js'
import { checkCondition, evaluateFormula } from '../utils/eigenschaft-utils.js'

/**
 * Processor for 'modifier' kategorie eigenschaften
 * Handles numeric modifiers, formulas, and conditional modifiers
 */
export class ModifierProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'modifier'
    }

    process(name, eigenschaft, computed, actor, weapon) {
        this._applyBasicModifiers(name, eigenschaft, computed, actor)
        this._applyConditionalModifiers(name, eigenschaft, computed, actor)
    }

    /**
     * Apply basic numeric and formula-based modifiers
     * @private
     */
    _applyBasicModifiers(name, eigenschaft, computed, actor) {
        const mods = eigenschaft.modifiers || {}
        console.log(`ModifierProcessor applying basic modifiers for:`, eigenschaft, mods)

        // Simple numeric modifiers
        computed.at += mods.at || 0
        computed.vt += mods.vt || 0
        computed.schadenBonus += mods.schaden || 0
        computed.rw += mods.rw || 0

        // Formula-based modifiers (e.g., "@actor.system.attribute.KK.wert" always with Math.floor(value/4))
        if (mods.schadenFormula) {
            const value = Math.floor(evaluateFormula(mods.schadenFormula, actor) / 4)
            computed.schadenBonus += value
            computed.modifiers.dmg.push(`${name}: ${value}`)
        }
    }

    /**
     * Apply conditional modifiers based on conditions
     * @private
     */
    _applyConditionalModifiers(name, eigenschaft, computed, actor) {
        // Check conditions
        if (eigenschaft.conditions && eigenschaft.conditions.length > 0) {
            for (const condition of eigenschaft.conditions) {
                if (checkCondition(condition, actor)) {
                    // Condition is true (failure condition met), apply penalties
                    const penalties = condition.onFailure || {}
                    computed.at += penalties.at || 0
                    computed.vt += penalties.vt || 0
                    computed.schadenBonus += penalties.schaden || 0

                    if (penalties.message) {
                        computed.modifiers.at.push(penalties.message)
                        computed.modifiers.vt.push(penalties.message)
                        computed.modifiers.dmg.push(penalties.message)
                    }
                }
            }
        }
    }
}
