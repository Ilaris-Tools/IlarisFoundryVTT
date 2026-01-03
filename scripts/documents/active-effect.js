import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'

/**
 * Custom ActiveEffect class for Ilaris system
 * Handles formula resolution in effect values with @ references
 *
 * DOT (Damage Over Time) Usage:
 * - Use Change Mode: Custom (10)
 * - Set Attribute Key to: "dot" (or any key starting with "dot")
 * - Set Effect Value to: damage amount (supports @references)
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
     * Get all DOT (Damage Over Time) effects from an actor
     * DOT effects are identified by:
     * - Change Mode: Custom (10)
     * - Attribute Key starting with "system.gesundheit.wunden"
     * @param {Actor} actor - The actor to check
     * @returns {Array} Array of {effect, change} objects with DOT mode
     */
    static getDotEffects(actor) {
        if (!actor) return []

        const dotEffects = []
        // Use .contents to iterate over the effects collection properly
        const effects = actor.appliedEffects || []

        console.log(`Checking actor ${actor.name} for DOT effects`, effects)
        for (const effect of effects) {
            if (effect.disabled || effect.isSuppressed) continue

            for (const change of effect.changes) {
                // Check for Custom mode (10) and key starting with "system.gesundheit.wunden"
                if (
                    change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM &&
                    change.key?.toLowerCase().startsWith('system.gesundheit.wunden')
                ) {
                    dotEffects.push({ effect, change })
                }
            }
        }
        return dotEffects
    }

    /**
     * Apply a DOT effect to an actor (called from combat hook)
     * @param {Actor} actor - The actor to apply DOT to
     * @param {Object} change - The change object with DOT configuration
     * @returns {Promise<void>}
     */
    static async applyDotDamage(actor, change) {
        // Resolve formula if it contains @ references
        let damageValue = change.value
        if (typeof damageValue === 'string' && damageValue.includes('@')) {
            const effect = new IlarisActiveEffect()
            const resolved = effect.resolveFormulaValue(damageValue, actor)
            damageValue = resolved ? parseFloat(resolved) : 0
        } else {
            damageValue = parseFloat(damageValue) || 0
        }

        // Apply damage to HP
        const currentHp = actor.system.gesundheit?.wunden ?? 0
        const newHp = currentHp + damageValue

        await actor.update({
            'system.gesundheit.wunden': newHp,
        })

        // Send chat message about DOT damage
        const effectName = change.key || 'Schaden über Zeit'
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="ilaris-chat-card">
                <h3>${effectName}</h3>
                <p>${actor.name} erleidet ${damageValue} Schadenspunkte.</p>
            </div>`,
        })

        console.log(`DOT: Applied ${damageValue} damage to ${actor.name}`)
    }

    /**
     * Override _applyCustom to handle DOT effects
     * DOT effects are applied via combat hooks, not during normal application
     * @param {Actor} actor - The actor to apply changes to
     * @param {Object} change - The change object
     * @returns {*} The result of the custom application
     * @override
     */
    _applyCustom(actor, change) {
        // Check if this is a DOT effect (key starts with "dot")
        if (change.key?.toLowerCase().startsWith('system.gesundheit.wunden')) {
            // DOT effects are handled by combat hooks, not during normal apply
            // Return null to skip normal application
            return null
        }

        // For other custom effects, call parent implementation
        return super._applyCustom(actor, change)
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
