import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'
import { targetFromMainAttributePath } from './utils/ilaris-modifier-constants.js'

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
     * Direct native main-attribute changes are legacy data. Applying them
     * changes prepared attributes and can cascade into GS, carry capacity, or
     * other derived values. New effects are redirected by the config and
     * Pre-Effect processors; existing ones are safely ignored here.
     * @override
     */
    shouldApplyChange(change, options) {
        if (targetFromMainAttributePath(change?.key)) return false
        return super.shouldApplyChange(change, options)
    }

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

            for (const change of effect.system?.changes ?? []) {
                // Check for Custom mode and key starting with "system.gesundheit.wunden"
                if (
                    change.type === 'custom' &&
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
    static async applyDotDamage(actor, change, effect) {
        const targetPath = change.key
        if (
            !targetPath ||
            (!targetPath.startsWith('system.gesundheit.wunden') &&
                !targetPath.startsWith('system.gesundheit.erschoepfungen'))
        ) {
            console.warn(`Ilaris | DOT change has invalid key: ${targetPath}`)
            return
        }

        // Resolve formula if it contains @ references
        let damageValue = change.value
        if (typeof damageValue === 'string' && damageValue.includes('@')) {
            const effectInstance = new IlarisActiveEffect()
            const resolved = effectInstance.resolveFormulaValue(damageValue, actor)
            damageValue = resolved ? parseFloat(resolved) : 0
        } else {
            damageValue = parseFloat(damageValue) || 0
        }

        // Apply to the target path (wunden or erschoepfungen)
        const current = foundry.utils.getProperty(actor, targetPath) ?? 0
        await actor.update({ [targetPath]: current + damageValue })

        // Send chat message about DOT damage
        const effectName = effect.name || 'Schaden über Zeit'
        const isErschoepfung = targetPath.includes('erschoepfungen')
        const label = isErschoepfung
            ? `${damageValue} Erschöpfung`
            : `${damageValue} Schadenspunkte`
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="ilaris-chat-card">
                <h3>${effectName}</h3>
                <p>${actor.name} erleidet ${label}.</p>
            </div>`,
        })
    }

    /**
     * Does this effect have any DOT (type === "dot") changes?
     * @returns {boolean}
     */
    get hasDotChanges() {
        return (this.changes ?? []).some((c) => c.type === 'dot')
    }

    /**
     * All DOT changes on this effect.
     * @returns {Array<{key: string, mode: number, value: string, type: string, priority: number, phase: string}>}
     */
    get dotChanges() {
        return (this.changes ?? []).filter((c) => c.type === 'dot')
    }

    /**
     * Override apply method to resolve formulas with @ references before applying
     * @override
     */
    apply(actor, change) {
        if (targetFromMainAttributePath(change?.key)) return {}

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

    /**
     * Prevent core from expiring Ilaris-timed effects.
     * Owner-scoped expiry is handled by combat-turn-hooks.js instead.
     * @override
     */
    isExpiryEvent(event, context) {
        if (this.system?.ilarisTiming?.durationType === 'ownerTurns') return false
        return super.isExpiryEvent(event, context)
    }

    /**
     * Prevent core from decrementing duration.turns for Ilaris-timed effects.
     * Without this guard the core would independently decrement on every combatant's
     * turn, creating a conflicting counter alongside the owner-scoped hooks.
     * @override
     */
    updateDuration(context) {
        if (this.system?.ilarisTiming?.durationType === 'ownerTurns') return
        return super.updateDuration(context)
    }
}
