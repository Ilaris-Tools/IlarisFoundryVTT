import { IlarisActiveEffect } from '../documents/active-effect.js'

/**
 * Hook handler for DOT (Damage Over Time) effects
 * Applies DOT damage at the end of each combatant's turn
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
 * - DOT effects are applied automatically at the START of the actor's turn in combat
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

/**
 * Handle combat turn changes to apply DOT effects
 * Fired when any combatant's turn ends and a new turn begins
 */
Hooks.on('combatTurn', async (combat, updateData, updateOptions) => {
    // The combatant whose turn just ended is in updateData
    // updateData contains the NEW turn info, so we need to look at who was active before
    // However, we can get the current combatant from combat directly
    const currentCombatant = combat.combatant

    // Apply DOT effects to the combatant whose turn just started
    // (effects apply at the START of their turn, representing damage from the previous turn)
    if (currentCombatant?.actor) {
        console.log(`Applying DOT effects to ${currentCombatant.actor.name} (turn just started)`)
        await applyDotEffectsToActor(currentCombatant.actor, combat, currentCombatant)
    }
})

/**
 * Handle combat round changes to apply DOT effects to the last combatant
 * Fired when a new round starts, meaning the last combatant's turn just ended
 */
Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    // When a new round starts, the last combatant of the previous round just finished
    // The combat is now at turn 0 of the new round
    // Get the last combatant from the turns array
    const lastCombatant = combat.turns[combat.turns.length - 1]

    if (lastCombatant?.actor) {
        console.log(
            `Applying DOT effects to ${lastCombatant.actor.name} (last turn of previous round just ended)`,
        )
        await applyDotEffectsToActor(lastCombatant.actor, combat, lastCombatant)
    }
})

/**
 * Apply all DOT effects to a specific actor
 * @param {Actor} actor - The actor to apply DOT effects to
 * @param {Combat} combat - The combat instance
 * @param {Combatant} combatant - The combatant whose turn just ended
 */
async function applyDotEffectsToActor(actor, combat, combatant) {
    const dotEffects = IlarisActiveEffect.getDotEffects(actor)

    if (dotEffects.length === 0) return

    console.log(`Applying ${dotEffects.length} DOT effect(s) to ${actor.name}`)

    const processedEffectIds = new Set()

    // Apply each DOT effect
    for (const { effect, change } of dotEffects) {
        try {
            await IlarisActiveEffect.applyDotDamage(actor, change, effect)
        } catch (error) {
            console.error(`Failed to apply DOT effect to ${actor.name}:`, error)
            ui.notifications.error(`Fehler beim Anwenden des DOT-Effekts auf ${actor.name}`)
        }
    }
}

console.log('Ilaris | DOT Effects hook registered')
