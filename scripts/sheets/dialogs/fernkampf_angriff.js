import {
    roll_crit_message,
    get_statuseffect_by_id,
    evaluate_roll_with_crit,
} from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'
import * as hardcoded from '../../actors/hardcodedvorteile.js'

export class FernkampfAngriffDialog extends CombatDialog {
    constructor(actor, item) {
        const dialog = { title: `Fernkampfangriff: ${item.name}` }
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/fernkampf_angriff.hbs',
            width: 500,
            height: 'auto',
        }
        super(dialog, options)
        // this can be probendialog (more abstract)
        this.text_at = ''
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
        // Generate unique dialog ID to avoid conflicts when multiple dialogs are open
        this.aufbauendeManoeverAktivieren()
    }

    async getData() {
        // damit wird das template gefüttert
        let data = {
            rw_choice: this.item.system.manoever.rw,
            rw_checked: this.item.system.manoever.fm_rwrh.selected,
            gzkl_choice: CONFIG.ILARIS.gzkl_choice,
            lcht_choice: CONFIG.ILARIS.lcht_choice,
            wttr_choice: CONFIG.ILARIS.wttr_choice,
            bwng_choice: CONFIG.ILARIS.bwng_choice,
            dckg_choice: CONFIG.ILARIS.dckg_choice,
            kgtl_choice: CONFIG.ILARIS.kgtl_choice,
            ...(await super.getData()),
        }
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.schaden').click((ev) => this._schadenKlick(html))
    }

    eigenschaftenText() {
        if (!this.item.system.eigenschaften.length > 0) {
            return
        }
        this.text_at += '\nEigenschaften: '
        this.text_at += this.item.system.eigenschaften.map((e) => e.name).join(', ')
    }

    async _angreifenKlick(html) {
        // NOTE: var names not very descriptive:
        // at_abzuege_mod kommen vom status/gesundheit, at_mod aus ansagen, nahkampfmod?
        let diceFormula = this.getDiceFormula(html)
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods() // durch manoever
        this.updateStatusMods()
        this.eigenschaftenText()

        let label = `Fernkampf (${this.item.name})`
        let formula = `${diceFormula} ${signed(this.item.system.fk)} \
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

        await this.handleTargetSelection(rollResult, 'ranged')
    }

    async _schadenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods()
        // Rollmode
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
        manoever.gzkl.selected = html.find(`#gzkl-${this.dialogId}`)[0]?.value || false // Größenklasse
        manoever.bwng.selected = html.find(`#bwng-${this.dialogId}`)[0]?.value || false // Bewegung
        manoever.lcht.selected = html.find(`#lcht-${this.dialogId}`)[0]?.value || false // Lichtverhältnisse
        manoever.wttr.selected = html.find(`#wttr-${this.dialogId}`)[0]?.value || false // Wetter
        manoever.dckg.selected = html.find(`#dckg-${this.dialogId}`)[0]?.value || false // Deckung
        manoever.kgtl.selected = html.find(`#kgtl-${this.dialogId}`)[0]?.value || false // Kampfgetümmel
        manoever.brtn.selected = html.find(`#brtn-${this.dialogId}`)[0]?.checked // Beritten
        manoever.fm_gzss.selected = html.find(`#fm_gzss-${this.dialogId}`)[0]?.checked || false // Reflexschuss

        manoever.mod.selected = html.find(`#modifikator-${this.dialogId}`)[0]?.value || false // Modifikator
        manoever.rllm.selected = html.find(`#rollMode-${this.dialogId}`)[0]?.value || false // RollMode
        await super.manoeverAuswaehlen(html)
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

        // Beritten brtn  Reiterkampf II rtk
        let beritten = manoever.brtn.selected
        let reiterkampf = false
        if (this.actor.type === 'kreatur') {
            reiterkampf =
                this.actor.vorteil.kampf.some((v) => v.name === 'Reiterkampf II') ||
                this.actor.vorteil.allgemein.some((v) => v.name === 'Reiterkampf II') ||
                this.actor.vorteil.kampfstil.some((v) => v.name === 'Reiterkampf II')
        } else {
            let selectedKampfstil = hardcoded.getSelectedStil(this.actor, 'kampf')
            reiterkampf =
                selectedKampfstil.name.includes('Reiterkampf') && selectedKampfstil.stufe >= 2
        }
        if (beritten && reiterkampf) {
            text_at = text_at.concat(`${CONFIG.ILARIS.label['brtn']} (Reiterkampf)\n`)
        } else if (beritten) {
            mod_at -= 4
            text_at = text_at.concat(`${CONFIG.ILARIS.label['brtn']}\n`)
        }

        // Collect all modifications from all maneuvers
        let ruhige_hand = manoever.fm_zlen.ruhige_hand
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

            // ruhige hand & zielen hardcoded
            if (manoever.name == 'Zielen' && ruhige_hand) {
                mod_fk += 2
                text = text.concat(`${manoever.name} (Ruhige Hand)\n`)
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

        // Trefferzone if not set by manoever but a trefferzone maneuver is active
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
        this.fumble_val = fumble_val
    }

    isGezieltSchlagActive() {
        // Check if any trefferzone-related maneuver is selected
        // For ranged combat, this might be different maneuvers, but using same logic for consistency
        return (
            this.item.system.manoever.km_gzsl && this.item.system.manoever.km_gzsl.selected !== '0'
        )
    }
}
