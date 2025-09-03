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

export class UebernatuerlichDialog extends CombatDialog {
    constructor(actor, item) {
        const dialog = { title: `Übernatürliche Fertigkeit: ${item.name}` }
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/uebernatuerlich.hbs',
            width: 500,
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

        // Initialize selected actors from Foundry targets after actor/item are set
        this._initializeSelectedActorsFromTargets()

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
        html.find('.energie-abrechnen').click((ev) => {
            const isSuccess = ev.currentTarget.dataset.isSuccess === 'true'
            this._energieAbrechnenKlick(html, isSuccess)
        })
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
            !isNumericCost(this.item.system.kosten)

        const hasVerbotenePforten =
            this.actor.vorteil.magie.some((v) => v.name === 'Verbotene Pforten') ||
            ((this.actor.type === 'kreatur'
                ? this.actor.vorteil.allgemein.some((v) => v.name.includes('Borbaradianer')) ||
                  this.actor.vorteil.magie.some((v) => v.name.includes('Borbaradianer')) ||
                  this.actor.vorteil.zaubertraditionen.some((v) => v.name.includes('Borbaradianer'))
                : hardcoded
                      .getSelectedStil(this.actor, 'uebernatuerlich')
                      ?.name.includes('Borbaradianer')) &&
                this.item.type === 'zauber')

        const difficulty = +this.item.system.schwierigkeit
        const isNonStandardDifficulty = isNaN(difficulty) || !difficulty

        return {
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_verbotene_pforten: {
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
            style: CONST.CHAT_MESSAGE_STYLES.ROLL,
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
            style: CONST.CHAT_MESSAGE_STYLES.ROLL,
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
        let manoever = this.item.system.manoever

        // allgemeine optionen
        manoever.kbak.selected = html.find('#kbak')[0]?.checked || false // Kombinierte Aktion

        // Initialize blutmagie and verbotene_pforten if they don't exist
        manoever.blutmagie = manoever.blutmagie || {}
        manoever.verbotene_pforten = manoever.verbotene_pforten || {}
        manoever.set_energy_cost = manoever.set_energy_cost || { value: 0 }

        // Get values from Blutmagie and Verbotene Pforten if they exist
        manoever.blutmagie.value = Number(html.find('#blutmagie')[0]?.value) || 0
        manoever.verbotene_pforten = {
            multiplier:
                Number(
                    html.find(
                        'input[name="item.system.manoever.verbotene_pforten_toggle"]:checked',
                    )[0]?.value,
                ) || 4,
            activated: html.find('#verbotene_pforten')[0]?.checked || false,
        }
        manoever.set_energy_cost.value =
            Number(html.find('input[name="item.system.manoever.energyOverride"]')[0]?.value) || 0

        console.log('manoever', manoever.set_energy_cost.value)
        // Get values from the HTML elements

        manoever.mod.selected = html.find(`#modifikator-${this.dialogId}`)[0]?.value || false // Modifikator
        manoever.rllm.selected = html.find(`#rollMode-${this.dialogId}`)[0]?.value || false // RollMode
        await super.manoeverAuswaehlen(html)
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
        let availableEnergy
        if (this.actor.type == 'held') {
            if (this.item.type === 'zauber') {
                availableEnergy = this.actor.system.abgeleitete.asp_stern
            } else {
                availableEnergy = this.actor.system.abgeleitete.kap_stern
            }
        } else {
            if (this.item.type === 'zauber') {
                availableEnergy = this.actor.system.energien.asp.value
            } else {
                availableEnergy = this.actor.system.energien.kap.value
            }
        }

        // Kombinierte Aktion kbak
        if (manoever.kbak.selected) {
            mod_at -= 4
            text_at = text_at.concat('Kombinierte Aktion\n')
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

        // Modifikator
        let modifikator = Number(manoever.mod.selected)
        if (modifikator != 0) {
            mod_vt += modifikator
            mod_at += modifikator
            text_vt = text_vt.concat(`Modifikator: ${modifikator}\n`)
            text_at = text_at.concat(`Modifikator: ${modifikator}\n`)
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
