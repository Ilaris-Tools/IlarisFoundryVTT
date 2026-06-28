import { AngriffDialog } from './dialogs/angriff.js'
import { FernkampfAngriffDialog } from './dialogs/fernkampf-angriff.js'
import { UebernatuerlichDialog } from './dialogs/uebernatuerlich.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../settings/configure-game-settings.model.js'
import { callIlarisHookWithGlobalMirror } from './hooks/global_combat_hooks.js'

/**
 * Opens a combat dialog for the given actor and item.
 *
 * Fires the cancellable `Ilaris.preCombatDialog` hook before opening.
 * If any registered handler returns `false`, the dialog is not opened and
 * `null` is returned.
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {'melee'|'ranged'|'supernatural'} type
 * @param {object} [options={}]
 * @returns {Promise<CombatDialog|null>}
 */
export async function openCombatDialog(actor, item, type, options = {}) {
    if (
        callIlarisHookWithGlobalMirror('Ilaris.preCombatDialog', actor, item, type, options) ===
        false
    )
        return null

    let d
    if (type === 'melee') {
        d = new AngriffDialog(actor, item, options)
    } else if (type === 'ranged') {
        d = new FernkampfAngriffDialog(actor, item, options)
    } else if (type === 'supernatural') {
        d = new UebernatuerlichDialog(actor, item, options)
    } else {
        throw new Error(`[Ilaris] openCombatDialog: Unknown type "${type}"`)
    }

    await d.render(true)
    return d
}

/**
 * Handles Akrobatik-based defense (dodging ranged attacks).
 *
 * Manages its own UI state (button disabling/re-enabling on cancel).
 * Moved from `dialogs/defense_button_hook.js` so that `defense_button_hook.js`
 * only performs UI-event delegation.
 *
 * @param {Actor} actor - The defending actor.
 * @param {object} rollResult - The attack roll result.
 * @param {HTMLElement} html - The chat message HTML element containing the defense buttons.
 * @returns {Promise<void>}
 */
export async function handleAkrobatikDefense(actor, rollResult, html) {
    // Disable all buttons and mark the prompt as handled
    const chatMessage = html.closest('.chat-message')
    chatMessage.classList.remove('ilaris-defense-prompt-highlight')
    chatMessage.classList.add('defense-handled')

    const allButtons = html.querySelectorAll('.defend-button')
    allButtons.forEach((button) => (button.disabled = true))

    // Get the talent from settings or default to Akrobatik
    const talentUuid = game.settings.get(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisGameSettingNames.defaultRangedDodgeTalent,
    )

    let talentName = 'Akrobatik'
    let fertigkeitName = 'Athletik'
    let selectedAttribute = null

    if (typeof talentUuid === 'string' && talentUuid.startsWith('attribute:')) {
        selectedAttribute = talentUuid.replace('attribute:', '')
        talentName = `Attribut ${selectedAttribute}`
        fertigkeitName = ''
    }

    if (talentUuid && !selectedAttribute) {
        try {
            const talentItem = await fromUuid(talentUuid)
            if (talentItem) {
                talentName = talentItem.name
                fertigkeitName = talentItem.system?.fertigkeit || 'Athletik'
            }
        } catch (e) {
            console.warn('Failed to load talent from UUID:', talentUuid, e)
        }
    }

    let skillValue = 0
    let label = `Ausweichen mit ${talentName}`

    if (selectedAttribute) {
        const attributeData = actor.system?.attribute?.[selectedAttribute]
        skillValue =
            attributeData?.kampfPw ??
            attributeData?.pw ??
            Math.floor((attributeData?.wert || 0) / 4)

        if (skillValue === undefined || skillValue === null) {
            ui.notifications.warn(`${actor.name} hat kein Attribut ${selectedAttribute}.`)
            return
        }
    }

    // Handle creatures differently - check freietalente
    if (actor.type === 'kreatur') {
        const dodgeTalent = actor.freietalente?.find(
            (t) => t.name === talentName || t.name === fertigkeitName,
        )

        if (!dodgeTalent) {
            ui.notifications.warn(`${actor.name} hat weder ${talentName} noch ${fertigkeitName}.`)
            return
        }

        skillValue = dodgeTalent.system?.pw || 0
    } else {
        // For regular actors, find the skill that contains the talent
        const skill = actor.profan?.fertigkeiten?.find((f) => f.name === fertigkeitName)

        if (!skill) {
            ui.notifications.warn(`${actor.name} hat keine ${fertigkeitName}-Fertigkeit.`)
            return
        }

        // Check if the actor has the talent
        const hasTalent = skill.system?.talente?.some((t) => t.name === talentName)

        // Use PWT if they have the talent, otherwise use PW
        skillValue = hasTalent ? skill.system.pwt || 0 : skill.system.pw || 0

        if (hasTalent) {
            label += ' (Talent)'
        }
    }

    const speaker = ChatMessage.getSpeaker({ actor: actor })
    const globalermod = actor.system?.abgeleitete?.globalermod || 0
    const dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // Show dialog for user to enter modifikator (e.g., multiple defenses malus)
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(
        'systems/Ilaris/scripts/dice/templates/probendiag_attribut.hbs',
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

    await foundry.applications.api.DialogV2.wait({
        window: { title: `Ausweichen mit ${talentName}` },
        content: dialogHtml,
        buttons: [
            {
                action: 'ok',
                icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                label: 'OK',
                default: true,
                callback: async (event, button, dialog) => {
                    let text = ''
                    let dice_number = 1
                    let discard_l = 0
                    let discard_h = 0

                    // Handle 3d20
                    const xd20Input = dialog.querySelector(`input[name="xd20-${dialogId}"]:checked`)
                    const xd20Value = xd20Input?.value
                    if (xd20Value === '1') {
                        dice_number = 3
                        discard_l = 1
                        discard_h = 1
                        text += '3W20 (höchster und niedrigster werden ignoriert)\n'
                    }

                    // Handle Schips
                    const schipsInput = dialog.querySelector(
                        `input[name="schips-${dialogId}"]:checked`,
                    )
                    const schipsValue = schipsInput?.value
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
                    const modInput = dialog.querySelector(`#modifikator-${dialogId}`)
                    if (modInput) {
                        modifikator = Number(modInput.value)
                        if (modifikator != 0) {
                            text += `Modifikator: ${modifikator}\n`
                        }
                    }

                    // Get roll mode
                    let rollmode = game.settings.get('core', 'rollMode')
                    const rollModeInput = dialog.querySelector(`#rollMode-${dialogId}`)
                    if (rollModeInput) {
                        rollmode = rollModeInput.value
                    }

                    // Build the roll formula
                    const dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                    const formula = `${dice_form} + ${skillValue} + ${globalermod} + ${modifikator}`

                    const roll = new Roll(formula)
                    await roll.evaluate()

                    // Determine success (compare to attack roll total)
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
            {
                action: 'cancel',
                icon: '<i class="fas fa-times"></i>',
                label: 'Abbrechen',
                callback: () => {
                    // Re-enable buttons if cancelled
                    allButtons.forEach((button) => (button.disabled = false))
                },
            },
        ],
        rejectClose: false,
    })
}

/**
 * Opens the appropriate defense dialog or skill check for a defense button click.
 *
 * Handles weapon resolution, roll modification for ranged attacks (fixed at 28),
 * and Akrobatik skill-based defense. Extracted from `defense_button_hook.js` so
 * that the hook module only performs UI-event delegation.
 *
 * @param {Actor}  actor          - The defending actor.
 * @param {Actor|null} attackingActor - The attacking actor (may be null).
 * @param {string} weaponId       - The weapon id to defend with, or `'akrobatik'`.
 * @param {object} rollResult     - The serialised attack roll result from the button's data attribute.
 * @param {string} attackType     - `'melee'` or `'ranged'`.
 * @param {HTMLElement} htmlDOM   - The chat message HTML element (needed for Akrobatik UI).
 * @returns {Promise<CombatDialog|null>}
 */
export async function openDefenseForTarget(
    actor,
    attackingActor,
    weaponId,
    rollResult,
    attackType,
    htmlDOM,
) {
    // Akrobatik defense manages its own UI state
    if (weaponId === 'akrobatik') {
        await handleAkrobatikDefense(actor, rollResult, htmlDOM)
        return null
    }

    // Weapon-based defense: resolve the weapon from the actor's inventory
    let weapon
    if (actor.type === 'kreatur' && actor.angriffe) {
        weapon = actor.angriffe.find((angriff) => angriff.id === weaponId)
    } else {
        weapon = actor.items.get(weaponId)
    }

    if (!weapon) {
        ui.notifications.warn('Die gewählte Waffe wurde nicht gefunden.')
        return null
    }

    // For ranged attacks in defense mode, the roll total is fixed at 28
    // per the Ilaris rulebook. Create a wrapper to avoid mutating the original.
    let effectiveRollResult = rollResult
    if (attackType === 'ranged') {
        effectiveRollResult = {
            ...rollResult,
            roll: {
                ...rollResult.roll,
                total: 28,
                _originalTotal: rollResult.roll.total || rollResult.roll._total,
            },
        }
    }

    return openCombatDialog(actor, weapon, 'melee', {
        isDefenseMode: true,
        attackingActor: attackingActor,
        attackRoll: effectiveRollResult,
    })
}
