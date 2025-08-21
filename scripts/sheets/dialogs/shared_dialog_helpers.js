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
 * @returns {Object} Updated rollValues.
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
            text = `${manoeverName}${
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
            break
        case 'ARMOR_BREAKING':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: Ignoriert Rüstung\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'SPECIAL_TEXT':
            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${modification.value}\n`
            rollValues.text_dm = rollValues.text_dm.concat(text)
            break
        case 'SPECIAL_RESOURCE':
            let result
            if (modification.operator === 'MULTIPLY') {
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

            text = `${manoeverName}${
                trefferzone ? ` (${CONFIG.ILARIS.trefferzonen[trefferzone]})` : ''
            }: ${
                modification.operator === 'SUBTRACT' ? '-' + result : signed(result)
            } Energiekosten\n`
            rollValues.text_energy = rollValues.text_energy.concat(text)
            break
    }

    return rollValues
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
        const operatorOrder = { ADD: 0, SUBTRACT: 0, MULTIPLY: 1, DIVIDE: 1 }
        return operatorOrder[a.modification.operator] - operatorOrder[b.modification.operator]
    })

    // First check for ZERO_DAMAGE
    allModifications.forEach(({ modification, manoever }) => {
        if (modification.type === 'ZERO_DAMAGE') {
            rollValues.nodmg.name = manoever.name
            rollValues.nodmg.value = true
        }
    })

    const originalRessourceCost = rollValues.mod_energy || 0
    // Process all modifications in sorted order
    allModifications.forEach(
        ({ modification, manoever: dynamicManoever, number, check, trefferZoneInput }) => {
            if ((check && number) || number) {
                processModification(
                    modification,
                    number,
                    dynamicManoever.name,
                    null,
                    rollValues,
                    originalRessourceCost,
                )
            } else if (check) {
                processModification(
                    modification,
                    1,
                    dynamicManoever.name,
                    null,
                    rollValues,
                    originalRessourceCost,
                )
            } else if (trefferZoneInput) {
                rollValues.trefferzone = trefferZoneInput
                processModification(
                    modification,
                    1,
                    dynamicManoever.name,
                    trefferZoneInput,
                    rollValues,
                )
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
    ]
}
