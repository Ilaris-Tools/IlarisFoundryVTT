import { IlarisItemSheet } from './item.js'
import { migrateWeapon, isOldEigenschaftenFormat } from '../../common/waffen-migration.js'

/**
 * Base class for weapon sheets (Nahkampfwaffe and Fernkampfwaffe)
 * Provides shared functionality for weapon items
 */
export class WaffeBaseSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'waffe'],
        actions: {
            migrateEigenschaften: WaffeBaseSheet.#onMigrateEigenschaften,
            addEigenschaft: WaffeBaseSheet.#onAddEigenschaft,
            removeEigenschaft: WaffeBaseSheet.#onRemoveEigenschaft,
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add migration status flag
        context.needsMigration = isOldEigenschaftenFormat(this.document.system.eigenschaften)

        // Get available eigenschaften for the select
        context.availableEigenschaften = await this._getAvailableEigenschaften()

        // Enrich eigenschaften with metadata from eigenschaft items
        await this._enrichEigenschaftenData(context)

        return context
    }

    /**
     * Enrich eigenschaften data with parameterSlots from eigenschaft items
     * @param {Object} context - The template context
     * @private
     */
    async _enrichEigenschaftenData(context) {
        const eigenschaften = context.document.system.eigenschaften
        if (!Array.isArray(eigenschaften)) return

        // Import parser utilities
        const { normalizeEigenschaften } = await import('../../items/utils/eigenschaft-parser.js')

        // Normalize eigenschaften to object format
        const normalized = normalizeEigenschaften(eigenschaften)

        // Load eigenschaft items and add metadata
        for (const eig of normalized) {
            if (!eig.key) continue

            const eigenschaftItem = await this._loadEigenschaftItem(eig.key)
            if (eigenschaftItem) {
                eig._meta = {
                    parameterSlots: eigenschaftItem.system.parameterSlots || [],
                    kategorie: eigenschaftItem.system.kategorie,
                }
            } else {
                eig._meta = {
                    parameterSlots: [],
                    kategorie: null,
                }
            }
        }

        // Update context with enriched eigenschaften
        context.document.system.eigenschaften = normalized
    }

    /**
     * Load a single eigenschaft item by name
     * @param {string} name - Name of the eigenschaft
     * @returns {Promise<Item|null>}
     * @private
     */
    async _loadEigenschaftItem(name) {
        // Search in world items first
        let item = game.items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)
        if (item) return item

        // Search in configured compendiums
        const selectedPacks = JSON.parse(game.settings.get('Ilaris', 'waffeneigenschaftenPacks'))
        for (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (pack && pack.metadata.type === 'Item') {
                const items = await pack.getDocuments()
                item = items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)
                if (item) return item
            }
        }

        return null
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options)

        // Handle change event for eigenschaft-select (not a click action)
        const eigenschaftSelects = this.element.querySelectorAll('.eigenschaft-select')
        eigenschaftSelects.forEach((select) => {
            select.addEventListener('change', (ev) => this._onEigenschaftChange(ev))
        })
    }

    /**
     * Handle adding a new eigenschaft
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
    static async #onAddEigenschaft(event, target) {
        // Get available eigenschaften (need to bind this context)
        const availableEigenschaften = await this._getAvailableEigenschaften()

        if (availableEigenschaften.length === 0) {
            ui.notifications.warn(
                'Keine Waffeneigenschaften verfügbar. Bitte konfiguriere die Compendium-Packs in den Einstellungen.',
            )
            return
        }

        // Create dialog to select eigenschaft and configure parameters
        const options = availableEigenschaften
            .map((e) => `<option value="${e.name}">${e.name}</option>`)
            .join('')

        const self = this // Save context for callbacks

        const dialog = new Dialog({
            title: 'Waffeneigenschaft hinzufügen',
            content: `
                <form>
                    <div class="form-group">
                        <label>Eigenschaft:</label>
                        <select id="eigenschaft-select" style="width: 100%;">
                            ${options}
                        </select>
                    </div>
                    <div id="parameter-container" style="margin-top: 10px; min-height: 100px;">
                        <!-- Parameters will be loaded here dynamically -->
                    </div>
                </form>
            `,
            buttons: {
                add: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Hinzufügen',
                    callback: async (html) => {
                        const selected = html.find('#eigenschaft-select').val()
                        if (selected) {
                            // Collect parameter values
                            const parameters = []
                            html.find('.parameter-input').each(function () {
                                const input = $(this)
                                const type = input.data('type')
                                let value = input.val()

                                // Convert to appropriate type
                                if (type === 'number' && value !== '') {
                                    value = Number(value)
                                } else if (value === '') {
                                    const defaultVal = input.data('default')
                                    value = defaultVal !== '' ? defaultVal : null
                                }

                                parameters.push(value)
                            })

                            const eigenschaften = [...(self.document.system.eigenschaften || [])]
                            eigenschaften.push({ key: selected, parameters: parameters })
                            await self.document.update({ 'system.eigenschaften': eigenschaften })
                        }
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Abbrechen',
                },
            },
            default: 'add',
            height: 500,
            render: async (html) => {
                // Add change listener to load parameters when eigenschaft is selected
                html.find('#eigenschaft-select').on('change', async function (e) {
                    const selectedName = $(this).val()
                    const container = html.find('#parameter-container')

                    // Load eigenschaft item to get parameter slots
                    const eigenschaftItem = await self._loadEigenschaftItem(selectedName)

                    // Convert parameterSlots to array if it's an object
                    let parameterSlots = eigenschaftItem?.system?.parameterSlots || []
                    if (
                        parameterSlots &&
                        typeof parameterSlots === 'object' &&
                        !Array.isArray(parameterSlots)
                    ) {
                        parameterSlots = Object.values(parameterSlots)
                    }

                    if (eigenschaftItem && parameterSlots && parameterSlots.length > 0) {
                        let paramHtml =
                            '<h4 style="margin-top: 10px; margin-bottom: 5px;">Parameter:</h4>'

                        parameterSlots.forEach((slot, index) => {
                            const inputType = slot.type === 'number' ? 'number' : 'text'
                            const placeholder = slot.defaultValue
                                ? `Standard: ${slot.defaultValue}`
                                : 'Optional'
                            const required = slot.required ? 'required' : ''

                            paramHtml += `
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label>${slot.label || slot.name}:</label>
                                    <input 
                                        type="${inputType}" 
                                        class="parameter-input" 
                                        data-index="${index}"
                                        data-type="${slot.type}"
                                        data-default="${slot.defaultValue || ''}"
                                        placeholder="${placeholder}"
                                        ${required}
                                        style="width: 100%;"
                                    />
                                </div>
                            `
                        })

                        container.html(paramHtml)
                    } else {
                        container.html(
                            '<p style="color: #999; font-style: italic; margin-top: 10px;">Keine Parameter erforderlich</p>',
                        )
                    }
                })

                // Trigger initial load for first option
                setTimeout(() => {
                    html.find('#eigenschaft-select').trigger('change')
                }, 100)
            },
        })

        dialog.render(true)
    }

    /**
     * Handle removing an eigenschaft
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
    static async #onRemoveEigenschaft(event, target) {
        const index = parseInt(target.dataset.index)
        const eigenschaften = [...(this.document.system.eigenschaften || [])]
        eigenschaften.splice(index, 1)
        await this.document.update({ 'system.eigenschaften': eigenschaften })
    }

    /**
     * Handle eigenschaft selection change
     * Re-render to show parameter fields for the new selection
     * @param {Event} event - The change event
     * @private
     */
    async _onEigenschaftChange(event) {
        // Get the form data and update
        const formElement = this.element.querySelector('form')
        if (!formElement) return

        const formData = new FormDataExtended(formElement)
        const updateData = foundry.utils.expandObject(formData.object)
        await this.document.update(updateData)
    }

    /**
     * Handle migration button click
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The clicked element
     * @private
     */
    static async #onMigrateEigenschaften(event, target) {
        target.disabled = true

        try {
            const wasMigrated = await migrateWeapon(this.document)

            if (wasMigrated) {
                ui.notifications.info(
                    `Weapon "${this.document.name}" successfully migrated to new eigenschaften format`,
                )
                this.render(false)
            } else {
                ui.notifications.warn(`Weapon "${this.document.name}" is already in new format`)
            }
        } catch (error) {
            ui.notifications.error(`Error migrating weapon: ${error.message}`)
            console.error('Migration error:', error)
        } finally {
            target.disabled = false
        }
    }

    /**
     * Get all available waffeneigenschaft items from compendiums
     * @returns {Promise<Array>} Array of eigenschaft objects with name and id
     * @protected
     */
    async _getAvailableEigenschaften() {
        const eigenschaften = []

        // Get configured waffeneigenschaften packs from settings
        const selectedPacks = JSON.parse(game.settings.get('Ilaris', 'waffeneigenschaftenPacks'))

        // Search through configured compendiums only
        for (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (pack && pack.metadata.type === 'Item') {
                const items = await pack.getDocuments()
                for (const item of items) {
                    if (item.type === 'waffeneigenschaft') {
                        eigenschaften.push({
                            name: item.name,
                            id: item.id,
                        })
                    }
                }
            }
        }

        // Sort by name for better UX
        eigenschaften.sort((a, b) => a.name.localeCompare(b.name))

        return eigenschaften
    }

    /**
     * Migrate legacy damage format (dice_anzahl and dice_plus) to tp format
     * @param {Object} context - The context data
     * @protected
     */
    _migrateLegacyDamageFormat(context) {
        // for migration from dice_anzahl and dice_plus to tp
        // Only migrate if tp is not set yet AND old fields exist
        if (
            !this.document.system.tp &&
            (this.document.system.dice_plus || this.document.system.dice_anzahl)
        ) {
            this.document.system.tp = `${this.document.system.dice_anzahl}W6${
                this.document.system.dice_plus < 0 ? '' : '+'
            }${this.document.system.dice_plus}`
            delete this.document.system.dice_anzahl
            delete this.document.system.dice_plus
        }
    }
}
