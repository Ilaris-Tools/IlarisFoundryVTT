import { AngriffDialog } from './angriff.js'

/**
 * Register the renderChatMessage hook for defense buttons
 * This module handles the defense button click logic that was previously in combat_dialog.js
 * Extracted to avoid circular dependency between CombatDialog and AngriffDialog
 */
export function registerDefenseButtonHook() {
    // Register the renderChatMessage hook ONCE at the top level
    if (!window._ilarisDefendButtonHookRegistered) {
        window._ilarisDefendButtonHookRegistered = true
        Hooks.on('renderChatMessage', (message, html) => {
            html.find('.defend-button').click(async function () {
                const actorId = this.dataset.actorId
                const weaponId = this.dataset.weaponId
                const distance = parseInt(this.dataset.distance)
                const attackerId = this.dataset.attackerId
                const attackType = this.dataset.attackType
                let rollResult
                try {
                    rollResult = JSON.parse(decodeURIComponent(this.dataset.rollResult))
                } catch (e) {
                    ui.notifications.error('Fehler beim Parsen des Angriffs-Wurfs.')
                    return
                }
                const actor = game.actors.get(actorId)
                const attackingActor = game.actors.get(attackerId)
                if (!actor) return

                // Get the specific weapon that was clicked
                let weapon
                if (actor.type === 'kreatur' && actor.angriffe) {
                    // For creatures, find the weapon in angriffe array
                    weapon = actor.angriffe.find((angriff) => angriff.id === weaponId)
                } else {
                    // For regular actors, find the weapon in items
                    weapon = actor.items.get(weaponId)
                }

                if (!weapon) {
                    ui.notifications.warn('Die gewählte Waffe wurde nicht gefunden.')
                    return
                }
                if (attackType === 'ranged') {
                    // For ranged attacks in defense mode, the roll total is fixed at 28
                    // according to the Ilaris rulebook (fixed defense roll value for ranged attacks)
                    if (rollResult.roll && typeof rollResult.roll === 'object') {
                        rollResult.roll._total = 28
                    }
                }
                const d = new AngriffDialog(actor, weapon, {
                    isDefenseMode: true,
                    attackingActor: attackingActor,
                    attackRoll: rollResult,
                })
                d.render(true)
            })
        })
    }
}
