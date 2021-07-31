export function get_statuseffect_by_id(actor, statusId) {
    let iterator = actor.data.effects.values();
    for (const effect of iterator) {
        if (effect.data.flags.core.statusId == statusId) {
            return true;
        }
    }
    return false;
}

export async function roll_crit_message(formula, label, text, speaker, rollmode, crit_eval=true, fumble_val=1){
    let roll = new Roll(formula);
    await roll.evaluate({ "async": true });
    let fumble = false;
    let crit = false;
    if (crit_eval) {
        let critfumble = roll.dice[0].results.find(a => a.active == true).result;
        if (critfumble == 20) {
            crit = true;
        } else if (critfumble <= fumble_val) {
            fumble = true;
        }
    }
    const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
        title: `${label}`,
        text: text,
        crit: crit,
        fumble: fumble,
    });
    let roll_msg = roll.toMessage({
        speaker: speaker,
        flavor: html_roll
    }, {
        rollMode: rollmode,
        //     create: false
    });
}


export function calculate_diceschips(html, text, actor){
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
    let schips_val = actor.data.data.schips.schips_stern;
    if (schips_val > 0 && schips == 1) {
        text = text.concat(`Schips ohne Eigenheit\n`);
        dice_number += 1;
        discard_l += 1;
        let new_schips = actor.data.data.schips.schips_stern - 1;
        actor.update({
            data: {
                schips: {
                    schips_stern: new_schips
                }
            }
        });
    } else if (schips_val > 0 && schips == 2) {
        text = text.concat(`Schips mit Eigenschaft\n`);
        dice_number += 2;
        discard_l += 2;
        let new_schips = actor.data.data.schips.schips_stern - 1;
        actor.update({
            data: {
                schips: {
                    schips_stern: new_schips
                }
            }
        });
    } else if (schips_val == 0 && (schips == 1 || schips == 2)) {
        text = text.concat(`Keine Schips\n`);
    }

    return [ text, dice_number, discard_l, discard_h ];
}
