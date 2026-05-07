import {
    applyDamageToTarget,
    resolveDamageExecutorUserId,
    resolveTargetActorForDamage,
} from '../dialogs/shared-dialog-helpers.js'
import {
    IlarisAutomatisierungSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'

/**
 * Hook handler for `Ilaris.postAngriff`.
 *
 * Dispatches defense prompts (as whispered chat messages) to all selected
 * target actors after an attack roll has been posted to chat.
 *
 * Previously this logic lived in `CombatDialog.handleTargetSelection`.
 *
 * @param {object} rollResult - The evaluated attack roll result.
 * @param {CombatDialog} dialog  - The dialog that fired the hook.
 */
async function handlePostAngriff(rollResult, dialog) {
    const useTargetSelection = game.settings.get(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisAutomatisierungSettingNames.useTargetSelection,
    )
    if (!useTargetSelection) return

    if (!dialog.selectedActors || dialog.selectedActors.length === 0) return

    const attackType = dialog.attackType

    // For ranged attacks only dispatch when the attack was successful;
    // for melee always dispatch.
    if (!((rollResult.success && attackType === 'ranged') || attackType === 'melee')) return

    for (const target of dialog.selectedActors) {
        const { targetActor } = resolveTargetActorForDamage(target)
        if (!targetActor) continue

        let weapons = []

        if (
            targetActor.type === 'kreatur' &&
            targetActor.angriffe &&
            Array.isArray(targetActor.angriffe)
        ) {
            weapons = targetActor.angriffe
            if (attackType === 'ranged') {
                weapons = weapons.filter((weapon) =>
                    weapon.system?.eigenschaften?.find((eig) => eig.name === 'Schild'),
                )
            }
        } else {
            const mainWeapon = targetActor.items.find(
                (item) => item.type === 'nahkampfwaffe' && item.system.hauptwaffe === true,
            )
            const secondaryWeapon = targetActor.items.find(
                (item) =>
                    item.type === 'nahkampfwaffe' &&
                    item.system.nebenwaffe === true &&
                    (!mainWeapon || item.id !== mainWeapon.id),
            )

            if (mainWeapon) weapons.push(mainWeapon)
            if (secondaryWeapon) weapons.push(secondaryWeapon)

            if (attackType === 'ranged') {
                weapons = weapons.filter((weapon) => weapon.system?.eigenschaften?.schild === true)
            }
        }

        let buttonsHtml = ''
        for (const weapon of weapons) {
            buttonsHtml += `
                <button class="defend-button" data-actor-id="${
                    targetActor.id
                }" data-weapon-id="${weapon.id}" data-distance="${
                    target.distance
                }" data-attacker-id="${
                    dialog.actor.id
                }" data-attack-type="${attackType}" data-roll-result='${encodeURIComponent(
                    JSON.stringify(rollResult, (key, value) =>
                        typeof value === 'function' ? undefined : value,
                    ),
                )}'>
                    <i class="fas fa-shield-alt"></i>
                    Verteidigen mit ${weapon.name}
                </button>`
        }

        // Akrobatik defense button for ranged attacks
        if (attackType === 'ranged') {
            buttonsHtml += `
                <button class="defend-button defend-akrobatik" data-actor-id="${
                    targetActor.id
                }" data-weapon-id="akrobatik" data-distance="${
                    target.distance
                }" data-attacker-id="${
                    dialog.actor.id
                }" data-attack-type="${attackType}" data-roll-result='${encodeURIComponent(
                    JSON.stringify(rollResult, (key, value) =>
                        typeof value === 'function' ? undefined : value,
                    ),
                )}'>
                    <i class="fas fa-running"></i>
                    Verteidigen mit Akrobatik
                </button>`
        }

        if (!buttonsHtml) {
            buttonsHtml = '<p style="color: #aa0000;">Keine Haupt- oder Nebenwaffe gefunden.</p>'
        }

        const content = `
            <div class="defense-prompt" style="padding: 10px;">
                <p>${dialog.actor.name} greift dich mit ${dialog.item.name} an!</p>
                <p>Entfernung: ${target.distance} Distanz</p>
                <div class="defense-buttons" style="display: flex; flex-wrap: wrap;">
                    ${buttonsHtml}
                </div>
            </div>
        `

        await routeDefensePromptToOwner(targetActor, content)
    }
}

/**
 * Route a defense prompt to the responsible owner client.
 *
 * @param {Actor} targetActor - Defender actor
 * @param {string} content - Chat message HTML
 */
async function routeDefensePromptToOwner(targetActor, content) {
    const executorUserId = resolveDamageExecutorUserId(targetActor)
    if (!executorUserId) {
        ui.notifications.warn(
            `Keine berechtigte aktive Benutzerinstanz fuer Verteidigung von ${targetActor.name} gefunden.`,
        )
        return
    }

    const whisperUserIds = getDefensePromptWhisperRecipients(executorUserId)
    const eventId = foundry.utils.randomID(16)

    const payload = {
        eventId,
        executorUserId,
        targetActorId: targetActor.id,
        content,
        whisperUserIds,
    }

    game?.socket?.emit('system.Ilaris', {
        type: 'createDefensePromptByOwner',
        data: payload,
    })

    if (executorUserId === game.user.id) {
        await handleDefensePromptSocketEvent(payload)
    }
}

/**
 * Build whisper recipients for defense prompts.
 * Includes designated executor and all active GMs.
 *
 * @param {string} executorUserId - Selected owner executor
 * @returns {string[]} Recipient user ids
 */
function getDefensePromptWhisperRecipients(executorUserId) {
    const recipients = new Set([executorUserId])
    for (const user of game.users) {
        if (user.active && user.isGM) {
            recipients.add(user.id)
        }
    }
    return Array.from(recipients)
}

/**
 * Handle defense prompt socket event on the designated client.
 *
 * @param {Object} data - Socket payload
 */
export async function handleDefensePromptSocketEvent(data) {
    const { eventId, executorUserId, targetActorId, content, whisperUserIds } = data || {}
    if (!eventId || !executorUserId || !targetActorId || !content) return
    if (executorUserId !== game.user.id) return

    if (!window._ilarisProcessedDefensePromptEvents) {
        window._ilarisProcessedDefensePromptEvents = new Set()
    }
    if (window._ilarisProcessedDefensePromptEvents.has(eventId)) return
    window._ilarisProcessedDefensePromptEvents.add(eventId)

    if (window._ilarisProcessedDefensePromptEvents.size > 1000) {
        const iterator = window._ilarisProcessedDefensePromptEvents.values()
        const first = iterator.next().value
        window._ilarisProcessedDefensePromptEvents.delete(first)
    }

    await ChatMessage.create({
        speaker: { alias: 'Combat System' },
        content,
        whisper: whisperUserIds?.length ? whisperUserIds : ChatMessage.getWhisperRecipients('GM'),
        flags: {
            Ilaris: {
                defensePrompt: true,
                targetActorId,
                defensePromptEventId: eventId,
            },
        },
    })
}

/**
 * Hook handler for `Ilaris.postSchaden`.
 *
 * Applies the damage roll result to all selected target actors.
 *
 * Previously this logic lived inline in `AngriffDialog._schadenKlick` and
 * `FernkampfAngriffDialog._schadenKlick`.
 *
 * @param {object} rollResult - The evaluated damage roll result.
 * @param {CombatDialog} dialog  - The dialog that fired the hook.
 */
async function handlePostSchaden(rollResult, dialog) {
    if (!dialog.selectedActors || dialog.selectedActors.length === 0) return

    for (const target of dialog.selectedActors) {
        await applyDamageToTarget(
            target,
            rollResult.roll.total,
            dialog.damageType,
            dialog.trueDamage,
            dialog.speaker,
        )
    }
}

/**
 * Register all combat-dialog hook handlers.
 *
 * Call this once during system initialisation (from `scripts/combat/hooks.js`).
 * Each handler is registered exactly once via a guard flag.
 */
export function registerCombatDialogHandlers() {
    if (window._ilarisCombatDialogHandlersRegistered) return
    window._ilarisCombatDialogHandlersRegistered = true

    Hooks.on('Ilaris.postAngriff', handlePostAngriff)
    Hooks.on('Ilaris.postSchaden', handlePostSchaden)
}
