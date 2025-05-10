/**
 * Processes a single modification and updates the rollValues object.
 * @param {Object} modification - The modification object.
 * @param {number} number - The multiplier for the modification value.
 * @param {string} manoeverName - The name of the maneuver.
 * @param {string|null} trefferzone - The hit zone (optional).
 * @param {Object} rollValues - The object containing roll values to be updated.
 * @param {Object} config - The CONFIG object for localization.
 * @returns {Object} Updated rollValues.
 */
export function processModification(modification, number, manoeverName, trefferzone, rollValues, config) {
    let value = number * modification.value;
    let targetValue = 0;

    if (modification.target) {
        const path = modification.target.split('.');
        targetValue = rollValues.context; // Assuming context is passed in rollValues
        for (const key of path) {
            if (targetValue && targetValue[key] !== undefined) {
                targetValue = targetValue[key];
            } else {
                targetValue = 0;
                break;
            }
        }
        if (!isNaN(targetValue)) {
            value += Number(targetValue);
        }
    }

    let text = `${manoeverName}${trefferzone ? ` (${config.ILARIS.trefferzonen[trefferzone]})` : ''}: ${modification.operator === 'SUBTRACT' ? '-' + value : signed(value)}\n`;

    switch (modification.type) {
        case 'ATTACK':
            rollValues.mod_at += modification.operator === 'ADD' ? value : -value;
            rollValues.text_at = rollValues.text_at.concat(text);
            break;
        case 'DAMAGE':
            rollValues.mod_dm += modification.operator === 'ADD' ? value : -value;
            rollValues.text_dm = rollValues.text_dm.concat(text);
            break;
        case 'DEFENCE':
            rollValues.mod_vt += modification.operator === 'ADD' ? value : -value;
            rollValues.text_vt = rollValues.text_vt.concat(text);
            break;
        case 'WEAPON_DAMAGE':
            if (modification.operator === 'ADD' || modification.operator === 'SUBTRACT') {
                rollValues.schaden = rollValues.schaden.concat(`${modification.operator === 'SUBTRACT' ? '-' : '+'}${value}`);
            } else {
                rollValues.schaden = rollValues.schaden.concat(`*${value}`);
                text = `${manoeverName}${trefferzone ? ` (${config.ILARIS.trefferzonen[trefferzone]})` : ''}: ${value} * Waffenschaden\n`;
            }
            rollValues.text_dm = rollValues.text_dm.concat(text);
            break;
        case 'ZERO_DAMAGE':
            rollValues.schaden = '0';
            rollValues.mod_dm = 0;
            text = `${manoeverName}${trefferzone ? ` (${config.ILARIS.trefferzonen[trefferzone]})` : ''}: Kein Schaden\n`;
            rollValues.text_dm = rollValues.text_dm.concat(text);
            break;
        case 'CHANGE_DAMAGE_TYPE':
            text = `${manoeverName}${trefferzone ? ` (${config.ILARIS.trefferzonen[trefferzone]})` : ''}: Schadenstyp zu ${config.ILARIS.schadenstypen[modification.value]}\n`;
            rollValues.text_dm = rollValues.text_dm.concat(text);
            break;
        case 'ARMOR_BREAKING':
            text = `${manoeverName}${trefferzone ? ` (${config.ILARIS.trefferzonen[trefferzone]})` : ''}: Ignoriert Rüstung\n`;
            rollValues.text_dm = rollValues.text_dm.concat(text);
            break;
    }

    return rollValues;
}

/**
 * Handles multiple modifications and updates roll values accordingly.
 * @param {Object} manoever - The maneuver object containing modifications.
 * @param {number} number - The multiplier for the modification value.
 * @param {boolean} check - A flag indicating whether the modification is checked.
 * @param {string|null} trefferZoneInput - The hit zone input (optional).
 * @param {Object} rollValues - The object containing roll values to be updated.
 * @param {Object} config - The CONFIG object for localization.
 * @returns {Array} Updated roll values.
 */
export function handleModifications(manoever, number, check, trefferZoneInput, rollValues, config) {
    console.log('call')
    let hasZeroDamage = false;
    
    // First check if any modification is a ZERO_DAMAGE type
    Object.values(manoever.system.modifications).forEach(modification => {
        if (modification.type === 'ZERO_DAMAGE' && ((check && number) || number || check || trefferZoneInput)) {
            hasZeroDamage = true;
        }
    });
    
    // Process each modification
    Object.values(manoever.system.modifications).forEach(modification => {
        if ((check && number) || number) {
            processModification(modification, number, manoever.name, null, rollValues, config);
        } else if (check) {
            processModification(modification, 1, manoever.name, null, rollValues, config);
        } else if (trefferZoneInput) {
            rollValues.trefferzone = trefferZoneInput;
            processModification(modification, 1, manoever.name, trefferZoneInput, rollValues, config);
        }
    });
    
    // If ZERO_DAMAGE was found, override damage values
    if (hasZeroDamage) {
        rollValues.mod_dm = 0;
        rollValues.schaden = '0';
        // Add text explaining zero damage if not already present
        if (!rollValues.text_dm.includes('Kein Schaden')) {
            rollValues.text_dm = rollValues.text_dm.concat(`${manoever.name}: Kein Schaden\n`);
        }
    }

    return [
        rollValues.mod_at,
        rollValues.mod_vt,
        rollValues.mod_dm,
        rollValues.text_at,
        rollValues.text_vt,
        rollValues.text_dm,
        rollValues.trefferzone,
        rollValues.schaden
    ];
}