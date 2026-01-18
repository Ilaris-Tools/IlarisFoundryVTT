/**
 * Hook handler for Active Effect duration management
 * Automatically decrements duration.turns for all active effects at the start of each combatant's turn
 *
 * BEHAVIOR:
 * ---------
 * - Duration is decremented at the START of the actor's turn in combat
 * - When duration.turns reaches 0, the effect is automatically removed
 * - A chat message is posted when an effect expires
 * - All effects with duration.turns are processed (not just DOT effects)
 * - Only effects with duration.turns !== null and !== undefined are processed
 * - Each effect is only processed once per turn (even if it has multiple changes)
 *
 * TECHNICAL NOTES:
 * ----------------
 * - Uses the 'combatTurn' and 'combatRound' hooks to detect turn changes
 * - Only processed by the GM to avoid duplicate applications
 * - Error handling ensures one failing effect doesn't break others
 */

/**
 * Handle combat turn changes to decrement effect durations
 * Fired when any combatant's turn ends and a new turn begins
 */
Hooks.on('combatTurn', async (combat, updateData, updateOptions) => {
    // Only process on the GM's client to avoid duplicate processing
    // if (!game.user.isGM) return

    console.log('combatTurn hook triggered for Active Effect duration management', {
        updateData,
        currentTurn: combat.turn,
        currentRound: combat.round,
        previousTurn: updateData.turn,
    })

    const currentCombatant = combat.combatant

    // Process effect durations for the combatant whose turn just started
    if (currentCombatant?.actor) {
        console.log(
            `Processing effect durations for ${currentCombatant.actor.name} (turn just started)`,
        )
        await processEffectDurationsForActor(currentCombatant.actor)
    }
})

/**
 * Handle combat round changes to process effect durations for the last combatant
 * Fired when a new round starts, meaning the last combatant's turn just ended
 */
Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    // Only process on the GM's client to avoid duplicate processing
    // if (!game.user.isGM) return

    console.log('combatRound hook triggered for Active Effect duration management', {
        updateData,
        currentRound: combat.round,
        currentTurn: combat.turn,
    })

    // When a new round starts, the last combatant of the previous round just finished
    // The combat is now at turn 0 of the new round
    // Get the last combatant from the turns array
    const lastCombatant = combat.turns[combat.turns.length - 1]

    if (lastCombatant?.actor) {
        console.log(
            `Processing effect durations for ${lastCombatant.actor.name} (last turn of previous round just ended)`,
        )
        await processEffectDurationsForActor(lastCombatant.actor)
    }
})

// Listen for when an Active Effect is updated
Hooks.on('updateActiveEffect', async (activeEffect, data, options, userId) => {
    console.log(
        `Active Effect "${activeEffect.name}" was ${data.disabled ? 'disabled' : 'enabled'}.`,
        activeEffect,
        options,
        userId,
    )
    await handleEffectExpiration(activeEffect, activeEffect.parent)
})

/**
 * Process all active effects with durations for a specific actor
 * Decrements duration.turns and removes expired effects
 * @param {Actor} actor - The actor to process effects for
 */
async function processEffectDurationsForActor(actor) {
    // Get all effects that have a defined duration.turns
    const effectsWithDuration = actor.effects.filter(
        (effect) =>
            effect.duration.turns !== null &&
            effect.duration.turns !== undefined &&
            !effect.disabled &&
            !effect.isSuppressed,
    )

    if (effectsWithDuration.length === 0) return

    console.log(
        `Processing ${effectsWithDuration.length} effect(s) with duration for ${actor.name}`,
    )

    // Process each effect
    for (const effect of effectsWithDuration) {
        try {
            const duration = effect.duration
            const newTurns = duration.turns - 1

            await effect.update({ 'duration.turns': newTurns })
            console.log(`Active Effect: ${effect.name} duration decremented to ${newTurns} turns.`)
        } catch (error) {
            console.error(`Failed to process effect duration for ${actor.name}:`, error)
            ui.notifications.error(
                `Fehler beim Verarbeiten der Effektdauer für ${actor.name}: ${effect.name}`,
            )
        }
    }
}

/**
 * Check and handle effect expiration
 * @param {ActiveEffect} effect - The active effect to check for expiration
 * @param {Actor} actor - The actor to process effects for
 */
async function handleEffectExpiration(effect, actor) {
    if (effect.duration.turns > 0) return
    if (effect.disabled || effect.isSuppressed) return
    if (effect.duration.turns == null) return

    await effect.delete()
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="ilaris-chat-card">
            <h3>${effect.name}</h3>
            <p>Der Effekt ist abgelaufen.</p>
        </div>`,
    })
    console.log(`Active Effect: ${effect.name} expired and was removed.`)
}

console.log('Ilaris | Active Effect Duration Management hook registered')
