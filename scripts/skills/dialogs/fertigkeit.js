import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { formatDiceFormula } from '../../core/utilities.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Dialog for skill (Fertigkeit) and attribute checks with live preview.
 * Supports: profane skills, free skills, and attribute checks.
 */
export class FertigkeitDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'fertigkeit-dialog'],
        position: { width: 900, height: 'auto' },
        window: {
            title: 'Fertigkeitsprobe',
            resizable: true,
        },
        actions: {
            previewClick: FertigkeitDialog.#onPreviewClick,
        },
    }

    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/skills/templates/dialogs/fertigkeit.hbs',
        },
    }

    constructor(actor, options = {}) {
        super(options)

        const probeType = options.probeType || 'fertigkeit'
        const title = FertigkeitDialog._getDialogTitle(probeType, options)

        // Set dynamic title
        this.options.window.title = title

        this.actor = actor
        this.probeType = probeType
        this.fertigkeitKey = options.fertigkeitKey || null
        this.fertigkeitName = options.fertigkeitName || ''
        this.pw = options.pw || 0
        this.talentList = options.talentList || {}
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        this._hasEmittedRenderedHook = false
    }

    static #onPreviewClick(event, target) {
        event.preventDefault()
        this._executeRoll()
    }

    static _getDialogTitle(probeType, options) {
        switch (probeType) {
            case 'attribut':
                return `Attributsprobe: ${options.fertigkeitName || 'Attribut'}`
            case 'freieFertigkeit':
                return `Freie Fertigkeitsprobe: ${options.fertigkeitName || 'Freie Fertigkeit'}`
            case 'fertigkeit':
            default:
                return `Fertigkeitsprobe: ${options.fertigkeitName || 'Fertigkeit'}`
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const hasSchips = this.actor.system.schips.schips_stern > 0

        return {
            ...context,
            actor: this.actor,
            probeType: this.probeType,
            fertigkeitKey: this.fertigkeitKey,
            fertigkeitName: this.fertigkeitName,
            pw: this.pw,
            talentList: this.talentList,
            hasTalents: Object.keys(this.talentList).length > 0,
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            hasSchips,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
            dialogId: this.dialogId,
        }
    }

    async _onRender(context, options) {
        await super._onRender(context, options)

        const html = this.element

        // Store modifier element reference
        this._modifierElement = html.querySelector('#modifier-summary')

        // Add listeners for real-time preview updates
        const inputs = html.querySelectorAll('input, select')
        inputs.forEach((input) => {
            input.addEventListener('change', () => this._handleInputChange())
            input.addEventListener('input', () => this._handleInputChange())
        })

        // Initial preview update
        const statePayload = this._updateModifierDisplay('render')

        if (!this._hasEmittedRenderedHook) {
            Hooks.callAll('Ilaris.skillDialogRendered', this, statePayload)
            this._hasEmittedRenderedHook = true
        }
    }

    _handleInputChange() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout)
        }
        this._updateTimeout = setTimeout(() => {
            this._updateModifierDisplay('change')
        }, 150)
    }

    /**
     * Calculate current modifiers and update the preview display
     */
    _updateModifierDisplay(reason = 'change') {
        if (!this._modifierElement) {
            return
        }

        const modifierState = this._calculateModifiers()
        const {
            diceFormula,
            totalMod,
            modLines,
            finalPW,
            effectivePW,
            label,
            noTalentSelected,
            usesTalent,
        } = modifierState
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`

        let summary = '<div class="all-summaries">'
        summary +=
            '<div class="modifier-summary probe-summary clickable-summary" data-action="previewClick">'
        summary += `<div class="flex_space-between_center"><h4 style="width:100%">🎲 ${label}: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base PW - show PW(T) if talent is selected
        const pwLabel = usesTalent ? 'Basis PW(T)' : 'Basis PW'
        summary += `<div class="modifier-item base-value">${pwLabel}: <span>${effectivePW}</span></div>`

        // Status modifiers
        const globalermod = this.actor.system.abgeleitete.globalermod || 0
        if (globalermod !== 0) {
            const color = globalermod > 0 ? 'positive' : 'negative'
            const sign = globalermod > 0 ? '+' : ''
            summary += `<div class="modifier-item ${color}">Status (Wunden/Furcht): <span>${sign}${globalermod}</span></div>`
        }

        // Individual modifier lines
        modLines.forEach((line) => {
            if (line.value !== 0) {
                const color = line.value > 0 ? 'positive' : 'negative'
                const sign = line.value > 0 ? '+' : ''
                summary += `<div class="modifier-item ${color}">${line.label}: <span>${sign}${line.value}</span></div>`
            }
        })

        summary += '<hr>'

        // Total modifiers
        if (totalMod !== 0) {
            const totalColor = totalMod > 0 ? 'positive' : 'negative'
            const totalSign = totalMod > 0 ? '+' : ''
            summary += `<div class="modifier-item total ${totalColor}"><strong>Addierte Modifikatoren: ${totalSign}${totalMod}</strong></div>`
        }

        summary += '</div></div></div>'

        // Update talent warning visibility in template
        const talentWarning = this.element.querySelector('.talent-warning')
        if (talentWarning) {
            if (noTalentSelected) {
                talentWarning.style.display = ''
            } else {
                talentWarning.style.display = 'none'
            }
        }

        this._modifierElement.innerHTML = summary

        const statePayload = this._buildStatePayload(modifierState, reason)
        this._lastStatePayload = statePayload
        Hooks.callAll('Ilaris.skillDialogStateChanged', this, statePayload)

        return statePayload
    }

    _buildStatePayload(modifierState, reason = 'change') {
        const talentSelection = this._getTalentSelection()

        return {
            reason,
            actor: this.actor,
            dialogId: this.dialogId,
            probeType: this.probeType,
            fertigkeitKey: this.fertigkeitKey,
            fertigkeitName: this.fertigkeitName,
            label: modifierState.label,
            basePW: this.pw,
            effectivePW: modifierState.effectivePW,
            finalPW: modifierState.finalPW,
            totalMod: modifierState.totalMod,
            diceFormula: modifierState.diceFormula,
            formattedDiceFormula: formatDiceFormula(modifierState.diceFormula),
            noTalentSelected: modifierState.noTalentSelected,
            usesTalent: modifierState.usesTalent,
            talent: talentSelection,
            modifiers: {
                globalermod: modifierState.globalermod,
                hoheQualitaet: modifierState.hoheQualitaet,
                hoheQualitaetMod: modifierState.hoheQualitaetMod,
                modifikator: modifierState.modifikator,
                lines: modifierState.modLines.map((line) => ({ ...line })),
            },
            schips: {
                choice: modifierState.schipsChoice,
                applied: modifierState.schipsApplied,
                text: modifierState.schipsText,
                available: this.actor.system?.schips?.schips_stern || 0,
            },
        }
    }

    _getTalentSelection() {
        const talentField = this.element?.querySelector(`#talent-${this.dialogId}`)
        if (!talentField) {
            return {
                selectedValue: null,
                selectedName: null,
                choices: Object.values(this.talentList),
            }
        }

        const selectedValue = Number(talentField.value)
        let selectedName = null

        if (selectedValue >= 0 && this.talentList[selectedValue]) {
            selectedName = this.talentList[selectedValue]
        } else if (selectedValue === -1) {
            selectedName = 'Talent'
        }

        return {
            selectedValue,
            selectedName,
            choices: Object.values(this.talentList),
        }
    }

    _buildRollText(modifierState) {
        let text = ''

        if (modifierState.schipsText) {
            text = text.concat(`${modifierState.schipsText}\n`)
        }
        if (modifierState.hoheQualitaet !== 0) {
            text = text.concat(`Hohe Qualität: ${modifierState.hoheQualitaet}\n`)
        }
        if (modifierState.modifikator !== 0) {
            text = text.concat(`Modifikator: ${modifierState.modifikator}\n`)
        }

        return text
    }

    _buildRollPayload({
        statePayload,
        formula,
        text,
        rollmode,
        rollResult = null,
        chatMessage = null,
        schipsConsumed = false,
        schipsConsumptionPrevented = false,
    }) {
        return {
            ...statePayload,
            formula,
            text,
            rollMode: rollmode,
            rollResult,
            roll: rollResult?.roll || null,
            success: rollResult?.success,
            crit: rollResult?.crit,
            fumble: rollResult?.fumble,
            is16OrHigher: rollResult?.is16OrHigher,
            total: rollResult?.roll?.total,
            chatMessage,
            schipsConsumed,
            schipsConsumptionPrevented,
        }
    }

    /**
     * Calculate all current modifiers from the form
     */
    _calculateModifiers() {
        const html = this.element
        const globalermod = this.actor.system.abgeleitete.globalermod || 0
        const modLines = []
        const hasTalents = Object.keys(this.talentList).length > 0

        // Get xd20 choice
        const xd20Choice =
            Number(html.querySelector(`input[name="xd20-${this.dialogId}"]:checked`)?.value) || 0
        const diceCount = xd20Choice === 0 ? 1 : 3

        // Calculate dice formula based on schips, respecting availability
        let selectedSchipsChoice =
            Number(html.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value) || 0
        const availableSchips = this.actor.system?.schips?.schips_stern || 0
        let schipsText = ''
        let schipsApplied = false

        if (selectedSchipsChoice !== 0 && availableSchips === 0) {
            // No Schips available – inform the user but don't modify dice
            schipsText = 'Keine Schips'
            selectedSchipsChoice = 0
        } else if (selectedSchipsChoice === 1 && availableSchips > 0) {
            schipsText = 'Schips ohne Eigenheit'
            schipsApplied = true
        } else if (selectedSchipsChoice === 2 && availableSchips > 0) {
            schipsText = 'Schips mit Eigenheit'
            schipsApplied = true
        }

        let diceFormula = this._getDiceFormula(diceCount, selectedSchipsChoice)

        // Hohe Qualität
        let hoheQualitaet =
            Number(html.querySelector(`#hohequalitaet-${this.dialogId}`)?.value) || 0
        if (hoheQualitaet !== 0) {
            modLines.push({ label: 'Hohe Qualität', value: hoheQualitaet * -4 })
        }

        // Custom modifier
        let modifikator = Number(html.querySelector(`#modifikator-${this.dialogId}`)?.value) || 0
        if (modifikator !== 0) {
            modLines.push({ label: 'Modifikator', value: modifikator })
        }

        // Talent selection affects PW for skills
        let effectivePW = this.pw
        let label = this.fertigkeitName
        let noTalentSelected = false
        let usesTalent = false

        if (this.probeType === 'fertigkeit' && this.fertigkeitKey) {
            const talentChoice = Number(html.querySelector(`#talent-${this.dialogId}`)?.value)
            if (talentChoice === -2) {
                // ohne Talent - use pw
                effectivePW =
                    this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pw || this.pw
                // Show warning if talents are available but none selected
                noTalentSelected = hasTalents
            } else if (talentChoice === -1) {
                // mit Talent - use pwt
                effectivePW =
                    this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pwt || this.pw
                label = `${this.fertigkeitName} (Talent)`
                usesTalent = true
            } else if (talentChoice >= 0 && this.talentList[talentChoice]) {
                // specific talent - use pwt
                effectivePW =
                    this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pwt || this.pw
                label = `${this.fertigkeitName} (${this.talentList[talentChoice]})`
                usesTalent = true
            }
        }

        // Calculate totals
        const hoheQualitaetMod = hoheQualitaet * -4
        const totalMod = globalermod + hoheQualitaetMod + modifikator
        const finalPW = effectivePW + totalMod

        return {
            diceFormula,
            totalMod,
            modLines,
            finalPW,
            effectivePW,
            label,
            noTalentSelected,
            usesTalent,
            // Additional values for roll execution
            globalermod,
            hoheQualitaet,
            hoheQualitaetMod,
            modifikator,
            schipsChoice: selectedSchipsChoice,
            schipsApplied,
            schipsText,
        }
    }

    /**
     * Get dice formula based on dice count and schips choice
     */
    _getDiceFormula(diceCount, schipsChoice) {
        let baseDice = diceCount
        let dropLow = diceCount === 1 ? 0 : 1
        let dropHigh = diceCount === 1 ? 0 : 1

        if (schipsChoice === 1) {
            // Schips ohne Eigenheit - add 1 die, drop 1 more low
            baseDice += 1
            dropLow += 1
        } else if (schipsChoice === 2) {
            // Schips mit Eigenheit - add 2 dice, drop 2 more low
            baseDice += 2
            dropLow += 2
        }

        if (dropLow === 0 && dropHigh === 0) {
            return `${baseDice}d20`
        }
        return `${baseDice}d20dl${dropLow}dh${dropHigh}`
    }

    /**
     * Execute the roll
     */
    async _executeRoll() {
        const html = this.element
        // Reuse the same calculation used for preview - single source of truth
        const modifierState = this._calculateModifiers()
        const statePayload = this._buildStatePayload(modifierState, 'roll')
        const text = this._buildRollText(modifierState)

        // Get roll mode
        const rollmode =
            html.querySelector(`#rollMode-${this.dialogId}`)?.value ||
            game.settings.get('core', 'rollMode')

        // Build formula
        const formula = `${modifierState.diceFormula} + ${modifierState.effectivePW} + ${modifierState.globalermod} + ${modifierState.hoheQualitaetMod} + ${modifierState.modifikator}`

        const preRollPayload = this._buildRollPayload({
            statePayload,
            formula,
            text,
            rollmode,
        })

        if (Hooks.call('Ilaris.preSkillRoll', this, preRollPayload) === false) {
            return
        }

        let schipsConsumed = false
        let schipsConsumptionPrevented = false

        // Update schips if used
        if (modifierState.schipsApplied && this.actor.system.schips.schips_stern > 0) {
            const remainingBefore = this.actor.system.schips.schips_stern
            const remainingAfter = Math.max(remainingBefore - 1, 0)
            const schipsPayload = {
                ...preRollPayload,
                amount: 1,
                remainingBefore,
                remainingAfter,
            }

            if (Hooks.call('Ilaris.preSkillSchipsConsumption', this, schipsPayload) !== false) {
                await this.actor.update({
                    'system.schips.schips_stern': remainingAfter,
                })
                schipsConsumed = true
                Hooks.callAll('Ilaris.postSkillSchipsConsumption', this, schipsPayload)
            } else {
                schipsConsumptionPrevented = true
            }
        }

        const rollResult = await evaluate_roll_with_crit(formula, modifierState.label, text)
        const chatMessage = await postRollToChat(rollResult, this.speaker, rollmode)
        const postRollPayload = this._buildRollPayload({
            statePayload,
            formula,
            text,
            rollmode,
            rollResult,
            chatMessage,
            schipsConsumed,
            schipsConsumptionPrevented,
        })

        Hooks.callAll('Ilaris.postSkillRoll', this, postRollPayload)
    }
}
