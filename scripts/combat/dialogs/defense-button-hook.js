import { openDefenseForTarget } from '../combat-api.js'

/**
 * Register the renderChatMessage hook for defense buttons.
 *
 * This module is responsible only for UI-event delegation: it listens for
 * clicks on `.defend-button` elements, validates the data attributes, and
 * delegates the actual combat logic to `openDefenseForTarget` in combat-api.js.
 *
 * Combat logic (weapon resolution, roll modification, dialog opening) was
 * extracted to avoid circular dependencies and to keep concerns separate.
 */
export function registerDefenseButtonHook() {
    // Register the renderChatMessage hook ONCE at the top level
    if (!window._ilarisDefendButtonHookRegistered) {
        window._ilarisDefendButtonHookRegistered = true
        Hooks.on('renderChatMessageHTML', (message, htmlDOM) => {
            htmlDOM.querySelectorAll('.defend-button').forEach((button) => {
                button.addEventListener('click', async function () {
                    // Disable only the clicked button initially to prevent double-clicks
                    const clickedButton = this
                    clickedButton.disabled = true

                    const actorId = this.dataset.actorId
                    const weaponId = this.dataset.weaponId
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
                        clickedButton.disabled = false
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
                        clickedButton.disabled = false
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
                        clickedButton.disabled = false
                        return
                    }

                    const actor = game.actors.get(actorId)
                    const attackingActor = game.actors.get(attackerId)
                    if (!actor) {
                        ui.notifications.warn('Akteur wurde nicht gefunden.')
                        clickedButton.disabled = false
                        return
                    }

                    // For weapon defense: disable all buttons and mark as handled now.
                    // For Akrobatik: openDefenseForTarget → handleAkrobatikDefense manages its own UI.
                    if (weaponId !== 'akrobatik') {
                        const chatMessage = htmlDOM.closest('.chat-message')
                        chatMessage.classList.remove('ilaris-defense-prompt-highlight')
                        chatMessage.classList.add('defense-handled')
                        htmlDOM.querySelectorAll('.defend-button').forEach((b) => {
                            b.disabled = true
                        })
                    }

                    await openDefenseForTarget(
                        actor,
                        attackingActor,
                        weaponId,
                        rollResult,
                        attackType,
                        htmlDOM,
                    )
                })
            })
        })
    }
}
