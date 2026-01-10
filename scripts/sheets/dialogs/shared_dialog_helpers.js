import { signed } from '../../common/wuerfel/chatutilities.js'
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
        const ruhigeHand = rollValues.context.item?.system?.manoever?.fm_zlen?.ruhige_hand
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
                rollValues.schaden = `(${rollValues.schaden})*${value}`
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
            rollValues.damageType = CONFIG.ILARIS.schadenstypen[modification.value]
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
    // If the current user doesn't have permission to update the target actor,
    // request the GM to do it via socket
    const targetActor = game.actors.get(target.actorId || target._id)
    if (!targetActor) {
        ui.notifications.error('Zielakteur wurde nicht gefunden.')
        return
    }

    // Check if current user can update the target actor
    if (!targetActor.canUserModify(game.user, 'update')) {
        // User doesn't have permission - send socket request to GM
        if (game.user.isGM) {
            // This shouldn't happen, but just in case
            console.error('GM user cannot update actor - this should not occur')
            return
        }

        // Emit socket event for GM to handle
        game.socket.emit('system.Ilaris', {
            type: 'applyDamage',
            data: {
                targetActorId: targetActor.id,
                damage: damage,
                damageType: damageType,
                trueDamage: trueDamage,
                speaker: speaker,
            },
        })

        // Notify the player that the request was sent
        ui.notifications.info(`Schadensanfrage an Spielleiter gesendet für ${targetActor.name}...`)
        return
    }

    // User has permission - apply damage directly
    await _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker)
}

/**
 * Internal function that actually applies the damage to an actor
 * This is called either directly if user has permission, or by GM via socket
 * Exported so it can be called by the socket handler in hooks.js
 */
export async function _applyDamageDirectly(targetActor, damage, damageType, trueDamage, speaker) {
    // Get WS and WS* of the target
    const useLepSystem = game.settings.get(
        ConfigureGameSettingsCategories.Ilaris,
        IlarisGameSettingNames.lepSystem,
    )
    const ws = targetActor.system.abgeleitete.ws
    const ws_stern = targetActor.system.abgeleitete.ws_stern

    let woundsToAdd = trueDamage ? Math.floor(damage / ws) : Math.floor(damage / ws_stern)

    if (useLepSystem) {
        woundsToAdd = trueDamage ? damage : damage - ws_stern

        if (woundsToAdd > 0) {
            await targetActor.update({
                [`system.gesundheit.wunden`]: currentValue + woundsToAdd,
            })

            // Send a message to chat
            await ChatMessage.create({
                content: `${targetActor.name} erleidet Schaden! (${
                    damageType ? CONFIG.ILARIS.schadenstypen[damageType] : ''
                })`,
                speaker: speaker,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            })
        }
    } else {
        // Calculate wounds based on whether it's true damage

        if (woundsToAdd > 0) {
            // Get current value and update the appropriate stat based on damage type
            const currentValue =
                damageType === 'STUMPF'
                    ? targetActor.system.gesundheit.erschoepfung || 0
                    : targetActor.system.gesundheit.wunden || 0

            await targetActor.update({
                [`system.gesundheit.${damageType === 'STUMPF' ? 'erschoepfung' : 'wunden'}`]:
                    currentValue + woundsToAdd,
            })

            // Send a message to chat
            await ChatMessage.create({
                content: `${targetActor.name} erleidet ${woundsToAdd} Einschränkung${
                    woundsToAdd > 1 ? 'en' : ''
                }! (${
                    damageType ? CONFIG.ILARIS.schadenstypen[damageType] : ''
                } Schaden: ${damage})`,
                speaker: speaker,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            })
        } else {
            // Send a message when damage wasn't high enough
            await ChatMessage.create({
                content: `${targetActor.name} erleidet keine Einschränkungen - der Schaden (${damage}) war nicht hoch genug.`,
                speaker: speaker,
                type: CONST.CHAT_MESSAGE_STYLES.OTHER,
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
        originalRessourceCost,
    ]
}
