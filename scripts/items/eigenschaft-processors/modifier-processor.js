import { BaseEigenschaftProcessor } from './base-processor.js'
import { evaluateFormula } from '../utils/eigenschaft-utils.js'

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
        this._applyCombatMechanics(name, eigenschaft, computed)
        this._registerConditionalModifiers(name, eigenschaft, computed)
    }

    /**
     * Apply basic numeric and formula-based modifiers
     * @private
     */
    _applyBasicModifiers(name, eigenschaft, computed, actor) {
        const mods = eigenschaft.modifiers || {}
        console.log(`ModifierProcessor applying basic modifiers for:`, eigenschaft, mods)

        // Simple numeric modifiers - ensure they are numbers
        const atMod = Number(mods.at) || 0
        const vtMod = Number(mods.vt) || 0
        const schadenMod = Number(mods.schaden) || 0
        const rwMod = Number(mods.rw) || 0

        computed.at += atMod
        computed.vt += vtMod
        computed.schadenBonus += schadenMod
        computed.rw += rwMod

        // Formula-based modifiers (e.g., "@actor.system.attribute.KK.wert" always with Math.floor(value/4))
        if (mods.schadenFormula) {
            try {
                const value = Math.floor(evaluateFormula(mods.schadenFormula, actor) / 4)
                if (!isNaN(value)) {
                    computed.schadenBonus += value
                    computed.modifiers.dmg.push(`${name}: ${value}`)
                } else {
                    console.warn(`Formula evaluation for "${name}" resulted in NaN`)
                }
            } catch (error) {
                console.error(`Error evaluating schadenFormula for "${name}":`, error)
            }
        }
    }

    /**
     * Apply combat mechanics like fumble/crit thresholds
     * @private
     */
    _applyCombatMechanics(name, eigenschaft, computed) {
        const mods = eigenschaft.modifiers || {}

        if (mods.fumbleThreshold !== null && mods.fumbleThreshold !== undefined) {
            computed.combatMechanics.fumbleThreshold = mods.fumbleThreshold
        }

        if (mods.critThreshold !== null && mods.critThreshold !== undefined) {
            computed.combatMechanics.critThreshold = mods.critThreshold
        }

        if (mods.ignoreCover) {
            computed.combatMechanics.ignoreCover = true
        }

        if (mods.ignoreArmor) {
            computed.combatMechanics.ignoreArmor = true
        }

        if (mods.additionalDice) {
            computed.combatMechanics.additionalDice =
                (computed.combatMechanics.additionalDice || 0) + mods.additionalDice
        }
    }

    /**
     * Register conditional modifiers to be checked during combat
     * @private
     */
    _registerConditionalModifiers(name, eigenschaft, computed) {
        const conditionalMods = eigenschaft.modifiers?.conditionalModifiers || []

        if (conditionalMods.length === 0) return

        // Store conditional modifiers to be checked during combat
        computed.conditionalModifiers.push(...conditionalMods)
    }
}
