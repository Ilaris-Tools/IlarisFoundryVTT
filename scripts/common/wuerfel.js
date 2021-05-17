import {AttackDialog} from "../sheets/dialog/dialog_attacke.js";

export async function wuerfelwurf(event, actor) {

    // activateListeners(html);


    let data = actor.data.data;
    // console.log($(event.currentTarget));
    let rolltype = $(event.currentTarget).data("rolltype");
    let wundabzuege = data.gesundheit.wundabzuege;
    let pw = 0;
    let label = "Probe";
    if(rolltype == "at") {
        let mod_at = 0;
        let mod_schaden = 0;
        let text = "";
        let itemId = event.currentTarget.dataset.itemid;
        const item = actor.getOwnedItem(itemId);
        // console.log(item);
        let manoever_at = item._data.data.manoever_at;
        console.log(item.data.data.manoever_at);
        console.log(item._data.data.manoever_at);
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_at.html', {
            distance_name: "distance",
            distance_checked: "0",
            distance_choice: {
                "0": "ideal",
                "1": "1 Feld",
                "2": "2 Felder",
            },
            rollModes: CONFIG.Dice.rollModes,
            manoever_at: manoever_at
        });
        let d = new AttackDialog(actor, {
            title: "Attacke",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/sword-clash.png"></i>',
                    label: "Angriff",
                    callback: async (html) => {
                        //Kombinierte Aktion
                        if (html.find("#kombinierte_aktion")[0].checked) {
                            mod_at -= 4;
                            text = text.concat("Kombinierte Aktion\n");
                        }
                        // Volle Offensive
                        if (html.find("#volle_offensive")[0].checked) {
                            mod_at += 4;
                            text = text.concat("Volle Offensive\n");
                        }
                        //Reichweitenunterschiede
                        let reichweite_check = html.find("input[name='distance']");
                        let reichweite = 0;
                        for (let i of reichweite_check) {
                            if (i.checked) reichweite = i.value;
                        }
                        mod_at -= 2*reichweite;
                        text = text.concat("Reichweitenunterschied: ");
                        text = text.concat(reichweite);
                        text = text.concat("\n");
                        //Anzahl Reaktionen
                        let reaktionen = Number(html.find("#reaktionsanzahl")[0].value);
                        if (reaktionen > 0){
                            mod_at -= 4 * reaktionen;
                            text = text.concat(`Anzahl Reaktionen: ${reaktionen}\n`);
                        }
                        //Entfernung verändern
                        if (manoever_at.indexOf("km_ever") > -1) {
                            // if (html.find("#km_ever").length > 0) {
                            //     let checkedValue = html.find("#km_ever")[0].checked;
                            // }
                            if (html.find("#km_ever")[0].checked) {
                                mod_at -= be;
                            }
                        }
                        console.log(text);
                        console.log(mod_at);
                    }
                },
                two: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                    label: "Schaden",
                    callback: () => console.log("Schaden")
                },
                three: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Abbruch")
                }
            }
        }, {
            jQuery: true,
            // jQuery: false,
        });
        d.render(true);
    }
    else if (rolltype == "profan_fertigkeit") {
        let fertigkeit = $(event.currentTarget).data("fertigkeit");
        label = actor.data.profan.fertigkeiten[fertigkeit].name;
        const talent_list = {};
        let array_talente = actor.data.profan.fertigkeiten[fertigkeit].data.talente;
        for (const [i, tal] of array_talente.entries()) {
            talent_list[i] = tal.name;
        }
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_profan.html', {
            groupName_xd20: "xd20",
            choices_xd20: {
                "0": "1W20",
                "1": "3W20"
            },
            checked_xd20: "1",
            groupName_schips: "schips",
            choices_schips: {
                "0": "Ohne",
                "1": "ohne Eigenheit",
                "2": "mit Eigenheit"
            },
            checked_schips: "0",
            groupName_talente: "talente",
            choices_talente_basic: {
                "0": "ohne Talent",
                "1": "mit Talent: "
            },
            // checked_talente_basic: "0",
            choices_talente: talent_list,
            // checked_talente: "-1",
            rollModes: CONFIG.Dice.rollModes
        });
        let d = new Dialog({
            title: "Fertigkeitsprobe",
            content: html,
            buttons: {
                one: {
                    // icon: '<i class="fas fa-check"></i>',
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: "OK",
                    callback: async (html) => {
                        let xd20_check = html.find("input[name='xd20']");
                        let xd20 = 0;
                        for (let i of xd20_check) {
                            if (i.checked) xd20 = i.value;
                        }
                        console.log(xd20);
                        let schips_check = html.find("input[name='schips']");
                        let schips = 0;
                        for (let i of schips_check) {
                            if (i.checked) schips = i.value;
                        }
                        console.log(schips);
                        // let talent_check = html.find("input[name='talente']");
                        // let talent = 0;
                        // for (let i of talent_check) {
                        //     if (i.checked) talent = i.value;
                        // }
                        // console.log(talent);
                        let talent_specific = 0;
                        let talent = "";
                        if (html.find("#talent").length > 0) {
                            talent_specific = Number(html.find("#talent")[0].value);
                            talent = talent_list[talent_specific];
                        }
                        console.log(talent_list);
                        console.log(talent_specific);
                        console.log(talent);
                        let hohequalitaet = 0;
                        if (html.find("#hohequalitaet").length > 0) {
                            hohequalitaet = Number(html.find("#hohequalitaet")[0].value);
                        }
                        console.log(hohequalitaet);
                        let modifikator = 0;
                        if (html.find("#modifikator").length > 0) {
                            modifikator = Number(html.find("#modifikator")[0].value);
                        }
                        console.log(modifikator);
                        let rollmode = "";
                        if (html.find("#rollMode").length > 0) {
                            rollmode = html.find("#rollMode")[0].value;
                        }
                        console.log(rollmode);
                        // console.log(html.find("#rollMode"));


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
                        }
                        if (talent_specific == -2) {
                            pw = actor.data.profan.fertigkeiten[fertigkeit].data.pw;
                        } else if (talent_specific == -1){
                            label = label + "(Talent)";
                            pw = actor.data.profan.fertigkeiten[fertigkeit].data.pwt;
                        } else {
                            label = label + "(" + talent + ")";
                            pw = actor.data.profan.fertigkeiten[fertigkeit].data.pwt;
                        }
                        hohequalitaet *= -4;

                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${pw} + ${wundabzuege} + ${hohequalitaet} + ${modifikator} + ${dice_form}`;
                        let roll = new Roll(formula);
                        roll.roll();
                        let result = roll.total;
                        let critfumble = roll.result.split(" + ").slice(-1)[0];
                        let fumble = false;
                        let crit = false;
                        if (critfumble == 20) {
                            crit = true;
                        } else if (critfumble == 1) {
                            fumble = true;
                        }
                        console.log(roll);
                        console.log(result);
                        console.log(critfumble);

                        // splittermond:
                        // templates/chat/skill-check.hbs mit neuem button
                        // module/actor/actor.js
                        //
                        // CoC:
                        // module/actors/actor.js
                        //

                        // const template = 'systems/Ilaris/templates/chat/probenchat_profan.html';
                        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
                            title: `${label}-Probe`,
                            crit: crit,
                            fumble: fumble,
                            pw: pw,
                            wundabzuege: wundabzuege,
                            hohequalitaet: hohequalitaet,
                            modifikator: modifikator,
                            dice_number: dice_number,
                            result: result
                        });
                        // roll._formula = "hallo";
                        let roll_msg = roll.toMessage({
                            flavor: html_roll
                        }, {
                            rollMode: rollmode,
                        //     create: false
                        });
                        console.log(roll_msg);
                        // let blabla = game.settings.get("core", "rollMode");
                        // console.log(blabla);
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Chose Two")
                }
            },
            // default: "two",
            // render: html => console.log("Register interactivity in the rendered dialog"),
            // close: html => console.log("This always is logged no matter which option is chosen")
        }, {
            jQuery: true,
            // jQuery: false,
        });
        d.render(true);
    }
    else if (rolltype == "fk") {
        
    }
    // let formula = `${pw} + ${wundabzuege} + 3d20dl1dh1`;
    // // let formula = `${data.pw} + 3d20dhdl`;
    // let roll = new Roll(formula);
    // roll.roll();
    // // console.log(roll);
    // let critfumble = roll.result.split(" + ")[1];
    // let fumble = false;
    // let crit = false;
    // if (critfumble == 20) {
    //     crit = true;
    // } else if (critfumble == 1) {
    //     fumble = true;
    // }
    // let templateData = {
    //     title: `${label}-Probe`,
    //     crit: crit,
    //     fumble: fumble
    // };
    // // console.log(templateData);
    // let template = 'systems/Ilaris/templates/chat/dreid20.html';
    // renderTemplate(template, templateData, roll).then(content => {
    //     if (formula != null) {
    //         roll.toMessage({
    //             flavor: content
    //         });
    //     }
    // });
}
