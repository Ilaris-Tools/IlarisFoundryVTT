const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Dialog for selecting nearby actors/tokens as targets for combat actions.
 * Displays all visible tokens on the current scene with their distances and dispositions,
 * allowing the user to select one or more targets. The selection is synced with Foundry's
 * built-in targeting system.
 *
 * @extends {HandlebarsApplicationMixin(ApplicationV2)}
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
 * async _showNearbyActors() {
 *     const dialog = new TargetSelectionDialog(this.actor, (selectedActors) => {
 *         this.selectedActors = selectedActors;
 *         this.updateSelectedActorsDisplay();
 *     });
 *     dialog.render(true);
 * }
 */
export class TargetSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'combat-dialog', 'target-sel', 'target-selection-dialog'],
        position: {
            width: 500,
            height: 'auto',
        },
        window: {
            title: 'Nahe Akteure',
        },
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/combat/templates/dialogs/target_selection.hbs',
        },
    }

    /**
     * Creates a new target selection dialog.
     *
     * @param {Actor} actor - The actor who is selecting targets (used as reference point for distance calculation)
     * @param {Function} onSelectionComplete - Callback function invoked when selection is confirmed.
     *                                         Receives an array of selected target objects:
     *                                         [{tokenId: string, actorId: string, name: string, distance: number}, ...]
     */
    constructor(actor, onSelectionComplete) {
        super({})
        this.actor = actor
        this.selectedActors = new Set()
        this.onSelectionComplete = onSelectionComplete
    }

    /**
     * Prepares data for the dialog template.
     * Retrieves all visible tokens on the current scene, calculates their distances
     * from the actor's token, and determines their dispositions.
     *
     * @override
     * @param {object} options - Render options
     * @returns {Promise<object>} Template data object containing:
     *   - currentToken: {id, actorId, name} - The actor's token information
     *   - tokens: Array of token objects with {id, actorId, name, distance, disposition, dispositionClass}
     */
    async _prepareContext(options) {
        // Get the token for the current actor
        const token = this.actor.getActiveTokens()[0]
        if (!token) {
            ui.notifications.warn('Kein Token für diesen Akteur auf der Szene gefunden.')
            this.close()
            return { currentToken: null, tokens: [] }
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
     * Actions performed after any render of the Application.
     * Replaces the legacy activateListeners() method.
     * @override
     * @param {object} context - Prepared context data
     * @param {object} options - Render options
     */
    async _onRender(context, options) {
        await super._onRender(context, options)

        // Add button listeners
        this.element.querySelector('.submit')?.addEventListener('click', () => {
            this._handleSelection(this.onSelectionComplete)
            this.close()
        })
        this.element.querySelector('.close')?.addEventListener('click', () => {
            this.close()
        })

        // Handle row clicks
        this.element.querySelectorAll('.target-sel-row').forEach((row) => {
            row.addEventListener('click', () => {
                // Don't handle clicks on the separator
                if (row.classList.contains('target-sel-separator-row')) return

                const tokenId = row.dataset.tokenId

                // Toggle selection
                row.classList.toggle('selected')
                if (row.classList.contains('selected')) {
                    this.selectedActors.add(tokenId)
                } else {
                    this.selectedActors.delete(tokenId)
                }

                // Update selection display
                const selectionList = this.element.querySelector('#selection-list')
                if (this.selectedActors.size === 0) {
                    selectionList.textContent = 'Keine'
                } else {
                    const selectedNames = Array.from(
                        this.element.querySelectorAll('.target-sel-row.selected'),
                    )
                        .map((r) => r.querySelector('td:nth-child(2)')?.textContent.trim())
                        .filter(Boolean)
                    selectionList.textContent = selectedNames.join(', ')
                }
            })
        })
    }

    /**
     * Handles the selection confirmation when the submit button is clicked.
     * Collects all selected tokens, syncs them with Foundry's targeting system,
     * and invokes the onSelectionComplete callback with the selected data.
     *
     * @param {Function} onSelectionComplete - Callback to invoke with selected targets
     * @private
     */
    _handleSelection(onSelectionComplete) {
        const selectedIds = Array.from(
            this.element.querySelectorAll('.target-sel-row.selected'),
        ).map((row) => ({
            tokenId: row.dataset.tokenId,
            actorId: row.dataset.actorId,
            name: row.cells[1].textContent.trim(),
            distance: parseInt(row.dataset.distance),
        }))

        // Update Foundry's targeting system to sync with dialog selection
        try {
            const targetTokenIds = selectedIds.map((target) => target.tokenId)
            game.user.updateTokenTargets(targetTokenIds)
            game.user.targets.clear()
            for (const target of selectedIds) {
                const token = canvas.tokens.placeables.find((t) => t.id === target.tokenId)
                if (token) {
                    token.setTarget(true, { releaseOthers: false })
                }
            }
            console.log(
                `Updated Foundry targets to match dialog selection: ${targetTokenIds.length} targets`,
                `Updated Foundry targets to match dialog selection: ${game.user.targets.size} targets`,
            )
        } catch (error) {
            console.warn('Could not update Foundry token targets:', error)
        }

        if (onSelectionComplete) {
            onSelectionComplete(selectedIds)
        }
    }
}
