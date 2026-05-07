import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { signed } from '../../dice/chatutilities.js'
import { handleModifications } from './shared-dialog-helpers.js'
import { CombatDialog } from './combat-dialog.js'
import { formatDiceFormula } from '../../core/utilities.js'
import {
    callIlarisHookAllWithGlobalMirror,
    callIlarisHookWithGlobalMirror,
} from '../hooks/global_combat_hooks.js'

export class FernkampfAngriffDialog extends CombatDialog {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['fernkampf-dialog'],
        actions: {
            schaden: FernkampfAngriffDialog.#onSchaden,
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/fernkampf_angriff.hbs',
        },
    }

    constructor(actor, item, options = {}) {
        super(actor, item, {
            ...options,
            window: { title: `Fernkampfangriff: ${item.name}` },
        })

        // Get fumble threshold from computed combat mechanics (calculated by eigenschaft system)
        if (this.item.system.computed?.combatMechanics?.fumbleThreshold) {
            this.fumble_val = this.item.system.computed.combatMechanics.fumbleThreshold
        }

        // Ranged combat has no specific additional properties beyond base
        this.aufbauendeManoeverAktivieren()
    }

    /**
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Context data for the template
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        return {
            ...context,
            rw_choice: this.item.system.manoever.rw,
            rw_checked: false,
            gzkl_choice: CONFIG.ILARIS.gzkl_choice,
            lcht_choice: CONFIG.ILARIS.lcht_choice,
            wttr_choice: CONFIG.ILARIS.wttr_choice,
            bwng_choice: CONFIG.ILARIS.bwng_choice,
            dckg_choice: CONFIG.ILARIS.dckg_choice,
            kgtl_choice: CONFIG.ILARIS.kgtl_choice,
        }
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
     * Handle the "schaden" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onSchaden(event, target) {
        await this._schadenKlick()
    }

    /* -------------------------------------------- */
    /*  Summary Click Actions                       */
    /* -------------------------------------------- */

    getSummaryClickActions() {
        return [
            {
                selector: '.clickable-summary.angreifen',
                handler: () => this._angreifenKlick(),
            },
            {
                selector: '.clickable-summary.schaden',
                handler: () => this._schadenKlick(),
            },
        ]
    }

    /**
     * Gets the FK (Fernkampf/ranged combat) value for this attack.
     * For creature actors, falls back to system.at if system.fk is not present.
     * @returns {number} The FK value to use for the attack
     */
    _getFKValue() {
        return (
            this.item.system.fk ?? (this.actor.type === 'kreatur' ? (this.item.system.at ?? 0) : 0)
        )
    }

    /**
     * Returns base values specific to FernkampfAngriffDialog
     */
    getBaseValues() {
        return {
            baseFK: this._getFKValue(),
        }
    }

    /**
     * Creates formatted summaries for all roll types
     */
    getAllModifierSummaries(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { baseFK } = baseValues
        let allSummaries = '<div class="all-summaries">'

        // Attack Summary
        allSummaries += this.getAttackSummary(baseFK, statusMods, nahkampfMods, diceFormula)

        // Damage Summary
        allSummaries += this.getDamageSummary()

        allSummaries += '</div>'
        return allSummaries
    }

    /**
     * Creates attack roll summary
     */
    getAttackSummary(baseFK, statusMods, nahkampfMods, diceFormula) {
        // Calculate totals first for the heading
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalFK = baseFK + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalFK >= 0 ? `${formattedDice}+${finalFK}` : `${formattedDice}${finalFK}`

        let summary = '<div class="modifier-summary attack-summary clickable-summary angreifen">'
        summary += `<div class="flex_space-between_center"><h4 style="width:100%">🏹 Fernkampf: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base FK
        summary += `<div class="modifier-item base-value">Basis FK: <span>${baseFK}</span></div>`

        summary += this._buildSignedModifierItem(statusMods, 'Status (Wunden/Furcht)')
        summary += this._buildSignedModifierItem(nahkampfMods, 'Token Status')
        summary += this._buildModifierLines(this.text_at, { sectionTitle: 'Manöver:' })

        summary += '<hr>'

        summary += this._buildTotalModifierItem(totalMod)

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

        let summary = '<div class="modifier-summary damage-summary clickable-summary schaden">'
        summary += `<div class="flex_space-between_center"><h4 style="width:100%">🩸 Schaden: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`
        summary += '<div class="modifier-list">'

        // Base damage
        summary += `<div class="modifier-item base-value">Basis Schaden: <span>${baseDamage}</span></div>`

        summary += this._buildModifierLines(this.text_dm, {
            sectionTitle: 'Modifikatoren:',
            filterLine: (line) =>
                this.isGezieltSchlagActive() ||
                (!line.includes('Trefferzone:') && !line.includes('Gezielter Schlag:')),
            transformLine: (line) =>
                line.replace(/\s*Trefferzone gewählt$/i, '').replace(/\s*gewählt$/i, ''),
            getLineClass: (line) => {
                if (line.includes('Kein Schaden')) return 'negative'
                if (line.includes('+')) return 'positive'
                if (line.includes('-')) return 'negative'
                return 'neutral'
            },
        })

        summary += '<hr>'

        summary += '</div></div>'
        return summary
    }

    /* -------------------------------------------- */
    /*  Combat Actions                              */
    /* -------------------------------------------- */

    async _angreifenKlick() {
        if (callIlarisHookWithGlobalMirror('Ilaris.preAngriff', this) === false) return
        let diceFormula = this.getDiceFormula()
        await this.manoeverAuswaehlen()
        await this.updateManoeverMods()
        this.updateStatusMods()
        super.eigenschaftenText()

        let label = `Fernkampf (${this.item.name})`
        let formula = `${diceFormula} ${signed(this._getFKValue())} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.mod_at)}`

        // Use the new evaluation function
        const rollResult = await evaluate_roll_with_crit(
            formula,
            label,
            this.text_at,
            12, // success_val
            this.fumble_val,
            true, // crit_eval
        )

        this.attackType = 'ranged'
        super._updateSchipsStern()
        await this.handleTargetSelection(rollResult, 'ranged')
        callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)
    }

    async _schadenKlick() {
        if (callIlarisHookWithGlobalMirror('Ilaris.preSchaden', this) === false) return
        await this.manoeverAuswaehlen()
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

        await postRollToChat(rollResult, this.speaker, this.rollmode)
        callIlarisHookAllWithGlobalMirror('Ilaris.postSchaden', rollResult, this)
    }

    /* -------------------------------------------- */
    /*  Maneuver Processing                         */
    /* -------------------------------------------- */

    /**
     * Parse maneuver selections from the dialog form.
     * Uses native DOM API instead of jQuery.
     */
    async manoeverAuswaehlen() {
        let manoever = this.item.system.manoever

        // allgemeine optionen
        manoever.kbak.selected =
            this.element.querySelector(`#kbak-${this.dialogId}`)?.checked || false // Kombinierte Aktion
        manoever.gzkl.selected =
            this.element.querySelector(`#gzkl-${this.dialogId}`)?.value || false // Größenklasse
        manoever.bwng.selected =
            this.element.querySelector(`#bwng-${this.dialogId}`)?.value || false // Bewegung
        manoever.lcht.selected =
            this.element.querySelector(`#lcht-${this.dialogId}`)?.value || false // Lichtverhältnisse
        manoever.wttr.selected =
            this.element.querySelector(`#wttr-${this.dialogId}`)?.value || false // Wetter
        manoever.dckg.selected =
            this.element.querySelector(`#dckg-${this.dialogId}`)?.value || false // Deckung
        manoever.kgtl.selected =
            this.element.querySelector(`#kgtl-${this.dialogId}`)?.value || false // Kampfgetümmel
        manoever.fm_gzss.selected =
            this.element.querySelector(`#fm_gzss-${this.dialogId}`)?.checked || false // Reflexschuss

        manoever.mod.selected =
            this.element.querySelector(`#modifikator-${this.dialogId}`)?.value || false // Modifikator
        manoever.rllm.selected =
            this.element.querySelector(`#rollMode-${this.dialogId}`)?.value || false // RollMode
        await super.manoeverAuswaehlen()
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
        let fumble_val = 1
        let damageType = 'NORMAL'
        let trueDamage = false

        // Kombinierte Aktion kbak
        if (manoever.kbak.selected) {
            mod_at -= 4
            text_at = text_at.concat('Kombinierte Aktion\n')
        }
        //Größenklasse gzkl
        let gklasse = Number(manoever.gzkl.selected)
        if (gklasse == 0) mod_at += 8
        else if (gklasse == 1) mod_at += 4
        else if (gklasse == 3) mod_at -= 4
        else if (gklasse == 4) mod_at -= 8
        else if (gklasse == 5) mod_at -= 12
        text_at = text_at.concat(`${CONFIG.ILARIS.gzkl_choice[gklasse]}\n`)

        // Lichtverhältnisse
        let licht = Number(manoever.lcht.selected)
        let licht_angepasst = Number(manoever.lcht.angepasst)
        if (licht == 4) {
            mod_at -= 32
            text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`)
        } else if (licht == 3) {
            if (licht_angepasst == 0) {
                mod_at -= 16
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`)
            } else if (licht_angepasst == 1) {
                mod_at -= 8
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`)
            } else if (licht_angepasst == 2) {
                mod_at -= 4
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`)
            }
        } else if (licht == 2) {
            if (licht_angepasst == 0) {
                mod_at -= 8
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`)
            } else if (licht_angepasst == 1) {
                mod_at -= 4
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`)
            } else if (licht_angepasst == 2) {
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`)
            }
        } else if (licht == 1) {
            if (licht_angepasst == 0) {
                mod_at -= 4
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]}\n`)
            } else if (licht_angepasst == 1) {
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst I)\n`)
            } else if (licht_angepasst == 2) {
                text_at = text_at.concat(`${CONFIG.ILARIS.lcht_choice[licht]} (Angepasst II)\n`)
            }
        }

        // Wetter wttr und Bewegung bwng
        let wetter = Number(manoever.wttr.selected)
        let bewegung = Number(manoever.bwng.selected)
        let reflexschuss = manoever.rflx
        if (reflexschuss) {
            let reflex_change = ''
            if (wetter > 0 || bewegung > 0) {
                if (wetter > bewegung) {
                    wetter -= 1
                    reflex_change = 'wetter'
                } else {
                    bewegung -= 1
                    reflex_change = 'bewegung'
                }
            }
            mod_at -= 4 * (wetter + bewegung)
            if (wetter > 0 && reflex_change != 'wetter') {
                text_at = text_at.concat(`${CONFIG.ILARIS.wttr_choice[wetter]}\n`)
            } else if (reflex_change == 'wetter') {
                text_at = text_at.concat(`${CONFIG.ILARIS.wttr_choice[wetter]} (Reflexschuss)\n`)
            }
            if (bewegung > 0 && reflex_change != 'bewegung') {
                text_at = text_at.concat(`${CONFIG.ILARIS.bwng_choice[bewegung]}\n`)
            } else if (reflex_change == 'bewegung') {
                text_at = text_at.concat(`${CONFIG.ILARIS.bwng_choice[bewegung]} (Reflexschuss)\n`)
            }
        } else {
            if (wetter > 0) {
                mod_at -= 4 * wetter
                text_at = text_at.concat(`${CONFIG.ILARIS.wttr_choice[wetter]}\n`)
            }
            if (bewegung > 0) {
                mod_at -= 4 * bewegung
                text_at = text_at.concat(`${CONFIG.ILARIS.bwng_choice[bewegung]}\n`)
            }
        }

        // Deckung dckg
        let deckung = Number(manoever.dckg.selected)
        if (deckung < 0) {
            mod_at += 4 * deckung
            text_at = text_at.concat(
                `${CONFIG.ILARIS.label['dckg']}: ${CONFIG.ILARIS.dckg_choice[deckung]}\n`,
            )
        }
        // Kampfgetümmel kgtl
        let kampfgetuemmel = Number(manoever.kgtl.selected)
        if (kampfgetuemmel == 1) {
            fumble_val += 1
            text_at = text_at.concat(
                `${CONFIG.ILARIS.label['kgtl']}: ${CONFIG.ILARIS.kgtl_choice[kampfgetuemmel]}\n`,
            )
        }
        if (kampfgetuemmel == 2) {
            fumble_val += 3
            text_at = text_at.concat(
                `${CONFIG.ILARIS.label['kgtl']}: ${CONFIG.ILARIS.kgtl_choice[kampfgetuemmel]}\n`,
            )
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
        this.fumble_val = fumble_val
        this.damageType = damageType
        this.trueDamage = trueDamage
    }
}
