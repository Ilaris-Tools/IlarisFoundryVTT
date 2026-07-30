import { openCombatDialog } from '../combat/combat-api.js'
import { openSkillDialog } from '../skills/skills-api.js'
import { roll_crit_message } from './wuerfel_misc.js'
import {
    buildAttributeProbeDialogOptions,
    buildFertigkeitProbeDialogOptions,
} from './skill-dialog-options.js'

export async function wuerfelwurf(target, actor) {
    let speaker = ChatMessage.getSpeaker({ actor: actor })
    let systemData = actor.system
    let rolltype = target.dataset.rolltype
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
        await openCombatDialog(actor, item, 'supernatural')
    } else if (rolltype == 'fertigkeit_diag') {
        // Unified skill/attribute dialog with preview
        const probeType = target.dataset.probetype || 'fertigkeit'
        const situation = target.dataset.situation

        if (probeType === 'attribut') {
            const attribut_name = target.dataset.attribut
            await openSkillDialog(
                actor,
                buildAttributeProbeDialogOptions(attribut_name, systemData, situation),
            )
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

            await openSkillDialog(
                actor,
                buildFertigkeitProbeDialogOptions(fertigkeit, fertigkeitData, situation),
            )
        }
    } else if (rolltype == 'simpleformula_diag') {
        label = target.dataset.name
        let formula = target.dataset.formula
        const html = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/templates/chat/probendiag_simpleformula.hbs',
            {
                messageMode: CONFIG.ChatMessage.modes,
                defaultRollMode: game.settings.get('core', 'messageMode'),
                dialogId: dialogId,
            },
        )
        await foundry.applications.api.DialogV2.wait({
            window: { title: label },
            content: html,
            buttons: [
                {
                    action: 'ok',
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: 'OK',
                    default: true,
                    callback: async (event, button, dialog) => {
                        let text = ''
                        let modifikator = 0
                        const modInput = dialog.element.querySelector(`#modifikator-${dialogId}`)
                        if (modInput) {
                            modifikator = Number(modInput.value)
                            if (modifikator != 0) {
                                text = text.concat(`Modifikator: ${modifikator}\n`)
                                formula = formula + '+' + modifikator
                            }
                        }
                        let rollmode = ''
                        const rollModeInput = dialog.element.querySelector(`#rollMode-${dialogId}`)
                        if (rollModeInput) {
                            rollmode = rollModeInput.value
                        }
                        await roll_crit_message(formula, label, text, speaker, rollmode, false)
                    },
                },
                {
                    action: 'cancel',
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Abbrechen',
                },
            ],
            rejectClose: false,
        })
    } else if (rolltype == 'simpleprobe_diag') {
        label = target.dataset.name
        pw = Number(target.dataset.pw)
        const probentyp = target.dataset.probentyp
        let spezialmod = 0
        if (probentyp == 'nahkampf') {
            spezialmod = nahkampfmod
        }
        const xd20 = target.dataset.xd20 == '0' ? '0' : '1'
        await openSkillDialog(actor, {
            probeType: 'simple',
            fertigkeitName: label,
            pw: pw + spezialmod,
            initialXd20: xd20,
        })
    }
}
