import { openCombatDialog } from '../combat/combat-api.js'
import { openSkillDialog } from '../skills/skills-api.js'
import { calculate_diceschips, roll_crit_message } from './wuerfel_misc.js'

export async function wuerfelwurf(target, actor) {
    console.log(target)
    let speaker = ChatMessage.getSpeaker({ actor: actor })
    let systemData = actor.system
    let rolltype = target.dataset.rolltype
    console.log('ILARIS | wuerfelwurf triggered', target, rolltype)
    let globalermod = systemData.abgeleitete.globalermod
    let nahkampfmod = systemData.modifikatoren.nahkampfmod
    let pw = 0
    let label = 'Probe'
    let dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    if (rolltype == 'angriff_diag') {
        let item = actor.items.get(target.dataset.itemid)
        await openCombatDialog(actor, item, 'melee')
    } else if (rolltype == 'fernkampf_diag') {
        let item = actor.items.get(target.dataset.itemid)
        await openCombatDialog(actor, item, 'ranged')
    } else if (rolltype == 'magie_diag' || rolltype == 'karma_diag') {
        let item = actor.items.get(target.dataset.itemid)
        console.log('item', item)
        await openCombatDialog(actor, item, 'supernatural')
    } else if (rolltype == 'fertigkeit_diag') {
        // Unified skill/attribute dialog with preview
        const probeType = target.dataset.probetype || 'fertigkeit'

        if (probeType === 'attribut') {
            const attribut_name = target.dataset.attribut
            const label = CONFIG.ILARIS.label[attribut_name]
            const pw = systemData.attribute[attribut_name].pw

            await openSkillDialog(actor, {
                probeType: 'attribut',
                fertigkeitKey: attribut_name,
                fertigkeitName: label,
                pw: pw,
            })
        } else if (probeType === 'freieFertigkeit' || probeType === 'freie_fertigkeit') {
            const fertigkeitName = target.dataset.fertigkeit
            const stufe = Number(target.dataset.pw)
            const pw = stufe * 8 - 2

            await openSkillDialog(actor, {
                probeType: 'freieFertigkeit',
                fertigkeitKey: null,
                fertigkeitName: fertigkeitName,
                pw: pw,
            })
        } else if (probeType === 'simple') {
            // Simple skill with direct PW (e.g. creature skills)
            const fertigkeitName = target.dataset.fertigkeit
            const pw = Number(target.dataset.pw)

            await openSkillDialog(actor, {
                probeType: 'simple',
                fertigkeitKey: null,
                fertigkeitName: fertigkeitName,
                pw: pw,
            })
        } else {
            // Regular skill (fertigkeit)
            const fertigkeit = target.dataset.fertigkeit
            const fertigkeitData = actor.profan.fertigkeiten[fertigkeit]
            const fertigkeitName = fertigkeitData.name
            const pw = fertigkeitData.system.pw

            // Build talent list
            const talentList = {}
            const talente = fertigkeitData.system.talente || []
            for (const [i, tal] of talente.entries()) {
                talentList[i] = tal.name
            }

            await openSkillDialog(actor, {
                probeType: 'fertigkeit',
                fertigkeitKey: fertigkeit,
                fertigkeitName: fertigkeitName,
                pw: pw,
                talentList: talentList,
            })
        }
    } else if (rolltype == 'simpleformula_diag') {
        label = target.dataset.name
        let formula = target.dataset.formula
        const html = await foundry.applications.handlebars.renderTemplate(
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
        label = target.dataset.name
        pw = Number(target.dataset.pw)
        let probentyp = target.dataset.probentyp
        let spezialmod = 0
        if (probentyp == 'nahkampf') {
            spezialmod = nahkampfmod
        }
        let xd20 = '1'
        if (target.dataset.xd20 == '0') {
            xd20 = '0'
        }
        const html = await renderTemplate(
            'systems/Ilaris/scripts/dice/templates/probendiag_attribut.hbs',
            {
                choices_xd20: CONFIG.ILARIS.xd20_choice,
                checked_xd20: xd20,
                choices_schips: CONFIG.ILARIS.schips_choice,
                checked_schips: '0',
                rollModes: CONFIG.Dice.rollModes,
                defaultRollMode: game.settings.get('core', 'rollMode'),
                dialogId: dialogId,
            },
        )
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
