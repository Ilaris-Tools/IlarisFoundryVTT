import {
    roll_crit_message,
    get_statuseffect_by_id,
    evaluate_roll_with_crit,
} from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'

export class AngriffDialog extends CombatDialog {
    constructor(actor, item, options = {}) {
        const title = options.isDefenseMode
            ? `Verteidigung gegen ${options.attackingActor?.name || 'Unbekannt'} (${item.name})`
            : `Kampf: ${item.name}`

        const dialog = { title }
        const dialogOptions = {
            template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs',
            width: 500,
            height: 'auto',
            classes: ['angriff-dialog'],
        }
        super(dialog, dialogOptions)
        // this can be probendialog (more abstract)
        this.text_at = ''
        this.text_vt = ''
        this.text_dm = ''
        this.item = item
        this.actor = actor
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.rollmode = game.settings.get('core', 'rollMode') // public, private....
        this.item.system.manoever.rllm.selected = game.settings.get('core', 'rollMode') // TODO: either manoever or dialog property.
        this.fumble_val = 1
        if (this.item.system.eigenschaften.unberechenbar) this.fumble_val = 2
        this.isDefenseMode = options.isDefenseMode || false
        this.attackingActor = options.attackingActor || null
        this.attackRoll = options.attackRoll || null // Store the attack roll if provided
        this.aufbauendeManoeverAktivieren()
    }

    async getData() {
        let data = super.getData()
        data.isDefenseMode = this.isDefenseMode
        data.attackingActor = this.attackingActor
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.schaden').click((ev) => this._schadenKlick(html))
        html.find('.verteidigen').click((ev) => this._verteidigenKlick(html))

        // If in defense mode, disable attack-related buttons
        if (this.isDefenseMode) {
            html.find('.angreifen').prop('disabled', true).css('opacity', '0.5')
            html.find('.schaden').prop('disabled', true).css('opacity', '0.5')
            html.find('.show-nearby').prop('disabled', true).css('opacity', '0.5')
        }
    }

    eigenschaftenText() {
        if (!this.item.system.eigenschaften.length > 0) {
            return
        }
        this.text_at += '\nEigenschaften: '
        this.text_at += this.item.system.eigenschaften.map((e) => e.name).join(', ')
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive:
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let diceFormula = this.getDiceFormula(html)
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods() // durch manoever
        this.updateStatusMods()
        this.eigenschaftenText()

        let label = `Attacke (${this.item.name})`
        let formula = `${diceFormula} ${signed(this.item.system.at)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} \
            ${signed(this.mod_at)}`

        // Use the new evaluation function
        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_at,
            null, // success_val
            this.fumble_val,
            true, // crit_eval
        )

        // Determine if we should hide the roll result
        const hideRoll = this.selectedActors && this.selectedActors.length > 0

        // Modify template data to hide results if needed
        const templateData = hideRoll
            ? {
                  ...rollResult.templateData,
                  // Hide specific results but keep flavor text
                  success: false,
                  fumble: false,
                  crit: false,
                  is16OrHigher: false,
                  noSuccess: false,
                  // Add a message indicating hidden roll
                  text:
                      rollResult.templateData.text +
                      '\nErgebnis verborgen bis alle Verteidigungen abgeschlossen sind.',
              }
            : rollResult.templateData

        // Send the chat message
        const html_roll = await renderTemplate(rollResult.templatePath, templateData)
        await rollResult.roll.toMessage(
            {
                speaker: this.speaker,
                flavor: html_roll,
                blind: hideRoll, // Make the roll blind if we have targets
                whisper: hideRoll ? [game.user.id] : [], // Only whisper to GM if hidden
            },
            {
                rollMode: hideRoll ? 'gmroll' : this.rollmode,
            },
        )

        // Store the roll result for later use with defense rolls
        if (hideRoll) {
            this.lastAttackRoll = {
                roll: rollResult.roll,
                success: rollResult.success,
                is16OrHigher: rollResult.is16OrHigher,
                templateData: rollResult.templateData,
            }
        }

        // If we have selected targets, send them defense prompts
        if (this.selectedActors && this.selectedActors.length > 0) {
            for (const target of this.selectedActors) {
                const targetActor = game.actors.get(target.actorId)
                if (!targetActor) continue

                // Find main and secondary weapons
                const mainWeapon = targetActor.items.find(
                    (item) => item.type === 'nahkampfwaffe' && item.system.hauptwaffe === true,
                )

                const secondaryWeapon = targetActor.items.find(
                    (item) =>
                        item.type === 'nahkampfwaffe' &&
                        item.system.nebenwaffe === true &&
                        (!mainWeapon || item.id !== mainWeapon.id), // Don't include if it's the same as main weapon
                )

                // Create defense buttons HTML
                let buttonsHtml = ''
                if (mainWeapon) {
                    buttonsHtml += `
                        <button class="defend-button" data-actor-id="${targetActor.id}" data-weapon-id="${mainWeapon.id}" data-distance="${target.distance}" data-attacker-id="${this.actor.id}" style="margin: 0 5px 5px 0;">
                            <i class="fas fa-shield-alt"></i>
                            Verteidigen mit ${mainWeapon.name}
                        </button>`
                }
                if (secondaryWeapon) {
                    buttonsHtml += `
                        <button class="defend-button" data-actor-id="${targetActor.id}" data-weapon-id="${secondaryWeapon.id}" data-distance="${target.distance}" data-attacker-id="${this.actor.id}" style="margin: 0 5px 5px 0;">
                            <i class="fas fa-shield-alt"></i>
                            Verteidigen mit ${secondaryWeapon.name}
                        </button>`
                }

                // If no weapons found, add a warning
                if (!buttonsHtml) {
                    buttonsHtml =
                        '<p style="color: #aa0000;">Keine Haupt- oder Nebenwaffe gefunden.</p>'
                }

                // Create defense prompt message content
                const content = `
                    <div class="defense-prompt" style="padding: 10px;">
                        <p>${this.actor.name} greift dich mit ${this.item.name} an!</p>
                        <p>Entfernung: ${target.distance} Felder</p>
                        <div class="defense-buttons" style="display: flex; flex-wrap: wrap;">
                            ${buttonsHtml}
                        </div>
                    </div>
                `

                // Send the message to chat
                const chatData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                    content: content,
                    whisper: [
                        game.users.find((u) => u.character?.id === targetActor.id)?.id,
                    ].filter((id) => id),
                }
                await ChatMessage.create(chatData)
            }

            // Add a click handler for the defend buttons
            Hooks.once('renderChatMessage', (message, html) => {
                html.find('.defend-button').click(async function () {
                    const actorId = this.dataset.actorId
                    const weaponId = this.dataset.weaponId
                    const distance = parseInt(this.dataset.distance)
                    const attackerId = this.dataset.attackerId
                    const actor = game.actors.get(actorId)
                    const attackingActor = game.actors.get(attackerId)
                    if (!actor) return

                    // Get the specific weapon that was clicked
                    const weapon = actor.items.get(weaponId)
                    if (!weapon) {
                        ui.notifications.warn('Die gewählte Waffe wurde nicht gefunden.')
                        return
                    }

                    // Create and render defense dialog with defense mode options and attack roll
                    const d = new AngriffDialog(actor, weapon, {
                        isDefenseMode: true,
                        attackingActor: attackingActor,
                        attackRoll: rollResult, // Pass the attack roll to the defense dialog
                    })
                    d.render(true)
                })
            })
        }
    }

    async _verteidigenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods()
        this.updateStatusMods()
        let label = `Verteidigung (${this.item.name})`
        let diceFormula = this.getDiceFormula(html)
        let formula = `${diceFormula} ${signed(this.item.system.vt)} ${signed(
            this.vt_abzuege_mod,
        )} ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} ${signed(this.mod_vt)}`

        // Use the new evaluation function
        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_vt,
            null, // success_val
            this.fumble_val,
            true, // crit_eval
        )

        // In defense mode, always hide the roll result initially
        if (this.isDefenseMode) {
            const templateData = {
                ...rollResult.templateData,
                // Hide specific results
                success: false,
                fumble: false,
                crit: false,
                is16OrHigher: false,
                noSuccess: false,
                // Add a message indicating hidden roll
                text: rollResult.templateData.text + '\nVerteidigungsergebnis verborgen.',
            }

            // Send the hidden defense roll
            const html_roll = await renderTemplate(rollResult.templatePath, templateData)
            await rollResult.roll.toMessage(
                {
                    speaker: this.speaker,
                    flavor: html_roll,
                    blind: true,
                    whisper: [game.user.id],
                },
                {
                    rollMode: 'gmroll',
                },
            )

            // Store the defense roll result
            this.lastDefenseRoll = {
                roll: rollResult.roll,
                success: rollResult.success,
                is16OrHigher: rollResult.is16OrHigher,
                templateData: rollResult.templateData,
                actor: this.actor,
            }

            // Resolve the attack vs defense
            await this.resolveAttackVsDefense()
        } else {
            // Normal defense roll (not in response to an attack)
            const html_roll = await renderTemplate(rollResult.templatePath, rollResult.templateData)
            await rollResult.roll.toMessage(
                {
                    speaker: this.speaker,
                    flavor: html_roll,
                },
                {
                    rollMode: this.rollmode,
                },
            )
        }
    }

    async resolveAttackVsDefense() {
        // Ensure we have both rolls
        if (!this.lastDefenseRoll || !this.attackRoll) return

        // Compare the rolls based on special conditions first
        let defenderWins = false
        let reason = ''

        // Both rolled crits or both rolled fumbles - highest value wins
        if (
            (this.attackRoll.crit && this.lastDefenseRoll.crit) ||
            (this.attackRoll.fumble && this.lastDefenseRoll.fumble)
        ) {
            defenderWins = this.lastDefenseRoll.roll.total >= this.attackRoll.roll.total
            reason = 'Höchster Wurf gewinnt'
        }
        // Attacker rolled crit - attacker wins
        else if (this.attackRoll.crit) {
            defenderWins = false
            reason = 'Kritischer Treffer'
        }
        // Defender rolled crit - defender wins
        else if (this.lastDefenseRoll.crit) {
            defenderWins = true
            reason = 'Kritische Verteidigung'
        }
        // Attacker rolled fumble - defender wins
        else if (this.attackRoll.fumble) {
            defenderWins = true
            reason = 'Patzer beim Angriff'
        }
        // Defender rolled fumble - attacker wins
        else if (this.lastDefenseRoll.fumble) {
            defenderWins = false
            reason = 'Patzer bei der Verteidigung'
        }
        // Normal comparison - defender wins ties
        else {
            defenderWins = this.lastDefenseRoll.roll.total >= this.attackRoll.roll.total
            reason = defenderWins ? 'Erfolgreiche Verteidigung' : 'Erfolgreicher Angriff'
        }

        // Prepare the result message
        let resultText = `<div class="attack-resolution" style="padding: 10px;">
            <h3 style="margin-bottom: 10px;">Kampfergebnis</h3>
            <div style="margin-bottom: 5px;">
                <strong>${this.attackingActor.name}</strong> greift <strong>${this.lastDefenseRoll.actor.name}</strong> an
            </div>`

        if (defenderWins) {
            resultText += `<div style="color: #44aa44; font-weight: bold; margin-top: 10px;">
                ${this.lastDefenseRoll.actor.name} wehrt den Angriff erfolgreich ab!
            </div>`
        } else {
            resultText += `<div style="color: #aa4444; font-weight: bold; margin-top: 10px;">
                ${this.attackingActor.name} durchbricht die Verteidigung!
            </div>`
        }

        // Add the reason for the result
        resultText += `<div style="font-style: italic; margin-top: 5px;">${reason}</div>`

        // Add any special conditions that occurred
        if (this.attackRoll.crit) {
            resultText += `<div style="color: #44aa44; font-style: italic;">Kritischer Treffer!</div>`
        }
        if (this.attackRoll.fumble) {
            resultText += `<div style="color: #aa4444; font-style: italic;">Patzer beim Angriff!</div>`
        }
        if (this.lastDefenseRoll.crit) {
            resultText += `<div style="color: #44aa44; font-style: italic;">Kritische Verteidigung!</div>`
        }
        if (this.lastDefenseRoll.fumble) {
            resultText += `<div style="color: #aa4444; font-style: italic;">Patzer bei der Verteidigung!</div>`
        }

        resultText += '</div>'

        // Send the resolution message
        await ChatMessage.create({
            content: resultText,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        })

        // Clean up the stored rolls
        this.lastDefenseRoll = null
        this.attackRoll = null
    }

    async _schadenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods()
        let label = `Schaden (${this.item.name})`
        let formula = `${this.schaden} ${signed(this.mod_dm)}`

        // Use the new evaluation function for damage (no crit evaluation)
        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_dm,
            null, // success_val
            1, // fumble_val not used since crit_eval is false
            false, // crit_eval
        )

        // Send the chat message
        const html_roll = await renderTemplate(rollResult.templatePath, rollResult.templateData)
        await rollResult.roll.toMessage(
            {
                speaker: this.speaker,
                flavor: html_roll,
            },
            {
                rollMode: this.rollmode,
            },
        )

        // Apply damage to selected targets if any
        if (this.selectedActors && this.selectedActors.length > 0) {
            for (const target of this.selectedActors) {
                await this.applyDamageToTarget(
                    target,
                    rollResult.roll.total,
                    this.damageType,
                    this.trueDamage,
                )
            }
        }
    }

    /**
     * Applies damage to a target actor and calculates wounds based on WS*
     * @param {Object} target - The target object containing actorId
     * @param {number} damage - The total damage to apply
     * @param {string} damageType - The type of damage being dealt
     * @param {boolean} trueDamage - If true, damage ignores WS* calculation
     * @private
     */
    async applyDamageToTarget(target, damage, damageType = 'normal', trueDamage = false) {
        const targetActor = game.actors.get(target.actorId)
        if (!targetActor) return

        // Get WS* of the target
        const ws_stern = targetActor.system.abgeleitete.ws_stern

        // Calculate wounds based on whether it's true damage
        const woundsToAdd = trueDamage ? Math.floor(damage / ws) : Math.floor(damage / ws_stern)

        if (woundsToAdd > 0) {
            // Get current value and update the appropriate stat based on damage type
            const currentValue =
                damageType === 'STUMPF'
                    ? targetActor.system.gesundheit.erschoepfung || 0
                    : targetActor.system.gesundheit.wunden || 0

            await targetActor.update({
                [`system.gesundheit.${damageType === 'STUMPF' ? 'erschoepfung' : 'wunden'}`]:
                    currentValue + (damageType === 'STUMPF' ? damage : woundsToAdd),
            })

            // Send a message to chat
            await ChatMessage.create({
                content: `${targetActor.name} erleidet ${woundsToAdd} Einschränkung${
                    woundsToAdd > 1 ? 'en' : ''
                }! (${
                    damageType ? CONFIG.ILARIS.schadenstypen[damageType] : ''
                } Schaden: ${damage}${!trueDamage ? `, WS*: ${ws_stern}` : ''})`,
                speaker: this.speaker,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            })
        }
    }

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever
        let vorteile = this.actor.vorteil.kampf.map((v) => v.name)

        manoever.vlof.offensiver_kampfstil = vorteile.includes('Offensiver Kampfstil')
        super.aufbauendeManoeverAktivieren()
    }

    async manoeverAuswaehlen(html) {
        /* parsed den angriff dialog und schreibt entsprechende werte 
        in die waffen items. Ersetzt ehemalige angriffUpdate aus angriff_prepare.js
        TODO: kann ggf. mit manoeverAnwenden zusammengelegt werden?
        TODO: kann evt in ein abstraktes waffen item verschoben werden oder
        in einn abstrakten angriffsdialog für allgemeine manöver wunden etc, und spezifisch
        überschrieben werden.. 
        TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        let manoever = this.item.system.manoever

        // allgemeine optionen
        manoever.kbak.selected = html.find(`#kbak-${this.dialogId}`)[0]?.checked || false // Kombinierte Aktion
        manoever.vlof.selected = html.find(`#vlof-${this.dialogId}`)[0]?.checked || false // Volle Offensive
        manoever.vldf.selected = html.find(`#vldf-${this.dialogId}`)[0]?.checked || false // Volle Defensive
        manoever.pssl.selected = html.find(`#pssl-${this.dialogId}`)[0]?.checked || false // Passierschlag pssl
        manoever.rwdf.selected = html.find(`#rwdf-${this.dialogId}`)[0]?.value || false // Reichweitenunterschied
        manoever.rkaz.selected = html.find(`#rkaz-${this.dialogId}`)[0]?.value || false // Reaktionsanzahl

        manoever.mod.selected = html.find(`#modifikator-${this.dialogId}`)[0]?.value || false // Modifikator
        manoever.rllm.selected = html.find(`#rollMode-${this.dialogId}`)[0]?.value || false // RollMode

        super.manoeverAuswaehlen(html)
    }

    async updateManoeverMods() {
        let manoever = this.item.system.manoever

        let mod_at = 0
        let mod_vt = 0
        let mod_dm = 0
        let mod_energy = 0
        let text_at = ''
        let text_vt = ''
        let text_dm = ''
        let text_energy = ''
        let nodmg = { name: '', value: false }
        let trefferzone = 0
        let schaden = this.item.getTp()
        let damageType = 'normal'
        let trueDamage = false

        // Handle standard maneuvers first
        if (manoever.kbak.selected) {
            mod_at -= 4
            text_at = text_at.concat('Kombinierte Aktion: -4\n')
        }
        // Volle Offensive vlof
        if (manoever.vlof.selected && !manoever.pssl.selected) {
            if (manoever.vlof.offensiver_kampfstil) {
                mod_vt -= 4
                text_vt = text_vt.concat('Volle Offensive (Offensiver Kampfstil): -4\n')
            } else {
                mod_vt -= 8
                text_vt = text_vt.concat('Volle Offensive: -8\n')
            }
            mod_at += 4
            text_at = text_at.concat('Volle Offensive: +4\n')
        }
        // Volle Defensive vldf
        if (manoever.vldf.selected) {
            mod_vt += 4
            text_vt = text_vt.concat('Volle Defensive +4\n')
        }
        // Reichweitenunterschiede rwdf
        let reichweite = Number(manoever.rwdf.selected)
        if (reichweite > 0) {
            let mod_rwdf = 2 * Number(reichweite)
            mod_at -= mod_rwdf
            mod_vt -= mod_rwdf
            text_at = text_at.concat(`Reichweitenunterschied: ${mod_rwdf}\n`)
            text_vt = text_vt.concat(`Reichweitenunterschied: ${mod_rwdf}\n`)
        }
        // Passierschlag pssl & Anzahl Reaktionen rkaz
        let reaktionen = Number(manoever.rkaz.selected)
        if (reaktionen > 0) {
            let mod_rkaz = 4 * reaktionen
            mod_vt -= mod_rkaz
            text_vt = text_vt.concat(`${reaktionen}. Reaktion: -${mod_rkaz}\n`)
            if (manoever.pssl.selected) {
                mod_at -= mod_rkaz
                text_at = text_at.concat(`${reaktionen}. Passierschlag: -${mod_rkaz} \n`)
            }
        }

        // Collect all modifications from all maneuvers
        const allModifications = []
        this.item.manoever.forEach((dynamicManoever) => {
            let check = undefined
            let number = undefined
            let trefferZoneInput = undefined
            if (dynamicManoever.inputValue.value) {
                if (dynamicManoever.inputValue.field == 'CHECKBOX') {
                    check = dynamicManoever.inputValue.value
                } else if (dynamicManoever.inputValue.field == 'NUMBER') {
                    number = dynamicManoever.inputValue.value
                } else {
                    trefferZoneInput = dynamicManoever.inputValue.value
                }
            }
            if (
                check == undefined &&
                (number == undefined || number == 0) &&
                (trefferZoneInput == undefined || trefferZoneInput == 0)
            )
                return

            // Add valid modifications to the collection
            Object.values(dynamicManoever.system.modifications).forEach((modification) => {
                allModifications.push({
                    modification,
                    manoever: dynamicManoever,
                    number,
                    check,
                    trefferZoneInput,
                })
            })

            // Handle special cases
            if (manoever.kbak.selected) {
                if (dynamicManoever.name == 'Sturmangriff') {
                    mod_at += 4
                    text_at = text_at.concat(`${dynamicManoever.name}: +4\n`)
                }
                if (dynamicManoever.name == 'Überrennen') {
                    mod_at += 4
                    text_at = text_at.concat(`${dynamicManoever.name}: +4\n`)
                }
            }
            if (dynamicManoever.name == 'Riposte') {
                mod_vt += mod_at
                text_vt = text_vt.concat(`${dynamicManoever.name}: (\n${text_at})\n`)
                text_dm = text_dm.concat(`${dynamicManoever.name}: (\n${text_at})\n`)
            }
        })

        // Process all modifications in order
        ;[
            mod_at,
            mod_vt,
            mod_dm,
            mod_energy,
            text_at,
            text_vt,
            text_dm,
            text_energy,
            trefferzone,
            schaden,
            nodmg,
            damageType,
            trueDamage,
        ] = handleModifications(allModifications, {
            mod_at,
            mod_vt,
            mod_dm,
            mod_energy: null,
            text_at,
            text_vt,
            text_dm,
            text_energy: null,
            trefferzone,
            schaden,
            nodmg,
            damageType,
            trueDamage,
            context: this,
        })

        // If ZERO_DAMAGE was found, override damage values
        if (nodmg.value) {
            mod_dm = 0
            schaden = '0'
            // Add text explaining zero damage if not already present
            if (!text_dm.includes('Kein Schaden')) {
                text_dm = text_dm.concat(`${nodmg.name}: Kein Schaden\n`)
            }
        }

        // Trefferzone if not set by manoever
        if (trefferzone == 0) {
            let zonenroll = new Roll('1d6')
            await zonenroll.evaluate()
            text_dm = text_dm.concat(
                `Trefferzone: ${CONFIG.ILARIS.trefferzonen[zonenroll.total]}\n`,
            )
        }

        // Modifikator
        let modifikator = Number(manoever.mod.selected)
        if (modifikator != 0) {
            mod_vt += modifikator
            mod_at += modifikator
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`)
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`)
        }

        this.mod_at = mod_at
        this.mod_vt = mod_vt
        this.mod_dm = mod_dm
        this.text_at = text_at
        this.text_vt = text_vt
        this.text_dm = text_dm
        this.schaden = schaden
        this.damageType = damageType
        this.trueDamage = trueDamage
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */
        this.vt_abzuege_mod = 0

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_vt = this.text_at.concat(`(Kalte Wut)\n`)
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege
        } else {
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.globalermod
        }
        super.updateStatusMods()
    }
}
