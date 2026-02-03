import { evaluate_roll_with_crit } from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications, applyDamageToTarget } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'
import { formatDiceFormula } from '../../common/utilities.js'

export class AngriffDialog extends CombatDialog {
    constructor(actor, item, options = {}) {
        const title = options.isDefenseMode
            ? `Verteidigung gegen ${options?.attackingActor?.name || 'Unbekannt'} (${item.name})`
            : `Kampf: ${item.name}`

        const dialog = { title }
        const dialogOptions = {
            template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs',
            width: 900,
            height: 'auto',
            classes: ['angriff-dialog'],
        }
        super(actor, item, dialog, dialogOptions)

        // Specific properties for melee combat
        this.text_vt = ''
        this.riposte = false
        this.isDefenseMode = options.isDefenseMode || false
        this.attackingActor = options.attackingActor || null
        this.attackRoll = options.attackRoll || null
        this.isHumanoid = false

        // Get fumble threshold from computed combat mechanics (calculated by eigenschaft system)
        if (this.item.system.computed?.combatMechanics?.fumbleThreshold) {
            this.fumble_val = this.item.system.computed.combatMechanics.fumbleThreshold
        }

        this.aufbauendeManoeverAktivieren()
    }

    async getData() {
        let data = {
            isHumanoid: this.isHumanoid,
            lcht_choice: CONFIG.ILARIS.lcht_choice,
            ...(await super.getData()),
        }
        data.isDefenseMode = this.isDefenseMode
        data.attackingActor = this.attackingActor
        if (this.isDefenseMode && this.attackingActor) {
            this.selectedActors = [this.attackingActor]
        }
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.verteidigen').click((ev) => this._verteidigenKlick(html))
        html.find('.schaden').click((ev) => this._schadenKlick(html))

        // If in defense mode, disable attack-related buttons
        if (this.isDefenseMode) {
            html.find('.angreifen').prop('disabled', true).css('opacity', '0.5')
            html.find('.show-nearby').prop('disabled', true).css('opacity', '0.5')
            if (this.riposte) {
                html.find('.schaden').prop('disabled', false).css('opacity', '1')
            } else {
                html.find('.schaden').prop('disabled', true).css('opacity', '0.5')
            }
        }

        // Setup modifier display with debounced listeners
        this.setupModifierDisplay(html)
    }

    getSummaryClickActions(html) {
        return [
            {
                selector: '.clickable-summary.angreifen',
                handler: (html) => this._angreifenKlick(html),
            },
            {
                selector: '.clickable-summary.verteidigen',
                handler: (html) => this._verteidigenKlick(html),
            },
            {
                selector: '.clickable-summary.schaden',
                handler: (html) => this._schadenKlick(html),
            },
        ]
    }

    /**
     * Returns base values specific to AngriffDialog
     */
    getBaseValues() {
        return {
            baseAT: this.item.system.at || 0,
            baseVT: this.item.system.vt || 0,
        }
    }

    /**
     * Creates formatted summaries for all three roll types
     */
    getAllModifierSummaries(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { baseAT, baseVT } = baseValues
        let allSummaries = '<div class="all-summaries">'

        // Attack Summary
        allSummaries += this.getAttackSummary(baseAT, statusMods, nahkampfMods, diceFormula)

        // Defense Summary
        allSummaries += this.getDefenseSummary(
            baseVT,
            statusMods,
            this.actor.system.modifikatoren.verteidigungmod,
            diceFormula,
        )

        // Damage Summary
        allSummaries += this.getDamageSummary()

        allSummaries += '</div>'
        return allSummaries
    }

    /**
     * Creates attack roll summary
     */
    getAttackSummary(baseAT, statusMods, nahkampfMods, diceFormula) {
        // Calculate totals first for the heading
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalAT = baseAT + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalAT >= 0 ? `${formattedDice}+${finalAT}` : `${formattedDice}${finalAT}`

        const isClickableStyle = this.isDefenseMode ? '' : 'clickable-summary'
        const isDisabledStyle = this.isDefenseMode ? 'disabled' : ''
        let summary = `<div class="modifier-summary attack-summary ${isClickableStyle} angreifen">`
        summary += `<div class="flex_space-between_center"><h4 class="${isDisabledStyle}" style="width:100%">🗡️ Angriff: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base AT
        summary += `<div class="modifier-item base-value">Basis AT: <span>${baseAT}</span></div>`

        // Status modifiers
        if (statusMods !== 0) {
            const statusColor = statusMods > 0 ? 'positive' : 'negative'
            const statusSign = statusMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${statusColor}">Status (Wunden/Furcht): <span>${statusSign}${statusMods}</span></div>`
        }

        // Nahkampf token modifiers
        if (nahkampfMods !== 0) {
            const nahkampfColor = nahkampfMods > 0 ? 'positive' : 'negative'
            const nahkampfSign = nahkampfMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${nahkampfColor}">Token Status: <span>${nahkampfSign}${nahkampfMods}</span></div>`
        }

        // Parse text_at for maneuver modifiers
        if (this.text_at && this.text_at.trim()) {
            summary += '<div class="modifier-section">Manöver:</div>'
            const lines = this.text_at.trim().split('\n')
            lines.forEach((line) => {
                if (line.trim()) {
                    let color = 'neutral'
                    if (line.includes('+')) color = 'positive'
                    else if (line.includes('-')) color = 'negative'
                    summary += `<div class="modifier-item maneuver ${color}">${line}</div>`
                }
            })
        }

        summary += '<hr>'

        // Show total modifiers if any exist
        if (totalMod !== 0) {
            const totalModColor = totalMod > 0 ? 'positive' : 'negative'
            const totalModSign = totalMod > 0 ? '+' : ''
            summary += `<div class="modifier-item total ${totalModColor}"><strong>Addierte Modifikatoren: ${totalModSign}${totalMod}</strong></div>`
        }

        summary += '</div></div>'
        return summary
    }

    /**
     * Creates defense roll summary
     */
    getDefenseSummary(baseVT, statusMods, nahkampfMods, diceFormula) {
        // Calculate totals first for the heading
        const vtStatusMods = this.vt_abzuege_mod || 0
        const maneuverMod = this.mod_vt || 0
        const totalMod = maneuverMod + vtStatusMods + nahkampfMods
        const finalVT = baseVT + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalVT >= 0 ? `${formattedDice}+${finalVT}` : `${formattedDice}${finalVT}`

        let summary = '<div class="modifier-summary defense-summary clickable-summary verteidigen">'
        summary += `<div class="flex_space-between_center"><h4 style="width:100%">🛡️ Verteidigung: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base VT
        summary += `<div class="modifier-item base-value">Basis VT: <span>${baseVT}</span></div>`

        // Status modifiers for defense
        if (vtStatusMods !== 0) {
            const statusColor = vtStatusMods > 0 ? 'positive' : 'negative'
            const statusSign = vtStatusMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${statusColor}">Status (Wunden/Furcht): <span>${statusSign}${vtStatusMods}</span></div>`
        }

        // Nahkampf token modifiers
        if (nahkampfMods !== 0) {
            const nahkampfColor = nahkampfMods > 0 ? 'positive' : 'negative'
            const nahkampfSign = nahkampfMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${nahkampfColor}">Token Status: <span>${nahkampfSign}${nahkampfMods}</span></div>`
        }

        // Parse text_vt for maneuver modifiers
        if (this.text_vt && this.text_vt.trim()) {
            summary += '<div class="modifier-section">Manöver:</div>'
            const lines = this.text_vt.trim().split('\n')
            lines.forEach((line) => {
                if (line.trim()) {
                    let color = 'neutral'
                    if (line.includes('+')) color = 'positive'
                    else if (line.includes('-')) color = 'negative'
                    summary += `<div class="modifier-item maneuver ${color}">${line}</div>`
                }
            })
        }

        summary += '<hr>'

        // Show total modifiers if any exist
        if (totalMod !== 0) {
            const totalModColor = totalMod > 0 ? 'positive' : 'negative'
            const totalModSign = totalMod > 0 ? '+' : ''
            summary += `<div class="modifier-item total ${totalModColor}"><strong>Addierte Modifikatoren: ${totalModSign}${totalMod}</strong></div>`
        }

        summary += '</div></div>'
        return summary
    }

    /**
     * Creates damage roll summary
     */
    getDamageSummary() {
        // Calculate totals first for the heading
        const baseDamage = this.schaden || this.item.getTp()
        const maneuverMod = this.mod_dm || 0
        let finalFormula
        if (maneuverMod === 0) {
            finalFormula = baseDamage
        } else {
            const sign = maneuverMod > 0 ? '+' : ''
            finalFormula = `${baseDamage} ${sign}${maneuverMod}`
        }

        const isClickableStyle = this.isDefenseMode && !this.riposte ? '' : 'clickable-summary'
        const isDisabledStyle = this.isDefenseMode && !this.riposte ? 'disabled' : ''

        let summary = `<div class="modifier-summary damage-summary ${isClickableStyle} schaden">`
        summary += `<div class="flex_space-between_center"><h4  class="${isDisabledStyle}" style="width:100%">🩸 Schaden: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base damage
        summary += `<div class="modifier-item base-value">Basis Schaden: <span>${baseDamage}</span></div>`

        // Parse text_dm for maneuver modifiers
        if (this.text_dm && this.text_dm.trim()) {
            summary += '<div class="modifier-section">Modifikatoren:</div>'
            const lines = this.text_dm.trim().split('\n')
            lines.forEach((line) => {
                if (line.trim()) {
                    // Skip trefferzone lines if Gezielter Schlag is not active
                    if (
                        !this.isGezieltSchlagActive() &&
                        (line.includes('Trefferzone:') || line.includes('Gezielter Schlag:'))
                    ) {
                        return
                    }

                    let color = 'neutral'
                    if (line.includes('+')) color = 'positive'
                    else if (line.includes('-')) color = 'negative'
                    else if (line.includes('Kein Schaden')) color = 'negative'

                    // Clean up trefferzone text
                    let cleanedLine = line.trim()
                    cleanedLine = cleanedLine.replace(/\s*Trefferzone gewählt$/i, '')
                    cleanedLine = cleanedLine.replace(/\s*gewählt$/i, '')

                    summary += `<div class="modifier-item maneuver ${color}">${cleanedLine}</div>`
                }
            })
        }

        summary += '<hr>'

        summary += '</div></div>'
        return summary
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive:
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let diceFormula = this.getDiceFormula(html)
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods(html) // durch manoever
        this.updateStatusMods()
        super.eigenschaftenText()

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
        super._updateSchipsStern(html)
        this.updateModifierDisplay(html)
        await this.handleTargetSelection(rollResult, 'melee')
    }

    async _verteidigenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods(html)
        this.updateStatusMods()
        let label = `Verteidigung (${this.item.name})`
        let diceFormula = this.getDiceFormula(html)
        let formula = `${diceFormula} ${signed(this.item.system.vt)} ${signed(
            this.vt_abzuege_mod,
        )} ${signed(this.item.actor.system.modifikatoren.verteidigungmod)} ${signed(this.mod_vt)}`

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
            await this.resolveAttackVsDefense(html)
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

    async resolveAttackVsDefense(html, overrideAttackRoll = null) {
        // Ensure we have both rolls
        if (!this.lastDefenseRoll || !this.attackRoll) return

        // Get the attack total to use
        const attackTotal =
            overrideAttackRoll !== null ? overrideAttackRoll : this.attackRoll.roll.total

        // Compare the rolls based on special conditions first
        let defenderWins = false
        let reason = ''

        // Both rolled crits or both rolled fumbles - highest value wins
        if (
            (this.attackRoll.crit && this.lastDefenseRoll.crit) ||
            (this.attackRoll.fumble && this.lastDefenseRoll.fumble)
        ) {
            defenderWins = this.lastDefenseRoll.roll.total >= attackTotal
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
            defenderWins = this.lastDefenseRoll.roll.total >= attackTotal
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
        const rollMessages = [
            {
                roll: this.attackRoll,
                critMsg: `<div style="color: #44aa44; font-style: italic;">Kritischer Treffer!</div>`,
                fumbleMsg: `<div style="color: #aa4444; font-style: italic;">Patzer beim Angriff!</div>`,
            },
            {
                roll: this.lastDefenseRoll,
                critMsg: `<div style="color: #44aa44; font-style: italic;">Kritische Verteidigung!</div>`,
                fumbleMsg: `<div style="color: #aa4444; font-style: italic;">Patzer bei der Verteidigung!</div>`,
            },
        ]

        for (const { roll, critMsg, fumbleMsg } of rollMessages) {
            if (roll?.crit) {
                resultText += critMsg
            }
            if (roll?.fumble) {
                resultText += fumbleMsg
            }
        }

        resultText += '</div>'

        // Send the resolution message
        await ChatMessage.create({
            content: resultText,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        })

        // Clean up the stored rolls
        this.lastDefenseRoll = null
        this.attackRoll = null
        super._updateSchipsStern(html)
        this.updateModifierDisplay(html)
    }

    async _schadenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods(html)
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
                await applyDamageToTarget(
                    target,
                    rollResult.roll.total,
                    this.damageType,
                    this.trueDamage,
                    this.speaker,
                )
            }
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

        this.isHumanoid = html.find(`#isHumanoid-${this.dialogId}`)[0]?.checked || false // isHumanoid
        manoever.lcht.selected = html.find(`#lcht-${this.dialogId}`)[0]?.value || '0' // Lichtverhältnisse

        super.manoeverAuswaehlen(html)
    }

    async updateManoeverMods(html) {
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
        let damageType = 'NORMAL'
        let trueDamage = false

        // Light conditions for melee (simpler penalties than ranged combat)
        let licht = Number(manoever.lcht.selected)
        if (licht == 1) {
            // Dämmerung
            mod_at -= 2
            text_at = text_at.concat('Dämmerung: -2\n')
        } else if (licht == 2) {
            // Mondlicht
            mod_at -= 4
            text_at = text_at.concat('Mondlicht: -4\n')
        } else if (licht == 3) {
            // Sternenlicht
            mod_at -= 8
            text_at = text_at.concat('Sternenlicht: -8\n')
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

        if (
            this.item.system.manoverausgleich &&
            this.item.system.manoverausgleich.value > 0 &&
            (!this.item.system.manoverausgleich.overcomplicated || this.isHumanoid)
        ) {
            // Manöverausgleich only applies to negative modifiers and only brings them up to 0
            let at_ausgleich = 0
            let vt_ausgleich = 0

            if (mod_at < 0) {
                at_ausgleich = Math.min(this.item.system.manoverausgleich.value, Math.abs(mod_at))
                mod_at += at_ausgleich
                text_at = text_at.concat(`Manöverausgleich: +${at_ausgleich}\n`)
            }

            if (mod_vt < 0) {
                vt_ausgleich = Math.min(this.item.system.manoverausgleich.value, Math.abs(mod_vt))
                mod_vt += vt_ausgleich
                text_vt = text_vt.concat(`Manöverausgleich: +${vt_ausgleich}\n`)
            }
        }

        // Handle standard maneuvers first
        // Handle Riposte special rule: attack maneuver penalties also apply to defense
        const riposteManeuver = this.item.manoever.find(
            (m) => m.name === 'Riposte' && m.inputValue.value,
        )
        if (riposteManeuver) {
            if (mod_at < 0) {
                mod_vt += mod_at
                text_vt = text_vt.concat(`Riposte (Attackemanöver): ${mod_at}\n`)
            }
            this.riposte = true
        }

        // Handle tactical options after handleModifications (so they don't affect Riposte)
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

        // Apply common damage logic (zero damage, trefferzone, modifikator)
        const updated = await this.applyCommonDamageLogic({
            nodmg,
            mod_dm,
            schaden,
            text_dm,
            trefferzone,
            mod_at,
            mod_vt,
            text_at,
            text_vt,
            damageType,
            trueDamage,
        })

        mod_dm = updated.mod_dm
        schaden = updated.schaden
        text_dm = updated.text_dm
        trefferzone = updated.trefferzone
        mod_at = updated.mod_at
        mod_vt = updated.mod_vt
        text_at = updated.text_at
        text_vt = updated.text_vt
        damageType = updated.damageType
        trueDamage = updated.trueDamage

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

        if (
            this.actor.system.gesundheit.wundenignorieren &&
            this.actor.system.gesundheit.wunden > 2
        ) {
            const wundabzuege = (this.actor.system.gesundheit.wunden - 2) * 2
            this.text_vt = this.text_vt.concat(
                `Bonus durch Kalte Wut oder ähnliches: +${wundabzuege} (im Globalenmod verrechnet)\n`,
            )
        }
        this.vt_abzuege_mod = this.actor.system.abgeleitete.globalermod
        super.updateStatusMods()
    }

    isGezieltSchlagActive() {
        // Check if Gezielter Schlag (km_gzsl) maneuver is selected
        return (
            this.item.system.manoever.km_gzsl && this.item.system.manoever.km_gzsl.selected !== '0'
        )
    }

    /**
     * Creates a formatted summary of all attack modifiers
     */
    getModifierSummary(baseAT, statusMods, nahkampfMods, diceFormula) {
        let summary = '<div class="modifier-summary">'
        summary += '<h4>Angriffswurf Zusammenfassung:</h4>'
        summary += '<div class="modifier-list">'

        // Base AT
        summary += `<div class="modifier-item base-value">Basis AT: <span>${baseAT}</span></div>`

        // Status modifiers
        if (statusMods !== 0) {
            const statusColor = statusMods > 0 ? 'positive' : 'negative'
            const statusSign = statusMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${statusColor}">Status (Wunden/Furcht): <span>${statusSign}${statusMods}</span></div>`
        }

        // Nahkampf token modifiers
        if (nahkampfMods !== 0) {
            const nahkampfColor = nahkampfMods > 0 ? 'positive' : 'negative'
            const nahkampfSign = nahkampfMods > 0 ? '+' : ''
            summary += `<div class="modifier-item ${nahkampfColor}">Token Status: <span>${nahkampfSign}${nahkampfMods}</span></div>`
        }

        // Parse text_at for maneuver modifiers
        if (this.text_at && this.text_at.trim()) {
            summary += '<div class="modifier-section">Manöver:</div>'
            const lines = this.text_at.trim().split('\n')
            lines.forEach((line) => {
                if (line.trim()) {
                    let color = 'neutral'
                    if (line.includes('+')) color = 'positive'
                    else if (line.includes('-')) color = 'negative'
                    summary += `<div class="modifier-item maneuver ${color}">${line}</div>`
                }
            })
        }

        // Calculate totals
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalAT = baseAT + totalMod

        summary += '<hr>'

        // Show total modifiers if any exist
        if (totalMod !== 0) {
            const totalModColor = totalMod > 0 ? 'positive' : 'negative'
            const totalModSign = totalMod > 0 ? '+' : ''
            summary += `<div class="modifier-item total ${totalModColor}"><strong>Addierte Modifikatoren: ${totalModSign}${totalMod}</strong></div>`
        }

        // Show final AT value with dice formula - always neutral
        const finalFormula =
            totalMod >= 0 ? `${diceFormula}+${finalAT}` : `${diceFormula}${finalAT}`
        summary += `<div class="modifier-item total neutral"><strong>Finaler Wurf: ${finalFormula}</strong></div>`

        summary += '</div></div>'
        return summary
    }
}
