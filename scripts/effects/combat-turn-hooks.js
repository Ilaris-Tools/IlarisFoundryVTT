/**
 * Owner-scoped turn timing hooks for Ilaris ActiveEffects.
 *
 * ## Architecture
 *
 * Effects with system.ilarisTiming.durationType === 'ownerTurns' are decremented
 * only on the owning combatant's turn. Core duration processing is suppressed for
 * these effects via IlarisActiveEffect.isExpiryEvent / updateDuration overrides.
 *
 * Two expiry modes (system.ilarisTiming.expiresOn):
 *
 *   turnStart — deleted immediately at the START of the owner's turn
 *               when remaining reaches 0. Handled entirely in
 *               reduceEffectDurationForCombatant.
 *
 *   turnEnd   — the effect still applies during the owner's current turn.
 *               Decrement and possible deletion are DEFERRED until the NEXT
 *               combatant's turn begins. This uses a two-phase flow:
 *
 *     Phase 1 (combatTurn / combatRound):
 *       reduceEffectDurationForCombatant computes newRemaining = remaining - 1
 *       but does NOT persist it. Instead it sets a flag:
 *         _pendingExpiry        → newRemaining <= 0 (will be deleted in Phase 2)
 *         _pendingDurationChange → newRemaining > 0  (will be decremented in Phase 2)
 *
 *     Phase 2 (updateCombat):
 *       When the combat turn index changes, all combatants are scanned for
 *       turnEnd effects with _pendingExpiry or _pendingDurationChange flags.
 *       The actual decrement (remaining - 1) or deletion happens here.
 *
 * ## Hooks used
 *
 *   combatTurn   — fires when the active turn changes. Decrements turnStart
 *                  effects immediately; flags turnEnd effects for Phase 2.
 *
 *   combatRound  — fires when the round advances. The last combatant in a round
 *                  may not receive a combatTurn event before the round rolls
 *                  over, so we also process them here.
 *
 *   updateCombat — Phase 2 for turnEnd effects. Scans all combatants for
 *                  flagged effects and applies the deferred decrement/expiry.
 */

import { IlarisActiveEffect } from './active-effect.js'

export async function expireEffect(actor, effect) {
    const summonedItemId = effect.flags?.ilaris?.summonedItemId
    if (summonedItemId) {
        const exists =
            actor.items?.get?.(summonedItemId) ||
            actor.items?.find?.((item) => item.id === summonedItemId)
        if (exists) await actor.deleteEmbeddedDocuments('Item', [summonedItemId])
    }
    await effect.delete()
}

Hooks.on('combatTurn', async (combat, updateData, updateOptions) => {
    // GM-only to avoid duplicate processing across clients
    if (!game.user.isGM) return
    // Only decrement on forward combat progression
    if (updateOptions?.direction === -1) return

    const combatant = combat.combatants.get(combat.turns[updateData.turn]._id)
    reduceEffectDurationForCombatant(combatant)
})

/**
 * Handles the last combatant in a round. When the round ends and wraps back to
 * the first combatant, the last combatant's combatTurn may not fire separately,
 * so we process them here to ensure their effects are evaluated.
 */
Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    if (!game.user.isGM) return
    if (updateOptions?.direction === -1) return

    // NOTE: combat.current reflects the round that just ended, not the previous.
    // This is expected V14 behavior — combat.current is updated before the hook fires.
    const combatant = combat.combatants.get(combat.turns[updateData.turn]._id)
    reduceEffectDurationForCombatant(combatant)
})

/**
 * Phase 2 for turnEnd effects: applies the deferred remaining decrement or
 * deletion that was flagged by reduceEffectDurationForCombatant in Phase 1.
 */
Hooks.on('updateCombat', async (combat, changed, _options, _userId) => {
    if (!game.user.isGM) return
    if (!('turn' in changed)) return

    for (const combatant of combat.combatants) {
        const actor = combatant.actor
        if (!actor) continue

        const turnEndEffects = actor.appliedEffects.filter(
            (e) =>
                e.system?.ilarisTiming?.expiresOn === 'turnEnd' &&
                (e.system?.ilarisTiming?._pendingExpiry ||
                    e.system?.ilarisTiming?._pendingDurationChange),
        )
        for (const effect of turnEndEffects) {
            const timing = effect.system.ilarisTiming
            // @issue See DOUBLE_DECREMENT above — remaining was not updated in Phase 1.
            const newRemaining = timing.remaining - 1

            // Apply DOT damage at end of owner's turn (after flagging)
            if (effect.hasDotChanges) {
                for (const change of effect.dotChanges) {
                    await IlarisActiveEffect.applyDotDamage(actor, change, effect)
                }
            }

            if (newRemaining <= 0) {
                await expireEffect(actor, effect)
                ChatMessage.create({
                    content: `<p><strong>${effect.name}</strong> auf ${actor.name} ist ausgelaufen.</p>`,
                })
            } else {
                await effect.update({
                    'system.ilarisTiming.remaining': newRemaining,
                    'system.ilarisTiming._pendingDurationChange': false,
                })
            }
        }
    }
})

/**
 * Phase 1: evaluates timing for a single combatant's Ilaris-timed effects.
 *
 * For turnStart: decrements remaining immediately. Deletes if <= 0.
 *
 * For turnEnd: computes newRemaining = remaining - 1 but does NOT persist it.
 *   Instead sets _pendingExpiry or _pendingDurationChange flag for Phase 2
 *   (updateCombat hook) to handle the actual update.
 */
async function reduceEffectDurationForCombatant(combatant) {
    const actor = combatant?.actor
    if (!actor) return

    const effects = actor.appliedEffects.filter(
        (e) =>
            !e.disabled && !e.isSuppressed && e.system?.ilarisTiming?.durationType === 'ownerTurns',
    )

    for (const effect of effects) {
        const timing = effect.system.ilarisTiming
        const newRemaining = timing.remaining - 1

        if (timing.expiresOn === 'turnStart') {
            if (newRemaining <= 0) {
                await expireEffect(actor, effect)
                ChatMessage.create({
                    content: `<p><strong>${effect.name}</strong> auf ${actor.name} ist ausgelaufen.</p>`,
                })
            } else {
                await effect.update({ 'system.ilarisTiming.remaining': newRemaining })
            }
        } else if (timing.expiresOn === 'turnEnd') {
            // Flag for Phase 2 — actual decrement/expiry happens in updateCombat.
            await effect.update({
                'system.ilarisTiming._pendingDurationChange': newRemaining > 0,
                'system.ilarisTiming._pendingExpiry': newRemaining <= 0,
            })
        }
    }
}

console.log('Ilaris | Combat turn effect timing hooks registered')
