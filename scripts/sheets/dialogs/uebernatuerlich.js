import { roll_crit_message } from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'
import * as hardcoded from '../../actors/hardcodedvorteile.js'
import { sanitizeEnergyCost, isNumericCost } from '../../common/utilities.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'
import { ILARIS } from '../../config.js'

export class UebernatuerlichDialog extends CombatDialog {
    constructor(actor, item) {
        const dialog = { title: `Übernatürliche Fertigkeit: ${item.name}` }
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/uebernatuerlich.hbs',
            width: 900,
            height: 'auto',
        }
        super(dialog, options)
        // this can be probendialog (more abstract)
        this.text_at = ''
        this.text_dm = ''
        this.text_energy = ''
        this.is16OrHigher = false
        this.item = item
        this.actor = actor
        console.log('actor', this.actor)
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.rollmode = game.settings.get('core', 'rollMode') // public, private....
        this.item.system.manoever.rllm.selected = game.settings.get('core', 'rollMode') // TODO: either manoever or dialog property.
        this.item.system.manoever.blutmagie = this.item.system.manoever.blutmagie || {}
        this.item.system.manoever.verbotene_pforten =
            this.item.system.manoever.verbotene_pforten || {}
        this.item.system.manoever.set_energy_cost = this.item.system.manoever.set_energy_cost || {}
        this.calculatedWounds = 0
        this.fumble_val = 1
        this.aufbauendeManoeverAktivieren()
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Store modifier element reference for performance
        this._modifierElement = html.find('#modifier-summary')

        // Store a reference to prevent multiple updates
        this._updateTimeout = null

        if (this._modifierElement.length === 0) {
            console.warn('MAGIE MODIFIER DISPLAY: Element nicht im Template gefunden')
            return
        }

        // Add listeners for real-time modifier updates with debouncing
        html.find('input, select').on('change input', () => {
            // Clear previous timeout
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout)
            }

            // Set new timeout to debounce rapid changes
            this._updateTimeout = setTimeout(() => {
                this.updateModifierDisplay(html)
            }, 300)
        })

        // Add summary click listeners
        this.addSummaryClickListeners(html)

        // Initial display update
        setTimeout(() => this.updateModifierDisplay(html), 500)
    }

    getSummaryClickActions(html) {
        return [
            {
                selector: '.clickable-summary.angreifen',
                handler: (html) => this._angreifenKlick(html),
            },
            {
                selector: '.clickable-summary.energie-erfolg',
                handler: (html) => this._energieAbrechnenKlick(html, true),
            },
            {
                selector: '.clickable-summary.energie-misserfolg',
                handler: (html) => this._energieAbrechnenKlick(html, false),
            },
        ]
    }

    /**
     * Returns base values specific to UebernatuerlichDialog
     */
    getBaseValues() {
        return {
            basePW: this.item.system.pw || 0,
        }
    }

    /**
     * Override getDiceFormula to handle the special xd20 logic for supernatural abilities
     */
    getDiceFormula(html, xd20_choice = null) {
        if (xd20_choice === null) {
            xd20_choice = Number(html.find('input[name="xd20"]:checked')[0]?.value) || 0
            xd20_choice = xd20_choice == 0 ? 1 : 3
        }
        return super.getDiceFormula(html, xd20_choice)
    }

    /**
     * Creates formatted summaries for all roll types
     */
    getAllModifierSummaries(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { basePW } = baseValues
        let allSummaries = '<div class="all-summaries">'

        // Talent/Spell Summary
        allSummaries += this.getTalentSummary(basePW, statusMods, nahkampfMods, diceFormula)

        // Energy Cost Summary
        allSummaries += this.getEnergySummary()

        allSummaries += '</div>'
        return allSummaries
    }

    /**
     * Creates talent/spell roll summary
     */
    getTalentSummary(basePW, statusMods, nahkampfMods, diceFormula) {
        // Calculate totals first for the heading
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalPW = basePW + totalMod
        const finalFormula = finalPW >= 0 ? `${diceFormula}+${finalPW}` : `${diceFormula}${finalPW}`

        const itemType = this.item.type === 'zauber' ? 'Zauber' : 'Liturgie'
        const icon = this.item.type === 'zauber' ? '🔮' : '✨'

        let summary = '<div class="modifier-summary talent-summary clickable-summary angreifen">'
        summary += `<h4>${icon} ${itemType}: ${finalFormula}</h4>`
        summary += '<div class="modifier-list">'

        // Base PW
        summary += `<div class="modifier-item base-value">Basis PW: <span>${basePW}</span></div>`

        // Difficulty
        const schwierigkeit = this.item.system.schwierigkeit
        if (schwierigkeit) {
            const parsedDifficulty = parseInt(schwierigkeit)
            if (!isNaN(parsedDifficulty)) {
                summary += `<div class="modifier-item base-value">Schwierigkeit: <span>${parsedDifficulty}</span></div>`
            } else {
                summary += `<div class="modifier-item neutral">Schwierigkeit: <span>${schwierigkeit}</span></div>`
            }
        }

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
     * Creates energy cost summary
     */
    getEnergySummary() {
        // Calculate energy cost
        const baseEnergy = this.mod_energy || 0
        const icon = '⚡'

        let summary = '<div class="modifier-summary energy-summary">'
        summary += `<h4>${icon} Energiekosten: ${baseEnergy} Energie</h4>`
        summary += '<div class="modifier-list">'

        // Base energy cost
        let originalCost = sanitizeEnergyCost(this.item.system.kosten) || 0
        if (this.energy_override) {
            originalCost = this.energy_override
        }
        summary += `<div class="modifier-item base-value">Basiskosten: <span>${originalCost} Energie</span></div>`

        // Parse text_energy for energy modifiers
        if (this.text_energy && this.text_energy.trim()) {
            summary += '<div class="modifier-section">Modifikatoren:</div>'
            const lines = this.text_energy.trim().split('\n')
            lines.forEach((line) => {
                if (line.trim()) {
                    let color = 'neutral'
                    // For energy costs, negative modifiers (cost reduction) are good (green)
                    // and positive modifiers (cost increase) are bad (red)
                    if (line.includes('-')) color = 'positive'
                    // Cost reduction = green
                    else if (line.includes('+')) color = 'negative' // Cost increase = red
                    summary += `<div class="modifier-item maneuver ${color}">${line}</div>`
                }
            })
        }

        // Show available energy
        const availableEnergy = this.getAvailableEnergy()

        summary += '<hr>'
        summary += `<div class="modifier-item base-value">Verfügbar: <span>${availableEnergy} Energie</span></div>`

        // Check if enough energy is available
        if (baseEnergy > availableEnergy) {
            const shortage = baseEnergy - availableEnergy
            summary += `<div class="modifier-item negative"><strong>Fehlend: ${shortage} Energie</strong></div>`
        } else {
            const remaining = availableEnergy - baseEnergy
            summary += `<div class="modifier-item positive">Verbleibend: <span>${remaining} Energie</span></div>`
        }

        summary += '</div>'

        // Add energy accounting buttons for non-standard difficulty spells
        const difficulty = +this.item.system.schwierigkeit
        const isNonStandardDifficulty = isNaN(difficulty) || !difficulty

        if (isNonStandardDifficulty) {
            summary += '<hr>'
            summary += '<div class="modifier-section">Energie abrechnen:</div>'
            summary +=
                '<div class="clickable-summary energie-erfolg" style="cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(0, 150, 0, 0.1); border: 1px solid rgba(0, 150, 0, 0.3); border-radius: 4px; text-align: center;">'
            summary += '✅ Erfolgreich gewirkt'
            summary += '</div>'
            summary +=
                '<div class="clickable-summary energie-misserfolg" style="cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(220, 0, 0, 0.1); border: 1px solid rgba(220, 0, 0, 0.3); border-radius: 4px; text-align: center;">'
            summary += '❌ Misslungen'
            summary += '</div>'
        }

        summary += '</div>'
        return summary
    }

    async getData() {
        // damit wird das template gefüttert
        const hasBlutmagie =
            this.actor.vorteil.magie.some((v) => v.name === 'Blutmagie') &&
            this.item.type === 'zauber'

        const restrictEnergyCostSetting = game.settings.get(
            ConfigureGameSettingsCategories.Ilaris,
            IlarisGameSettingNames.restrictEnergyCostSetting,
        )

        const canSetEnergyCost =
            !restrictEnergyCostSetting ||
            this.actor.vorteil?.magie?.some((v) => v.name === 'Unitatio') ||
            !isNumericCost(sanitizeEnergyCost(this.item.system.kosten))

        const hasVerbotenePforten = this.hasVerbotenePfortenAccess()

        const difficulty = +this.item.system.schwierigkeit
        const isNonStandardDifficulty = isNaN(difficulty) || !difficulty

        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_verbotene_pforten: {
                0: 'Deaktiviert',
                4: '1 Vorteil (WS+4)',
                8: '2 Vorteile (WS+8)',
            },
            hasBlutmagie,
            hasVerbotenePforten,
            isNonStandardDifficulty,
            canSetEnergyCost,
            ...(await super.getData()),
        }
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive:
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let xd20_choice = Number(html.find('input[name="xd20"]:checked')[0]?.value) || 0
        xd20_choice = xd20_choice == 0 ? 1 : 3
        let diceFormula = this.getDiceFormula(html, xd20_choice)
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods() // durch manoever
        this.updateStatusMods()

        // Initialize and check energy values
        await this.initializeEnergyValues()

        let label = `${this.item.name}`
        let formula = `${diceFormula} ${signed(this.item.system.pw)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.mod_at)}`

        // Parse difficulty from item's schwierigkeit
        let difficulty = null
        let additionalText = ''
        const schwierigkeit = this.item.system.schwierigkeit
        if (schwierigkeit) {
            const parsedDifficulty = parseInt(schwierigkeit)
            if (!isNaN(parsedDifficulty)) {
                difficulty = parsedDifficulty
            } else {
                additionalText = `\n${schwierigkeit}`
            }
        }

        // Show roll result
        let isSuccess = false
        let is16OrHigher = false
        ;[isSuccess, is16OrHigher] = await roll_crit_message(
            formula,
            label,
            this.text_at + '\n' + this.text_energy + additionalText,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
            difficulty,
        )

        this.is16OrHigher = is16OrHigher
        if (difficulty) {
            await this.applyEnergyCost(isSuccess, is16OrHigher)
            // If not enough resources, show erro
            if (this.currentEnergy < this.endCost) {
                ui.notifications.error(
                    `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
                )
            }
            // Refresh dialog data after energy application
            await this.refreshActorData()
        }
        super._updateSchipsStern(html)
    }

    async _energieAbrechnenKlick(html, isSuccess) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods() // durch manoever
        // Initialize and check energy values
        await this.initializeEnergyValues()

        await this.applyEnergyCost(isSuccess, this.is16OrHigher)

        // If not enough resources, show erro
        if (this.currentEnergy < this.endCost) {
            ui.notifications.error(
                `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
            )
        }

        // Refresh dialog data after energy application
        await this.refreshActorData()

        // Create chat message with energy cost information
        const label = `${this.item.name} (Kosten: ${this.endCost} Energie)`
        const html_roll = await renderTemplate(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            {
                title: label,
                text: isSuccess ? this.text_energy : '',
            },
        )

        await ChatMessage.create({
            speaker: this.speaker,
            content: html_roll,
            type: 5, // CONST.CHAT_MESSAGE_TYPES.ROLL
            whisper:
                this.rollmode === 'gmroll'
                    ? ChatMessage.getWhisperRecipients('GM')
                    : this.rollmode === 'selfroll'
                    ? [game.user.id]
                    : undefined,
            blind: this.rollmode === 'blindroll',
        })
    }

    async initializeEnergyValues() {
        // Check if we have enough resources
        if (this.actor.type == 'held') {
            if (this.item.type === 'zauber') {
                this.currentEnergy = this.actor.system.abgeleitete.asp_stern
                this.energyPath = 'system.abgeleitete.asp_stern'
            } else {
                this.currentEnergy = this.actor.system.abgeleitete.kap_stern
                this.energyPath = 'system.abgeleitete.kap_stern'
            }
        } else {
            if (this.item.type === 'zauber') {
                this.currentEnergy = this.actor.system.energien.asp.value
                this.energyPath = 'system.energien.asp.value'
            } else {
                this.currentEnergy = this.actor.system.energien.kap.value
                this.energyPath = 'system.energien.kap.value'
            }
        }
    }

    async applyEnergyCost(isSuccess, is16OrHigher) {
        let costModifier = 2
        // hardcoded failed liturgie cost
        if (
            this.actor.type == 'held' &&
            this.item.type == 'liturgie' &&
            this.actor.vorteil.karma.some((v) => v.name == 'Liturgische Sorgfalt')
        ) {
            costModifier = 4
        }
        // Calculate cost based on success
        let cost = isSuccess
            ? this.mod_energy
            : Math.ceil(sanitizeEnergyCost(this.item.system.kosten) / costModifier)

        // Apply all cost modifications from advantages and styles
        cost = hardcoded.calculateModifiedCost(
            this.actor,
            this.item,
            isSuccess,
            is16OrHigher,
            cost,
            this.energy_override,
        )

        // Update resources and apply wounds if using Verbotene Pforten
        const updates = {
            [this.energyPath]: Math.max(0, this.currentEnergy - cost),
        }

        // Apply wounds from Verbotene Pforten if any
        if (this.item.system.manoever.verbotene_pforten?.activated && this.calculatedWounds > 0) {
            updates['system.gesundheit.wunden'] =
                this.actor.system.gesundheit.wunden + this.calculatedWounds
        }

        this.endCost = cost

        await this.actor.update(updates)

        // Create chat message with energy cost information
        const label = `${this.item.name} (Kosten: ${this.endCost} AsP)`
        const html_roll = await renderTemplate('systems/Ilaris/templates/chat/spell_result.hbs', {
            success: isSuccess,
            cost: this.endCost,
            costModifier: costModifier,
        })

        await ChatMessage.create({
            speaker: this.speaker,
            content: html_roll,
            type: 5, // CONST.CHAT_MESSAGE_TYPES.ROLL
            whisper:
                this.rollmode === 'gmroll'
                    ? ChatMessage.getWhisperRecipients('GM')
                    : this.rollmode === 'selfroll'
                    ? [game.user.id]
                    : undefined,
            blind: this.rollmode === 'blindroll',
        })
    }

    async manoeverAuswaehlen(html) {
        // Ensure manoever exists
        if (!this.item.system.manoever) {
            this.item.system.manoever = ILARIS.manoever_ueber
        }
        let manoever = this.item.system.manoever

        // Ensure all required manoever properties exist
        if (!manoever.kbak) {
            manoever.kbak = { selected: false }
        }
        if (!manoever.mod) {
            manoever.mod = { selected: 0 }
        }
        if (!manoever.rllm) {
            manoever.rllm = { selected: game.settings.get('core', 'rollMode') }
        }

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0]?.checked || false // Kombinierte Aktion

        // Initialize blutmagie and verbotene_pforten if they don't exist
        manoever.blutmagie = manoever.blutmagie || {}
        manoever.verbotene_pforten = manoever.verbotene_pforten || {}
        manoever.set_energy_cost = manoever.set_energy_cost || { value: 0 }

        // Get values from Blutmagie and Verbotene Pforten if they exist
        manoever.blutmagie.value = Number(html.find('#blutmagie')[0]?.value) || 0

        // For verbotene_pforten, check if a radio button is selected (not the default "0")
        const verbotenePfortenValue = html.find('input[name="verbotene_pforten_toggle"]:checked')[0]
            ?.value
        manoever.verbotene_pforten = {
            multiplier: Number(verbotenePfortenValue) || 4,
            activated: verbotenePfortenValue !== undefined && verbotenePfortenValue !== '0',
        }
        manoever.set_energy_cost.value =
            Number(html.find('input[name="item.system.manoever.energyOverride"]')[0]?.value) || 0

        console.log('manoever', manoever.set_energy_cost.value)
        // Get values from the HTML elements

        manoever.mod.selected = Number(html.find(`#modifikator-${this.dialogId}`)[0]?.value) || 0 // Modifikator
        manoever.rllm.selected =
            html.find(`#rollMode-${this.dialogId}`)[0]?.value ||
            game.settings.get('core', 'rollMode') // RollMode
        await super.manoeverAuswaehlen(html)
    }

    /**
     * Gets the available energy for the current actor and item type
     * @returns {number} Available energy (AsP or KaP)
     */
    getAvailableEnergy() {
        if (this.actor.type == 'held') {
            if (this.item.type === 'zauber') {
                return this.actor.system.abgeleitete.asp_stern
            } else {
                return this.actor.system.abgeleitete.kap_stern
            }
        } else {
            if (this.item.type === 'zauber') {
                return this.actor.system.energien.asp.value
            } else {
                return this.actor.system.energien.kap.value
            }
        }
    }

    /**
     * Determines whether the actor has access to Verbotene Pforten functionality
     * @returns {boolean} True if the actor can use Verbotene Pforten
     */
    hasVerbotenePfortenAccess() {
        // Direct advantage "Verbotene Pforten"
        if (this.actor.vorteil.magie.some((v) => v.name === 'Verbotene Pforten')) {
            return true
        }

        if (this.actor.uebernatuerlich.zauber.some((z) => z.name === 'Blut des Dolches (passiv)')) {
            return true
        }

        // Borbaradianer tradition access (only for spells)
        if (this.item.type === 'zauber') {
            if (this.actor.type === 'kreatur') {
                // For creatures, check in all advantage categories
                return (
                    this.actor.vorteil.allgemein.some((v) => v.name.includes('Borbaradianer')) ||
                    this.actor.vorteil.magie.some((v) => v.name.includes('Borbaradianer')) ||
                    this.actor.vorteil.zaubertraditionen.some((v) =>
                        v.name.includes('Borbaradianer'),
                    )
                )
            } else {
                // For heroes, check selected style
                return hardcoded
                    .getSelectedStil(this.actor, 'uebernatuerlich')
                    ?.name.includes('Borbaradianer')
            }
        }

        return false
    }

    /**
     * Calculates the number of wounds needed to provide enough energy
     * @param {number} ws - Wundschwelle of the character
     * @param {number} multiplier - Selected multiplier (4 or 8)
     * @param {number} energyNeeded - Amount of energy still needed
     * @returns {number} Number of wounds required
     */
    calculateRequiredWounds(ws, multiplier, energyNeeded) {
        if (energyNeeded <= 0) return 0
        const energyPerWound = ws + multiplier
        return Math.ceil(energyNeeded / energyPerWound)
    }

    /**
     * Refreshes the dialog's actor reference and updates displays after actor changes
     */
    async refreshActorData() {
        // Get the updated actor from the game
        const updatedActor = game.actors.get(this.actor.id)
        if (updatedActor) {
            // Update the dialog's actor reference
            this.actor = updatedActor

            // Update energy values based on the refreshed actor
            await this.initializeEnergyValues()

            // Update the modifier display if it exists
            const html = this.element
            if (
                html &&
                html.length > 0 &&
                this._modifierElement &&
                this._modifierElement.length > 0
            ) {
                this.updateModifierDisplay(html)
            }
        }
    }

    async updateManoeverMods() {
        let manoever = this.item.system.manoever

        let mod_at = 0
        let mod_vt = 0
        let mod_dm = 0
        let mod_energy = sanitizeEnergyCost(this.item.system.kosten)
        if (manoever.set_energy_cost?.value) {
            mod_energy = manoever.set_energy_cost.value
            this.energy_override = manoever.set_energy_cost.value
        }
        let text_at = ''
        let text_vt = ''
        let text_dm = ''
        let text_energy = ''
        let schaden = null
        let nodmg = { name: '', value: false }
        let trefferzone = 0
        let fumble_val = 1

        // Get the minimum available resource based on actor and item type
        const availableEnergy = this.getAvailableEnergy()

        // Collect all modifications from all maneuvers
        const allModifications = []
        let manoeverAmount = 0
        let baseManoverCount = 0

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

            manoeverAmount++

            // Count base maneuvers for Gildenmagier II bonus
            if (dynamicManoever.system.isBaseManover) {
                baseManoverCount++
            }

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
            this.energy_override,
        ] = handleModifications(allModifications, {
            mod_at,
            mod_vt,
            mod_dm,
            mod_energy,
            text_at,
            text_vt,
            text_dm,
            text_energy,
            trefferzone,
            schaden: null,
            nodmg: null,
            context: this,
        })

        // Kombinierte Aktion kbak
        if (manoever.kbak.selected) {
            mod_at -= 4
            text_at = text_at.concat('Kombinierte Aktion\n')
        }

        // Modifikator
        let modifikator = Number(manoever.mod.selected)
        if (modifikator != 0) {
            mod_vt += modifikator
            mod_at += modifikator
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`)
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`)
        }

        // Gildenmagier II Bonus: +2 wenn mindestens 2 verschiedene Basismanöver verwendet werden
        if (baseManoverCount >= 2 && this.actor.type === 'held' && this.item.type === 'zauber') {
            const selectedStil = hardcoded.getSelectedStil(this.actor, 'uebernatuerlich')
            if (selectedStil?.name.includes('Gildenmagier') && selectedStil.stufe >= 2) {
                mod_at += 2
                text_at = text_at.concat('Gildenmagier II: +2\n')
            }
        }

        // Handle Blutmagie and Verbotene Pforten
        if (manoever.blutmagie?.value || manoever.verbotene_pforten?.activated) {
            const energyNeeded = mod_energy - availableEnergy

            // Handle Blutmagie
            if (manoever.blutmagie?.value) {
                const blutmagieReduction = Math.min(energyNeeded, manoever.blutmagie.value)
                if (blutmagieReduction > 0) {
                    mod_energy -= blutmagieReduction
                    text_energy = text_energy.concat(`Blutmagie: -${blutmagieReduction} AsP\n`)
                }
            }

            // Handle Verbotene Pforten
            if (manoever.verbotene_pforten?.activated) {
                const ws =
                    this.actor.type === 'held'
                        ? this.actor.system.abgeleitete.ws
                        : this.actor.system.kampfwerte.ws
                const multiplier = manoever.verbotene_pforten.multiplier

                // Calculate required wounds using the extracted method
                const remainingEnergyNeeded = mod_energy - availableEnergy
                this.calculatedWounds = this.calculateRequiredWounds(
                    ws,
                    multiplier,
                    remainingEnergyNeeded,
                )

                if (this.calculatedWounds > 0) {
                    const verbotenePfortenReduction = (ws + multiplier) * this.calculatedWounds
                    // Ensure mod_energy doesn't go below availableEnergy
                    const maxReduction = mod_energy - availableEnergy
                    const actualReduction = Math.min(verbotenePfortenReduction, maxReduction)
                    mod_energy -= actualReduction
                    text_energy = text_energy.concat(
                        `Verbotene Pforten (${this.calculatedWounds} Wunden): +${verbotenePfortenReduction} AsP\n`,
                    )
                }
            }
        }

        console.log('mod_energy', mod_energy)
        // Ensure mod_energy is never less than 0
        mod_energy = Math.max(0, mod_energy)
        this.mod_at = mod_at
        this.mod_vt = mod_vt
        this.mod_dm = mod_dm
        this.mod_energy = mod_energy
        this.text_at = text_at
        this.text_vt = text_vt
        this.text_dm = text_dm
        this.text_energy = text_energy
        this.schaden = schaden
        this.fumble_val = fumble_val
    }
}
