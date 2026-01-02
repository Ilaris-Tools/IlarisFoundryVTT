import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'
/**
 * Custom ActiveEffect class for Ilaris system
 * Handles formula resolution in effect values with @ references
 */
export class IlarisActiveEffect extends ActiveEffect {
    /**
     * Resolves a formula string containing @ references using actor roll data
     * @param {string} formula - The formula string to resolve
     * @param {Object} actor - The actor to get roll data from
     * @returns {string|null} The resolved numeric value as a string, or null if resolution fails
     */
    resolveFormulaValue(formula, actor) {
        try {
            const rollData = actor.getRollData()
            const roll = new Roll(formula, rollData)
            roll.evaluateSync()

            // Use Roll.safeEval on the resolved formula to get the numeric result
            const resolvedValue = Roll.safeEval(roll.formula)

            console.log(
                `✓ Resolved effect formula: ${formula} → ${roll.formula} = ${resolvedValue}`,
            )

            return String(resolvedValue)
        } catch (error) {
            console.warn(`✗ Failed to resolve effect formula: ${formula}`, error)
            return null
        }
    }

    /**
     * Updates actor HP values when WS is modified and LEP system is enabled
     * @param {Object} actor - The actor to update
     * @param {string} changeKey - The key of the change being applied
     */
    recalculateHpIfNeeded(actor, changeKey) {
        if (changeKey !== 'system.abgeleitete.ws') {
            return
        }

        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )

        if (useLepSystem) {
            actor.system.gesundheit.hp.max = actor.system.abgeleitete.ws
            actor.system.gesundheit.hp.value = actor.system.abgeleitete.ws
        }
    }

    /**
     * Override apply method to resolve formulas with @ references before applying
     * @override
     */
    apply(actor, change) {
        // If change value contains @ references, resolve it as a formula
        if (typeof change.value === 'string' && change.value.includes('@')) {
            const resolvedValue = this.resolveFormulaValue(change.value, actor)

            if (resolvedValue !== null) {
                // Create a modified change with the resolved numeric value
                const modifiedChange = {
                    ...change,
                    value: resolvedValue,
                }
                const result = super.apply(actor, modifiedChange)
                this.recalculateHpIfNeeded(actor, change.key)
                return result
            }
        }

        const result = super.apply(actor, change)
        this.recalculateHpIfNeeded(actor, change.key)
        return result
    }
}
