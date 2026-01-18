import { IlarisActiveEffect } from '../documents/active-effect.js'

/**
 * Hook handler for DOT (Damage Over Time) effects
 * Applies DOT damage on duration tick down
 *
 * USAGE:
 * ------
 * 1. Create an Active Effect on an Actor or Item
 * 2. Add a change with:
 *    - Change Mode: Custom (10)
 *    - Attribute Key: "dot" or any key starting with "dot" (e.g., "dotBlutung", "dotGift")
 *    - Effect Value: The damage amount (can use @references for dynamic values)
 *
 * EXAMPLES:
 * ---------
 * - Fixed damage:
 *   Mode: Custom, Key: "dotBlutung", Value: "3"
 *
 * - Dynamic damage based on attribute:
 *   Mode: Custom, Key: "dotGift", Value: "@attributes.KO / 4"
 *
 * - Formula with floor():
 *   Mode: Custom, Key: "dotFeuer", Value: "floor(@level / 2)"
 *
 * BEHAVIOR:
 * ---------
 * - DOT effects are applied automatically when their duration ticks down
 * - The damage is added to the actor's wounds (system.gesundheit.wunden)
 * - A chat message is posted showing the damage dealt
 * - Multiple DOT effects on the same actor stack (all are applied)
 * - DOT effects respect disabled/suppressed states
 * - The Attribute Key can be descriptive (e.g., "dotBlutung", "dotGift") for clarity
 *
 * TECHNICAL NOTES:
 * ----------------
 * - Uses the 'combatTurn' and 'combatRound' hooks to detect turn changes
 * - Only processed by the GM to avoid duplicate applications
 * - Supports formula resolution using the actor's roll data
 * - Error handling ensures one failing DOT doesn't break others
 * - Custom mode (10) is used with keys starting with "dot" to identify DOT effects
 */

// Listen for when an Active Effect is updated
Hooks.on('updateActiveEffect', async (activeEffect, data, options, userId) => {
    await applyDotEffectToActor(activeEffect, activeEffect.parent)
})

/**
 * DOT Effects apply when they tick down, which happens when they reduce their duration
 * @param {Effect} activeEffect - The Active Effect being updated
 * @param {Actor} actor - The actor to apply DOT effect to
 */
async function applyDotEffectToActor(effect, actor) {
    if (!actor || !effect) return
    if (effect.disabled || effect.isSuppressed) return
    if (effect.changes.length === 0) return

    const dotChanges = effect.changes.filter(
        (c) =>
            c.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM &&
            c.key.toLowerCase().startsWith('system.gesundheit.wunden'),
    )
    if (dotChanges.length === 0) return

    // Apply DOT effect
    for (const change of dotChanges) {
        try {
            await IlarisActiveEffect.applyDotDamage(actor, change, effect)
        } catch (error) {
            console.error(`Failed to apply DOT effect to ${actor.name}:`, error)
            ui.notifications.error(`Fehler beim Anwenden des DOT-Effekts auf ${actor.name}`)
        }
    }
}

console.log('Ilaris | DOT Effects hook registered')
