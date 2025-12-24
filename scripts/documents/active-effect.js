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
     * Override apply method to resolve formulas with @ references before applying
     * @override
     */
    apply(actor, change) {
        const useLepSystem = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.lepSystem,
        )
        // If change value contains @ references, resolve it as a formula
        if (typeof change.value === 'string' && change.value.includes('@')) {
            try {
                const rollData = actor.getRollData()
                const roll = new Roll(change.value, rollData)
                roll.evaluateSync()

                // Use Roll.safeEval on the resolved formula to get the numeric result
                const resolvedValue = Roll.safeEval(roll.formula)

                console.log(
                    `✓ Resolved effect formula: ${change.value} → ${roll.formula} = ${resolvedValue}`,
                )

                // Create a modified change with the resolved numeric value
                const modifiedChange = {
                    ...change,
                    value: String(resolvedValue),
                }
                const result = super.apply(actor, modifiedChange)
                // Special handling: If WS is modified and LEP system is enabled, recalculate HP
                if (change.key === 'system.abgeleitete.ws') {
                    if (useLepSystem) {
                        actor.system.gesundheit.hp.max = actor.system.abgeleitete.ws
                        actor.system.gesundheit.hp.value = actor.system.abgeleitete.ws
                    }
                }
                return result
            } catch (error) {
                console.warn(`✗ Failed to resolve effect formula: ${change.value}`, error)
            }
        }

        const result = super.apply(actor, change)

        // Special handling: If WS is modified and LEP system is enabled, recalculate HP
        if (change.key === 'system.abgeleitete.ws') {
            if (useLepSystem) {
                actor.system.gesundheit.hp.max = actor.system.abgeleitete.ws
                actor.system.gesundheit.hp.value = actor.system.abgeleitete.ws
            }
        }

        return result
    }
}
