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
                // Disable only the clicked button initially to prevent double-clicks
                const clickedButton = $(this)
                clickedButton.prop('disabled', true)

                const actorId = this.dataset.actorId
                const weaponId = this.dataset.weaponId
                const distance = parseInt(this.dataset.distance)
                const attackerId = this.dataset.attackerId
                const attackType = this.dataset.attackType

                // Validate required data attributes before parsing
                if (!this.dataset.rollResult) {
                    console.error('Defense button missing rollResult data attribute', {
                        actorId,
                        weaponId,
                        attackerId,
                        attackType,
                    })
                    ui.notifications.error(
                        'Angriffsdaten fehlen. Bitte kontaktiere den Spielleiter.',
                    )
                    clickedButton.prop('disabled', false)
                    return
                }

                let rollResult
                try {
                    rollResult = JSON.parse(decodeURIComponent(this.dataset.rollResult))
                } catch (e) {
                    console.error('Failed to parse rollResult data:', {
                        error: e.message,
                        rawData: this.dataset.rollResult,
                        actorId,
                        weaponId,
                        attackerId,
                    })
                    ui.notifications.error(
                        'Fehler beim Parsen des Angriffs-Wurfs. Daten sind ungültig.',
                    )
                    clickedButton.prop('disabled', false)
                    return
                }

                // Validate parsed rollResult structure
                if (!rollResult || !rollResult.roll) {
                    console.error('Invalid rollResult structure:', {
                        rollResult,
                        actorId,
                        weaponId,
                        attackerId,
                    })
                    ui.notifications.error('Angriffswurf-Daten sind unvollständig.')
                    clickedButton.prop('disabled', false)
                    return
                }

                const actor = game.actors.get(actorId)
                const attackingActor = game.actors.get(attackerId)
                if (!actor) {
                    ui.notifications.warn('Akteur wurde nicht gefunden.')
                    clickedButton.prop('disabled', false)
                    return
                }

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
                    clickedButton.prop('disabled', false)
                    return
                }

                // Validation successful - now remove highlighting and disable all buttons
                const chatMessage = html.closest('.chat-message')
                chatMessage.removeClass('ilaris-defense-prompt-highlight')

                const allButtons = html.find('.defend-button')
                allButtons.prop('disabled', true)

                // For ranged attacks in defense mode, the roll total is fixed at 28
                // according to the Ilaris rulebook (fixed defense roll value for ranged attacks)
                // Create a wrapper object instead of mutating the original roll
                let effectiveRollResult = rollResult
                if (attackType === 'ranged') {
                    effectiveRollResult = {
                        ...rollResult,
                        roll: {
                            ...rollResult.roll,
                            total: 28,
                            // Preserve the original roll for reference
                            _originalTotal: rollResult.roll.total || rollResult.roll._total,
                        },
                    }
                }

                const d = new AngriffDialog(actor, weapon, {
                    isDefenseMode: true,
                    attackingActor: attackingActor,
                    attackRoll: effectiveRollResult,
                })
                d.render(true)
            })
        })
    }
}
