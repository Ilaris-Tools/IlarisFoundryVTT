export class TargetSelectionDialog extends Dialog {
    constructor(actor, onSelectionComplete) {
        const dialog = {
            title: 'Nahe Akteure',
        }
        const dialogOptions = {
            template: 'systems/Ilaris/templates/sheets/dialogs/target_selection.hbs',
            width: 500,
            height: 'auto',
            classes: ['target-selection-dialog'],
            buttons: {},
            default: 'select',
        }

        super(dialog, dialogOptions)
        this.actor = actor
        this.selectedActors = new Set()
        this.onSelectionComplete = onSelectionComplete
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

        // Prepare data for the template
        const templateData = {
            currentToken: {
                id: token.id,
                actorId: token.actor.id,
                name: token.name,
            },
            tokens: tokens.map((t) => {
                const waypoints = [
                    { x: token.center.x, y: token.center.y },
                    { x: t.center.x, y: t.center.y },
                ]
                const distance = Math.round(
                    canvas.grid.measurePath(waypoints, { gridSpaces: true }).distance,
                )

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

                return {
                    id: t.id,
                    actorId: t.actor.id,
                    name: t.name,
                    distance: distance,
                    disposition: disposition,
                    dispositionClass: dispositionClass,
                }
            }),
        }

        return templateData
    }

    activateListeners(html) {
        super.activateListeners(html)

        // Add button listeners
        html.find('.submit').on('click', (event) => {
            this._handleSelection(html, this.onSelectionComplete)
            this.close()
        })
        html.find('.close').on('click', (event) => {
            this.close()
        })
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
        const selectedIds = Array.from(html[2].querySelectorAll('.actor-row.selected')).map(
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
