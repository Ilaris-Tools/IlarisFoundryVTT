// import {NahkampfDialog} from "../sheets/dialog/dialog_nahkampf.js";
import { nahkampfUpdate, calculate_attacke } from './wuerfel/nahkampf_prepare.js';
import { fernkampfUpdate } from './wuerfel/fernkampf_prepare.js';
import { magieUpdate } from './wuerfel/magie_prepare.js';
import { karmaUpdate } from './wuerfel/karma_prepare.js';
import { multiplyString } from './wuerfel/chatutilities.js';

import {
    calculate_diceschips,
    roll_crit_message,
    get_statuseffect_by_id,
} from './wuerfel/wuerfel_misc.js';
// import { calculate_diceschips, roll_crit_message } from "./wuerfel/wuerfel_misc.js";

export async function wuerfelwurf(event, actor) {
    let speaker = ChatMessage.getSpeaker({ actor: actor });
    let data = actor.data.data;
    // console.log($(event.currentTarget));
    let rolltype = $(event.currentTarget).data('rolltype');
    // if (actor.type == "held") {
        let globalermod = data.abgeleitete.globalermod;
        let wundabzuegemod = data.gesundheit.wundabzuege;
        let furchtmod = data.furcht.furchtabzuege;
        console.log(`globalermod: ${globalermod}`);
        console.log(`wundabzuegemod: ${wundabzuegemod}`);
        console.log(`furchtmod: ${furchtmod}`);
        let be = data.abgeleitete.be;
        let nahkampfmod = data.modifikatoren.nahkampfmod;
    // }
    let pw = 0;
    let label = 'Probe';
    // let groupName_xd20 = "xd20";
    // let choices_xd20 = {
    //     "0": "1W20",
    //     "1": "3W20"
    // };
    // let checked_xd20 = "1";
    // let groupName_schips = "schips";
    // let choices_schips = {
    //     "0": "Ohne",
    //     "1": "ohne Eigenheit",
    //     "2": "mit Eigenheit"
    // };
    // checked_schips: "0";
    // let zeroToEightObj = {
    //     "0": "0",
    //     "1": "1",
    //     "2": "2",
    //     "3": "3",
    //     "4": "4",
    //     "5": "5",
    //     "6": "6",
    //     "7": "7",
    //     "8": "8"
    // };
    if (rolltype == 'nahkampf_diag') {
        let mod_at = 0;
        let mod_vt = 0;
        let mod_schaden = 0;
        let text = '';
        let itemId = event.currentTarget.dataset.itemid;
        // let item = actor.getOwnedItem(itemId);
        let item = actor.items.get(itemId);
        let pw_at = item.data.data.at;
        let pw_vt = item.data.data.vt;
        // console.log(item);
        // let manoever_at = item._data.data.manoever_at;
        let schaden = item.data.data.schaden;
        // console.log(item.data.data);
        // console.log(item._data.data.manoever_at);
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_nahkampf.html',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: '0',
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                // distance_name: "distance",
                // distance_name: "rwdf",
                // distance_checked: "0",
                distance_choice: CONFIG.ILARIS.distance_choice,
                rollModes: CONFIG.Dice.rollModes,
                manoever: item.data.data.manoever,
                item: item,
                // pw: pw
            },
        );
        let d = new Dialog(
            {
                title: 'Nahkampf',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/sword-clash.png"></i>',
                        label: 'Attacke',
                        callback: async (html) => {
                            await nahkampfUpdate(html, actor, item);
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            // Kombinierte Aktion kbak
                            if (item.data.data.manoever.kbak.selected) {
                                mod_at -= 4;
                                text = text.concat('Kombinierte Aktion\n');
                            }
                            // Volle Offensive vlof
                            if (item.data.data.manoever.vlof.selected) {
                                if (item.data.data.manoever.vlof.offensiver_kampfstil) {
                                    mod_at += 8;
                                    text = text.concat('Volle Offensive (Offensiver Kampfstil)\n');
                                } else {
                                    mod_at += 4;
                                    text = text.concat('Volle Offensive\n');
                                }
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
                            let [mod_from_at, text_from_at] = calculate_attacke(actor, item);
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
                            let at_abzuege_mod = 0;
                            if (wundabzuegemod < 0 && item.data.data.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`);
                                at_abzuege_mod = furchtmod;
                            } else {
                                at_abzuege_mod = globalermod;
                            }
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let formula = `${dice_form} + ${pw_at} + ${at_abzuege_mod} + ${nahkampfmod} + ${mod_at}`;
                            // Critfumble & Message
                            let label = `Attacke (${item.name})`;
                            let fumble_val = 1;
                            if (item.data.data.eigenschaften.unberechenbar) {
                                fumble_val = 2;
                            }
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            );
                            // (top, left)
                            // wuerfelwurf(event, actor);
                        },
                    },
                    two: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/shield-opposition.png"></i>',
                        label: 'Verteidigung',
                        callback: async (html) => {
                            await nahkampfUpdate(html, actor, item);
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            // Volle Offensive vlof
                            if (item.data.data.manoever.vlof.selected) {
                                mod_vt -= 8;
                                text = text.concat('Volle Offensive\n');
                            }
                            // Volle Offensive vldf
                            if (item.data.data.manoever.vldf.selected) {
                                mod_vt += 4;
                                text = text.concat('Volle Defensive\n');
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
                                text = text.concat('Ausweichen\n');
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
                                text = text.concat(`${CONFIG.ILARIS.label['km_entw']}\n`);
                            }
                            // Auflaufen lassen km_aufl
                            if (item.data.data.manoever.km_aufl.selected) {
                                let gs = Number(item.data.data.manoever.km_aufl.gs);
                                mod_vt -= 4;
                                text = text.concat(`${CONFIG.ILARIS.label['km_aufl']}: ${gs}\n`);
                            }
                            // Riposte km_rpst
                            if (item.data.data.manoever.km_rpst.selected) {
                                let [mod_from_at, text_from_at] = calculate_attacke(actor, item);
                                mod_vt += -4 + mod_from_at;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['km_rpst']}: (\n${text_from_at})\n`,
                                );
                            }
                            // Schildwall km_shwl
                            if (item.data.data.manoever.km_shwl.selected) {
                                mod_vt -= 4;
                                text = text.concat(`${CONFIG.ILARIS.label['km_shwl']}\n`);
                            }
                            // Unterlaufen km_utlf
                            if (item.data.data.manoever.km_utlf.selected) {
                                mod_vt -= 4;
                                text = text.concat(`${CONFIG.ILARIS.label['km_utlf']}\n`);
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
                            let vt_abzuege_mod = 0;
                            if (wundabzuegemod < 0 && item.data.data.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`);
                                vt_abzuege_mod = furchtmod;
                            } else {
                                vt_abzuege_mod = globalermod;
                            }
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let formula = `${dice_form} + ${pw_vt} + ${vt_abzuege_mod} + ${nahkampfmod} + ${mod_vt}`;
                            // Critfumble & Message
                            let label = `Verteidigung (${item.name})`;
                            await roll_crit_message(formula, label, text, speaker, rollmode);
                        },
                    },
                    three: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                        label: 'Schaden',
                        callback: async (html) => {
                            await nahkampfUpdate(html, actor, item);
                            // Gezielter Schlag km_gzsl
                            let trefferzone = Number(item.data.data.manoever.km_gzsl.selected);
                            if (trefferzone) {
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['km_gzsl']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
                                );
                            } else {
                                let zonenroll = new Roll('1d6');
                                await zonenroll.evaluate({ async: true });
                                // let zonenroll = Math.floor(Math.random() * 6 + 1);
                                text = text.concat(
                                    `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
                                );
                            }
                            // Wuchtschlag km_wusl
                            let wusl = Number(item.data.data.manoever.km_wusl.selected);
                            if (wusl > 0) {
                                mod_schaden += wusl;
                                text = text.concat(`${CONFIG.ILARIS.label['km_wusl']}: ${wusl}\n`);
                            }
                            // Auflaufen lassen km_aufl
                            if (item.data.data.manoever.km_aufl.selected) {
                                let gs = Number(item.data.data.manoever.km_aufl.gs);
                                mod_schaden += gs;
                                text = text.concat(`${CONFIG.ILARIS.label['km_aufl']}: ${gs}\n`);
                            }
                            // Rüstungsbrecher km_rust
                            if (item.data.data.manoever.km_rust.selected) {
                                text = text.concat(`${CONFIG.ILARIS.label['km_rust']}\n`);
                            }
                            // Schildspalter km_shsp
                            if (item.data.data.manoever.km_shsp.selected) {
                                text = text.concat(`${CONFIG.ILARIS.label['km_shsp']}\n`);
                            }
                            // Stumpfer Schlag km_stsl
                            if (item.data.data.manoever.km_stsl.selected) {
                                text = text.concat(`${CONFIG.ILARIS.label['km_stsl']}\n`);
                            }
                            // Hammerschlag km_hmsl
                            if (item.data.data.manoever.km_hmsl.selected) {
                                schaden = schaden.concat(`+${schaden}`);
                                text = text.concat(`${CONFIG.ILARIS.label['km_hmsl']}\n`);
                            }
                            // Niederwerfen km_ndwf
                            if (item.data.data.manoever.km_ndwf.selected) {
                                text = text.concat(`${CONFIG.ILARIS.label['km_ndwf']}\n`);
                            }
                            // Sturmangriff km_stag
                            if (item.data.data.manoever.km_stag.selected) {
                                let gs = Number(item.data.data.manoever.km_stag.gs);
                                mod_schaden += gs;
                                text = text.concat(`${CONFIG.ILARIS.label['km_stag']}: ${gs}\n`);
                            }
                            // Todesstoß km_tdst
                            if (item.data.data.manoever.km_tdst.selected) {
                                text = text.concat(`${CONFIG.ILARIS.label['km_tdst']}\n`);
                            }
                            // Überrennen km_uebr
                            if (item.data.data.manoever.km_uebr.selected) {
                                let gs = Number(item.data.data.manoever.km_uebr.gs);
                                mod_schaden += gs;
                                text = text.concat(`${CONFIG.ILARIS.label['km_uebr']}: ${gs}\n`);
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
                            await roll_crit_message(formula, label, text, speaker, rollmode, false);
                        },
                    },
                    four: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Abbruch'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'fernkampf_diag') {
        let mod_fk = 0;
        let mod_schaden = 0;
        let text = '';
        let itemId = event.currentTarget.dataset.itemid;
        // let item = actor.getOwnedItem(itemId);
        let item = actor.items.get(itemId);
        pw = item.data.data.fk;
        // console.log(item);
        // let manoever_at = item._data.data.manoever_at;
        let schaden = item.data.data.schaden;
        // console.log(item.data.data);
        // console.log(item._data.data.manoever_at);
        // let gzkl_checked = "0",
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_fernkampf.html',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: '0',
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                rw_choice: item.data.data.manoever.rw,
                rw_checked: item.data.data.manoever.fm_rwrh.selected,
                gzkl_choice: CONFIG.ILARIS.gzkl_choice,
                // gzkl_checked: item.data.data.manoever.gzkl.selected,
                lcht_choice: CONFIG.ILARIS.lcht_choice,
                // lcht_checked: item.data.data.manoever.lcht.selected,
                wttr_choice: CONFIG.ILARIS.wttr_choice,
                // wttr_checked: item.data.data.manoever.wttr.selected,
                bwng_choice: CONFIG.ILARIS.bwng_choice,
                // bwng_checked: item.data.data.manoever.bwng.selected,
                dckg_choice: CONFIG.ILARIS.dckg_choice,
                // dckg_checked: item.data.data.manoever.dckg.selected,
                kgtl_choice: CONFIG.ILARIS.kgtl_choice,
                // kgtl_checked: item.data.data.manoever.kgtl.selected,
                // brtn_checked: item.data.data.manoever.brtn.selected,
                fm_snls_choice: CONFIG.ILARIS.fm_snls_choice,
                // fm_snls_checked: item.data.data.manoever.fm_snls.selected,
                fm_srfs_choice: CONFIG.ILARIS.zeroToEightObj,
                // fm_srfs_checked: item.data.data.manoever.fm_srfs.selected,
                rollModes: CONFIG.Dice.rollModes,
                manoever: item.data.data.manoever,
                item: item,
                // pw: pw
            },
        );
        let d = new Dialog(
            {
                title: 'Fernkampf',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/sword-clash.png"></i>',
                        label: 'Attacke',
                        callback: async (html) => {
                            await fernkampfUpdate(html, actor, item);
                            let fumble_val = 1;
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            // Kombinierte Aktion kbak
                            if (item.data.data.manoever.kbak.selected) {
                                mod_fk -= 4;
                                text = text.concat('Kombinierte Aktion\n');
                            }
                            // // Volle Defensive vldf
                            // if (item.data.data.manoever.vldf.possible) {
                            //     if (item.data.data.manoever.vldf.selected) {
                            //         mod_fk -= 4;
                            //     text = text.concat("Volle Defensive ()\n");
                            // }
                            // Reichweite erhöhen fm_rwrh
                            let reichweite = Number(item.data.data.manoever.fm_rwrh.selected);
                            if (reichweite > 0) {
                                mod_fk -= 4 * reichweite;
                                text = text.concat(
                                    `${item.data.data.manoever.rw[reichweite]} (${reichweite}x)\n`,
                                );
                            }
                            //Größenklasse gzkl
                            let gklasse = Number(item.data.data.manoever.gzkl.selected);
                            if (gklasse == 0) mod_fk += 8;
                            else if (gklasse == 1) mod_fk += 4;
                            else if (gklasse == 3) mod_fk -= 4;
                            else if (gklasse == 4) mod_fk -= 8;
                            else if (gklasse == 5) mod_fk -= 12;
                            text = text.concat(`${CONFIG.ILARIS.gzkl_choice[gklasse]}\n`);
                            // Lichtverhältnisse ILARIS.lcht_choice = {
                            let licht = Number(item.data.data.manoever.lcht.selected);
                            let licht_angepasst = Number(item.data.data.manoever.lcht.angepasst);
                            if (licht == 4) {
                                mod_fk -= 32;
                                text = text.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`);
                            } else if (licht == 3) {
                                if (licht_angepasst == 0) {
                                    mod_fk -= 16;
                                    text = text.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`);
                                } else if (licht_angepasst == 1) {
                                    mod_fk -= 8;
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`,
                                    );
                                } else if (licht_angepasst == 2) {
                                    mod_fk -= 4;
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`,
                                    );
                                }
                            } else if (licht == 2) {
                                if (licht_angepasst == 0) {
                                    mod_fk -= 8;
                                    text = text.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`);
                                } else if (licht_angepasst == 1) {
                                    mod_fk -= 4;
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`,
                                    );
                                } else if (licht_angepasst == 2) {
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`,
                                    );
                                }
                            } else if (licht == 1) {
                                if (licht_angepasst == 0) {
                                    mod_fk -= 4;
                                    text = text.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`);
                                } else if (licht_angepasst == 1) {
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`,
                                    );
                                } else if (licht_angepasst == 2) {
                                    text = text.concat(
                                        `${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`,
                                    );
                                }
                            }
                            // Wetter wttr und Bewegung bwng
                            let wetter = Number(item.data.data.manoever.wttr.selected);
                            let bewegung = Number(item.data.data.manoever.bwng.selected);
                            let reflexschuss = item.data.data.manoever.rflx;
                            if (reflexschuss) {
                                let reflex_change = '';
                                if (wetter > 0 || bewegung > 0) {
                                    if (wetter > bewegung) {
                                        wetter -= 1;
                                        reflex_change = 'wetter';
                                    } else {
                                        bewegung -= 1;
                                        reflex_change = 'bewegung';
                                    }
                                }
                                mod_fk -= 4 * (wetter + bewegung);
                                if (wetter > 0 && reflex_change != 'wetter') {
                                    text = text.concat(`${CONFIG.ILARIS.wttr_choice[wetter]}\n`);
                                } else if (reflex_change == 'wetter') {
                                    text = text.concat(
                                        `${CONFIG.ILARIS.wttr_choice[wetter]} (Reflexschuss)\n`,
                                    );
                                }
                                if (bewegung > 0 && reflex_change != 'bewegung') {
                                    text = text.concat(`${CONFIG.ILARIS.bwng_choice[bewegung]}\n`);
                                } else if (reflex_change == 'bewegung') {
                                    text = text.concat(
                                        `${CONFIG.ILARIS.bwng_choice[bewegung]} (Reflexschuss)\n`,
                                    );
                                }
                            } else {
                                if (wetter > 0) {
                                    mod_fk -= 4 * wetter;
                                    text = text.concat(`${CONFIG.ILARIS.wttr_choice[wetter]}\n`);
                                }
                                if (bewegung > 0) {
                                    mod_fk -= 4 * bewegung;
                                    text = text.concat(`${CONFIG.ILARIS.bwng_choice[bewegung]}\n`);
                                }
                            }
                            // Deckung dckg
                            let deckung = Number(item.data.data.manoever.dckg.selected);
                            if (deckung < 0) {
                                mod_fk += 4 * deckung;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['dckg']}: ${CONFIG.ILARIS.dckg_choice[deckung]}\n`,
                                );
                            }
                            // Kampfgetümmel kgtl
                            let kampfgetuemmel = Number(item.data.data.manoever.kgtl.selected);
                            if (kampfgetuemmel == 1) {
                                fumble_val += 1;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['kgtl']}: ${CONFIG.ILARIS.kgtl_choice[kampfgetuemmel]}\n`,
                                );
                            }
                            if (kampfgetuemmel == 2) {
                                fumble_val += 3;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['kgtl']}: ${CONFIG.ILARIS.kgtl_choice[kampfgetuemmel]}\n`,
                                );
                            }
                            // Beritten brtn  Reiterkampf II rtk
                            let beritten = item.data.data.manoever.brtn.selected;
                            let reiterkampf = item.data.data.manoever.brtn.rtk;
                            if (beritten && reiterkampf) {
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['brtn']} (Reiterkampf)\n`,
                                );
                            } else if (beritten) {
                                mod_fk -= 4;
                                text = text.concat(`${CONFIG.ILARIS.label['brtn']}\n`);
                            }
                            // Gezielter Schuss
                            let trefferzone = Number(item.data.data.manoever.fm_gzss.selected);
                            if (trefferzone) {
                                mod_fk -= 2;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_gzss']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
                                );
                            }
                            // else {
                            //     let r = new Roll("1d6");
                            //     r = r.evaluate({ "async": false }).total;
                            //     text = text.concat(`Trefferzone: ${CONFIG.ILARIS.trefferzonen[r]}\n`);
                            // }
                            // Scharfschuss fm_srfs
                            let scharfschuss = Number(item.data.data.manoever.fm_srfs.selected);
                            if (scharfschuss) {
                                mod_fk -= scharfschuss;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_srfs']}: ${scharfschuss}\n`,
                                );
                            }
                            // Zielen fm_zlen    "ruhige_hand": false,
                            let zielen = item.data.data.manoever.fm_zlen.selected;
                            let ruhige_hand = item.data.data.manoever.fm_zlen.ruhige_hand;
                            if (zielen && ruhige_hand) {
                                mod_fk += 4;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_zlen']} (Ruhige Hand)\n`,
                                );
                            } else if (zielen) {
                                mod_fk += 2;
                                text = text.concat(`${CONFIG.ILARIS.label['fm_zlen']}\n`);
                            }
                            // Meisterschuss fm_msts
                            let meisterschuss = item.data.data.manoever.fm_msts.selected;
                            if (meisterschuss) {
                                mod_fk -= 8;
                                text = text.concat(`${CONFIG.ILARIS.label['fm_msts']}\n`);
                            }
                            // Rüstungsbrecher fm_rust
                            let ruestungsbrecher = item.data.data.manoever.fm_rust.selected;
                            if (ruestungsbrecher) {
                                mod_fk -= 4;
                                text = text.concat(`${CONFIG.ILARIS.label['fm_rust']}\n`);
                            }
                            // Schnellschuss fm_snls
                            let schnellschuss = Number(item.data.data.manoever.fm_snls.selected);
                            console.log(`WERT VON SCHNELLSCHUSS: ${schnellschuss}`);
                            if (schnellschuss > 0) {
                                mod_fk -= 4 * schnellschuss;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_snls']} (${schnellschuss})\n`,
                                );
                            }
                            // Modifikator
                            let modifikator = Number(item.data.data.manoever.mod.selected);
                            if (modifikator != 0) {
                                mod_fk += modifikator;
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                            // Rollmode
                            let rollmode = item.data.data.manoever.rllm.selected;
                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let fk_abzuege_mod = 0;
                            if (wundabzuegemod < 0 && item.data.data.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`);
                                fk_abzuege_mod = furchtmod;
                            } else {
                                fk_abzuege_mod = globalermod;
                            }
                            let formula = `${dice_form} + ${pw} + ${fk_abzuege_mod} + ${mod_fk}`;
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${mod_fk}`;
                            // Critfumble & Message
                            let label = `Attacke (${item.name})`;
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            );
                        },
                    },
                    two: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                        label: 'Schaden',
                        callback: async (html) => {
                            await fernkampfUpdate(html, actor, item);
                            // Gezielter Schlag km_gzss
                            let trefferzone = Number(item.data.data.manoever.fm_gzss.selected);
                            if (trefferzone) {
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_gzss']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
                                );
                            } else {
                                let zonenroll = new Roll('1d6');
                                await zonenroll.evaluate({ async: true });
                                // let zonenroll = Math.floor(Math.random() * 6 + 1);
                                text = text.concat(
                                    `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
                                );
                            }
                            // Scharfschuss fm_srfs
                            let fm_srfs = Number(item.data.data.manoever.fm_srfs.selected);
                            if (fm_srfs > 0) {
                                mod_schaden += fm_srfs;
                                text = text.concat(
                                    `${CONFIG.ILARIS.label['fm_srfs']}: ${fm_srfs}\n`,
                                );
                            }
                            // Rüstungsbrecher fm_rust
                            let ruestungsbrecher = item.data.data.manoever.fm_rust.selected;
                            if (ruestungsbrecher) {
                                text = text.concat(`${CONFIG.ILARIS.label['fm_rust']}\n`);
                            }
                            // Meisterschuss fm_msts
                            let meisterschuss = item.data.data.manoever.fm_msts.selected;
                            if (meisterschuss) {
                                text = text.concat(`${CONFIG.ILARIS.label['fm_msts']}\n`);
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
                            await roll_crit_message(formula, label, text, speaker, rollmode, false);
                        },
                    },
                    three: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Abbruch'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'attribut_diag') {
        const attribut_name = $(event.currentTarget).data('attribut');
        label = CONFIG.ILARIS.label[attribut_name];
        pw = data.attribute[attribut_name].pw;
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_attribut.html',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: '1',
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                rollModes: CONFIG.Dice.rollModes,
            },
        );
        let d = new Dialog(
            {
                title: 'Attributsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = '';
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            let hohequalitaet = 0;
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value);
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                                }
                            }
                            let modifikator = 0;
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value);
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`);
                                }
                            }
                            let rollmode = '';
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value;
                            }
                            hohequalitaet *= -4;

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode);
                        },
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Chose Two'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'profan_fertigkeit_diag') {
        let fertigkeit = $(event.currentTarget).data('fertigkeit');
        label = actor.data.data.profan.fertigkeiten[fertigkeit].name;
        const talent_list = {};
        let array_talente = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.talente;
        for (const [i, tal] of array_talente.entries()) {
            talent_list[i] = tal.name;
        }
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_profan.html', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            groupName_talente: 'talente',
            choices_talente_basic: {
                0: 'ohne Talent',
                1: 'mit Talent: ',
            },
            choices_talente: talent_list,
            rollModes: CONFIG.Dice.rollModes,
        });
        let d = new Dialog(
            {
                title: 'Fertigkeitsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = '';
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            let talent_specific = 0;
                            let talent = '';
                            if (html.find('#talent').length > 0) {
                                talent_specific = Number(html.find('#talent')[0].value);
                                talent = talent_list[talent_specific];
                            }
                            let hohequalitaet = 0;
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value);
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                                }
                            }
                            let modifikator = 0;
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value);
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`);
                                }
                            }
                            let rollmode = '';
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value;
                            }
                            if (talent_specific == -2) {
                                pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pw;
                            } else if (talent_specific == -1) {
                                label = label + ' (Talent)';
                                pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                            } else {
                                label = label + ' (' + talent + ')';
                                pw = actor.data.data.profan.fertigkeiten[fertigkeit].data.data.pwt;
                            }
                            hohequalitaet *= -4;

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode);
                        },
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Chose Two'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'freie_fertigkeit_diag') {
        label = $(event.currentTarget).data('fertigkeit');
        pw = Number($(event.currentTarget).data('pw')) * 8 - 2;
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_attribut.html',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: '1',
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                rollModes: CONFIG.Dice.rollModes,
            },
        );
        let d = new Dialog(
            {
                title: 'Freie Fertigkeitsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = '';
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            let hohequalitaet = 0;
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value);
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                                }
                            }
                            let modifikator = 0;
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value);
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`);
                                }
                            }
                            let rollmode = '';
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value;
                            }
                            hohequalitaet *= -4;

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode);
                        },
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Chose Two'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'simpleprobe_diag') {
        label = $(event.currentTarget).data('name');
        pw = Number($(event.currentTarget).data('pw'));
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_attribut.html',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: '1',
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                rollModes: CONFIG.Dice.rollModes,
            },
        );
        let d = new Dialog(
            {
                title: 'Probe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = '';
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            let hohequalitaet = 0;
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value);
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`);
                                }
                            }
                            let modifikator = 0;
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value);
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`);
                                }
                            }
                            let rollmode = '';
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value;
                            }
                            hohequalitaet *= -4;

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`;
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode);
                        },
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Chose Two'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'magie_diag') {
        let mod_pw = 0;
        // let mod_asp = 0;
        let text = '';
        let itemId = event.currentTarget.dataset.itemid;
        let item = actor.items.get(itemId);
        console.log(item.data.data);
        pw = item.data.data.pw;
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_magie.html', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            zere_choice: CONFIG.ILARIS.zere_choice,
            rollModes: CONFIG.Dice.rollModes,
            manoever: item.data.data.manoever,
            item: item,
            // pw: pw
        });
        let d = new Dialog(
            {
                title: 'Zauber',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/book-cover.png"></i>',
                        label: 'Zaubern',
                        callback: async (html) => {
                            await magieUpdate(html, actor, item);
                            let fumble_val = 1;
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            // Kombinierte Aktion kbak
                            if (item.data.data.manoever.kbak.selected) {
                                mod_pw -= 4;
                                text = text.concat('Kombinierte Aktion: -4\n');
                            }
                            // Maechtige Magie mm_mama
                            let mm_mama = Number(item.data.data.manoever.mm_mama.selected);
                            if (mm_mama > 0) {
                                let erschwernis = 4 * mm_mama;
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Mächtige Magie (${mm_mama}x): -${erschwernis}\n`,
                                );
                            }
                            //  Mehrere Ziele mm_mezi
                            let mm_mezi = Number(item.data.data.manoever.mm_mezi.selected);
                            if (mm_mezi > 0) {
                                let erschwernis = 4;
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Mehrere Ziele (${mm_mezi} Stück): -${erschwernis}\n`,
                                );
                            }
                            //  Reichweite erhoehen mm_rwrh
                            let mm_rwrh = Number(item.data.data.manoever.mm_rwrh.selected);
                            if (mm_rwrh > 0) {
                                let erschwernis = 4 * mm_rwrh; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,mm_rwrh); 
                                // let reichweite = multiplyString(item.data.data.reichweite,multiplier);
                                // text = text.concat(
                                //     `Reichweite ${reichweite}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Reichweite erhöhen (${multiplier}-fach): -${erschwernis}\n`,
                                );
                            }
                            // Vorbereitung verkuerzen mm_vbvk
                            let mm_vbvk = Number(item.data.data.manoever.mm_vbvk.selected);
                            if (mm_vbvk > 0) {
                                let erschwernis = 4 * mm_vbvk; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,mm_vbvk); 
                                // let vorbereitung = multiplyString(item.data.data.vorbereitung,1/multiplier);
                                // if(vorbereitung == '0.5 Aktionen'){
                                //     vorbereitung = '0 Aktionen';
                                // }
                                // text = text.concat(
                                //     `Vorbereitung ${vorbereitung}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Vorbereitung verkürzen (1/${multiplier}): -${erschwernis}\n`,
                                );
                            }
                            // Wirkungsdauer verlaengern mm_wkvl
                            let mm_wkvl = Number(item.data.data.manoever.mm_wkvl.selected);
                            if (mm_wkvl > 0) {
                                let erschwernis = 4 * mm_wkvl; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,mm_wkvl); 
                                // let wirkungsdauer = multiplyString(item.data.data.wirkungsdauer,multiplier);
                                // text = text.concat(
                                //     `Wirkungsdauer ${wirkungsdauer}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Wirkungsdauer verlängern (${multiplier}-fach): -${erschwernis}\n`,
                                );
                            }
                            // Zaubertechnik ignorieren mm_ztig
                            let mm_ztig = Number(item.data.data.manoever.mm_ztig.selected);
                            if (mm_ztig > 0) {
                                let erschwernis = 4 * mm_ztig; 
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Zaubertechnik ignorieren (${mm_ztig}x): -${erschwernis}\n`,
                                );
                            }
                            // Erzwingen mm_erzw
                            // console.log('Erzwingen possible: ', item.data.data.manoever.mm_erzw.possible);
                            if (item.data.data.manoever.mm_erzw.selected && item.data.data.manoever.mm_erzw.possible) {
                                mod_pw += 4;
                                text = text.concat('Erzwingen: +4\n');
                            }
                            // Kosten sparen mm_kosp
                            let mm_kosp = Number(item.data.data.manoever.mm_kosp.selected);
                            if (mm_kosp > 0  && item.data.data.manoever.mm_kosp.possible) {
                                let erschwernis = 4 * mm_kosp; 
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Kosten sparen (${mm_kosp}x): -${erschwernis}\n`,
                                );
                            }
                            // Zeit lassen mm_ztls
                            if (item.data.data.manoever.mm_ztls.selected && item.data.data.manoever.mm_ztls.possible) {
                                mod_pw += 2;
                                text = text.concat('Zeit lassen: +2\n');
                            }
                            // Zeremonie mm_zere
                            let mm_zere = Number(item.data.data.manoever.mm_zere.selected);
                            if (mm_zere > 0  && item.data.data.manoever.mm_zere.possible) {
                                let erleichterung = 2+ 2 * mm_zere; 
                                mod_pw += erleichterung;
                                text = text.concat(
                                    `Zeremonie (${CONFIG.ILARIS.zere_choice[mm_zere]}): +${erleichterung}\n`,
                                );
                            }
                            // Opferung mm_opfe
                            if (item.data.data.manoever.mm_opfe.selected && item.data.data.manoever.mm_opfe.possible) {
                                mod_pw += 4;
                                text = text.concat('Opferung: +4\n');
                            }

                            // Modifikator
                            let modifikator = Number(item.data.data.manoever.mod.selected);
                            if (modifikator != 0) {
                                mod_pw += modifikator;
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                            // Rollmode
                            let rollmode = item.data.data.manoever.rllm.selected;
                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let pw_abzuege_mod = 0;
                            if (wundabzuegemod < 0 && item.data.data.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`);
                                pw_abzuege_mod = furchtmod;
                            } else {
                                pw_abzuege_mod = globalermod;
                            }
                            let formula = `${dice_form} + ${pw} + ${pw_abzuege_mod} + ${mod_pw}`;
                            // Critfumble & Message
                            let label = `Zauber (${item.name})`;
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            );
                        },
                    },
                    // two: {
                    //     icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                    //     label: 'Schaden',
                    //     callback: async (html) => {
                    //         await fernkampfUpdate(html, actor, item);
                    //         // Gezielter Schlag km_gzss
                    //         let trefferzone = Number(item.data.data.manoever.fm_gzss.selected);
                    //         if (trefferzone) {
                    //             text = text.concat(
                    //                 `${CONFIG.ILARIS.label['fm_gzss']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
                    //             );
                    //         } else {
                    //             let zonenroll = new Roll('1d6');
                    //             await zonenroll.evaluate({ async: true });
                    //             // let zonenroll = Math.floor(Math.random() * 6 + 1);
                    //             text = text.concat(
                    //                 `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
                    //             );
                    //         }
                    //         // Scharfschuss fm_srfs
                    //         let fm_srfs = Number(item.data.data.manoever.fm_srfs.selected);
                    //         if (fm_srfs > 0) {
                    //             mod_schaden += fm_srfs;
                    //             text = text.concat(
                    //                 `${CONFIG.ILARIS.label['fm_srfs']}: ${fm_srfs}\n`,
                    //             );
                    //         }
                    //         // Modifikator
                    //         let modifikator = Number(item.data.data.manoever.mod.selected);
                    //         if (modifikator != 0) {
                    //             mod_schaden += modifikator;
                    //             text = text.concat(`Modifikator: ${modifikator}\n`);
                    //         }
                    //         // Rollmode
                    //         let rollmode = item.data.data.manoever.rllm.selected;
                    //         let formula = `${schaden} + ${mod_schaden}`;
                    //         let label = `Schaden (${item.name})`;
                    //         // Critfumble & Message
                    //         await roll_crit_message(formula, label, text, speaker, rollmode, false);
                    //     },
                    // },
                    three: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Abbruch'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    } else if (rolltype == 'karma_diag') {
        let mod_pw = 0;
        // let mod_asp = 0;
        let text = '';
        let itemId = event.currentTarget.dataset.itemid;
        let item = actor.items.get(itemId);
        console.log(item.data.data);
        pw = item.data.data.pw;
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_karma.html', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            zere_choice: CONFIG.ILARIS.zere_choice,
            rollModes: CONFIG.Dice.rollModes,
            manoever: item.data.data.manoever,
            item: item,
            // pw: pw
        });
        let d = new Dialog(
            {
                title: 'Liturgie',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/book-cover.png"></i>',
                        label: 'Beten',
                        callback: async (html) => {
                            await karmaUpdate(html, actor, item);
                            let fumble_val = 1;
                            let dice_number = 0;
                            let discard_l = 0;
                            let discard_h = 0;
                            [text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            );
                            // Kombinierte Aktion kbak
                            if (item.data.data.manoever.kbak.selected) {
                                mod_pw -= 4;
                                text = text.concat('Kombinierte Aktion: -4\n');
                            }
                            // Maechtige Liturgie lm_mali
                            let lm_mali = Number(item.data.data.manoever.lm_mali.selected);
                            if (lm_mali > 0) {
                                let erschwernis = 4 * lm_mali;
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Mächtige Liturgie (${lm_mali}x): -${erschwernis}\n`,
                                );
                            }
                            //  Mehrere Ziele lm_mezi
                            let lm_mezi = Number(item.data.data.manoever.lm_mezi.selected);
                            if (lm_mezi > 0) {
                                let erschwernis = 4;
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Mehrere Ziele (${lm_mezi} Stück): -${erschwernis}\n`,
                                );
                            }
                            //  Reichweite erhoehen lm_rwrh
                            let lm_rwrh = Number(item.data.data.manoever.lm_rwrh.selected);
                            if (lm_rwrh > 0) {
                                let erschwernis = 4 * lm_rwrh; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,lm_rwrh); 
                                text = text.concat(
                                    `Reichweite erhöhen (${multiplier}-fach): -${erschwernis}\n`,
                                );
                            }
                            // Vorbereitung verkuerzen lm_vbvk
                            let lm_vbvk = Number(item.data.data.manoever.lm_vbvk.selected);
                            if (lm_vbvk > 0) {
                                let erschwernis = 4 * lm_vbvk; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,lm_vbvk); 
                                // let vorbereitung = multiplyString(item.data.data.vorbereitung,1/multiplier);
                                // if(vorbereitung == '0.5 Aktionen'){
                                //     vorbereitung = '0 Aktionen';
                                // }
                                // text = text.concat(
                                //     `Vorbereitung ${vorbereitung}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Vorbereitung verkürzen (1/${multiplier}): -${erschwernis}\n`,
                                );
                            }
                            // Wirkungsdauer verlaengern lm_wkvl
                            let lm_wkvl = Number(item.data.data.manoever.lm_wkvl.selected);
                            if (lm_wkvl > 0) {
                                let erschwernis = 4 * lm_wkvl; 
                                mod_pw -= erschwernis;
                                let multiplier = Math.pow(2,lm_wkvl); 
                                text = text.concat(
                                    `Wirkungsdauer verlängern (${lm_wkvl}-fach): -${erschwernis}\n`,
                                );
                            }
                            // Zaubertechnik ignorieren lm_ltig
                            let lm_ltig = Number(item.data.data.manoever.lm_ltig.selected);
                            if (lm_ltig > 0) {
                                let erschwernis = 4 * lm_ltig; 
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Zaubertechnik ignorieren (${lm_ltig}x): -${erschwernis}\n`,
                                );
                            }
                            // Kosten sparen lm_kosp
                            let lm_kosp = Number(item.data.data.manoever.lm_kosp.selected);
                            if (lm_kosp > 0  && item.data.data.manoever.lm_kosp.possible) {
                                let erschwernis = 4 * lm_kosp; 
                                mod_pw -= erschwernis;
                                text = text.concat(
                                    `Kosten sparen (${lm_kosp}x): -${erschwernis}\n`,
                                );
                            }
                            // Zeremonie lm_zere
                            let lm_zere = Number(item.data.data.manoever.lm_zere.selected);
                            if (lm_zere > 0  && item.data.data.manoever.lm_zere.possible) {
                                let erleichterung = 2+ 2 * lm_zere; 
                                mod_pw += erleichterung;
                                text = text.concat(
                                    `Zeremonie (${CONFIG.ILARIS.zere_choice[lm_zere]}): +${erleichterung}\n`,
                                );
                            }
                            // Opferung lm_opfe
                            if (item.data.data.manoever.lm_opfe.selected && item.data.data.manoever.lm_opfe.possible) {
                                mod_pw += 4;
                                text = text.concat('Opferung: +4\n');
                            }

                            // Modifikator
                            let modifikator = Number(item.data.data.manoever.mod.selected);
                            if (modifikator != 0) {
                                mod_pw += modifikator;
                                text = text.concat(`Modifikator: ${modifikator}\n`);
                            }
                            // Rollmode
                            let rollmode = item.data.data.manoever.rllm.selected;
                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`;
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let pw_abzuege_mod = 0;
                            if (wundabzuegemod < 0 && item.data.data.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`);
                                pw_abzuege_mod = furchtmod;
                            } else {
                                pw_abzuege_mod = globalermod;
                            }
                            let formula = `${dice_form} + ${pw} + ${pw_abzuege_mod} + ${mod_pw}`;
                            // Critfumble & Message
                            let label = `Zauber (${item.name})`;
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            );
                        },
                    },
                    // two: {
                    //     icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/bloody-sword.png"></i>',
                    //     label: 'Schaden',
                    //     callback: async (html) => {
                    //         await fernkampfUpdate(html, actor, item);
                    //         // Gezielter Schlag km_gzss
                    //         let trefferzone = Number(item.data.data.manoever.fm_gzss.selected);
                    //         if (trefferzone) {
                    //             text = text.concat(
                    //                 `${CONFIG.ILARIS.label['fm_gzss']}: ${CONFIG.ILARIS.trefferzonen[trefferzone]}\n`,
                    //             );
                    //         } else {
                    //             let zonenroll = new Roll('1d6');
                    //             await zonenroll.evaluate({ async: true });
                    //             // let zonenroll = Math.floor(Math.random() * 6 + 1);
                    //             text = text.concat(
                    //                 `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
                    //             );
                    //         }
                    //         // Scharfschuss fm_srfs
                    //         let fm_srfs = Number(item.data.data.manoever.fm_srfs.selected);
                    //         if (fm_srfs > 0) {
                    //             mod_schaden += fm_srfs;
                    //             text = text.concat(
                    //                 `${CONFIG.ILARIS.label['fm_srfs']}: ${fm_srfs}\n`,
                    //             );
                    //         }
                    //         // Modifikator
                    //         let modifikator = Number(item.data.data.manoever.mod.selected);
                    //         if (modifikator != 0) {
                    //             mod_schaden += modifikator;
                    //             text = text.concat(`Modifikator: ${modifikator}\n`);
                    //         }
                    //         // Rollmode
                    //         let rollmode = item.data.data.manoever.rllm.selected;
                    //         let formula = `${schaden} + ${mod_schaden}`;
                    //         let label = `Schaden (${item.name})`;
                    //         // Critfumble & Message
                    //         await roll_crit_message(formula, label, text, speaker, rollmode, false);
                    //     },
                    // },
                    three: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Abbrechen',
                        callback: () => console.log('Abbruch'),
                    },
                },
            },
            {
                jQuery: true,
            },
        );
        d.render(true);
    }
}
