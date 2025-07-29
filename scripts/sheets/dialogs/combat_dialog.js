export class CombatDialog extends Dialog {
    async getData() {
        await this.item.setManoevers()
        // damit wird das template gefüttert
        return {
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            trefferzonen: CONFIG.ILARIS.trefferzonen,
            item: this.item,
            actor: this.actor,
            mod_at: this.mod_at,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            dialogId: (this.dialogId = `dialog-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}`),
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find('.angreifen').click((ev) => this._angreifenKlick(html))
        // Add expand/collapse functionality
        html.find('.maneuver-header').click((ev) => {
            const header = ev.currentTarget
            const grid = header.nextElementSibling
            const isCollapsed = header.classList.contains('collapsed')
            const text = header.querySelector('h4')

            header.classList.toggle('collapsed')
            grid.classList.toggle('collapsed')

            // Update text based on state
            text.textContent = isCollapsed ? 'Einklappen' : 'Ausklappen'
        })

        // Update has-value class when inputs change
        html.find('.maneuver-item input, .maneuver-item select').change((ev) => {
            const item = ev.currentTarget.closest('.maneuver-item')
            const hasValue = Array.from(item.querySelectorAll('input, select')).some((input) => {
                if (input.type === 'checkbox') return input.checked
                return input.value && input.value !== '0'
            })
            item.classList.toggle('has-value', hasValue)
        })
        html.find('.show-nearby').click((ev) => this._showNearbyActors(html))
    }

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever
        let vorteile = this.actor.vorteil.kampf.map((v) => v.name)

        manoever.kwut = vorteile.includes('Kalte Wut')
    }

    async manoeverAuswaehlen(html) {
        /* TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        this.rollmode = this.item.system.manoever.rllm.selected

        this.item.manoever.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            if (manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.checked || false
            } else {
                console.log(manoever.inputValue.name, html.find(`#${elementId}`)[0]?.value)
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.value || false
            }
        })
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */
        this.at_abzuege_mod = 0

        if (this.item.actor.system.gesundheit.wundabzuege < 0 && this.item.system.manoever.kwut) {
            this.text_at = this.text_at.concat(`(Kalte Wut)\n`)
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.furchtabzuege
        } else {
            this.at_abzuege_mod = this.item.actor.system.abgeleitete.globalermod
        }
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
                    <tr class="actor-row current-actor" data-token-id="${token.id}" data-actor-id="${token.actor.id}" data-distance="0">
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
                <tr class="actor-row" data-token-id="${t.id}" data-actor-id="${t.actor.id}" data-distance="${fields}">
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
                            name: row.cells[0].textContent.trim(),
                            distance: parseInt(row.dataset.distance),
                        }))

                        // Store selected actors in the class instance
                        this.selectedActors = selectedIds

                        // Update the main dialog to show selected actors
                        this.updateSelectedActorsDisplay(html)
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
                                return $(this).find('td').first().text().trim()
                            })
                            .get()
                        selectionList.text(selectedNames.join(', '))
                    }
                })
            },
        })
        d.render(true)
    }

    updateSelectedActorsDisplay(html) {
        // Get the parent dialog element that contains the original angriff.hbs content
        const parentDialog = $(html[0]).closest('.app.window-app').parent().find('.angriff-dialog')

        // Find or create the selected actors display
        let selectedActorsDiv = parentDialog.find('.selected-actors-display')

        if (selectedActorsDiv.length === 0) {
            // If the div doesn't exist, create and insert it before the first hr
            selectedActorsDiv = $(`
                <div class="selected-actors-display" style="margin: 10px 0;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Ausgewählte Ziele:</div>
                    <div class="selected-actors-list"></div>
                </div>
            `)
            parentDialog.find('hr').first().before(selectedActorsDiv)
        }

        // Update the selected actors list
        const listDiv = selectedActorsDiv.find('.selected-actors-list')
        if (!this.selectedActors || this.selectedActors.length === 0) {
            listDiv.html('<i>Keine Ziele ausgewählt</i>')
        } else {
            const actorsList = this.selectedActors
                .map((actor) => `<div>${actor.name} (${actor.distance} Felder)</div>`)
                .join('')
            listDiv.html(actorsList)
        }
    }

    getDiceFormula(html, xd20_choice) {
        let schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
        let text = ''
        let diceFormula = xd20_choice ?? '1d20'
        if (schipsOption == 0) {
            return diceFormula
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = text.concat(`Keine Schips\n`)
            this.text_vt = text.concat(`Keine Schips\n`)
            return diceFormula
        }

        this.actor.update({
            'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
        })
        if (schipsOption == 1) {
            this.text_at = text.concat(`Schips ohne Eigenheit\n`)
            this.text_vt = text.concat(`Schips ohne Eigenheit\n`)
            diceFormula = `${2}d20dl${1}`
        }

        if (schipsOption == 2) {
            this.text_at = text.concat(`Schips mit Eigenschaft\n`)
            this.text_vt = text.concat(`Schips mit Eigenschaft\n`)
            diceFormula = `${3}d20dl${2}`
        }
        return diceFormula
    }
}
