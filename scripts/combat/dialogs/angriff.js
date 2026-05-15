import { evaluate_roll_with_crit, postRollToChat } from '../../dice/wuerfel_misc.js'
import { signed } from '../../dice/chatutilities.js'
import { handleModifications } from './shared-dialog-helpers.js'
import { CombatDialog } from './combat-dialog.js'
import { formatDiceFormula } from '../../core/utilities.js'
import {
    callIlarisHookAllWithGlobalMirror,
    callIlarisHookWithGlobalMirror,
} from '../hooks/global_combat_hooks.js'

export class AngriffDialog extends CombatDialog {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['angriff-dialog'],
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            verteidigen: AngriffDialog.#onVerteidigen,
            schaden: AngriffDialog.#onSchaden,
        },
    }

    /** @override */
    static PARTS = {
        settings: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/angriff.hbs',
        },
        summaries: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/shared/summaries.hbs',
        },
    }

    constructor(actor, item, options = {}) {
        const title = options.isDefenseMode
            ? `Verteidigung gegen ${options?.attackingActor?.name || 'Unbekannt'} (${item.name})`
            : `Kampf: ${item.name}`

        super(actor, item, { ...options, window: { title } })

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

    /**
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Context data for the template
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        if (this.isDefenseMode && this.attackingActor) {
            this.selectedActors = [this.attackingActor]
        }
        return {
            ...context,
            isHumanoid: this.isHumanoid,
            lcht_choice: CONFIG.ILARIS.lcht_choice,
            isDefenseMode: this.isDefenseMode,
            attackingActor: this.attackingActor,
        }
    }

    /**
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        // If in defense mode, disable attack-related buttons
        if (this.isDefenseMode) {
            const angreifenBtn = this.element.querySelector('[data-action="angreifen"]')
            const showNearbyBtn = this.element.querySelector('[data-action="showNearby"]')
            if (angreifenBtn) {
                angreifenBtn.disabled = true
                angreifenBtn.style.opacity = '0.5'
            }
            if (showNearbyBtn) {
                showNearbyBtn.disabled = true
                showNearbyBtn.style.opacity = '0.5'
            }
            const schadenBtn = this.element.querySelector('[data-action="schaden"]')
            if (schadenBtn) {
                if (this.riposte) {
                    schadenBtn.disabled = false
                    schadenBtn.style.opacity = '1'
                } else {
                    schadenBtn.disabled = true
                    schadenBtn.style.opacity = '0.5'
                }
            }
        }

        // Setup modifier display with debounced listeners
        this.setupModifierDisplay()
    }

    /* -------------------------------------------- */
    /*  Action Handlers                             */
    /* -------------------------------------------- */

    /**
     * Handle the "verteidigen" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onVerteidigen(event, target) {
        await this._verteidigenKlick()
    }

    /**
     * Handle the "schaden" action button click.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async #onSchaden(event, target) {
        await this._schadenKlick()
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

    getSummaryContext(baseValues, statusMods, nahkampfMods, diceFormula) {
        const { baseAT, baseVT } = baseValues
        return {
            title: 'Würfelaktionen:',
            isEmpty: false,
            isError: false,
            sections: [
                this.getAttackSummaryContext(baseAT, statusMods, nahkampfMods, diceFormula),
                this.getDefenseSummaryContext(
                    baseVT,
                    statusMods,
                    this.actor.system.modifikatoren.verteidigungmod,
                    diceFormula,
                ),
                this.getDamageSummaryContext(),
            ],
        }
    }

    /**
     * Creates attack roll summary
     */
    getAttackSummaryContext(baseAT, statusMods, nahkampfMods, diceFormula) {
        const maneuverMod = this.mod_at || 0
        const totalMod = maneuverMod + statusMods + nahkampfMods
        const finalAT = baseAT + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalAT >= 0 ? `${formattedDice}+${finalAT}` : `${formattedDice}${finalAT}`

        const maneuverSection = this._buildModifierSectionData(this.text_at, {
            sectionTitle: 'Manöver:',
        })

        return {
            action: this.isDefenseMode ? null : 'angreifen',
            cssClass: `modifier-summary attack-summary${this.isDefenseMode ? '' : ' clickable-summary'}`,
            heading: `🗡️ Angriff: ${finalFormula}`,
            headingClass: this.isDefenseMode ? 'disabled' : '',
            rows: [
                {
                    label: 'Basis AT',
                    value: `${baseAT}`,
                    cssClass: 'modifier-item base-value',
                },
                this._buildSignedModifierData(statusMods, 'Status (Wunden/Furcht)'),
                this._buildSignedModifierData(nahkampfMods, 'Token Status'),
            ].filter((row) => row),
            sections: maneuverSection ? [maneuverSection] : [],
            totalRow: this._buildTotalModifierData(totalMod),
            showDivider: Boolean(maneuverSection || totalMod),
        }
    }

    /**
     * Creates defense roll summary
     */
    getDefenseSummaryContext(baseVT, statusMods, nahkampfMods, diceFormula) {
        const vtStatusMods = this.vt_abzuege_mod || 0
        const maneuverMod = this.mod_vt || 0
        const totalMod = maneuverMod + vtStatusMods + nahkampfMods
        const finalVT = baseVT + totalMod
        const formattedDice = formatDiceFormula(diceFormula)
        const finalFormula =
            finalVT >= 0 ? `${formattedDice}+${finalVT}` : `${formattedDice}${finalVT}`

        const maneuverSection = this._buildModifierSectionData(this.text_vt, {
            sectionTitle: 'Manöver:',
        })

        return {
            action: 'verteidigen',
            cssClass: 'modifier-summary defense-summary clickable-summary',
            heading: `🛡️ Verteidigung: ${finalFormula}`,
            rows: [
                {
                    label: 'Basis VT',
                    value: `${baseVT}`,
                    cssClass: 'modifier-item base-value',
                },
                this._buildSignedModifierData(vtStatusMods, 'Status (Wunden/Furcht)'),
                this._buildSignedModifierData(nahkampfMods, 'Token Status'),
            ].filter((row) => row),
            sections: maneuverSection ? [maneuverSection] : [],
            totalRow: this._buildTotalModifierData(totalMod),
            showDivider: Boolean(maneuverSection || totalMod),
        }
    }

    /**
     * Creates damage roll summary
     */
    getDamageSummaryContext() {
        const baseDamage = this.schaden || this.item.getTp()
        const maneuverMod = this.mod_dm || 0
        let finalFormula
        if (maneuverMod === 0) {
            finalFormula = baseDamage
        } else {
            const sign = maneuverMod > 0 ? '+' : ''
            finalFormula = `${baseDamage} ${sign}${maneuverMod}`
        }

        const canClick = !(this.isDefenseMode && !this.riposte)
        const modifierSection = this._buildModifierSectionData(this.text_dm, {
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

        return {
            action: canClick ? 'schaden' : null,
            cssClass: `modifier-summary damage-summary${canClick ? ' clickable-summary' : ''}`,
            heading: `🩸 Schaden: ${finalFormula}`,
            headingClass: canClick ? '' : 'disabled',
            rows: [
                {
                    label: 'Basis Schaden',
                    value: `${baseDamage}`,
                    cssClass: 'modifier-item base-value',
                },
            ],
            sections: modifierSection ? [modifierSection] : [],
            showDivider: Boolean(modifierSection),
        }
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
        this.attackType = 'melee'
        super._updateSchipsStern()
        this.updateModifierDisplay()
        await this.handleTargetSelection(rollResult, 'melee')
        callIlarisHookAllWithGlobalMirror('Ilaris.postAngriff', rollResult, this)
    }

    async _verteidigenKlick() {
        if (callIlarisHookWithGlobalMirror('Ilaris.preVerteidigung', this) === false) return
        await this.manoeverAuswaehlen()
        await this.updateManoeverMods()
        this.updateStatusMods()
        let label = `Verteidigung (${this.item.name})`
        let diceFormula = this.getDiceFormula()
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
        callIlarisHookAllWithGlobalMirror('Ilaris.postVerteidigung', rollResult, this)
        if (this.isDefenseMode) {
            const templateData = {
                ...rollResult.templateData,
                success: false,
                fumble: false,
                crit: false,
                is16OrHigher: false,
                noSuccess: false,
                text: rollResult.templateData.text + '\nVerteidigungsergebnis verborgen.',
            }

            // Send the hidden defense roll
            const html_roll = await foundry.applications.handlebars.renderTemplate(
                rollResult.templatePath,
                templateData,
            )
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
            await postRollToChat(rollResult, this.speaker, this.rollmode)
        }
    }

    async resolveAttackVsDefense(overrideAttackRoll = null) {
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
        super._updateSchipsStern()
        this.updateModifierDisplay()
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

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever
        let vorteile = this.actor.vorteil.kampf.map((v) => v.name)

        manoever.vlof.offensiver_kampfstil = vorteile.includes('Offensiver Kampfstil')
        super.aufbauendeManoeverAktivieren()
    }

    /**
     * Parse maneuver selections from the dialog form.
     * Uses native DOM API instead of jQuery.
     */
    async manoeverAuswaehlen() {
        let manoever = this.item.system.manoever

        // allgemeine optionen
        manoever.kbak.selected =
            this.element.querySelector(`#kbak-${this.dialogId}`)?.checked || false // Kombinierte Aktion
        manoever.vlof.selected =
            this.element.querySelector(`#vlof-${this.dialogId}`)?.checked || false // Volle Offensive
        manoever.vldf.selected =
            this.element.querySelector(`#vldf-${this.dialogId}`)?.checked || false // Volle Defensive
        manoever.pssl.selected =
            this.element.querySelector(`#pssl-${this.dialogId}`)?.checked || false // Passierschlag pssl
        manoever.rwdf.selected =
            this.element.querySelector(`#rwdf-${this.dialogId}`)?.value || false // Reichweitenunterschied
        manoever.rkaz.selected =
            this.element.querySelector(`#rkaz-${this.dialogId}`)?.value || false // Reaktionsanzahl

        manoever.mod.selected =
            this.element.querySelector(`#modifikator-${this.dialogId}`)?.value || false // Modifikator
        manoever.rllm.selected =
            this.element.querySelector(`#rollMode-${this.dialogId}`)?.value || false // RollMode

        this.isHumanoid =
            this.element.querySelector(`#isHumanoid-${this.dialogId}`)?.checked || false // isHumanoid
        manoever.lcht.selected = this.element.querySelector(`#lcht-${this.dialogId}`)?.value || '0' // Lichtverhältnisse

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
        let damageType = 'NORMAL'
        let trueDamage = false

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

        // Light conditions for melee (simpler penalties than ranged combat)
        let licht = Number(manoever.lcht.selected)
        if (manoever.lcht.angepasst) {
            licht = Math.max(licht - Number(manoever.lcht.angepasst), 0) // Angepasst kann nur die Lichtstufe verbessern, niemals verschlechtern
        }
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
        return (
            this.item.system.manoever.km_gzsl && this.item.system.manoever.km_gzsl.selected !== '0'
        )
    }
}
