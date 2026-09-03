import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { signed } from '../../dice/chatutilities.js'
import { handleModifications } from './shared-dialog-helpers.js'
import { CombatDialog } from './combat-dialog.js'
import * as hardcoded from '../../actors/data/hardcodedvorteile.js'
import { sanitizeEnergyCost, isNumericCost, formatDiceFormula } from '../../core/utilities.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from '../../settings/configure-game-settings.model.js'
import { ILARIS } from '../../core/config.js'
import {
    callIlarisHookAllWithGlobalMirror,
    callIlarisHookWithGlobalMirror,
} from '../hooks/global_combat_hooks.js'
import { applyPreEffects, hasPreEffects } from '../../effects/pre-effects/pre-effects-processor.js'

export class UebernatuerlichDialog extends CombatDialog {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['uebernatuerlich-dialog'],
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            energieErfolg: UebernatuerlichDialog.#onEnergieErfolg,
            energieMisserfolg: UebernatuerlichDialog.#onEnergieMisserfolg,
        },
    }

    /** @override */
    static PARTS = {
        settings: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/uebernatuerlich.hbs',
        },
        summaries: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/summaries.hbs',
        },
    }

    constructor(actor, item, options = {}) {
        super(actor, item, {
            ...options,
            window: { title: `Übernatürliche Fertigkeit: ${item.name}` },
        })

        // Specific properties for supernatural abilities
        this.text_energy = ''
        this.is16OrHigher = false
        // Dialog-session state — never written to the item document
        this.blutmagie = { value: 0 }
        this.verbotene_pforten = { multiplier: 4, activated: false }
        this.set_energy_cost = { value: null }
        this.calculatedWounds = 0
    }

    /**
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        // Setup modifier display with debounced listeners
        this.setupModifierDisplay()
    }

    /* -------------------------------------------- */
    /*  Action Handlers                             */
    /* -------------------------------------------- */

    /**
     * Handle the "energieErfolg" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onEnergieErfolg(event, target) {
        await this._energieAbrechnenKlick(true)
    }

    /**
     * Handle the "energieMisserfolg" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onEnergieMisserfolg(event, target) {
        await this._energieAbrechnenKlick(false)
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
     * Override getDiceFormula to handle the special xd20 logic for supernatural abilities.
     */
    getDiceFormula(xd20_choice = null) {
        // Anrufungen werden immer mit 1W20 gewürfelt, keine Median-Option
        if (this.item.type === 'anrufung') {
            return super.getDiceFormula(1)
        }
        if (xd20_choice === null) {
            xd20_choice =
                Number(this.element.querySelector('input[name="xd20"]:checked')?.value) || 0
            xd20_choice = xd20_choice == 0 ? 1 : 3
        }
        return super.getDiceFormula(xd20_choice)
    }

    getSummaryContext(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { basePW } = baseValues
        return {
            title: 'Würfelaktionen:',
            isEmpty: false,
            isError: false,
            sections: [
                this.getTalentSummaryContext(basePW, statusMods, nahkampfMods, diceFormula),
                this.getEnergySummaryContext(),
            ],
        }
    }

    /**
     * Creates talent/spell roll summary
     */
    getTalentSummaryContext(basePW, statusMods, nahkampfMods, diceFormula) {
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalPW = basePW + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`

        const itemTypeLabels = { zauber: 'Zauber', liturgie: 'Liturgie', anrufung: 'Anrufung' }
        const itemTypeIcons = { zauber: '🔮', liturgie: '✨', anrufung: '👹' }
        const itemType = itemTypeLabels[this.item.type] || 'Liturgie'
        const icon = itemTypeIcons[this.item.type] || '✨'

        const difficultyRows = []
        const schwierigkeit = this.item.system.schwierigkeit
        if (schwierigkeit) {
            const parsedDifficulty = parseInt(schwierigkeit)
            if (!isNaN(parsedDifficulty)) {
                difficultyRows.push({
                    label: 'Schwierigkeit',
                    value: `${parsedDifficulty}`,
                    cssClass: 'modifier-item base-value',
                })
            } else {
                difficultyRows.push({
                    label: 'Schwierigkeit',
                    value: `${schwierigkeit}`,
                    cssClass: 'modifier-item neutral',
                })
            }
        }

        const maneuverSection = this._buildModifierSectionData(this.text_at, {
            sectionTitle: 'Manöver:',
        })

        return {
            action: 'angreifen',
            cssClass: 'modifier-summary talent-summary clickable-summary',
            heading: `${icon} ${itemType}: ${finalFormula}`,
            rows: [
                {
                    label: 'Basis PW',
                    value: `${basePW}`,
                    cssClass: 'modifier-item base-value',
                },
                ...difficultyRows,
                this._buildSignedModifierData(statusMods, 'Status (Wunden/Furcht)'),
                this._buildSignedModifierData(nahkampfMods, 'Token Status'),
            ].filter((row) => row),
            sections: maneuverSection ? [maneuverSection] : [],
            totalRow: this._buildTotalModifierData(totalMod),
            showDivider: Boolean(maneuverSection || totalMod),
        }
    }

    /**
     * Creates energy cost summary
     */
    getEnergySummaryContext() {
        const baseEnergy = this.mod_energy || 0
        const icon = '⚡'

        // Base energy cost
        let originalCost = sanitizeEnergyCost(this.item.system.kosten) || 0
        if (this.energy_override != null) {
            originalCost = this.energy_override
        }
        const availableEnergy = this.getAvailableEnergy()

        const modifierSection = this._buildModifierSectionData(this.text_energy, {
            sectionTitle: 'Modifikatoren:',
            getLineClass: (line) => {
                if (line.includes('-')) return 'positive'
                if (line.includes('+')) return 'negative'
                return 'neutral'
            },
        })

        const footerRows = [
            {
                label: 'Verfügbar',
                value: `${availableEnergy} Energie`,
                cssClass: 'modifier-item base-value',
            },
        ]

        if (baseEnergy > availableEnergy) {
            const shortage = baseEnergy - availableEnergy
            footerRows.push({
                text: `Fehlend: ${shortage} Energie`,
                cssClass: 'modifier-item negative',
                strong: true,
            })
        } else {
            const remaining = availableEnergy - baseEnergy
            footerRows.push({
                label: 'Verbleibend',
                value: `${remaining} Energie`,
                cssClass: 'modifier-item positive',
            })
        }

        const difficulty = +this.item.system.schwierigkeit
        const isNonStandardDifficulty = isNaN(difficulty) || !difficulty

        return {
            cssClass: 'modifier-summary energy-summary',
            heading: `${icon} Energiekosten: ${baseEnergy} Energie`,
            rows: [
                {
                    label: 'Basiskosten',
                    value: `${originalCost} Energie`,
                    cssClass: 'modifier-item base-value',
                },
            ],
            sections: modifierSection ? [modifierSection] : [],
            footerRows,
            actionButtons: isNonStandardDifficulty
                ? [
                      {
                          action: 'energieErfolg',
                          text: '✅ Erfolgreich gewirkt',
                          cssClass: 'clickable-summary energie-erfolg',
                          style: 'cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(0, 150, 0, 0.1); border: 1px solid rgba(0, 150, 0, 0.3); border-radius: 4px; text-align: center;',
                      },
                      {
                          action: 'energieMisserfolg',
                          text: '❌ Misslungen',
                          cssClass: 'clickable-summary energie-misserfolg',
                          style: 'cursor: pointer; padding: 8px; margin: 4px 0; background: rgba(220, 0, 0, 0.1); border: 1px solid rgba(220, 0, 0, 0.3); border-radius: 4px; text-align: center;',
                      },
                  ]
                : [],
            showDivider: true,
        }
    }

    /**
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Context data for the template
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

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
            ...context,
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
            blutmagie: this.blutmagie,
            verbotene_pforten: this.verbotene_pforten,
            set_energy_cost: this.set_energy_cost,
        }
    }

    /* -------------------------------------------- */
    /*  Combat Actions                              */
    /* -------------------------------------------- */

    async _angreifenKlick() {
        if (callIlarisHookWithGlobalMirror('Ilaris.preAngriff', this) === false) return
        // getDiceFormula already checks this
        // let xd20_choice =
        //     Number(this.element.querySelector('input[name="xd20"]:checked')?.value) || 0
        // xd20_choice = xd20_choice == 0 ? 1 : 3
        // let diceFormula = this.getDiceFormula(xd20_choice)
        let diceFormula = this.getDiceFormula()
        await this.manoeverAuswaehlen()
        await this.updateManoeverMods()
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

        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_at + '\n' + this.text_energy + additionalText,
            difficulty,
            this.fumble_val,
            true,
        )

        await postRollToChat(rollResult, this.speaker, this.rollmode)
        callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)

        const isSuccess = rollResult.success
        const is16OrHigher = rollResult.is16OrHigher

        this.is16OrHigher = is16OrHigher
        if (difficulty) {
            await this.applyEnergyCost(isSuccess, is16OrHigher)
            // If not enough resources, show error
            if (this.currentEnergy < this.endCost) {
                ui.notifications.error(
                    `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
                )
            }
            // Refresh dialog data after energy application
            await this.refreshActorData()
        }
        super._updateSchipsStern()

        // Fire-and-forget pre-effects on success
        if (isSuccess && hasPreEffects(this.item.system.preEffects)) {
            applyPreEffects(rollResult, this)
        }
    }

    async _energieAbrechnenKlick(isSuccess) {
        await this.manoeverAuswaehlen()
        await this.updateManoeverMods()
        // Initialize and check energy values
        await this.initializeEnergyValues()

        await this.applyEnergyCost(isSuccess, this.is16OrHigher)

        // Fire-and-forget pre-effects for non-standard difficulty spells
        if (isSuccess && hasPreEffects(this.item.system.preEffects)) {
            applyPreEffects({ success: true }, this)
        }

        // If not enough resources, show error
        if (this.currentEnergy < this.endCost) {
            ui.notifications.error(
                `Nicht genug Ressourcen! Benötigt: ${this.endCost}, Vorhanden: ${this.currentEnergy}. Unter bestimmten Voraussetzungen zieht dir das System einfach Energie ab, bis du bei 0 angelangt bist. Du kannst diese Information nach eigenem Ermessen weiterverwenden.`,
            )
        }

        // Refresh dialog data after energy application
        await this.refreshActorData()

        // Create chat message with energy cost information
        const label = `${this.item.name} (Kosten: ${this.endCost} Energie)`
        const html_roll = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/skills/templates/chat/probenchat_profan.hbs',
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

    /* -------------------------------------------- */
    /*  Energy Management                           */
    /* -------------------------------------------- */

    async initializeEnergyValues() {
        // Check if we have enough resources
        const energyKey =
            this.item.type === 'anrufung' ? 'gup' : this.item.type === 'zauber' ? 'asp' : 'kap'
        const energyState = this.actor.getEnergyState(energyKey)
        this.currentEnergy = energyState.current
        this.energyPath = energyState.currentPath
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
        if (this.verbotene_pforten?.activated && this.calculatedWounds > 0) {
            updates['system.gesundheit.wunden'] =
                this.actor.system.gesundheit.wunden + this.calculatedWounds
        }

        this.endCost = cost

        await this.actor.update(updates)

        // Create chat message with energy cost information
        const html_roll = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/dice/templates/spell_result.hbs',
            {
                success: isSuccess,
                cost: this.endCost,
                costModifier: costModifier,
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

    /* -------------------------------------------- */
    /*  Maneuver Processing                         */
    /* -------------------------------------------- */

    /**
     * Parse maneuver selections from the dialog form.
     */
    async manoeverAuswaehlen() {
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
        // allgemeine optionen
        manoever.kbak.selected = this.element.querySelector('#kbak')?.checked || false // Kombinierte Aktion

        // Read Blutmagie/Verbotene Pforten/EnergieOverride into dialog-local state (not item document)
        this.blutmagie.value = Number(this.element.querySelector('#blutmagie')?.value) || 0

        // For verbotene_pforten, check if a radio button is selected (not the default "0")
        const verbotenePfortenValue = this.element.querySelector(
            'input[name="verbotene_pforten_toggle"]:checked',
        )?.value
        this.verbotene_pforten = {
            multiplier: Number(verbotenePfortenValue) || 4,
            activated: verbotenePfortenValue !== undefined && verbotenePfortenValue !== '0',
        }

        const energyOverride = this.element.querySelector(
            'input[name="item.system.manoever.energyOverride"]',
        )?.value
        this.set_energy_cost.value =
            energyOverride !== '' && energyOverride != null ? +energyOverride : null

        manoever.mod.selected =
            Number(this.element.querySelector(`#modifikator-${this.dialogId}`)?.value) || 0 // Modifikator
        await super.manoeverAuswaehlen()
    }

    /**
     * Gets the available energy for the current actor and item type
     * @returns {number} Available energy (AsP or KaP)
     */
    getAvailableEnergy() {
        const energyKey =
            this.item.type === 'anrufung' ? 'gup' : this.item.type === 'zauber' ? 'asp' : 'kap'
        return this.actor.getEnergyState(energyKey).current
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
     * Refreshes the dialog's actor reference and updates displays after actor changes.
     */
    async refreshActorData() {
        // Get the updated actor from the game
        const updatedActor = game.actors.get(this.actor.id)
        if (updatedActor) {
            // Update the dialog's actor reference
            this.actor = updatedActor

            // Update energy values based on the refreshed actor
            await this.initializeEnergyValues()

            if (this.element) {
                this.updateModifierDisplay()
            }
        }
    }

    async updateManoeverMods() {
        let manoever = this.item.system.manoever

        let mod_at = 0
        let mod_vt = 0
        let mod_dm = 0
        let mod_energy = sanitizeEnergyCost(this.item.system.kosten)
        if (this.set_energy_cost?.value != null) {
            mod_energy = this.set_energy_cost.value
            this.energy_override = this.set_energy_cost.value
        }
        let text_at = ''
        let text_vt = ''
        let text_dm = ''
        let text_energy = ''
        let schaden = null
        let nodmg = { name: '', value: false }
        let trefferzone = 0
        let fumble_val = 1
        let damageType = 'NORMAL'
        let trueDamage = false
        let durationBonus = 0
        let maechtigeMagieQs = 0

        // Get the minimum available resource based on actor and item type
        const availableEnergy = this.getAvailableEnergy()

        // Collect all modifications from all maneuvers
        const allModifications = []
        let manoeverAmount = 0
        let baseManoeverCount = 0

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
            if (dynamicManoever.system.isBaseManoever) {
                baseManoeverCount++
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
            damageType,
            trueDamage,
            durationBonus,
            maechtigeMagieQs,
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
            damageType,
            trueDamage,
            durationBonus,
            maechtigeMagieQs,
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
        if (baseManoeverCount >= 2 && this.actor.type === 'held' && this.item.type === 'zauber') {
            const selectedStil = hardcoded.getSelectedStil(this.actor, 'uebernatuerlich')
            if (selectedStil?.name.includes('Gildenmagier') && selectedStil.stufe >= 2) {
                mod_at += 2
                text_at = text_at.concat('Gildenmagier II: +2\n')
            }
        }

        // Handle Blutmagie and Verbotene Pforten
        if (this.blutmagie?.value || this.verbotene_pforten?.activated) {
            // Handle Blutmagie
            if (this.blutmagie?.value) {
                const blutmagieReduction = Math.min(mod_energy, this.blutmagie.value)
                if (blutmagieReduction > 0) {
                    mod_energy -= blutmagieReduction
                    text_energy = text_energy.concat(`Blutmagie: -${blutmagieReduction} Energie\n`)
                }
            }

            // Handle Verbotene Pforten
            if (this.verbotene_pforten?.activated) {
                const ws =
                    this.actor.type === 'held'
                        ? this.actor.system.abgeleitete.ws
                        : this.actor.system.kampfwerte.ws
                const multiplier = this.verbotene_pforten.multiplier

                // Ensure mod_energy doesn't go below availableEnergy
                const maxReduction = mod_energy - availableEnergy

                // Calculate required wounds using the extracted method
                this.calculatedWounds = this.calculateRequiredWounds(ws, multiplier, maxReduction)

                if (this.calculatedWounds > 0 && maxReduction > 0) {
                    const verbotenePfortenReduction = (ws + multiplier) * this.calculatedWounds
                    const actualReduction = Math.min(verbotenePfortenReduction, maxReduction)
                    mod_energy -= actualReduction
                    text_energy = text_energy.concat(
                        `Verbotene Pforten (${this.calculatedWounds} Wunden): ${actualReduction} Energie\n`,
                    )
                }
            }
        }

        // Ensure mod_energy is never less than 0
        mod_energy = Math.max(0, mod_energy)

        // Track Mächtige Magie QS and maneuver duration bonus for pre-effects
        this.maechtigeMagieQs = maechtigeMagieQs || 0
        this.maneuverDurationBonus = durationBonus || 0

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
        this.damageType = damageType
        this.trueDamage = trueDamage
    }
}
