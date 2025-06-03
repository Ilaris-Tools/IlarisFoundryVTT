import { AngriffDialog } from '../sheets/dialogs/angriff.js'
import { FernkampfAngriffDialog } from '../sheets/dialogs/fernkampf_angriff.js'
import { nahkampfUpdate, calculate_attacke } from './wuerfel/nahkampf_prepare.js'
import { fernkampfUpdate } from './wuerfel/fernkampf_prepare.js'
import { magieUpdate } from './wuerfel/magie_prepare.js'
import { karmaUpdate } from './wuerfel/karma_prepare.js'
import { multiplyString } from './wuerfel/chatutilities.js'

import {
    calculate_diceschips,
    roll_crit_message,
    get_statuseffect_by_id,
} from './wuerfel/wuerfel_misc.js'
// import { calculate_diceschips, roll_crit_message } from "./wuerfel/wuerfel_misc.js";

export async function wuerfelwurf(event, actor) {
    console.log(event)
    let speaker = ChatMessage.getSpeaker({ actor: actor })
    let systemData = actor.system
    let rolltype = $(event.currentTarget).data('rolltype')
    let globalermod = systemData.abgeleitete.globalermod
    let wundabzuegemod = systemData.gesundheit.wundabzuege
    let furchtmod = systemData.furcht.furchtabzuege
    let be = systemData.abgeleitete.be
    let nahkampfmod = systemData.modifikatoren.nahkampfmod
    let pw = 0
    let label = 'Probe'
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
    if (rolltype == 'angriff_diag') {
        let item = actor.items.get(event.currentTarget.dataset.itemid)
        await item.setManoevers()
        let d = new AngriffDialog(actor, item)
        await d.render(true)
    } else if (rolltype == 'fernkampf_diag') {
        let item = actor.items.get(event.currentTarget.dataset.itemid)
        await item.setManoevers()
        let d = new FernkampfAngriffDialog(actor, item)
        await d.render(true)
    } else if (rolltype == 'attribut_diag') {
        const attribut_name = $(event.currentTarget).data('attribut')
        label = CONFIG.ILARIS.label[attribut_name]
        pw = systemData.attribute[attribut_name].pw
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_attribut.hbs', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
        })
        let d = new Dialog(
            {
                title: 'Attributsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = ''
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            let hohequalitaet = 0
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value)
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value
                            }
                            hohequalitaet *= -4

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode)
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
        )
        d.render(true)
    } else if (rolltype == 'profan_fertigkeit_diag') {
        let fertigkeit = $(event.currentTarget).data('fertigkeit')
        console.log(actor)
        label = actor.profan.fertigkeiten[fertigkeit].name
        const talent_list = {}
        let array_talente = actor.profan.fertigkeiten[fertigkeit].system.talente
        for (const [i, tal] of array_talente.entries()) {
            talent_list[i] = tal.name
        }
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_profan.hbs', {
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
            defaultRollMode: game.settings.get('core', 'rollMode'),
        })
        let d = new Dialog(
            {
                title: 'Fertigkeitsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = ''
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            let talent_specific = 0
                            let talent = ''
                            if (html.find('#talent').length > 0) {
                                talent_specific = Number(html.find('#talent')[0].value)
                                talent = talent_list[talent_specific]
                            }
                            let hohequalitaet = 0
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value)
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value
                            }
                            if (talent_specific == -2) {
                                pw = actor.profan.fertigkeiten[fertigkeit].system.pw
                            } else if (talent_specific == -1) {
                                label = label + ' (Talent)'
                                pw = actor.profan.fertigkeiten[fertigkeit].system.pwt
                            } else {
                                label = label + ' (' + talent + ')'
                                pw = actor.profan.fertigkeiten[fertigkeit].system.pwt
                            }
                            hohequalitaet *= -4

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode)
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
        )
        d.render(true)
    } else if (rolltype == 'freie_fertigkeit_diag') {
        label = $(event.currentTarget).data('fertigkeit')
        pw = Number($(event.currentTarget).data('pw')) * 8 - 2
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_attribut.hbs', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
        })
        let d = new Dialog(
            {
                title: 'Freie Fertigkeitsprobe',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = ''
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            let hohequalitaet = 0
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value)
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value
                            }
                            hohequalitaet *= -4

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator}`
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode)
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
        )
        d.render(true)
    } else if (rolltype == 'simpleformula_diag') {
        label = $(event.currentTarget).data('name')
        let formula = $(event.currentTarget).data('formula')
        const html = await renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_simpleformula.hbs',
            {
                rollModes: CONFIG.Dice.rollModes,
                defaultRollMode: game.settings.get('core', 'rollMode'),
            },
        )
        console.log('hier')
        let d = new Dialog(
            {
                title: label,
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = ''
                            let modifikator = 0
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                    formula = formula + '+' + modifikator
                                }
                            }
                            let rollmode = ''
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value
                            }
                            await roll_crit_message(formula, label, text, speaker, rollmode, false)
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
        )
        d.render(true)
    } else if (rolltype == 'simpleprobe_diag') {
        label = $(event.currentTarget).data('name')
        pw = Number($(event.currentTarget).data('pw'))
        let probentyp = $(event.currentTarget).data('probentyp')
        let spezialmod = 0
        if (probentyp == 'nahkampf') {
            spezialmod = nahkampfmod
        }
        let xd20 = '1'
        if ($(event.currentTarget).data('xd20') == '0') {
            xd20 = '0'
        }
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_attribut.hbs', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: xd20,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
        })
        let d = new Dialog(
            {
                title: 'Probe ( ' + label + ')',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                        label: 'OK',
                        callback: async (html) => {
                            let text = ''
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            let hohequalitaet = 0
                            if (html.find('#hohequalitaet').length > 0) {
                                hohequalitaet = Number(html.find('#hohequalitaet')[0].value)
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find('#modifikator').length > 0) {
                                modifikator = Number(html.find('#modifikator')[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find('#rollMode').length > 0) {
                                rollmode = html.find('#rollMode')[0].value
                            }
                            hohequalitaet *= -4

                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            let formula = `${dice_form} + ${pw} + ${globalermod} + ${hohequalitaet} + ${modifikator} + ${spezialmod}`
                            // Critfumble & Message
                            await roll_crit_message(formula, label, text, speaker, rollmode)
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
        )
        d.render(true)
    } else if (rolltype == 'magie_diag') {
        let mod_pw = 0
        // let mod_asp = 0;
        let text = ''
        let itemId = event.currentTarget.dataset.itemid
        let item = actor.items.get(itemId)
        console.log(item)
        pw = item.system.pw
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_magie.hbs', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            zere_choice: CONFIG.ILARIS.zere_choice,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
            manoever: item.system.manoever,
            item: item,
            // pw: pw
        })
        let d = new Dialog(
            {
                title: 'Zauber',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/book-cover.png"></i>',
                        label: 'Zaubern',
                        callback: async (html) => {
                            await magieUpdate(html, actor, item)
                            let fumble_val = 1
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            // Kombinierte Aktion kbak
                            if (item.system.manoever.kbak.selected) {
                                mod_pw -= 4
                                text = text.concat('Kombinierte Aktion: -4\n')
                            }
                            // Maechtige Magie mm_mama
                            let mm_mama = Number(item.system.manoever.mm_mama.selected)
                            if (mm_mama > 0) {
                                let erschwernis = 4 * mm_mama
                                mod_pw -= erschwernis
                                text = text.concat(
                                    `Mächtige Magie (${mm_mama}x): -${erschwernis}\n`,
                                )
                            }
                            //  Mehrere Ziele mm_mezi
                            let mm_mezi = Number(item.system.manoever.mm_mezi.selected)
                            if (mm_mezi > 0) {
                                let erschwernis = 4
                                mod_pw -= erschwernis
                                text = text.concat(`Mehrere Ziele: -${erschwernis}\n`)
                            }
                            //  Reichweite erhoehen mm_rwrh
                            let mm_rwrh = Number(item.system.manoever.mm_rwrh.selected)
                            if (mm_rwrh > 0) {
                                let erschwernis = 4 * mm_rwrh
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, mm_rwrh)
                                // let reichweite = multiplyString(item.data.data.reichweite,multiplier);
                                // text = text.concat(
                                //     `Reichweite ${reichweite}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Reichweite erhöhen (${multiplier}-fach): -${erschwernis}\n`,
                                )
                            }
                            // Vorbereitung verkuerzen mm_vbvk
                            let mm_vbvk = Number(item.system.manoever.mm_vbvk.selected)
                            if (mm_vbvk > 0) {
                                let erschwernis = 4 * mm_vbvk
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, mm_vbvk)
                                // let vorbereitung = multiplyString(item.data.data.vorbereitung,1/multiplier);
                                // if(vorbereitung == '0.5 Aktionen'){
                                //     vorbereitung = '0 Aktionen';
                                // }
                                // text = text.concat(
                                //     `Vorbereitung ${vorbereitung}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Vorbereitung verkürzen (1/${multiplier}): -${erschwernis}\n`,
                                )
                            }
                            // Wirkungsdauer verlaengern mm_wkvl
                            let mm_wkvl = Number(item.system.manoever.mm_wkvl.selected)
                            if (mm_wkvl > 0) {
                                let erschwernis = 4 * mm_wkvl
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, mm_wkvl)
                                // let wirkungsdauer = multiplyString(item.data.data.wirkungsdauer,multiplier);
                                // text = text.concat(
                                //     `Wirkungsdauer ${wirkungsdauer}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Wirkungsdauer verlängern (${multiplier}-fach): -${erschwernis}\n`,
                                )
                            }
                            // Zaubertechnik ignorieren mm_ztig
                            let mm_ztig = Number(item.system.manoever.mm_ztig.selected)
                            if (mm_ztig > 0) {
                                let erschwernis = 4 * mm_ztig
                                mod_pw -= erschwernis
                                text = text.concat(
                                    `Zaubertechnik ignorieren (${mm_ztig}x): -${erschwernis}\n`,
                                )
                            }
                            // Erzwingen mm_erzw
                            // console.log('Erzwingen possible: ', item.data.data.manoever.mm_erzw.possible);
                            if (
                                item.system.manoever.mm_erzw.selected &&
                                item.system.manoever.mm_erzw.possible
                            ) {
                                mod_pw += 4
                                text = text.concat('Erzwingen: +4\n')
                            }
                            // Kosten sparen mm_kosp
                            let mm_kosp = Number(item.system.manoever.mm_kosp.selected)
                            if (mm_kosp > 0 && item.system.manoever.mm_kosp.possible) {
                                let erschwernis = 4 * mm_kosp
                                mod_pw -= erschwernis
                                text = text.concat(`Kosten sparen (${mm_kosp}x): -${erschwernis}\n`)
                            }
                            // Zeit lassen mm_ztls
                            if (
                                item.system.manoever.mm_ztls.selected &&
                                item.system.manoever.mm_ztls.possible
                            ) {
                                mod_pw += 2
                                text = text.concat('Zeit lassen: +2\n')
                            }
                            // Zeremonie mm_zere
                            let mm_zere = Number(item.system.manoever.mm_zere.selected)
                            if (mm_zere > 0 && item.system.manoever.mm_zere.possible) {
                                let erleichterung = 2 + 2 * mm_zere
                                mod_pw += erleichterung
                                text = text.concat(
                                    `Zeremonie (${CONFIG.ILARIS.zere_choice[mm_zere]}): +${erleichterung}\n`,
                                )
                            }
                            // Opferung mm_opfe
                            if (
                                item.system.manoever.mm_opfe.selected &&
                                item.system.manoever.mm_opfe.possible
                            ) {
                                mod_pw += 4
                                text = text.concat('Opferung: +4\n')
                            }

                            // Modifikator
                            let modifikator = Number(item.system.manoever.mod.selected)
                            if (modifikator != 0) {
                                mod_pw += modifikator
                                text = text.concat(`Modifikator: ${modifikator}\n`)
                            }
                            // Rollmode
                            let rollmode = item.system.manoever.rllm.selected
                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let pw_abzuege_mod = 0
                            if (wundabzuegemod < 0 && item.system.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`)
                                pw_abzuege_mod = furchtmod
                            } else {
                                pw_abzuege_mod = globalermod
                            }
                            let formula = `${dice_form} + ${pw} + ${pw_abzuege_mod} + ${mod_pw}`
                            // Critfumble & Message
                            let label = `Zauber (${item.name})`
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            )
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
        )
        d.render(true)
    } else if (rolltype == 'karma_diag') {
        let mod_pw = 0
        // let mod_asp = 0;
        let text = ''
        let itemId = event.currentTarget.dataset.itemid
        let item = actor.items.get(itemId)
        console.log(item)
        pw = item.system.pw
        const html = await renderTemplate('systems/Ilaris/templates/chat/probendiag_karma.hbs', {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            zere_choice: CONFIG.ILARIS.zere_choice,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
            manoever: item.system.manoever,
            item: item,
            // pw: pw
        })
        let d = new Dialog(
            {
                title: 'Liturgie',
                content: html,
                buttons: {
                    one: {
                        icon: '<i><img class="button-icon-nahkampf" src="systems/Ilaris/assets/game-icons.net/book-cover.png"></i>',
                        label: 'Beten',
                        callback: async (html) => {
                            await karmaUpdate(html, actor, item)
                            let fumble_val = 1
                            let dice_number = 0
                            let discard_l = 0
                            let discard_h = 0
                            ;[text, dice_number, discard_l, discard_h] = calculate_diceschips(
                                html,
                                text,
                                actor,
                            )
                            // Kombinierte Aktion kbak
                            if (item.system.manoever.kbak.selected) {
                                mod_pw -= 4
                                text = text.concat('Kombinierte Aktion: -4\n')
                            }
                            // Maechtige Liturgie lm_mali
                            let lm_mali = Number(item.system.manoever.lm_mali.selected)
                            if (lm_mali > 0) {
                                let erschwernis = 4 * lm_mali
                                mod_pw -= erschwernis
                                text = text.concat(
                                    `Mächtige Liturgie (${lm_mali}x): -${erschwernis}\n`,
                                )
                            }
                            //  Mehrere Ziele lm_mezi
                            let lm_mezi = Number(item.system.manoever.lm_mezi.selected)
                            if (lm_mezi > 0) {
                                let erschwernis = 4
                                mod_pw -= erschwernis
                                text = text.concat(`Mehrere Ziele: -${erschwernis}\n`)
                            }
                            //  Reichweite erhoehen lm_rwrh
                            let lm_rwrh = Number(item.system.manoever.lm_rwrh.selected)
                            if (lm_rwrh > 0) {
                                let erschwernis = 4 * lm_rwrh
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, lm_rwrh)
                                text = text.concat(
                                    `Reichweite erhöhen (${multiplier}-fach): -${erschwernis}\n`,
                                )
                            }
                            // Vorbereitung verkuerzen lm_vbvk
                            let lm_vbvk = Number(item.system.manoever.lm_vbvk.selected)
                            if (lm_vbvk > 0) {
                                let erschwernis = 4 * lm_vbvk
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, lm_vbvk)
                                // let vorbereitung = multiplyString(item.data.data.vorbereitung,1/multiplier);
                                // if(vorbereitung == '0.5 Aktionen'){
                                //     vorbereitung = '0 Aktionen';
                                // }
                                // text = text.concat(
                                //     `Vorbereitung ${vorbereitung}: -${erschwernis}\n`,
                                // );
                                text = text.concat(
                                    `Vorbereitung verkürzen (1/${multiplier}): -${erschwernis}\n`,
                                )
                            }
                            // Wirkungsdauer verlaengern lm_wkvl
                            let lm_wkvl = Number(item.system.manoever.lm_wkvl.selected)
                            if (lm_wkvl > 0) {
                                let erschwernis = 4 * lm_wkvl
                                mod_pw -= erschwernis
                                let multiplier = Math.pow(2, lm_wkvl)
                                text = text.concat(
                                    `Wirkungsdauer verlängern (${lm_wkvl}-fach): -${erschwernis}\n`,
                                )
                            }
                            // Zaubertechnik ignorieren lm_ltig
                            let lm_ltig = Number(item.system.manoever.lm_ltig.selected)
                            if (lm_ltig > 0) {
                                let erschwernis = 4 * lm_ltig
                                mod_pw -= erschwernis
                                text = text.concat(
                                    `Zaubertechnik ignorieren (${lm_ltig}x): -${erschwernis}\n`,
                                )
                            }
                            // Kosten sparen lm_kosp
                            let lm_kosp = Number(item.system.manoever.lm_kosp.selected)
                            if (lm_kosp > 0 && item.system.manoever.lm_kosp.possible) {
                                let erschwernis = 4 * lm_kosp
                                mod_pw -= erschwernis
                                text = text.concat(`Kosten sparen (${lm_kosp}x): -${erschwernis}\n`)
                            }
                            // Zeremonie lm_zere
                            let lm_zere = Number(item.system.manoever.lm_zere.selected)
                            if (lm_zere > 0 && item.system.manoever.lm_zere.possible) {
                                let erleichterung = 2 + 2 * lm_zere
                                mod_pw += erleichterung
                                text = text.concat(
                                    `Zeremonie (${CONFIG.ILARIS.zere_choice[lm_zere]}): +${erleichterung}\n`,
                                )
                            }
                            // Opferung lm_opfe
                            if (
                                item.system.manoever.lm_opfe.selected &&
                                item.system.manoever.lm_opfe.possible
                            ) {
                                mod_pw += 4
                                text = text.concat('Opferung: +4\n')
                            }

                            // Modifikator
                            let modifikator = Number(item.system.manoever.mod.selected)
                            if (modifikator != 0) {
                                mod_pw += modifikator
                                text = text.concat(`Modifikator: ${modifikator}\n`)
                            }
                            // Rollmode
                            let rollmode = item.system.manoever.rllm.selected
                            let dice_form = `${dice_number}d20dl${discard_l}dh${discard_h}`
                            // let formula = `${dice_form} + ${pw} + ${globalermod} + ${nahkampfmod} + ${mod_at}`;
                            let pw_abzuege_mod = 0
                            if (wundabzuegemod < 0 && item.system.manoever.kwut) {
                                text = text.concat(`(Kalte Wut)\n`)
                                pw_abzuege_mod = furchtmod
                            } else {
                                pw_abzuege_mod = globalermod
                            }
                            let formula = `${dice_form} + ${pw} + ${pw_abzuege_mod} + ${mod_pw}`
                            // Critfumble & Message
                            let label = `Zauber (${item.name})`
                            await roll_crit_message(
                                formula,
                                label,
                                text,
                                speaker,
                                rollmode,
                                true,
                                fumble_val,
                            )
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
        )
        d.render(true)
    }
}
