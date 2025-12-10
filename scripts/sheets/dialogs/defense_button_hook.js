import { AngriffDialog } from './angriff.js'

/**
 * Handles Akrobatik-based defense (dodging ranged attacks)
 * @param {Actor} actor - The defending actor
 * @param {Object} rollResult - The attack roll result
 * @param {jQuery} html - The chat message HTML
 * @returns {Promise<void>}
 */
async function handleAkrobatikDefense(actor, rollResult, html) {
    // Validation successful - now remove highlighting and disable all buttons
    const chatMessage = html.closest('.chat-message')
    chatMessage.removeClass('ilaris-defense-prompt-highlight')
    chatMessage.addClass('defense-handled')

    const allButtons = html.find('.defend-button')
    allButtons.prop('disabled', true)

    let skillValue = 0
    let label = 'Ausweichen mit Akrobatik'

    // Handle creatures differently - check freietalente
    if (actor.type === 'kreatur') {
        const akrobatikOrAthletik = actor.freietalente?.find(
            (t) => t.name === 'Akrobatik' || t.name === 'Athletik',
        )

        if (!akrobatikOrAthletik) {
            ui.notifications.warn(`${actor.name} hat weder Akrobatik noch Athletik.`)
            return
        }

        skillValue = akrobatikOrAthletik.system?.pw || 0
    } else {
        // For regular actors, find the Athletik skill (Akrobatik is a talent of Athletik)
        const athletikSkill = actor.profan?.fertigkeiten?.find((f) => f.name === 'Athletik')

        if (!athletikSkill) {
            ui.notifications.warn(`${actor.name} hat keine Athletik-Fertigkeit.`)
            return
        }

        // Check if the actor has the Akrobatik talent
        const hasAkrobatikTalent = athletikSkill.system?.talente?.some(
            (t) => t.name === 'Akrobatik',
        )

        // Use PWT if they have the talent, otherwise use PW
        skillValue = hasAkrobatikTalent
            ? athletikSkill.system.pwt || 0
            : athletikSkill.system.pw || 0

        if (hasAkrobatikTalent) {
            label += ' (Talent)'
        }
    }

    const speaker = ChatMessage.getSpeaker({ actor: actor })
    const globalermod = actor.system?.abgeleitete?.globalermod || 0
    const dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // Show dialog for user to enter modifikator (e.g., multiple defenses malus)
    const dialogHtml = await renderTemplate(
        'systems/Ilaris/templates/chat/probendiag_attribut.hbs',
        {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
            dialogId: dialogId,
        },
    )

    const d = new Dialog(
        {
            title: 'Ausweichen mit Akrobatik',
            content: dialogHtml,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: 'OK',
                    callback: async (dialogResponseHtml) => {
                        let text = ''
                        let dice_number = 1
                        let discard_l = 0
                        let discard_h = 0

                        // Handle 3d20
                        const xd20Value = dialogResponseHtml
                            .find(`input[name="xd20-${dialogId}"]:checked`)
                            .val()
                        if (xd20Value === '1') {
                            dice_number = 3
                            discard_l = 1
                            discard_h = 1
                            text += '3W20 (höchster und niedrigster werden ignoriert)\n'
                        }

                        // Handle Schips
                        const schipsValue = dialogResponseHtml
                            .find(`input[name="schips-${dialogId}"]:checked`)
                            .val()
                        if (schipsValue === '1' && actor.system.schips.schips_stern > 0) {
                            dice_number += 1
                            discard_l += 1
                            text += 'Schips ohne Eigenheit\n'
                            await actor.update({
                                'system.schips.schips_stern': actor.system.schips.schips_stern - 1,
                            })
                        } else if (schipsValue === '2' && actor.system.schips.schips_stern > 0) {
                            dice_number += 2
                            discard_l += 2
                            text += 'Schips mit Eigenheit\n'
                            await actor.update({
                                'system.schips.schips_stern': actor.system.schips.schips_stern - 1,
                            })
                        }

                        // Get modifikator
                        let modifikator = 0
                        if (dialogResponseHtml.find(`#modifikator-${dialogId}`).length > 0) {
                            modifikator = Number(
                                dialogResponseHtml.find(`#modifikator-${dialogId}`)[0].value,
                            )
                            if (modifikator != 0) {
                                text += `Modifikator: ${modifikator}\n`
                            }
                        }

                        // Get roll mode
                        let rollmode = game.settings.get('core', 'rollMode')
                        if (dialogResponseHtml.find(`#rollMode-${dialogId}`).length > 0) {
                            rollmode = dialogResponseHtml.find(`#rollMode-${dialogId}`)[0].value
                        }

                        // Build the roll formula
                        const dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                        const formula = `${dice_form} + ${skillValue} + ${globalermod} + ${modifikator}`

                        const roll = new Roll(formula)
                        await roll.evaluate()

                        // Determine success (compare to attack roll, which is 28 for ranged)
                        const attackTotal = rollResult.roll.total || rollResult.roll._total || 0
                        const defenseTotal = roll.total
                        const success = defenseTotal >= attackTotal

                        // Create chat message for Akrobatik defense
                        const content = `
                            <div class="ilaris-defense-roll">
                                <h3>${label}</h3>
                                <p><strong>${actor.name}</strong> versucht auszuweichen</p>
                                ${
                                    text
                                        ? `<p style="font-size: 0.9em;">${text.replace(
                                              /\n/g,
                                              '<br>',
                                          )}</p>`
                                        : ''
                                }
                                <div class="dice-roll">
                                    <div class="dice-result">
                                        <div class="dice-formula">${roll.formula}</div>
                                        <div class="dice-total ${
                                            success ? 'success' : 'failure'
                                        }">${defenseTotal}</div>
                                    </div>
                                </div>
                                <p><strong>Angriffswurf:</strong> ${attackTotal}</p>
                                <p><strong>Ergebnis:</strong> ${
                                    success
                                        ? '✓ Erfolgreich ausgewichen!'
                                        : '✗ Ausweichen fehlgeschlagen'
                                }</p>
                            </div>
                        `

                        await ChatMessage.create({
                            speaker: speaker,
                            content: content,
                            sound: CONFIG.sounds.dice,
                            rollMode: rollmode,
                        })
                    },
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Abbrechen',
                    callback: () => {
                        // Re-enable buttons if cancelled
                        allButtons.prop('disabled', false)
                    },
                },
            },
        },
        {
            jQuery: true,
        },
    )
    d.render(true)
}

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

                // Handle Akrobatik defense (skill-based, not weapon-based)
                if (weaponId === 'akrobatik') {
                    await handleAkrobatikDefense(actor, rollResult, html)
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
                chatMessage.addClass('defense-handled')

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
