import { signed } from '../../dice/chatutilities.js'
import {
    ConfigureGameSettingsCategories,
    IlarisGameSettingNames,
} from '../../settings/configure-game-settings.model.js'

const DEFAULT_DAMAGE_TYPE_BEHAVIOR = {
    healing: false,
    targetsErschoepfung: false,
    bypassesArmor: false,
}
let cachedDamageTypesRaw
let cachedDamageTypes = []
const warnedDamageTypes = new Set()

/**
 * Returns the behavior flags configured for a damage type.
 *
 * @param {string} damageType - The configured damage type key
 * @returns {{healing: boolean, targetsErschoepfung: boolean, bypassesArmor: boolean}}
 */
export function getDamageTypeBehavior(damageType) {
    // 'NORMAL' is the dialogs' legacy "no specific type" sentinel (CONFIG.ILARIS.schadenstypen
    // maps it to an empty label). It is intentionally not part of the configurable registry.
    if (!damageType || damageType === 'NORMAL') {
        return { ...DEFAULT_DAMAGE_TYPE_BEHAVIOR }
    }

    try {
        const raw = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.damageTypes,
        )
        if (raw !== cachedDamageTypesRaw) {
            const parsed = JSON.parse(raw || '[]')
            cachedDamageTypes = Array.isArray(parsed) ? parsed : []
            cachedDamageTypesRaw = raw
        }
    } catch (error) {
        console.warn('Ilaris | Failed to parse damageTypes setting:', error)
        cachedDamageTypes = []
    }

    const configuredType = cachedDamageTypes.find((type) => type.value === damageType)
    if (!configuredType && !warnedDamageTypes.has(damageType)) {
        warnedDamageTypes.add(damageType)
        ui?.notifications?.warn(
            `Schadenstyp "${damageType}" existiert nicht in den Einstellungen. ` +
                'Standard (Profan / Wunden) wird verwendet.',
        )
    }

    return {
        healing: configuredType?.behavior?.healing ?? DEFAULT_DAMAGE_TYPE_BEHAVIOR.healing,
        targetsErschoepfung:
            configuredType?.behavior?.targetsErschoepfung ??
            DEFAULT_DAMAGE_TYPE_BEHAVIOR.targetsErschoepfung,
        bypassesArmor:
            configuredType?.behavior?.bypassesArmor ?? DEFAULT_DAMAGE_TYPE_BEHAVIOR.bypassesArmor,
    }
}
/**
 * Applies the specified operator to the current value
 * @param {number} currentValue - The current value to modify
 * @param {number} value - The value to apply
 * @param {string} operator - The operator to use (DIVIDE, MULTIPLY, ADD, SUBTRACT)
 * @returns {number} The result of the operation
 */
export function applyOperator(currentValue, value, operator) {
    switch (operator) {
        case 'DIVIDE':
            return Math.ceil(currentValue / value)
        case 'MULTIPLY':
            return Math.ceil(currentValue * value)
        case 'ADD':
            return currentValue + value
        case 'SUBTRACT':
            return currentValue - value
    }
}

/**
 * Processes a single modification and updates the rollValues object.
 * @param {Object} modification - The modification object.
 * @param {number} number - The multiplier for the modification value.
 * @param {string} manoeverName - The name of the maneuver.
 * @param {string|null} trefferzone - The hit zone (optional).
 * @param {Object} rollValues - The object containing roll values to be updated.
 * @param {number} originalRessourceCost - The original resource cost.
 * @returns {Object} Object containing updated rollValues and originalRessourceCost.
 */
export function processModification(
    modification,
    number,
    manoeverName,
    trefferzone,
    rollValues,
    originalRessourceCost,
) {
    let value = modification.value
    let targetValue = 0

    if (modification.target) {
        const path = modification.target.split('.')
        targetValue = rollValues.context // Assuming context is passed in rollValues
        for (const key of path) {
            if (targetValue && targetValue[key] !== undefined) {
                targetValue = targetValue[key]
            } else {
                targetValue = 0
                break
            }
        }
        if (!isNaN(targetValue)) {
            value += Number(targetValue)
        }
    }
    value = modification.affectedByInput ? number * value : value

    // Special case for "Zielen" with "Ruhige Hand"
    let isZielenMitRuhigeHand = false
    if (manoeverName === 'Zielen' && rollValues.context) {
        const ruhigeHand = rollValues.context.actor?.vorteil?.kampf?.find(
            (vorteil) => vorteil.name === 'Ruhige Hand',
        )
        if (ruhigeHand && modification.type === 'ATTACK') {
            value = value * 2 // Double the bonus with Ruhige Hand
            isZielenMitRuhigeHand = true
        }
    }

    let text
    switch (modification.operator) {
        case 'DIVIDE':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${signed(value)} / \n`
            break
        case 'MULTIPLY':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${signed(value)} * \n`
            break
        case 'ADD':
            text = `${manoeverName}${isZielenMitRuhigeHand ? ' (Ruhige Hand)' : ''}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${signed(value)}\n`
            break
        case 'SUBTRACT':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: -${value}\n`
            break
    }

    switch (modification.type) {
        case 'ATTACK':
            rollValues.mod_at = applyOperator(rollValues.mod_at, value, modification.operator)
            rollValues.text_at = rollValues.text_at.concat(text)
            break
        case 'DAMAGE':
            rollValues.mod_dm = applyOperator(rollValues.mod_dm, value, modification.operator)
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'DEFENCE':
            rollValues.mod_vt = applyOperator(rollValues.mod_vt, value, modification.operator)
            rollValues.text_vt = rollValues.text_vt.concat(text)
            break
        case 'WEAPON_DAMAGE':
            if (modification.operator === 'ADD' || modification.operator === 'SUBTRACT') {
                rollValues.schaden = rollValues.schaden.concat(
                    `${modification.operator === 'SUBTRACT' ? '-' : '+'}${value}`,
                )
                text = `${manoeverName}${
                    trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
                }: ${
                    modification.operator === 'SUBTRACT' ? '-' + value : signed(value)
                } Waffenschaden\n`
            } else if (modification.operator === 'DIVIDE') {
                rollValues.schaden = `(${rollValues.schaden})/${value}`
                text = `${manoeverName}${
                    trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
                }: ${value} / Waffenschaden\n`
            } else {
                const expandWeaponDamageMultipliers = game.settings.get(
                    ConfigureGameSettingsCategories.Ilaris,
                    IlarisGameSettingNames.expandWeaponDamageMultipliers,
                )
                if (expandWeaponDamageMultipliers) {
                    try {
                        rollValues.schaden = new Roll(rollValues.schaden).alter(value, 0, {
                            multiplyNumeric: true,
                        }).formula
                    } catch (error) {
                        console.warn(
                            'Ilaris | Failed to expand weapon damage multiplier formula:',
                            error,
                        )
                        rollValues.schaden = `(${rollValues.schaden})*${value}`
                    }
                } else {
                    rollValues.schaden = `(${rollValues.schaden})*${value}`
                }
                text = `${manoeverName}${
                    trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
                }: ${value} * Waffenschaden\n`
            }
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'ZERO_DAMAGE':
            rollValues.schaden = '0'
            rollValues.mod_dm = 0
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: Kein Schaden\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'CHANGE_DAMAGE_TYPE':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: Schadenstyp zu ${CONFIG.ILARIS.schadenstypen[modification.value]}\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            // Keep the key ('STUMPF'), not the label ('Stumpf') — getDamageTypeBehavior and
            // the damageTypes setting match on keys.
            rollValues.damageType = modification.value
            break
        case 'ARMOR_BREAKING':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: Ignoriert Rüstung\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            rollValues.trueDamage = true
            break
        case 'SPECIAL_TEXT':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${modification.value}\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'SPECIAL_RESOURCE':
            let result
            if (modification.operator === 'SET') {
                result = value
                rollValues.mod_energy = result
                originalRessourceCost = result
            } else if (modification.operator === 'MULTIPLY') {
                result = originalRessourceCost * value
                if (value < 1) {
                    result = Math.ceil(result) * -1
                } else {
                    result = Math.ceil(result) - originalRessourceCost
                }
                rollValues.mod_energy = rollValues.mod_energy + result
            } else if (modification.operator === 'DIVIDE') {
                result = originalRessourceCost / value
                if (value < 1) {
                    result = Math.ceil(result) - originalRessourceCost
                } else {
                    result = Math.ceil(result) * -1
                }
                rollValues.mod_energy = rollValues.mod_energy + result
            } else {
                result = value
                rollValues.mod_energy = applyOperator(
                    rollValues.mod_energy,
                    value,
                    modification.operator,
                )
            }

            if (modification.operator === 'SET') {
                text = `${manoeverName}: Setzt die Basiskosten auf ${result} Energie\n`
            } else {
                text = `${manoeverName}${
                    trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
                }: ${
                    modification.operator === 'SUBTRACT' ? '-' + result : signed(result)
                } Energiekosten\n`
            }
            rollValues.text_energy = rollValues.text_energy.concat(text)
            break
        case 'DURATION':
            rollValues.durationBonus =
                (rollValues.durationBonus || 0) +
                (modification.operator === 'ADD'
                    ? value
                    : modification.operator === 'MULTIPLY'
                      ? value
                      : 0)
            text = `${manoeverName}: Wirkungsdauer ${
                modification.operator === 'ADD' ? '+' + value : '×' + value
            }\n`
            rollValues.text_energy = rollValues.text_energy.concat(text)
            break
        case 'MAECHTIGE_MAGIE':
            rollValues.maechtigeMagieQs = (rollValues.maechtigeMagieQs || 0) + (value || 1)
            text = `${manoeverName}: Mächtige Magie QS +${value || 1}\n`
            rollValues.text_at = rollValues.text_at.concat(text)
            break
    }

    return { rollValues, originalRessourceCost }
}

/**
 * Applies damage to a target actor and calculates wounds based on WS*
 * @param {Object} target - The target object containing actorId
 * @param {number} damage - The total damage to apply
 * @param {string} damageType - The type of damage being dealt
 * @param {boolean} trueDamage - If true, damage ignores WS* calculation
 * @param {Object} speaker - The speaker object for chat messages
 */
export async function applyDamageToTarget(
    target,
    damage,
    damageType = 'PROFAN',
    trueDamage = false,
    speaker,
) {
    await routeDamageToOwner(target, damage, damageType, trueDamage, speaker)
}

/**
 * Resolve the concrete actor document that should receive damage.
 * For unlinked tokens, this prefers the token actor instance.
 *
 * @param {Object} target - Target payload from dialog selection
 * @returns {{ targetActor: Actor|null, targetToken: Token|null, actorLink: boolean }}
 */
export function resolveTargetActorForDamage(target) {
    const targetToken = target?.tokenId ? canvas?.tokens?.get(target.tokenId) : null
    const actorLink = target?.actorLink ?? targetToken?.document?.actorLink ?? true

    const targetActor =
        !actorLink && targetToken?.actor
            ? targetToken.actor
            : game.actors.get(target?.actorId || target?._id) || targetToken?.actor

    return { targetActor, targetToken, actorLink }
}

/**
 * Select the responsible active user who should execute a damage update.
 * Priority: active non-GM OWNER -> active GM -> requesting user (if possible).
 *
 * @param {Actor|null} targetActor - Actor that should receive damage
 * @returns {string|null} User id of executor, or null when no eligible user exists
 */
export function resolveDamageExecutorUserId(targetActor) {
    if (!targetActor) return null

    const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    const activeNonGmOwners = game.users
        .filter(
            (user) =>
                user.active &&
                !user.isGM &&
                targetActor.testUserPermission(user, ownerLevel, { exact: false }),
        )
        .sort((a, b) => a.id.localeCompare(b.id))

    if (activeNonGmOwners.length > 0) {
        return activeNonGmOwners[0].id
    }

    const activeGms = game.users
        .filter((user) => user.active && user.isGM)
        .sort((a, b) => a.id.localeCompare(b.id))

    if (activeGms.length > 0) {
        return activeGms[0].id
    }

    if (targetActor.canUserModify(game.user, 'update')) {
        return game.user.id
    }

    return null
}

/**
 * Route damage handling to the responsible owner client via socket event.
 *
 * @param {Object} target - The target object containing actor/token reference
 * @param {number} damage - The total damage to apply
 * @param {string} damageType - The type of damage being dealt
 * @param {boolean} trueDamage - If true, damage ignores WS* calculation
 * @param {Object} speaker - The speaker object for chat messages
 */
export async function routeDamageToOwner(
    target,
    damage,
    damageType = 'PROFAN',
    trueDamage = false,
    speaker,
) {
    const { targetActor, actorLink } = resolveTargetActorForDamage(target)

    if (!targetActor) {
        ui.notifications.error('Zielakteur wurde nicht gefunden.')
        return
    }

    const eventId = foundry.utils.randomID(16)
    const executorUserId = resolveDamageExecutorUserId(targetActor)

    if (!executorUserId) {
        ui.notifications.error(
            `Schaden konnte nicht angewendet werden: Kein berechtigter Benutzer online für ${targetActor.name}.`,
        )
        return
    }

    const payload = {
        eventId,
        executorUserId,
        requesterUserId: game.user.id,
        timestamp: Date.now(),
        target: {
            actorId: target?.actorId || target?._id || targetActor.id,
            tokenId: target?.tokenId || null,
            actorLink,
        },
        damage,
        damageType,
        trueDamage,
        speaker,
    }

    game?.socket?.emit('system.Ilaris', {
        type: 'applyDamageByOwner',
        data: payload,
    })

    if (executorUserId === game.user.id) {
        if (!window._ilarisProcessedDamageEvents) {
            window._ilarisProcessedDamageEvents = new Set()
        }
        window._ilarisProcessedDamageEvents.add(eventId)
        await _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker)
    } else {
        ui.notifications.info(`Schadensanfrage gesendet: ${targetActor.name}`)
    }
}

/**
 * Internal function that actually applies the damage to an actor
 * This is called either directly if user has permission, or by GM via socket
 * Exported so it can be called by the socket handler in hooks.js
 */
export async function _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker) {
    const behavior = getDamageTypeBehavior(damageType)
    const healthKey = behavior.targetsErschoepfung ? 'erschoepfung' : 'wunden'
    const statKey = `system.gesundheit.${healthKey}`
    const ignoresArmor = trueDamage || behavior.bypassesArmor
    const damageTypeLabel = CONFIG.ILARIS.schadenstypen[damageType] ?? 'Profan'

    // Get WS and WS* of the target
    const useLepSystem = game.settings.get(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisGameSettingNames.lepSystem,
    )
    let ws = targetActor.system.abgeleitete.ws
    let ws_stern = targetActor.system.abgeleitete.ws_stern ?? ws

    if (targetActor.type === 'kreatur') {
        ws = targetActor.system.kampfwerte.ws
        ws_stern = targetActor.system.kampfwerte.ws_stern ?? targetActor.system.kampfwerte.ws
    }

    // Calculate wounds: Damage must be STRICTLY GREATER than WS to cause wounds
    // Formula: Math.floor((damage - 1) / ws) counts how many full WS thresholds are exceeded
    // Examples with WS=5: damage=5 -> 0 wounds, damage=6 -> 1 wound, damage=10 -> 1 wound,
    //                     damage=11 -> 2 wounds, damage=16 -> 3 wounds
    // The (damage - 1) shift ensures damage must exceed WS, not just equal it

    // --- Healing branch ---
    if (behavior.healing) {
        const healAmount = Math.max(0, damage)

        if (useLepSystem && !behavior.targetsErschoepfung) {
            // Under LEP, gesundheit.wunden accumulates raw damage points (see the LEP damage
            // branch below and hp = max_hp - wunden in actor.js), so healing removes from it.
            const currentDamage = targetActor.system.gesundheit.wunden || 0
            const newDamage = Math.max(0, currentDamage - healAmount)
            if (newDamage < currentDamage) {
                await targetActor.update({ 'system.gesundheit.wunden': newDamage })
                await ChatMessage.create({
                    content: `${targetActor.name} erhält ${currentDamage - newDamage} Heilung!`,
                    speaker: speaker,
                    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                })
            }
        } else {
            const currentValue = targetActor.system.gesundheit[healthKey] || 0
            const woundsToRemove = healAmount > ws ? Math.floor((healAmount - 1) / ws) : 0

            if (woundsToRemove > 0) {
                const newValue = Math.max(0, currentValue - woundsToRemove)
                await targetActor.update({ [statKey]: newValue })
                await ChatMessage.create({
                    content: `${targetActor.name} heilt ${woundsToRemove} Einschränkung${
                        woundsToRemove > 1 ? 'en' : ''
                    }! (Heilung: ${healAmount})`,
                    speaker: speaker,
                    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                })
            } else {
                await ChatMessage.create({
                    content: `${targetActor.name} erhält keine Heilung - die Heilung (${healAmount}) war nicht hoch genug (WS ${ws}).`,
                    speaker: speaker,
                    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                })
            }
        }
        return
    }

    const damageAmount = Math.max(0, damage)
    let woundsToAdd = ignoresArmor
        ? damageAmount > ws
            ? Math.floor((damageAmount - 1) / ws)
            : 0
        : damageAmount > ws_stern
          ? Math.floor((damageAmount - 1) / ws_stern)
          : 0

    if (useLepSystem && !behavior.targetsErschoepfung) {
        woundsToAdd = ignoresArmor ? damageAmount : damageAmount - ws_stern

        if (woundsToAdd > 0) {
            await targetActor.update({
                [`system.gesundheit.wunden`]:
                    (targetActor.system.gesundheit.wunden || 0) + woundsToAdd,
            })

            // Send a message to chat
            await ChatMessage.create({
                content: `${targetActor.name} erleidet ${woundsToAdd} Schaden! (${
                    damageTypeLabel
                })`,
                speaker: speaker,
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            })
        }
    } else {
        // Calculate wounds based on whether it's true damage

        if (woundsToAdd > 0) {
            // Get current value and update the appropriate stat based on damage type
            const currentValue = targetActor.system.gesundheit[healthKey] || 0

            await targetActor.update({
                [statKey]: currentValue + woundsToAdd,
            })

            // Send a message to chat
            await ChatMessage.create({
                content: `${targetActor.name} erleidet ${woundsToAdd} Einschränkung${
                    woundsToAdd > 1 ? 'en' : ''
                }! (${damageTypeLabel} Schaden: ${damage})`,
                speaker: speaker,
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            })
        } else {
            // Send a message when damage wasn't high enough
            await ChatMessage.create({
                content: `${targetActor.name} erleidet keine Einschränkungen - der Schaden (${damage}) war nicht hoch genug.`,
                speaker: speaker,
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            })
        }
    }
}

/**
 * Handles multiple modifications and updates roll values accordingly.
 * @param {Object} allModifications - The modifications to be processed.
 * @param {Object} rollValues - The object containing roll values to be updated.
 * @returns {Array} Updated roll values.
 */
export function handleModifications(allModifications, rollValues) {
    // Sort all modifications by operator type
    allModifications.sort((a, b) => {
        const operatorOrder = { ADD: 0, SUBTRACT: 0, SET: 0, MULTIPLY: 1, DIVIDE: 1 }
        return operatorOrder[a.modification.operator] - operatorOrder[b.modification.operator]
    })

    // First check for ZERO_DAMAGE
    allModifications.forEach(({ modification, manoever }) => {
        if (modification.type === 'ZERO_DAMAGE') {
            rollValues.nodmg.name = manoever.name
            rollValues.nodmg.value = true
        }
    })

    let originalRessourceCost = rollValues.mod_energy || 0
    // Process all modifications in sorted order
    allModifications.forEach(
        ({ modification, manoever: dynamicManoever, number, check, trefferZoneInput }) => {
            let result
            if ((check && number) || number) {
                result = processModification(
                    modification,
                    number,
                    dynamicManoever.name,
                    null,
                    rollValues,
                    originalRessourceCost,
                )
                rollValues = result.rollValues
                originalRessourceCost = result.originalRessourceCost
            } else if (check) {
                result = processModification(
                    modification,
                    1,
                    dynamicManoever.name,
                    null,
                    rollValues,
                    originalRessourceCost,
                )
                rollValues = result.rollValues
                originalRessourceCost = result.originalRessourceCost
            } else if (trefferZoneInput) {
                rollValues.trefferzone = trefferZoneInput
                result = processModification(
                    modification,
                    1,
                    dynamicManoever.name,
                    trefferZoneInput,
                    rollValues,
                    originalRessourceCost,
                )
                rollValues = result.rollValues
                originalRessourceCost = result.originalRessourceCost
            }
        },
    )

    return [
        rollValues.mod_at,
        rollValues.mod_vt,
        rollValues.mod_dm,
        rollValues.mod_energy,
        rollValues.text_at,
        rollValues.text_vt,
        rollValues.text_dm,
        rollValues.text_energy,
        rollValues.trefferzone,
        rollValues.schaden,
        rollValues.nodmg,
        rollValues.damageType,
        rollValues.trueDamage,
        rollValues.durationBonus || 0,
        rollValues.maechtigeMagieQs || 0,
        originalRessourceCost,
    ]
}
