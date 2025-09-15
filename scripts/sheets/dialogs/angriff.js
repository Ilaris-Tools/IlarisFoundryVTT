import { roll_crit_message, get_statuseffect_by_id } from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'

export class AngriffDialog extends CombatDialog {
    constructor(actor, item) {
        const dialog = { title: `Kampf: ${item.name}` }
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs',
            width: 900,
            height: 'auto',
        }
        super(dialog, options)
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
        if (this.item.system.eigenschaften.unberechenbar) {
            this.fumble_val = 2
        }
        this.aufbauendeManoeverAktivieren()
    }

    getData() {
        let data = super.getData()
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.verteidigen').click((ev) => this._verteidigenKlick(html))
        html.find('.schaden').click((ev) => this._schadenKlick(html))

        // Store a reference to prevent multiple updates
        this._updateTimeout = null

        // Find the modifier summary element (should now exist in template)
        this._modifierElement = html.find('#modifier-summary')

        if (this._modifierElement.length === 0) {
            console.warn('MODIFIER DISPLAY: Element nicht im Template gefunden')
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

        // Initial display update
        setTimeout(() => this.updateModifierDisplay(html), 500)

        // Add event listeners for clickable summary sections
        this.addSummaryClickListeners(html)
    }

    addSummaryClickListeners(html) {
        // Use event delegation since the summary elements are dynamically created
        html.find('#modifier-summary').on('click', '.clickable-summary.angreifen', (ev) => {
            ev.preventDefault()
            this._angreifenKlick(html)
        })

        html.find('#modifier-summary').on('click', '.clickable-summary.verteidigen', (ev) => {
            ev.preventDefault()
            this._verteidigenKlick(html)
        })

        html.find('#modifier-summary').on('click', '.clickable-summary.schaden', (ev) => {
            ev.preventDefault()
            this._schadenKlick(html)
        })
    }

    /**
     * Updates the modifier display in real-time
     */
    async updateModifierDisplay(html) {
        try {
            // Use the stored reference instead of searching for the element
            if (!this._modifierElement || this._modifierElement.length === 0) {
                console.warn('MODIFIER DISPLAY: Element-Referenz nicht verfügbar')
                return
            }

            // Show loading state
            this._modifierElement.html(
                '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Wird berechnet...</div></div>',
            )

            // Temporarily parse values to calculate modifiers
            await this.manoeverAuswaehlen(html)
            await this.updateManoeverMods()
            await this.updateStatusMods()

            // Get base values
            const baseAT = this.item.system.at || 0
            const baseVT = this.item.system.vt || 0
            const statusMods = this.actor.system.abgeleitete.globalermod || 0
            const nahkampfMods = this.actor.system.modifikatoren.nahkampfmod || 0

            // Get dice formula
            const diceFormula = this.getDiceFormula(html)

            // Create all summaries
            const summaries = this.getAllModifierSummaries(
                baseAT,
                baseVT,
                statusMods,
                nahkampfMods,
                diceFormula,
            )

            // Update the display element
            this._modifierElement.html(summaries)
        } catch (error) {
            console.error('MODIFIER DISPLAY: Fehler beim Update:', error)
            // Show error state
            if (this._modifierElement && this._modifierElement.length > 0) {
                this._modifierElement.html(
                    '<div class="modifier-summary"><h4>Würfelwurf Zusammenfassungen:</h4><div class="modifier-item neutral">Fehler beim Berechnen...</div></div>',
                )
            }
        }
    }

    /**
     * Creates formatted summaries for all three roll types
     */
    getAllModifierSummaries(baseAT, baseVT, statusMods, nahkampfMods, diceFormula) {
        let allSummaries = '<div class="all-summaries">'

        // Attack Summary
        allSummaries += this.getAttackSummary(baseAT, statusMods, nahkampfMods, diceFormula)

        // Defense Summary
        allSummaries += this.getDefenseSummary(baseVT, statusMods, nahkampfMods, diceFormula)

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
        const finalFormula = finalAT >= 0 ? `${diceFormula}+${finalAT}` : `${diceFormula}${finalAT}`

        let summary = '<div class="modifier-summary attack-summary clickable-summary angreifen">'
        summary += `<h4>🗡️ Angriff: ${finalFormula}</h4>`
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
        const finalFormula = finalVT >= 0 ? `${diceFormula}+${finalVT}` : `${diceFormula}${finalVT}`

        let summary = '<div class="modifier-summary defense-summary clickable-summary verteidigen">'
        summary += `<h4>🛡️ Verteidigung: ${finalFormula}</h4>`
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

        let summary = '<div class="modifier-summary damage-summary clickable-summary schaden">'
        summary += `<h4>🩸 Schaden: ${finalFormula}</h4>`
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
        await this.updateManoeverMods() // durch manoever
        this.updateStatusMods()
        this.eigenschaftenText()

        let label = `Attacke (${this.item.name})`
        let formula = `${diceFormula} ${signed(this.item.system.at)} \
            ${signed(this.at_abzuege_mod)} \
            ${signed(this.item.actor.system.modifikatoren.nahkampfmod)} \
            ${signed(this.mod_at)}`
        await roll_crit_message(
            formula,
            label,
            this.text_at,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
        )
        super._updateSchipsStern(html)
        this.updateModifierDisplay(html)
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
        await roll_crit_message(
            formula,
            label,
            this.text_vt,
            this.speaker,
            this.rollmode,
            true,
            this.fumble_val,
        )
        super._updateSchipsStern(html)
        this.updateModifierDisplay(html)
    }

    async _schadenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods()
        // Rollmode
        let label = `Schaden (${this.item.name})`
        let formula = `${this.schaden} ${signed(this.mod_dm)}`
        await roll_crit_message(formula, label, this.text_dm, this.speaker, this.rollmode, false)
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

        // Trefferzone if not set by manoever but Gezielter Schlag is active
        if (trefferzone == 0 && this.isGezieltSchlagActive()) {
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

    eigenschaftenText() {
        if (!this.item.system.eigenschaften.length > 0) {
            return
        }
        this.text_at += '\nEigenschaften: '
        this.text_at += this.item.system.eigenschaften.map((e) => e.name).join(', ')
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
