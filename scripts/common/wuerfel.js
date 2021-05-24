// import {NahkampfDialog} from "../sheets/dialog/dialog_nahkampf.js";
import { nahkampfUpdate } from "./wuerfel/nahkampf_prepare.js";

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
    if(rolltype == "nahkampf") {
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
        // let d = new NahkampfDialog(actor, item, {
        let d = new Dialog({
            title: "Nahkampf",
            content: html,
            buttons: {
                one: {
                    icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/sword-clash.png"></i>',
                    label: "Attacke",
                    callback: async (html) => {
                        await nahkampfUpdate(html, actor, item);
                        // console.log(item);
                        // console.log(item.data.data.manoever);
                        // console.log(item);
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
                        let formula = `1d20 + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                        let roll = new Roll(formula);
                        await roll.evaluate({"async": true});
                        let critfumble = roll.dice[0].results[0].result;
                        let fumble = false;
                        let crit = false;
                        if (critfumble == 20) {
                            crit = true;
                        } else if (critfumble == 1) {
                            fumble = true;
                        }
                        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
                            title: `Attacke (${item.name})`,
                            text: text,
                            crit: crit,
                            fumble: fumble,
                            // pw: pw,
                            // wundabzuege: wundabzuege,
                            // hohequalitaet: hohequalitaet,
                            // modifikator: modifikator,
                            // dice_number: dice_number,
                            // result: result
                        });
                        // roll._formula = "hallo";
                        let roll_msg = roll.toMessage({
                            flavor: html_roll
                        }, {
                            rollMode: rollmode,
                        //     create: false
                        });
                    }
                },
                two: {
                    icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/shield-opposition.png"></i>',
                    label: "Verteidigung",
                    callback: async (html) => {
                        await nahkampfUpdate(html, actor, item);
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
                        let formula = `1d20 + ${pw} + ${globalermod} + ${mod_vt}`;
                        let roll = new Roll(formula);
                        await roll.evaluate({"async": true});
                        let critfumble = roll.dice[0].results[0].result;
                        let fumble = false;
                        let crit = false;
                        if (critfumble == 20) {
                            crit = true;
                        } else if (critfumble == 1) {
                            fumble = true;
                        }
                        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
                            title: `Verteidigung (${item.name})`,
                            text: text,
                            crit: crit,
                            fumble: fumble,
                            // pw: pw,
                            // globalermod: globalermod
                            // hohequalitaet: hohequalitaet,
                            // modifikator: modifikator,
                            // dice_number: dice_number,
                            // result: result
                        });
                        // roll._formula = "hallo";
                        let roll_msg = roll.toMessage({
                            flavor: html_roll
                        }, {
                            rollMode: rollmode,
                        //     create: false
                        });
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
                        let roll = new Roll(formula);
                        await roll.evaluate({"async": true});
                        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
                            title: `Schaden (${item.name})`,
                            text: text,
                            // crit: crit,
                            // fumble: fumble,
                            // pw: pw,
                            // wundabzuege: wundabzuege,
                            // hohequalitaet: hohequalitaet,
                            // modifikator: modifikator,
                            // dice_number: dice_number,
                            // result: result
                        });
                        // roll._formula = "hallo";
                        let roll_msg = roll.toMessage({
                            flavor: html_roll
                        }, {
                            rollMode: rollmode,
                        //     create: false
                        });
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
            // jQuery: false,
        });
        d.render(true);
    }
    else if (rolltype == "profan_fertigkeit") {
        let fertigkeit = $(event.currentTarget).data("fertigkeit");
        label = actor.data.data.profan.fertigkeiten[fertigkeit].name;
        const talent_list = {};
        let array_talente = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.talente;
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
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pw;
                        } else if (talent_specific == -1){
                            label = label + "(Talent)";
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                        } else {
                            label = label + "(" + talent + ")";
                            pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                        }
                        hohequalitaet *= -4;

                        let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                        let formula = `${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator} + ${dice_form}`;
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

                        // const template = 'systems/Ilaris/templates/chat/probenchat_profan.html';
                        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/probenchat_profan.html', {
                            title: `${label}-Probe`,
                            crit: crit,
                            fumble: fumble,
                            pw: pw,
                            globalermod: globalermod,
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
