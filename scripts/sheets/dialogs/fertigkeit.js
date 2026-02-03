import { roll_crit_message } from '../../common/wuerfel/wuerfel_misc.js'
import { formatDiceFormula } from '../../common/utilities.js'

/**
 * Dialog for skill (Fertigkeit) and attribute checks with live preview.
 * Supports: profane skills, free skills, and attribute checks.
 */
export class FertigkeitDialog extends Dialog {
    constructor(actor, options = {}) {
        const probeType = options.probeType || 'fertigkeit'
        const title = FertigkeitDialog._getDialogTitle(probeType, options)

        const dialogData = {
            title,
            buttons: {
                roll: {
                    icon: '<i><img class="button-icon" src="systems/Ilaris/assets/game-icons.net/rolling-dices.png"></i>',
                    label: 'Würfeln',
                    callback: (html) => this._onRoll(html),
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Abbrechen',
                },
            },
            default: 'roll',
        }

        const dialogOptions = {
            template: 'systems/Ilaris/templates/sheets/dialogs/fertigkeit.hbs',
            width: 900,
            height: 'auto',
            resizable: true,
            classes: ['fertigkeit-dialog', 'ilaris'],
            jQuery: true,
        }

        super(dialogData, dialogOptions)

        this.actor = actor
        this.probeType = probeType
        this.fertigkeitKey = options.fertigkeitKey || null
        this.fertigkeitName = options.fertigkeitName || ''
        this.pw = options.pw || 0
        this.talentList = options.talentList || {}
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
        this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }

    static _getDialogTitle(probeType, options) {
        switch (probeType) {
            case 'attribut':
                return `Attributsprobe: ${options.fertigkeitName || 'Attribut'}`
            case 'freie_fertigkeit':
                return `Freie Fertigkeitsprobe: ${options.fertigkeitName || 'Freie Fertigkeit'}`
            case 'fertigkeit':
            default:
                return `Fertigkeitsprobe: ${options.fertigkeitName || 'Fertigkeit'}`
        }
    }

    async getData() {
        const hasSchips = this.actor.system.schips.schips_stern > 0

        return {
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

    activateListeners(html) {
        super.activateListeners(html)

        // Store modifier element reference
        this._modifierElement = html.find('#modifier-summary')

        // Add listeners for real-time preview updates
        html.find('input, select').on('change input', () => {
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout)
            }
            this._updateTimeout = setTimeout(() => {
                this._updateModifierDisplay(html)
            }, 150)
        })

        // Make preview clickable to roll
        html.find('#modifier-summary').on('click', '.clickable-summary', (ev) => {
            ev.preventDefault()
            this._onRoll(html)
        })

        // Initial preview update
        setTimeout(() => this._updateModifierDisplay(html), 100)
    }

    /**
     * Calculate current modifiers and update the preview display
     */
    _updateModifierDisplay(html) {
        if (!this._modifierElement || this._modifierElement.length === 0) {
            return
        }

        const {
            diceFormula,
            totalMod,
            modLines,
            finalPW,
            effectivePW,
            label,
            noTalentSelected,
            usesTalent,
        } = this._calculateModifiers(html)
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`

        let summary = '<div class="all-summaries">'
        summary += '<div class="modifier-summary probe-summary clickable-summary">'
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
        const talentWarning = html.find('.talent-warning')
        if (talentWarning.length > 0) {
            if (noTalentSelected) {
                talentWarning.show()
            } else {
                talentWarning.hide()
            }
        }

        this._modifierElement.html(summary)
    }

    /**
     * Calculate all current modifiers from the form
     */
    _calculateModifiers(html) {
        const globalermod = this.actor.system.abgeleitete.globalermod || 0
        const modLines = []
        const hasTalents = Object.keys(this.talentList).length > 0

        // Get xd20 choice
        const xd20Choice =
            Number(html.find(`input[name="xd20-${this.dialogId}"]:checked`).val()) || 0
        const diceCount = xd20Choice === 0 ? 1 : 3

        // Calculate dice formula based on schips, respecting availability
        let selectedSchipsChoice =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`).val()) || 0
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
        let hoheQualitaet = Number(html.find(`#hohequalitaet-${this.dialogId}`).val()) || 0
        if (hoheQualitaet !== 0) {
            modLines.push({ label: 'Hohe Qualität', value: hoheQualitaet * -4 })
        }

        // Custom modifier
        let modifikator = Number(html.find(`#modifikator-${this.dialogId}`).val()) || 0
        if (modifikator !== 0) {
            modLines.push({ label: 'Modifikator', value: modifikator })
        }

        // Talent selection affects PW for skills
        let effectivePW = this.pw
        let label = this.fertigkeitName
        let noTalentSelected = false
        let usesTalent = false

        if (this.probeType === 'fertigkeit' && this.fertigkeitKey) {
            const talentChoice = Number(html.find(`#talent-${this.dialogId}`).val())
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
    async _onRoll(html) {
        // Reuse the same calculation used for preview - single source of truth
        const {
            diceFormula,
            effectivePW,
            label,
            globalermod,
            hoheQualitaet,
            hoheQualitaetMod,
            modifikator,
            schipsChoice,
            schipsApplied,
            schipsText,
        } = this._calculateModifiers(html)

        // Build roll text for chat
        let text = ''
        if (schipsText) {
            text = text.concat(`${schipsText}\n`)
        }
        if (hoheQualitaet !== 0) {
            text = text.concat(`Hohe Qualität: ${hoheQualitaet}\n`)
        }
        if (modifikator !== 0) {
            text = text.concat(`Modifikator: ${modifikator}\n`)
        }

        // Get roll mode
        const rollmode =
            html.find(`#rollMode-${this.dialogId}`).val() || game.settings.get('core', 'rollMode')

        // Build formula
        const formula = `${diceFormula} + ${effectivePW} + ${globalermod} + ${hoheQualitaetMod} + ${modifikator}`

        // Update schips if used
        if (schipsApplied && this.actor.system.schips.schips_stern > 0) {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        }

        // Execute roll using existing function
        await roll_crit_message(formula, label, text, this.speaker, rollmode)
    }
}
