// import {NahkampfDialog} from "../sheets/dialog/dialog_nahkampf.js";
import { nahkampfUpdate } from "./wuerfel/nahkampf_prepare.js";

async function roll_crit_message(formula, label, text, rollmode, crit_eval=true, fumble_val=1){
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
        flavor: html_roll
    }, {
        rollMode: rollmode,
        //     create: false
    });
}


function calculate_diceschips(html, text, actor){
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
        text = text.concat(`Schips ohne Eigenschaft\n`);
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
        text = text.concat(`Keine Schips`);
    }

    return [ text, dice_number, discard_l, discard_h ];
}

function calculate_attacke(actor, item) {
    let data = actor.data.data;
    let be = data.abgeleitete.be;
    let mod_at = 0;
    let text = "";
    // Entfernung verändern km_ever
    if (item.data.data.manoever.km_ever.selected) {
        mod_at -= be;
        text = text.concat(`${CONFIG.ILARIS.label["km_ever"]}\n`);
    }
    // Entwaffnen km_entw
    if (item.data.data.manoever.km_entw.selected_at) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_entw"]}\n`);
    }
    // Gezielter Schlag km_gzsl
    let trefferzone = Number(item.data.data.manoever.km_gzsl.selected);
    if (trefferzone) {
        mod_at -= 2;
        text = text.concat(`${CONFIG.ILARIS.label["km_gzsl"]}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`);
    }
    // Umreißen km_umre
    if (item.data.data.manoever.km_umre.selected) {
        text = text.concat(`${CONFIG.ILARIS.label["km_umre"]}\n`);
    }
    // Wuchtschlag km_wusl
    let wusl = Number(item.data.data.manoever.km_wusl.selected);
    if (wusl > 0) {
        mod_at -= wusl;
        text = text.concat(`${CONFIG.ILARIS.label["km_wusl"]}: ${wusl}\n`);
    }
    // Rüstungsbrecher km_rust
    if (item.data.data.manoever.km_rust.selected) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_rust"]}\n`);
    }
    // Schildspalter km_shsp
    if (item.data.data.manoever.km_shsp.selected) {
        mod_at += 2;
        text = text.concat(`${CONFIG.ILARIS.label["km_shsp"]}\n`);
    }
    // Stumpfer Schlag km_stsl
    if (item.data.data.manoever.km_stsl.selected) {
        text = text.concat(`${CONFIG.ILARIS.label["km_stsl"]}\n`);
    }
    // Umklammern km_umkl
    if (item.data.data.manoever.km_umkl.selected) {
        let umkl = Number(item.data.data.manoever.km_umkl.mod);
        mod_at -= umkl;
        text = text.concat(`${CONFIG.ILARIS.label["km_umkl"]}: ${umkl}\n`);
    }
    // Ausfall km_ausf
    if (item.data.data.manoever.km_ausf.selected) {
        mod_at -= 2 + be;
        text = text.concat(`${CONFIG.ILARIS.label["km_ausf"]}\n`);
    }
    // Befreiungsschlag km_befr
    if (item.data.data.manoever.km_befr.selected) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_befr"]}\n`);
    }
    // Doppelangriff km_dppl
    if (item.data.data.manoever.km_dppl.selected) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_dppl"]}\n`);
    }
    // Hammerschlag km_hmsl
    if (item.data.data.manoever.km_hmsl.selected) {
        mod_at -= 8;
        text = text.concat(`${CONFIG.ILARIS.label["km_hmsl"]}\n`);
    }
    // Klingentanz km_kltz
    if (item.data.data.manoever.km_kltz.selected) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_kltz"]}\n`);
    }
    // Niederwerfen km_ndwf
    if (item.data.data.manoever.km_ndwf.selected) {
        mod_at -= 4;
        text = text.concat(`${CONFIG.ILARIS.label["km_ndwf"]}\n`);
    }
    // Sturmangriff km_stag
    if (item.data.data.manoever.km_stag.selected) {
        if (item.data.data.manoever.kbak.selected) mod_at += 4;
        let gs = Number(item.data.data.manoever.km_stag.gs);
        text = text.concat(`${CONFIG.ILARIS.label["km_stag"]}: ${gs}\n`);
    }
    // Todesstoß km_tdst
    if (item.data.data.manoever.km_tdst.selected) {
        mod_at -= 8;
        text = text.concat(`${CONFIG.ILARIS.label["km_tdst"]}\n`);
    }
    // Überrennen km_uebr
    if (item.data.data.manoever.km_uebr.selected) {
        if (item.data.data.manoever.kbak.selected) mod_at += 4;
        let gs = Number(item.data.data.manoever.km_uebr.gs);
        text = text.concat(`${CONFIG.ILARIS.label["km_uebr"]}: ${gs}\n`);
    }
    // console.log(mod_at);
    return [ mod_at, text ];
}

export async function wuerfelwurf(event, actor) {
    let data = actor.data.data;
    // console.log($(event.currentTarget));
    let rolltype = $(event.currentTarget).data("rolltype");
    let globalermod = data.abgeleitete.globalermod;
    let be = data.abgeleitete.be;
    let nahkampfmod = data.modifikatoren.nahkampfmod;
    let pw = 0;
    let label = "Probe";
    let groupName_xd20 = "xd20";
    let choices_xd20 = {
        "0": "1W20",
        "1": "3W20"
    };
    let checked_xd20 = "1";
    let groupName_schips = "schips";
    let choices_schips = {
        "0": "Ohne",
        "1": "ohne Eigenheit",
        "2": "mit Eigenheit"
    };
    // checked_schips: "0";
    if(rolltype == "nahkampf_diag") {
        let mod_at = 0;
        let mod_vt = 0;
        let mod_schaden = 0;
        let text = "";
        let itemId = event.currentTarget.dataset.itemid;
        // let item = actor.getOwnedItem(itemId);
        let item = actor.items.get(itemId);
        pw = item.data.data.at;
        // console.log(item);
        // let manoever_at = item._data.data.manoever_at;
        let schaden = item.data.data.schaden;
        // console.log(item.data.data);
        // console.log(item._data.data.manoever_at);
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_nahkampf.html', {
            choices_xd20: choices_xd20,
            checked_xd20: "0",
            choices_schips: choices_schips,
            checked_schips: "0",
            // distance_name: "distance",
            // distance_name: "rwdf",
            // distance_checked: "0",
            distance_choice: {
                "0": "ideal",
                "1": "1 Feld",
                "2": "2 Felder",
            },
            rollModes: CONFIG.Dice.rollModes,
            manoever: item.data.data.manoever,
            item: item
            // pw: pw
        });
        let d = new Dialog({
            title: "Nahkampf",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/sword-clash.png"></i>',
                    label: "Attacke",
                    callback: async (html) => {
                        await nahkampfUpdate(html, actor, item);
                        let dice_number = 0;
                        let discard_l = 0;
                        let discard_h = 0;
                        [text, dice_number, discard_l, discard_h] = calculate_diceschips(html, text, actor);
                        // Kombinierte Aktion kbak
                        if (item.data.data.manoever.kbak.selected) {
                            mod_at -= 4;
                            text = text.concat("Kombinierte Aktion\n");
                        }
                        // Volle Offensive vlof
                        if (item.data.data.manoever.vlof.selected) {
                            mod_at += 4;
                            text = text.concat("Volle Offensive\n");
                        }
                        // Reichweitenunterschiede rwdf
                        let reichweite = item.data.data.manoever.rwdf.selected;
                        mod_at -= 2 * Number(reichweite);
                        text = text.concat(`Reichweitenunterschied: ${reichweite}\n`);
                        //Passierschlag pssl & Anzahl Reaktionen rkaz
                        if (item.data.data.manoever.pssl.selected) {
                            let reaktionen = Number(item.data.data.manoever.rkaz.selected);
                            if (reaktionen > 0) {
                                mod_at -= 4 * reaktionen;
                                text = text.concat(`Passierschlag: (${reaktionen})\n`);
                            }
                        }
                        // Binden km_bind
                        let binden = Number(item.data.data.manoever.km_bind.selected);
                        if (binden > 0) {
                            mod_at += binden;
                            text = text.concat(`Binden: ${binden}\n`);
                        }
                        // Attacke Manöver ausgelagert für Riposte
                        let [ mod_from_at, text_from_at ] = calculate_attacke(actor, item);
                        mod_at += mod_from_at;
                        text = text.concat(text_from_at);
                        // Modifikator
                        let modifikator = Number(item.data.data.manoever.mod.selected);
                        if (modifikator != 0) {
                            mod_at += modifikator;
                            text = text.concat(`Modifikator: ${modifikator}\n`);
                        }
                        // Rollmode
                        let rollmode = item.data.data.manoever.rllm.selected;
                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                        // Critfumble & Message
                        let label = `Attacke (${item.name})`;
                        let fumble_val = 1;
                        if (item.data.data.eigenschaften.unberechenbar){
                            fumble_val = 2;
                        }
                        await roll_crit_message(formula, label, text, rollmode, true, fumble_val);
                    }
                },
                two: {
                    icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/shield-opposition.png"></i>',
                    label: "Verteidigung",
                    callback: async (html) => {
                        await nahkampfUpdate(html, actor, item);
                        let dice_number = 0;
                        let discard_l = 0;
                        let discard_h = 0;
                        [text, dice_number, discard_l, discard_h] = calculate_diceschips(html, text, actor);
                        // Volle Offensive vlof
                        if (item.data.data.manoever.vlof.selected) {
                            mod_vt -= 8;
                            text = text.concat("Volle Offensive\n");
                        }
                        // Volle Offensive vldf
                        if (item.data.data.manoever.vldf.selected) {
                            mod_vt += 4;
                            text = text.concat("Volle Offensive\n");
                        }
                        // Reichweitenunterschiede rwdf
                        let reichweite = item.data.data.manoever.rwdf.selected;
                        mod_vt -= 2 * Number(reichweite);
                        text = text.concat(`Reichweitenunterschied: ${reichweite}\n`);
                        //Anzahl Reaktionen rkaz
                        let reaktionen = Number(item.data.data.manoever.rkaz.selected);
                        if (reaktionen > 0) {
                            mod_vt -= 4 * reaktionen;
                            text = text.concat(`Anzahl Reaktionen: ${reaktionen}\n`);
                        }
                        // Ausweichen km_ausw
                        if (item.data.data.manoever.km_ausw.selected) {
                            mod_vt -= 2 + be;
                            text = text.concat("Ausweichen\n");
                        }
                        // Binden km_bind
                        let binden = Number(item.data.data.manoever.km_bind.selected);
                        if (binden > 0) {
                            mod_vt -= binden;
                            text = text.concat(`Binden: ${binden}\n`);
                        }
                        // Entwaffnen km_entw
                        if (item.data.data.manoever.km_entw.selected_vt) {
                            mod_vt -= 4;
                            text = text.concat(`${CONFIG.ILARIS.label["km_entw"]}\n`);
                        }
                        // Auflaufen lassen km_aufl
                        if (item.data.data.manoever.km_aufl.selected) {
                            let gs = Number(item.data.data.manoever.km_aufl.gs);
                            mod_vt -= 4;
                            text = text.concat(`${CONFIG.ILARIS.label["km_aufl"]}: ${gs}\n`);
                        }
                        // Riposte km_rpst
                        if (item.data.data.manoever.km_rpst.selected) {
                            let [mod_from_at, text_from_at] = calculate_attacke(actor, item);
                            mod_vt += -4 + mod_from_at;
                            text = text.concat(`${CONFIG.ILARIS.label["km_rpst"]}: (\n${text_from_at})\n`);
                        }
                        // Schildwall km_shwl
                        if (item.data.data.manoever.km_shwl.selected) {
                            mod_vt -= 4;
                            text = text.concat(`${CONFIG.ILARIS.label["km_shwl"]}\n`);
                        }
                        // Unterlaufen km_utlf
                        if (item.data.data.manoever.km_utlf.selected) {
                            mod_vt -= 4;
                            text = text.concat(`${CONFIG.ILARIS.label["km_utlf"]}\n`);
                        }
                        // Modifikator
                        let modifikator = Number(item.data.data.manoever.mod.selected);
                        if (modifikator != 0) {
                            mod_vt += modifikator;
                            text = text.concat(`Modifikator: ${modifikator}\n`);
                        }
                        // Rollmode
                        let rollmode = item.data.data.manoever.rllm.selected;
                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${dice_form} + ${pw} + ${globalermod} + ${mod_vt}`;
                        // Critfumble & Message
                        let label = `Verteidigung (${item.name})`;
                        await roll_crit_message(formula, label, text, rollmode);
                    }
                },
                three: {
                    icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                    label: "Schaden",
                    callback: async (html) => {
                        await nahkampfUpdate(html, actor, item);
                        // Gezielter Schlag km_gzsl
                        let trefferzone = Number(item.data.data.manoever.km_gzsl.selected);
                        if (trefferzone) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_gzsl"]}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`);
                        }
                        else {
                            let zonenroll = new Roll("1d6");
                            await zonenroll.evaluate({ "async": true});
                            // let zonenroll = Math.floor(Math.random() * 6 + 1);
                            text = text.concat(`Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`);
                        }
                        // Wuchtschlag km_wusl
                        let wusl = Number(item.data.data.manoever.km_wusl.selected);
                        if (wusl > 0) {
                            mod_schaden += wusl;
                            text = text.concat(`${CONFIG.ILARIS.label["km_wusl"]}: ${wusl}\n`);
                        }
                        // Auflaufen lassen km_aufl
                        if (item.data.data.manoever.km_aufl.selected) {
                            let gs = Number(item.data.data.manoever.km_aufl.gs);
                            mod_schaden += gs;
                            text = text.concat(`${CONFIG.ILARIS.label["km_aufl"]}: ${gs}\n`);
                        }
                        // Rüstungsbrecher km_rust
                        if (item.data.data.manoever.km_rust.selected) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_rust"]}\n`);
                        }
                        // Schildspalter km_shsp
                        if (item.data.data.manoever.km_shsp.selected) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_shsp"]}\n`);
                        }
                        // Stumpfer Schlag km_stsl
                        if (item.data.data.manoever.km_stsl.selected) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_stsl"]}\n`);
                        }
                        // Hammerschlag km_hmsl
                        if (item.data.data.manoever.km_hmsl.selected) {
                            schaden = schaden.concat(`+${schaden}`);
                            text = text.concat(`${CONFIG.ILARIS.label["km_hmsl"]}\n`);
                        }
                        // Niederwerfen km_ndwf
                        if (item.data.data.manoever.km_ndwf.selected) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_ndwf"]}\n`);
                        }
                        // Sturmangriff km_stag
                        if (item.data.data.manoever.km_stag.selected) {
                            let gs = Number(item.data.data.manoever.km_stag.gs);
                            mod_schaden += gs;
                            text = text.concat(`${CONFIG.ILARIS.label["km_stag"]}: ${gs}\n`);
                        }
                        // Todesstoß km_tdst
                        if (item.data.data.manoever.km_tdst.selected) {
                            text = text.concat(`${CONFIG.ILARIS.label["km_tdst"]}\n`);
                        }
                        // Überrennen km_uebr
                        if (item.data.data.manoever.km_uebr.selected) {
                            let gs = Number(item.data.data.manoever.km_uebr.gs);
                            mod_schaden += gs;
                            text = text.concat(`${CONFIG.ILARIS.label["km_uebr"]}: ${gs}\n`);
                        }
                        // Modifikator
                        let modifikator = Number(item.data.data.manoever.mod.selected);
                        if (modifikator != 0) {
                            mod_schaden += modifikator;
                            text = text.concat(`Modifikator: ${modifikator}\n`);
                        }
                        // Rollmode
                        let rollmode = item.data.data.manoever.rllm.selected;
                        let formula = `${schaden} + ${mod_schaden}`;
                        let label = `Schaden (${item.name})`;
                        // Critfumble & Message
                        await roll_crit_message(formula, label, text, rollmode, false);
                    }
                },
                four: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Abbruch")
                }
            }
        }, {
            jQuery: true,
        });
        d.render(true);
    }
    else if (rolltype == "attribut_diag") {
        const attribut_name = $(event.currentTarget).data("attribut");
        label = CONFIG.ILARIS.label[attribut_name];
        pw = data.attribute[attribut_name].pw;
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_attribut.html', {
            choices_xd20: choices_xd20,
            checked_xd20: "1",
            choices_schips: choices_schips,
            checked_schips: "0",
            rollModes: CONFIG.Dice.rollModes
        });
        let d = new Dialog({
            title: "Attributsprobe",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: "OK",
                    callback: async (html) => {
                        let text = "";
                        let dice_number = 0;
                        let discard_l = 0;
                        let discard_h = 0;
                        [text, dice_number, discard_l, discard_h ] = calculate_diceschips(html, text, actor);
                        let hohequalitaet = 0;
                        if (html.find("#hohequalitaet").length > 0) {
                            hohequalitaet = Number(html.find("#hohequalitaet")[0].value);
                            if (hohequalitaet != 0) {
                                text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                            }
                        }
                        let modifikator = 0;
                        if (html.find("#modifikator").length > 0) {
                            modifikator = Number(html.find("#modifikator")[0].value);
                            if (modifikator != 0) {
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                        }
                        let rollmode = "";
                        if (html.find("#rollMode").length > 0) {
                            rollmode = html.find("#rollMode")[0].value;
                        }
                        hohequalitaet *= -4;

                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                        // Critfumble & Message
                        await roll_crit_message(formula, label, text, rollmode);
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Chose Two")
                }
            },
        }, {
            jQuery: true,
        });
        d.render(true);
    }
    else if (rolltype == "profan_fertigkeit_diag") {
        let fertigkeit = $(event.currentTarget).data("fertigkeit");
        label = actor.data.data.profan.fertigkeiten[fertigkeit].name;
        const talent_list = {};
        let array_talente = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.talente;
        for (const [i, tal] of array_talente.entries()) {
            talent_list[i] = tal.name;
        }
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_profan.html', {
            choices_xd20: choices_xd20,
            checked_xd20: "1",
            choices_schips: choices_schips,
            checked_schips: "0",
            groupName_talente: "talente",
            choices_talente_basic: {
                "0": "ohne Talent",
                "1": "mit Talent: "
            },
            choices_talente: talent_list,
            rollModes: CONFIG.Dice.rollModes
        });
        let d = new Dialog({
            title: "Fertigkeitsprobe",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: "OK",
                    callback: async (html) => {
                        let text = "";
                        let dice_number = 0;
                        let discard_l = 0;
                        let discard_h = 0;
                        [text, dice_number, discard_l, discard_h ] = calculate_diceschips(html, text, actor);
                        let talent_specific = 0;
                        let talent = "";
                        if (html.find("#talent").length > 0) {
                            talent_specific = Number(html.find("#talent")[0].value);
                            talent = talent_list[talent_specific];
                        }
                        let hohequalitaet = 0;
                        if (html.find("#hohequalitaet").length > 0) {
                            hohequalitaet = Number(html.find("#hohequalitaet")[0].value);
                            if (hohequalitaet != 0) {
                                text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                            }
                        }
                        let modifikator = 0;
                        if (html.find("#modifikator").length > 0) {
                            modifikator = Number(html.find("#modifikator")[0].value);
                            if (modifikator != 0) {
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                        }
                        let rollmode = "";
                        if (html.find("#rollMode").length > 0) {
                            rollmode = html.find("#rollMode")[0].value;
                        }
                        if (talent_specific == -2) {
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pw;
                        } else if (talent_specific == -1){
                            label = label + " (Talent)";
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                        } else {
                            label = label + " (" + talent + ")";
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                        }
                        hohequalitaet *= -4;

                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                        // Critfumble & Message
                        await roll_crit_message(formula, label, text, rollmode);
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Chose Two")
                }
            },
        }, {
            jQuery: true,
        });
        d.render(true);
    }
    else if (rolltype == "freie_fertigkeit_diag") {
        label = $(event.currentTarget).data("fertigkeit");
        pw = Number($(event.currentTarget).data("pw")) * 8 - 2;
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_attribut.html', {
            choices_xd20: choices_xd20,
            checked_xd20: "1",
            choices_schips: choices_schips,
            checked_schips: "0",
            rollModes: CONFIG.Dice.rollModes
        });
        let d = new Dialog({
            title: "Freie Fertigkeitsprobe",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: "OK",
                    callback: async (html) => {
                        let text = "";
                        let dice_number = 0;
                        let discard_l = 0;
                        let discard_h = 0;
                        [text, dice_number, discard_l, discard_h ] = calculate_diceschips(html, text, actor);
                        let hohequalitaet = 0;
                        if (html.find("#hohequalitaet").length > 0) {
                            hohequalitaet = Number(html.find("#hohequalitaet")[0].value);
                            if (hohequalitaet != 0) {
                                text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                            }
                        }
                        let modifikator = 0;
                        if (html.find("#modifikator").length > 0) {
                            modifikator = Number(html.find("#modifikator")[0].value);
                            if (modifikator != 0) {
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                        }
                        let rollmode = "";
                        if (html.find("#rollMode").length > 0) {
                            rollmode = html.find("#rollMode")[0].value;
                        }
                        hohequalitaet *= -4;

                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                        // Critfumble & Message
                        await roll_crit_message(formula, label, text, rollmode);
                    }
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => console.log("Chose Two")
                }
            },
        }, {
            jQuery: true,
        });
        d.render(true);
    }
    else if (rolltype == "fernkampf_diag") {
        
    }
    // let formula = `${pw} + ${globalermod} + 3d20dl1dh1`;
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
