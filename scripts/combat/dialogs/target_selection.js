/**
 * Dialog for selecting nearby actors/tokens as targets for combat actions.
 * Displays all visible tokens on the current scene with their distances and dispositions,
 * allowing the user to select one or more targets. The selection is synced with Foundry's
 * built-in targeting system.
 *
 * @extends {Dialog}
 *
 * @example
 * // Basic usage with callback
 * const dialog = new TargetSelectionDialog(actor, (selectedActors) => {
 *     console.log('Selected targets:', selectedActors);
 *     // selectedActors is an array of objects with: tokenId, actorId, name, distance
 * });
 * dialog.render(true);
 *
 * @example
 * // Usage in combat dialog
 * async _showNearbyActors(html) {
 *     const dialog = new TargetSelectionDialog(this.actor, (selectedActors) => {
 *         this.selectedActors = selectedActors;
 *         this.updateSelectedActorsDisplay(html);
 *     });
 *     dialog.render(true);
 * }
 */
export class TargetSelectionDialog extends Dialog {
    /**
     * Creates a new target selection dialog.
     *
     * @param {Actor} actor - The actor who is selecting targets (used as reference point for distance calculation)
     * @param {Function} onSelectionComplete - Callback function invoked when selection is confirmed.
     *                                         Receives an array of selected target objects:
     *                                         [{tokenId: string, actorId: string, name: string, distance: number}, ...]
     */
    constructor(actor, onSelectionComplete) {
        const dialog = {
            title: 'Nahe Akteure',
        }
        const dialogOptions = {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/target_selection.hbs',
            width: 500,
            height: 'auto',
            classes: ['ilaris', 'combat-dialog', 'target-sel', 'target-selection-dialog'],
            buttons: {},
        }

        super(dialog, dialogOptions)
        this.actor = actor
        this.selectedActors = new Set()
        this.onSelectionComplete = onSelectionComplete
    }

    /**
     * Prepares data for the dialog template.
     * Retrieves all visible tokens on the current scene, calculates their distances
     * from the actor's token, and determines their dispositions.
     *
     * @returns {Promise<Object|null>} Template data object containing:
     *   - currentToken: {id, actorId, name} - The actor's token information
     *   - tokens: Array of token objects with {id, actorId, name, distance, disposition, dispositionClass}
     *   Returns null if the actor has no active token on the scene.
     */
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
                img: token.actor.img || 'icons/svg/mystery-man.svg',
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
                        dispositionClass = 'target-sel-hostile'
                        break
                    case 0:
                        disposition = 'Neutral'
                        dispositionClass = 'target-sel-neutral'
                        break
                    case 1:
                        disposition = 'Freundlich'
                        dispositionClass = 'target-sel-friendly'
                        break
                }

                return {
                    id: t.id,
                    actorId: t.actor.id,
                    name: t.name,
                    img: t.actor.img || 'icons/svg/mystery-man.svg',
                    distance: distance,
                    disposition: disposition,
                    dispositionClass: dispositionClass,
                }
            }),
        }

        return templateData
    }

    /**
     * Activates event listeners for the dialog.
     * Sets up handlers for:
     * - Submit button (confirms selection and closes dialog)
     * - Close button (closes dialog without confirming)
     * - Row clicks (toggles selection of individual tokens)
     *
     * @param {jQuery} html - The rendered HTML of the dialog
     */
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
        html.find('.target-sel-row').on('click', (event) => {
            const row = event.currentTarget
            // Don't handle clicks on the separator
            if ($(row).hasClass('target-sel-separator-row')) return

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
                    .find('.target-sel-row.selected')
                    .map(function () {
                        return $(this).find('td').eq(1).text().trim()
                    })
                    .get()
                selectionList.text(selectedNames.join(', '))
            }
        })
    }

    /**
     * Handles the selection confirmation when the submit button is clicked.
     * Collects all selected tokens, syncs them with Foundry's targeting system,
     * and invokes the onSelectionComplete callback with the selected data.
     *
     * @param {jQuery} html - The rendered HTML of the dialog
     * @param {Function} onSelectionComplete - Callback to invoke with selected targets
     * @private
     */
    _handleSelection(html, onSelectionComplete) {
        const selectedIds = Array.from(html.find('.target-sel-row.selected')).map((row) => ({
            tokenId: row.dataset.tokenId,
            actorId: row.dataset.actorId,
            name: row.cells[1].textContent.trim(),
            distance: parseInt(row.dataset.distance),
        }))

        // Update Foundry's targeting system to sync with dialog selection
        try {
            const targetTokenIds = selectedIds.map((target) => target.tokenId)
            game.user.updateTokenTargets(targetTokenIds)
            console.log(
                `Updated Foundry targets to match dialog selection: ${targetTokenIds.length} targets`,
            )
        } catch (error) {
            console.warn('Could not update Foundry token targets:', error)
        }

        if (onSelectionComplete) {
            onSelectionComplete(selectedIds)
        }
    }
}
