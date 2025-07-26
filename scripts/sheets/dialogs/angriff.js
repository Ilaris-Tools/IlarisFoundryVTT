import { roll_crit_message, get_statuseffect_by_id } from '../../common/wuerfel/wuerfel_misc.js'
import { signed } from '../../common/wuerfel/chatutilities.js'
import { handleModifications } from './shared_dialog_helpers.js'
import { CombatDialog } from './combat_dialog.js'

export class AngriffDialog extends CombatDialog {
    constructor(actor, item) {
        const dialog = { title: `Kampf: ${item.name}` }
        const options = {
            template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs',
            width: 500,
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
        html.find('.schaden').click((ev) => this._schadenKlick(html))
        html.find('.verteidigen').click((ev) => this._verteidigenKlick(html))
        html.find('.show-nearby').click((ev) => this._showNearbyActors(html))
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
    }

    async _schadenKlick(html) {
        await this.manoeverAuswaehlen(html)
        await this.updateManoeverMods()
        // Rollmode
        let label = `Schaden (${this.item.name})`
        let formula = `${this.schaden} ${signed(this.mod_dm)}`
        await roll_crit_message(formula, label, this.text_dm, this.speaker, this.rollmode, false)
    }

    async _showNearbyActors(html) {
        // Get the token for the current actor
        const token = this.actor.getActiveTokens()[0]
        if (!token) {
            ui.notifications.warn('Kein Token für diesen Akteur auf der Szene gefunden.')
            return
        }

        // Get all tokens on the current scene
        const tokens = canvas.tokens.placeables.filter(
            (t) =>
                t.actor && // Has an actor
                t.id !== token.id && // Not the current token
                !t.document.hidden, // Not hidden
        )

        // Log tokens for debugging
        console.log('Current token:', token)
        tokens.forEach((t) => {
            console.log('Found nearby token:', {
                name: t.name,
                actor: t.actor,
                disposition: t.document.disposition, // -1 hostile, 0 neutral, 1 friendly
                document: t.document,
            })
        })

        // Calculate distances and create content
        let content = `
        <div style="max-height: 400px; overflow-y: auto;">
            <div id="selected-actors" style="margin-bottom: 10px; min-height: 20px;">
                <strong>Ausgewählte Akteure:</strong> <span id="selection-list">Keine</span>
            </div>
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th style="text-align: left;">Name</th>
                        <th style="text-align: left;">Felder</th>
                        <th style="text-align: left;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="actor-row current-actor" data-token-id="${token.id}" data-actor-id="${token.actor.id}">
                        <td><i class="fas fa-user"></i> ${token.name}</td>
                        <td>0</td>
                        <td>Selbst</td>
                    </tr>
                    <tr class="separator">
                        <td colspan="3"><hr style="margin: 5px 0;"></td>
                    </tr>`

        tokens.forEach((t) => {
            const ray = new Ray(token.center, t.center)
            const distance = canvas.grid.measureDistances([{ ray }], { gridSpaces: true })[0]
            const fields = Math.round(distance)

            // Determine disposition
            let disposition = ''
            let dispositionClass = ''
            switch (t.document.disposition) {
                case -1:
                    disposition = 'Feindlich'
                    dispositionClass = 'hostile'
                    break
                case 0:
                    disposition = 'Neutral'
                    dispositionClass = 'neutral'
                    break
                case 1:
                    disposition = 'Freundlich'
                    dispositionClass = 'friendly'
                    break
            }

            content += `
                <tr class="actor-row" data-token-id="${t.id}" data-actor-id="${t.actor.id}">
                    <td>${t.name}</td>
                    <td>${fields}</td>
                    <td class="${dispositionClass}">${disposition}</td>
                </tr>`
        })

        content += `</tbody></table></div>
        <style>
            .hostile { color: #ff4444; }
            .neutral { color: #ffaa00; }
            .friendly { color: #44ff44; }
            table th { padding: 5px; }
            table td { padding: 3px 5px; }
            .actor-row { cursor: pointer; }
            .actor-row:hover { background-color: rgba(0, 0, 0, 0.1); }
            .actor-row.selected { 
                background-color: rgba(0, 150, 255, 0.2);
            }
            .current-actor {
                background-color: rgba(0, 0, 0, 0.05);
            }
            .current-actor.selected {
                background-color: rgba(0, 150, 255, 0.3);
            }
            .separator {
                background: none !important;
                cursor: default !important;
            }
            .separator:hover {
                background: none !important;
            }
            #selected-actors {
                padding: 5px;
                border-radius: 3px;
            }
        </style>`

        // Create and render the dialog
        const d = new Dialog({
            title: 'Nahe Akteure',
            content: content,
            buttons: {
                select: {
                    label: 'Auswählen',
                    callback: (html) => {
                        const selectedIds = Array.from(
                            html[0].querySelectorAll('.actor-row.selected'),
                        ).map((row) => ({
                            tokenId: row.dataset.tokenId,
                            actorId: row.dataset.actorId,
                            name: row.cells[0].textContent,
                            distance: parseInt(row.cells[1].textContent),
                        }))
                        console.log('Selected actors:', selectedIds)
                        // Here you can handle the selected actors
                        // For now, we just log them
                    },
                },
                close: {
                    label: 'Schließen',
                },
            },
            default: 'select',
            render: (html) => {
                // Store selected actors
                const selectedActors = new Set()

                // Handle row clicks using Foundry's event system
                html.find('.actor-row').on('click', function (event) {
                    // Don't handle clicks on the separator
                    if ($(this).hasClass('separator')) return

                    const tokenId = this.dataset.tokenId

                    // Toggle selection
                    $(this).toggleClass('selected')
                    if ($(this).hasClass('selected')) {
                        selectedActors.add(tokenId)
                    } else {
                        selectedActors.delete(tokenId)
                    }

                    // Update selection display
                    const selectionList = html.find('#selection-list')
                    if (selectedActors.size === 0) {
                        selectionList.text('Keine')
                    } else {
                        const selectedNames = html
                            .find('.actor-row.selected')
                            .map(function () {
                                return $(this).find('td').first().text()
                            })
                            .get()
                        selectionList.text(selectedNames.join(', '))
                    }
                })
            },
        })
        d.render(true)
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

        // Trefferzone if not set by manoever
        if (trefferzone == 0) {
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

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_vt = this.text_at.concat(`(Kalte Wut)\n`)
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege
        } else {
            this.vt_abzuege_mod = this.item.actor.system.abgeleitete.globalermod
        }
        super.updateStatusMods()
    }
}
