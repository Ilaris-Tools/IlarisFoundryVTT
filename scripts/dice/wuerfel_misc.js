export function get_statuseffect_by_id(actor, statusId) {
    let iterator = actor.effects.values()
    for (const effect of iterator) {
        if (effect.flags.core.statusId == statusId) {
            return true
        }
    }
    return false
}

/**
 * Evaluates a roll for critical successes and fumbles based on Ilaris rules.
 * @param {Roll} roll - The evaluated Foundry Roll object
 * @param {Object} result - The roll result object
 * @param {number} fumble_val - The fumble threshold (default 1)
 * @param {number} success_val - The target number for success (optional)
 * @param {boolean} crit_eval - Whether to evaluate crits/fumbles
 * @returns {Object} Object containing crit, fumble, isSuccess, and is16OrHigher flags
 */
function evaluateCriticalResults(roll, result, fumble_val, success_val, crit_eval) {
    let fumble = false
    let crit = false
    let isSuccess = false
    let is16OrHigher = false
    let realFumbleCrits = game.settings.get('Ilaris', 'realFumbleCrits')

    if (crit_eval) {
        let critfumble = roll.dice[0].results.find((a) => a.active == true).result
        if (realFumbleCrits) {
            if (critfumble == 20) {
                crit = true
            } else if (critfumble <= fumble_val) {
                fumble = true
            }
        } else {
            if (success_val) {
                // For rolls with a target number, apply the same logic
                const bonuses = result._total - critfumble
                const maxPossibleResult = 20 + bonuses
                const minPossibleResult = 1 + bonuses

                if (critfumble == 20 && maxPossibleResult >= success_val) {
                    crit = true
                } else if (
                    critfumble <= fumble_val &&
                    minPossibleResult + (fumble_val - 1) < success_val
                ) {
                    fumble = true
                }
            } else {
                // For rolls without a target number, use the original logic
                if (critfumble == 20) {
                    crit = true
                } else if (critfumble <= fumble_val) {
                    fumble = true
                }
            }
        }

        if (success_val && result._total >= success_val && !fumble && !crit) {
            isSuccess = true
        }
        if (roll.dice[0].results.find((a) => a.active == true).result >= 16) {
            is16OrHigher = true
        }
    }

    return { crit, fumble, isSuccess, is16OrHigher }
}

/**
 * Prepares the template path and data for rendering roll results.
 * @param {string} label - The roll label/title
 * @param {string} text - The roll description text
 * @param {boolean} crit - Whether the roll was a critical success
 * @param {boolean} fumble - Whether the roll was a fumble
 * @param {boolean} isSuccess - Whether the roll succeeded
 * @param {boolean} is16OrHigher - Whether the die result was 16 or higher
 * @param {number} success_val - The target number for success (optional)
 * @returns {Object} Object containing templatePath and templateData
 */
function prepareRollTemplate(label, text, crit, fumble, isSuccess, is16OrHigher, success_val) {
    let templatePath = 'systems/Ilaris/scripts/skills/templates/chat/probenchat_profan.hbs'
    let templateData = {
        title: `${label}`,
        text: text,
        crit: crit,
        fumble: fumble,
        success: isSuccess,
        noSuccess: success_val && !isSuccess && !crit && !fumble,
        is16OrHigher: is16OrHigher,
    }

    // If this is a spell result, use the spell_result template
    if (label.startsWith('Zauber (')) {
        templatePath = 'systems/Ilaris/scripts/dice/templates/spell_result.hbs'
        const cost = text.match(/Kosten: (\d+) AsP/)?.[1] || 0
        templateData = {
            success: isSuccess || crit,
            cost: cost,
            costModifier: fumble ? 4 : 2,
        }
    }

    return { templatePath, templateData }
}

export async function roll_crit_message(
    formula,
    label,
    text,
    speaker,
    rollmode,
    crit_eval = true,
    fumble_val = 1,
    success_val,
) {
    const roll = new Roll(formula)
    const result = await roll.evaluate()

    // Evaluate critical results using shared helper
    const { crit, fumble, isSuccess, is16OrHigher } = evaluateCriticalResults(
        roll,
        result,
        fumble_val,
        success_val,
        crit_eval,
    )

    // Prepare template data using shared helper
    const { templatePath, templateData } = prepareRollTemplate(
        label,
        text,
        crit,
        fumble,
        isSuccess,
        is16OrHigher,
        success_val,
    )

    const html_roll = await foundry.applications.handlebars.renderTemplate(
        templatePath,
        templateData,
    )
    let roll_msg = roll.toMessage(
        {
            speaker: speaker,
            flavor: html_roll,
        },
        {
            rollMode: rollmode,
        },
    )
    return [isSuccess || crit, is16OrHigher]
}

/**
 * Evaluates a roll with critical success/fumble detection and prepares template data.
 * Unlike roll_crit_message, this function doesn't post the result to chat but returns
 * all the data needed for the caller to handle the result.
 * @param {string} formula - The dice roll formula (e.g., "1d20+5")
 * @param {string} label - The roll label/title
 * @param {string} text - The roll description text
 * @param {number} success_val - The target number for success (optional)
 * @param {number} fumble_val - The fumble threshold (default 1)
 * @param {boolean} crit_eval - Whether to evaluate crits/fumbles (default true)
 * @returns {Promise<Object>} Object containing:
 *   - success: boolean - Whether the roll succeeded (including crits)
 *   - is16OrHigher: boolean - Whether the die result was 16 or higher
 *   - crit: boolean - Whether the roll was a critical success
 *   - fumble: boolean - Whether the roll was a fumble
 *   - roll: Roll - The Foundry Roll object
 *   - templatePath: string - Path to the appropriate template
 *   - templateData: Object - Data for rendering the template
 */
export async function evaluate_roll_with_crit(
    formula,
    label,
    text,
    success_val,
    fumble_val = 1,
    crit_eval = true,
) {
    const roll = new Roll(formula)
    const result = await roll.evaluate()

    // Evaluate critical results using shared helper
    const { crit, fumble, isSuccess, is16OrHigher } = evaluateCriticalResults(
        roll,
        result,
        fumble_val,
        success_val,
        crit_eval,
    )

    // Prepare template data using shared helper
    const { templatePath, templateData } = prepareRollTemplate(
        label,
        text,
        crit,
        fumble,
        isSuccess,
        is16OrHigher,
        success_val,
    )

    return {
        success: isSuccess || crit,
        is16OrHigher: is16OrHigher,
        crit: crit,
        fumble: fumble,
        roll: roll,
        templatePath: templatePath,
        templateData: templateData,
    }
}

export function calculate_diceschips(html, text, actor, dialogId = '') {
    // let text = "";
    const xd20Name = dialogId ? `xd20-${dialogId}` : 'xd20'
    console.log(xd20Name)
    const schipsName = dialogId ? `schips-${dialogId}` : 'schips'

    let xd20_check = html.find(`input[name='${xd20Name}']`)
    let xd20 = 0
    for (let i of xd20_check) {
        if (i.checked) xd20 = i.value
    }
    // console.log(xd20);
    let schips_check = html.find(`input[name='${schipsName}']`)
    let schips = 0
    for (let i of schips_check) {
        if (i.checked) schips = i.value
    }
    let dice_number = 0
    let discard_l = 0
    let discard_h = 0
    if (xd20 == 0) {
        dice_number = 1
    } else if (xd20 == 1) {
        dice_number = 3
        discard_l = 1
        discard_h = 1
    }
    let schips_val = actor.system.schips.schips_stern
    if (schips_val > 0 && schips == 1) {
        text = text.concat(`Schips ohne Eigenheit\n`)
        dice_number += 1
        discard_l += 1
        let new_schips = actor.system.schips.schips_stern - 1
        actor.update({
            system: {
                schips: {
                    schips_stern: new_schips,
                },
            },
        })
    } else if (schips_val > 0 && schips == 2) {
        text = text.concat(`Schips mit Eigenschaft\n`)
        dice_number += 2
        discard_l += 2
        let new_schips = actor.system.schips.schips_stern - 1
        actor.update({
            system: {
                schips: {
                    schips_stern: new_schips,
                },
            },
        })
    } else if (schips_val == 0 && (schips == 1 || schips == 2)) {
        text = text.concat(`Keine Schips\n`)
    }

    return [text, dice_number, discard_l, discard_h]
}
