export function get_statuseffect_by_id(actor, statusId) {
    let iterator = actor.effects.values();
    for (const effect of iterator) {
        if (effect.flags.core.statusId == statusId) {
            return true;
        }
    }
    return false;
}

export async function roll_crit_message(
    formula,
    label,
    text,
    speaker,
    rollmode,
    crit_eval = true,
    fumble_val = 1,
    success_val
) {
    const roll = new Roll(formula);
    const result = await roll.evaluate();
    let fumble = false;
    let crit = false;
    let isSuccess = false;
    let is16OrHigher = false;
    let realFumbleCrits = game.settings.get('Ilaris', 'realFumbleCrits');

    if (crit_eval) {
        let critfumble = roll.dice[0].results.find((a) => a.active == true).result;
        if (realFumbleCrits) {
            if (critfumble == 20) {
                crit = true;
            } else if (critfumble <= fumble_val) {
                fumble = true;
            }
        } else {
            if (success_val) {
                // For rolls with a target number, apply the same logic
                const bonuses = result._total - critfumble;
                const maxPossibleResult = 20 + bonuses;
                const minPossibleResult = 1 + bonuses;

                if (critfumble == 20 && maxPossibleResult >= success_val) {
                    crit = true;
                } else if (critfumble <= fumble_val && minPossibleResult + (fumble_val - 1) < success_val) {
                    fumble = true;
                }
            } else {
                // For rolls without a target number, use the original logic
                if (critfumble == 20) {
                    crit = true;
                } else if (critfumble <= fumble_val) {
                    fumble = true;
                }
            }
        }

        if (success_val && result._total >= success_val && !fumble && !crit) {
            isSuccess = true;
        }
        if (result._total >= 16) {
            is16OrHigher = true;
        }
    }

    let templatePath = 'systems/Ilaris/templates/chat/probenchat_profan.html';
    let templateData = {
        title: `${label}`,
        text: text,
        crit: crit,
        fumble: fumble,
        success: isSuccess,
        noSuccess: success_val && !isSuccess,
        is16OrHigher: is16OrHigher
    };

    // If this is a spell result, use the spell_result template
    if (label.startsWith('Zauber (')) {
        templatePath = 'systems/Ilaris/templates/chat/spell_result.html';
        const cost = text.match(/Kosten: (\d+) AsP/)?.[1] || 0;
        templateData = {
            success: isSuccess || crit,
            cost: cost,
            costModifier: fumble ? 4 : 2
        };
    }

    const html_roll = await renderTemplate(templatePath, templateData);
    let roll_msg = roll.toMessage(
        {
            speaker: speaker,
            flavor: html_roll,
        },
        {
            rollMode: rollmode,
        },
    );
    return [isSuccess || crit, is16OrHigher];
}

export function calculate_diceschips(html, text, actor) {
    // let text = "";
    let xd20_check = html.find("input[name='xd20']");
    let xd20 = 0;
    for (let i of xd20_check) {
        if (i.checked) xd20 = i.value;
    }
    // console.log(xd20);
    let schips_check = html.find("input[name='schips']");
    let schips = 0;
    for (let i of schips_check) {
        if (i.checked) schips = i.value;
    }
    let dice_number = 0;
    let discard_l = 0;
    let discard_h = 0;
    if (xd20 == 0) {
        dice_number = 1;
    } else if (xd20 == 1) {
        dice_number = 3;
        discard_l = 1;
        discard_h = 1;
    }
    let schips_val = actor.system.schips.schips_stern;
    if (schips_val > 0 && schips == 1) {
        text = text.concat(`Schips ohne Eigenheit\n`);
        dice_number += 1;
        discard_l += 1;
        let new_schips = actor.system.schips.schips_stern - 1;
        actor.update({
            system: {
                schips: {
                    schips_stern: new_schips,
                },
            },
        });
    } else if (schips_val > 0 && schips == 2) {
        text = text.concat(`Schips mit Eigenschaft\n`);
        dice_number += 2;
        discard_l += 2;
        let new_schips = actor.system.schips.schips_stern - 1;
        actor.update({
            system: {
                schips: {
                    schips_stern: new_schips,
                },
            },
        });
    } else if (schips_val == 0 && (schips == 1 || schips == 2)) {
        text = text.concat(`Keine Schips\n`);
    }

    return [text, dice_number, discard_l, discard_h];
}
