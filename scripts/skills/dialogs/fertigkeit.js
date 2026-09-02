import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { formatDiceFormula } from '../../core/utilities.js'
import {
    IlarisModifierPhase,
    IlarisModifierTarget,
} from '../../effects/utils/ilaris-modifier-constants.js'
import { resolveIlarisModifiers } from '../../effects/utils/ilaris-modifier-resolver.js'
import {
    getIlarisSituationTags,
    IlarisSkillSituationOptions,
} from '../../effects/utils/ilaris-roll-situations.js'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Dialog for skill (Fertigkeit) and attribute checks with live preview.
 * Supports: profane skills, free skills, and attribute checks.
 */
export class FertigkeitDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'combat-dialog', 'fertigkeit-dialog'],
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
        settings: {
            template: 'systems/Ilaris/scripts/skills/templates/dialogs/fertigkeit.hbs',
        },
        summaries: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/summaries.hbs',
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
        this.fertigkeitKey = options.fertigkeitKey ?? null
        this.fertigkeitName = options.fertigkeitName || ''
        this.pw = options.pw || 0
        this.success_val = options.success_val || null
        this.talentList = options.talentList || {}
        this.initialTalent = options.initialTalent || ''
        this.initialTalentKey =
            Object.entries(this.talentList).find(
                ([, talentName]) => talentName === this.initialTalent,
            )?.[0] ?? '-2'
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        this.initialXd20 = options.initialXd20 ?? '1'
        this.attributeTargets = (options.attributeTargets || []).map((attribute) =>
            String(attribute).toLowerCase(),
        )
        this.situation = options.situation || (options.sozialesDuell ? 'sozialesDuell' : '')
        this._hasEmittedRenderedHook = false
        this.summary = this.getDefaultSummaryContext()
        this._initialPreviewPromise = null
    }

    static #onPreviewClick(event, target) {
        event.preventDefault()
        this._executeRoll()
    }

    static _getDialogTitle(probeType, options) {
        const resistPrefix = options.resistAgainst ? 'Widerstandsprobe' : undefined

        switch (probeType) {
            case 'attribut':
                if (resistPrefix) {
                    return `${resistPrefix}: ${options.fertigkeitName || 'Attribut'} (gegen ${options.resistAgainst})`
                }
                return `Attributsprobe: ${options.fertigkeitName || 'Attribut'}`
            case 'freieFertigkeit':
                if (resistPrefix) {
                    return `${resistPrefix}: ${options.fertigkeitName || 'Freie Fertigkeit'} (gegen ${options.resistAgainst})`
                }
                return `Freie Fertigkeitsprobe: ${options.fertigkeitName || 'Freie Fertigkeit'}`
            case 'simple':
                if (resistPrefix) {
                    return `${resistPrefix}: ${options.fertigkeitName || 'Simple Fertigkeit'} (gegen ${options.resistAgainst})`
                }
                return `${options.fertigkeitName || 'Simple Fertigkeit'}`
            case 'fertigkeit':
            default:
                if (resistPrefix) {
                    return `${resistPrefix}: ${options.fertigkeitName || 'Fertigkeit'} (gegen ${options.resistAgainst})`
                }
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
            selectedTalentKey: this.initialTalentKey,
            hasTalents: Object.keys(this.talentList).length > 0,
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: this.initialXd20,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            hasSchips,
            rollModes: CONFIG.ChatMessage.modes,
            defaultRollMode: game.settings.get('core', 'messageMode'),
            dialogId: this.dialogId,
            situationOptions: IlarisSkillSituationOptions,
            selectedSituation: this.situation,
            summary: this.summary,
        }
    }

    async _preparePartContext(partId, context, options) {
        let partContext = context
        if (typeof super._preparePartContext === 'function') {
            partContext = await super._preparePartContext(partId, context, options)
        }

        if (partId === 'summaries') {
            partContext.summary = this.summary || this.getDefaultSummaryContext()
        }

        return partContext
    }

    async _onRender(context, options) {
        await super._onRender(context, options)

        const html = this.element
        const renderedParts = options?.parts ?? []
        const isSummariesOnlyRender =
            Array.isArray(renderedParts) &&
            renderedParts.length > 0 &&
            renderedParts.every((part) => part === 'summaries')

        if (isSummariesOnlyRender) {
            return
        }

        // Add listeners for real-time preview updates
        const inputs = html.querySelectorAll('input, select')
        inputs.forEach((input) => {
            input.addEventListener('change', () => this._handleInputChange())
            input.addEventListener('input', () => this._handleInputChange())
        })

        if (!this._initialPreviewPromise) {
            this._initialPreviewPromise = Promise.resolve()
                .then(() => this._updateModifierDisplay('render'))
                .then((statePayload) => {
                    if (!this._hasEmittedRenderedHook) {
                        Hooks.callAll('Ilaris.skillDialogRendered', this, statePayload)
                        this._hasEmittedRenderedHook = true
                    }
                    return statePayload
                })
        }
    }

    _handleInputChange() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout)
        }
        this._updateTimeout = setTimeout(() => {
            void this._updateModifierDisplay('change')
        }, 150)
    }

    /**
     * Calculate current modifiers and update the preview display
     */
    async _updateModifierDisplay(reason = 'change') {
        const modifierState = this._calculateModifiers()
        const { noTalentSelected } = modifierState

        // Update talent warning visibility in template
        const talentWarning = this.element.querySelector('.talent-warning')
        if (talentWarning) {
            if (noTalentSelected) {
                talentWarning.style.display = ''
            } else {
                talentWarning.style.display = 'none'
            }
        }

        this.summary = this._buildSummaryContext(modifierState)
        await this.render({ parts: ['summaries'] })

        const statePayload = this._buildStatePayload(modifierState, reason)
        this._lastStatePayload = statePayload
        Hooks.callAll('Ilaris.skillDialogStateChanged', this, statePayload)

        return statePayload
    }

    getDefaultSummaryContext() {
        return {
            title: 'Würfelaktionen:',
            sections: [],
            isEmpty: true,
            isError: false,
            message: 'Wird berechnet...',
        }
    }

    _getIlarisProbeResult(talent = '') {
        const targets = new Set([IlarisModifierTarget.Probe])
        if (talent) targets.add(IlarisModifierTarget.Talent)
        for (const attribute of this.attributeTargets) targets.add(attribute)

        const results = Array.from(targets).map((target) =>
            resolveIlarisModifiers({
                actor: this.actor,
                phase: IlarisModifierPhase.Roll,
                target,
                fertigkeit: this.fertigkeitName,
                talent,
                attributes: this.attributeTargets,
                situation: getIlarisSituationTags(this._getSelectedSituation()),
            }),
        )

        return {
            value: results.reduce((total, result) => total + result.value, 0),
            selected: results.flatMap((result) => result.selected),
            suppressed: results.flatMap((result) => result.suppressed),
            hasSuppression: results.some((result) => result.hasSuppression),
        }
    }

    _getSelectedSituation() {
        const field = this.element?.querySelector(`#situation-${this.dialogId}`)
        if (field) this.situation = field.value
        return this.situation
    }

    _getIlarisModifierLines(result) {
        return result.selected.map((entry) => ({
            label: `Ilaris: ${entry.sourceName}`,
            value: entry.parsed.expectedValue,
        }))
    }

    _getIlarisSuppressionContext(result) {
        if (!result.hasSuppression) return null
        return {
            label: 'Unterdrückte Ilaris-Modifikatoren anzeigen',
            entries: result.suppressed.map((entry) => ({
                sourceName: entry.sourceName,
                value: entry.parsed.raw,
                reason: entry.reason,
            })),
        }
    }

    _buildSummaryContext(modifierState) {
        const { diceFormula, totalMod, modLines, finalPW, effectivePW, label, usesTalent } =
            modifierState
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`
        const globalermod = this.actor.system.abgeleitete.globalermod || 0

        // Build rows array
        const rows = [
            {
                label: usesTalent ? 'Basis PW(T)' : 'Basis PW',
                value: `${effectivePW}`,
                cssClass: 'modifier-item base-value',
            },
            globalermod === 0
                ? null
                : {
                      label: 'Status (Wunden/Furcht)',
                      value: `${globalermod > 0 ? '+' : ''}${globalermod}`,
                      cssClass: `modifier-item ${globalermod > 0 ? 'positive' : 'negative'}`,
                  },
            ...modLines
                .filter((line) => line.value !== 0)
                .map((line) => ({
                    label: line.label,
                    value: `${line.value > 0 ? '+' : ''}${line.value}`,
                    cssClass: `modifier-item ${line.value > 0 ? 'positive' : 'negative'}`,
                })),
        ].filter((row) => row)

        // Add difficulty row for resist tests
        if (this.success_val !== null && this.success_val !== undefined) {
            rows.push({
                label: 'Erschwernis',
                value: `${this.success_val}`,
                cssClass: 'modifier-item difficulty',
            })
        }

        return {
            title: 'Würfelaktionen:',
            isEmpty: false,
            isError: false,
            sections: [
                {
                    action: 'previewClick',
                    cssClass: 'modifier-summary probe-summary clickable-summary',
                    heading: `🎲 ${label}: ${finalFormula}`,
                    rows,
                    totalRow:
                        totalMod === 0
                            ? null
                            : {
                                  text: `Addierte Modifikatoren: ${
                                      totalMod > 0 ? '+' : ''
                                  }${totalMod}`,
                                  cssClass: `modifier-item total ${
                                      totalMod > 0 ? 'positive' : 'negative'
                                  }`,
                              },
                    suppression: this._getIlarisSuppressionContext(modifierState.ilaris),
                    showDivider: true,
                },
            ],
        }
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
                ilaris: {
                    value: modifierState.ilaris.value,
                    selected: modifierState.ilaris.selected.map((entry) => ({
                        sourceName: entry.sourceName,
                        value: entry.parsed.raw,
                    })),
                    suppressed: modifierState.ilaris.suppressed.map((entry) => ({
                        sourceName: entry.sourceName,
                        value: entry.parsed.raw,
                        reason: entry.reason,
                    })),
                },
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
        for (const entry of modifierState.ilaris.selected) {
            text = text.concat(`Ilaris – ${entry.sourceName}: ${entry.parsed.raw}\n`)
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
            messageMode: rollmode,
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

        if (this.probeType === 'fertigkeit' && this.fertigkeitKey !== null) {
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

        const selectedTalent = usesTalent ? label.replace(/^.*\(|\)$/g, '') : ''
        const ilaris = this._getIlarisProbeResult(selectedTalent)
        modLines.push(...this._getIlarisModifierLines(ilaris))

        // Calculate totals
        const hoheQualitaetMod = hoheQualitaet * -4
        const totalMod = globalermod + hoheQualitaetMod + modifikator + ilaris.value
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
            ilaris,
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
            game.settings.get('core', 'messageMode')

        // Build formula
        const ilarisFormula = modifierState.ilaris.value ? ` + ${modifierState.ilaris.value}` : ''
        const formula = `${modifierState.diceFormula} + ${modifierState.effectivePW} + ${modifierState.globalermod} + ${modifierState.hoheQualitaetMod} + ${modifierState.modifikator}${ilarisFormula}`

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

        const rollResult = await evaluate_roll_with_crit(
            formula,
            modifierState.label,
            text,
            this.success_val,
        )
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
