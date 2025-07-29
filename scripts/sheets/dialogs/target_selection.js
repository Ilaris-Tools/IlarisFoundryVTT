export class TargetSelectionDialog extends Dialog {
    constructor(actor, onSelectionComplete) {
        super({
            title: 'Nahe Akteure',
            content: '', // Will be populated in getData
            buttons: {
                select: {
                    label: 'Auswählen',
                    callback: (html) => this._handleSelection(html, onSelectionComplete),
                },
                close: {
                    label: 'Schließen',
                },
            },
            default: 'select',
            render: (html) => this._activateListeners(html),
        })
        this.actor = actor
        this.selectedActors = new Set()
    }

    async getData() {
        // Get the token for the current actor
        const token = this.actor.getActiveTokens()[0]
        if (!token) {
            ui.notifications.warn('Kein Token für diesen Akteur auf der Szene gefunden.')
            return null
        }

        // Get all tokens on the current scene
        const tokens = canvas.tokens.placeables.filter(
            (t) =>
                t.actor && // Has an actor
                t.id !== token.id && // Not the current token
                !t.document.hidden, // Not hidden
        )

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

        return { content }
    }

    _activateListeners(html) {
        // Handle row clicks using Foundry's event system
        html.find('.actor-row').on('click', (event) => {
            const row = event.currentTarget
            // Don't handle clicks on the separator
            if ($(row).hasClass('separator')) return

            const tokenId = row.dataset.tokenId

            // Toggle selection
            $(row).toggleClass('selected')
            if ($(row).hasClass('selected')) {
                this.selectedActors.add(tokenId)
            } else {
                this.selectedActors.delete(tokenId)
            }

            // Update selection display
            const selectionList = html.find('#selection-list')
            if (this.selectedActors.size === 0) {
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
    }

    _handleSelection(html, onSelectionComplete) {
        const selectedIds = Array.from(html[0].querySelectorAll('.actor-row.selected')).map(
            (row) => ({
                tokenId: row.dataset.tokenId,
                actorId: row.dataset.actorId,
                name: row.cells[0].textContent.trim(),
                distance: parseInt(row.dataset.distance),
            }),
        )

        if (onSelectionComplete) {
            onSelectionComplete(selectedIds)
        }
    }
}
