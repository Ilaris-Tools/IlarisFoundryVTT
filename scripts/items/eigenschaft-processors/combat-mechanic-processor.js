import { BaseEigenschaftProcessor } from './base-processor.js'

/**
 * Processor for 'combat_mechanic' kategorie eigenschaften
 * Handles combat mechanics like fumble/crit thresholds and conditional modifiers
 */
export class CombatMechanicProcessor extends BaseEigenschaftProcessor {
    static getKategorie() {
        return 'combat_mechanic'
    }

    process(eigenschaft, computed, actor, weapon) {
        this._applyCombatMechanics(eigenschaft, computed)
        this._registerConditionalModifiers(eigenschaft, computed)
    }

    /**
     * Apply combat mechanics like fumble/crit thresholds
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
     * Register conditional modifiers to be checked during combat
     * @private
     */
    _registerConditionalModifiers(eigenschaft, computed) {
        const conditionalMods = eigenschaft.conditionalModifiers

        if (!conditionalMods || conditionalMods.length === 0) return

        // Store conditional modifiers to be checked during combat
        computed.conditionalModifiers.push(...conditionalMods)
    }
}
