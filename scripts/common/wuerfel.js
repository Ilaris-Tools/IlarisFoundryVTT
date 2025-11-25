import { AngriffDialog } from '../sheets/dialogs/angriff.js'
import { FernkampfAngriffDialog } from '../sheets/dialogs/fernkampf_angriff.js'
import { UebernatuerlichDialog } from '../sheets/dialogs/uebernatuerlich.js'
import { FertigkeitDialog } from '../sheets/dialogs/fertigkeit.js'
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
    let dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
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
        let d = new AngriffDialog(actor, item)
        await d.render(true)
    } else if (rolltype == 'fernkampf_diag') {
        let item = actor.items.get(event.currentTarget.dataset.itemid)
        let d = new FernkampfAngriffDialog(actor, item)
        await d.render(true)
    } else if (rolltype == 'magie_diag' || rolltype == 'karma_diag') {
        let item = actor.items.get(event.currentTarget.dataset.itemid)
        console.log('item', item)
        let d = new UebernatuerlichDialog(actor, item)

        await d.render(true)
    } else if (rolltype == 'fertigkeit_diag') {
        // Unified skill/attribute dialog with preview
        const probeType = $(event.currentTarget).data('probetype') || 'fertigkeit'

        if (probeType === 'attribut') {
            const attribut_name = $(event.currentTarget).data('attribut')
            const label = CONFIG.ILARIS.label[attribut_name]
            const pw = systemData.attribute[attribut_name].pw

            let d = new FertigkeitDialog(actor, {
                probeType: 'attribut',
                fertigkeitKey: attribut_name,
                fertigkeitName: label,
                pw: pw,
            })
            await d.render(true)
        } else if (probeType === 'freie_fertigkeit') {
            const fertigkeitName = $(event.currentTarget).data('fertigkeit')
            const stufe = Number($(event.currentTarget).data('pw'))
            const pw = stufe * 8 - 2

            let d = new FertigkeitDialog(actor, {
                probeType: 'freie_fertigkeit',
                fertigkeitKey: null,
                fertigkeitName: fertigkeitName,
                pw: pw,
            })
            await d.render(true)
        } else {
            // Regular skill (fertigkeit)
            const fertigkeit = $(event.currentTarget).data('fertigkeit')
            const fertigkeitData = actor.profan.fertigkeiten[fertigkeit]
            const fertigkeitName = fertigkeitData.name
            const pw = fertigkeitData.system.pw

            // Build talent list
            const talentList = {}
            const talente = fertigkeitData.system.talente || []
            for (const [i, tal] of talente.entries()) {
                talentList[i] = tal.name
            }

            let d = new FertigkeitDialog(actor, {
                probeType: 'fertigkeit',
                fertigkeitKey: fertigkeit,
                fertigkeitName: fertigkeitName,
                pw: pw,
                talentList: talentList,
            })
            await d.render(true)
        }
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
            dialogId: dialogId,
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
                                dialogId,
                            )
                            let hohequalitaet = 0
                            if (html.find(`#hohequalitaet-${dialogId}`).length > 0) {
                                hohequalitaet = Number(
                                    html.find(`#hohequalitaet-${dialogId}`)[0].value,
                                )
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find(`#modifikator-${dialogId}`).length > 0) {
                                modifikator = Number(html.find(`#modifikator-${dialogId}`)[0].value)
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
            dialogId: dialogId,
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
                                dialogId,
                            )
                            let talent_specific = 0
                            let talent = ''
                            if (html.find(`#talent-${dialogId}`).length > 0) {
                                talent_specific = Number(html.find(`#talent-${dialogId}`)[0].value)
                                talent = talent_list[talent_specific]
                            }
                            let hohequalitaet = 0
                            if (html.find(`#hohequalitaet-${dialogId}`).length > 0) {
                                hohequalitaet = Number(
                                    html.find(`#hohequalitaet-${dialogId}`)[0].value,
                                )
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find(`#modifikator-${dialogId}`).length > 0) {
                                modifikator = Number(html.find(`#modifikator-${dialogId}`)[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find(`#rollMode-${dialogId}`).length > 0) {
                                rollmode = html.find(`#rollMode-${dialogId}`)[0].value
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
            dialogId: dialogId,
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
                                dialogId,
                            )
                            let hohequalitaet = 0
                            if (html.find(`#hohequalitaet-${dialogId}`).length > 0) {
                                hohequalitaet = Number(
                                    html.find(`#hohequalitaet-${dialogId}`)[0].value,
                                )
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find(`#modifikator-${dialogId}`).length > 0) {
                                modifikator = Number(html.find(`#modifikator-${dialogId}`)[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                }
                            }
                            let rollmode = ''
                            if (html.find(`#rollMode-${dialogId}`).length > 0) {
                                rollmode = html.find(`#rollMode-${dialogId}`)[0].value
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
                dialogId: dialogId,
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
                            if (html.find(`#modifikator-${dialogId}`).length > 0) {
                                modifikator = Number(html.find(`#modifikator-${dialogId}`)[0].value)
                                if (modifikator != 0) {
                                    text = text.concat(`Modifikator: ${modifikator}\n`)
                                    formula = formula + '+' + modifikator
                                }
                            }
                            let rollmode = ''
                            if (html.find(`#rollMode-${dialogId}`).length > 0) {
                                rollmode = html.find(`#rollMode-${dialogId}`)[0].value
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
            dialogId: dialogId,
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
                                dialogId,
                            )
                            let hohequalitaet = 0
                            if (html.find(`#hohequalitaet-${dialogId}`).length > 0) {
                                hohequalitaet = Number(
                                    html.find(`#hohequalitaet-${dialogId}`)[0].value,
                                )
                                if (hohequalitaet != 0) {
                                    text = text.concat(`Hohe Qualität: ${hohequalitaet}\n`)
                                }
                            }
                            let modifikator = 0
                            if (html.find(`#modifikator-${dialogId}`).length > 0) {
                                modifikator = Number(html.find(`#modifikator-${dialogId}`)[0].value)
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
    }
}
