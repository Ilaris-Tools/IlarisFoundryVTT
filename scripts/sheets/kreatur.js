import { IlarisActorSheet } from './actor.js'

export class KreaturSheet extends IlarisActorSheet {
    /**
     * @param {object} options - Application options
     */
    constructor(options = {}) {
        super(options)
        this.#dragDrop = this.#createDragDropHandlers()
    }

    /**
     * Create drag-drop handlers for the sheet
     * @returns {DragDrop[]}
     */
    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            }
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this),
            }
            return new DragDrop(d)
        })
    }

    /** @type {DragDrop[]} */
    #dragDrop

    /** @returns {DragDrop[]} */
    get dragDrop() {
        return this.#dragDrop
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'kreatur'],
        window: {
            icon: 'fa-solid fa-dragon',
        },
        actions: {
            addVorteilInfo: KreaturSheet.addVorteilInfo,
        },
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/kreatur.hbs',
            scrollable: [''],
        },
    }

    // Note: kreatur.hbs does not use tabs - single page layout

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options)
        return context
    }

    /**
     * Bind event listeners after render
     * @param {ApplicationRenderContext} context - The render context
     * @param {RenderOptions} options - Render options
     * @protected
     */
    _onRender(context, options) {
        super._onRender(context, options)

        // Bind DragDrop handlers
        this.dragDrop.forEach((d) => d.bind(this.element))
    }

    /**
     * Show info about adding advantages
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element
     */
    static addVorteilInfo(event, target) {
        try {
            const pack = game.packs.get('Ilaris.vorteile')
            if (pack) {
                pack.render(true)
            }
            Dialog.prompt({
                content:
                    'Du kannst Vorteile direkt aus den Kompendium Packs auf den Statblock ziehen. Für eigene Vor/Nachteile zu erstellen, die nicht im Regelwerk enthalten sind, benutze die Eigenschaften.',
                callback: () => {},
            })
        } catch (err) {
            console.error('ILARIS | Error showing vorteil info:', err)
            ui.notifications.error('Fehler beim Öffnen der Vorteile-Kompendium.')
        }
    }

    /**
     * Check if user can drag from selector
     * @param {string} selector - The drag selector
     * @returns {boolean}
     * @protected
     */
    _canDragStart(selector) {
        return this.isEditable
    }

    /**
     * Check if user can drop on selector
     * @param {string} selector - The drop selector
     * @returns {boolean}
     * @protected
     */
    _canDragDrop(selector) {
        return this.isEditable
    }

    /**
     * Handle drag start
     * @param {DragEvent} event - The drag event
     * @protected
     */
    _onDragStart(event) {
        const li = event.currentTarget.closest('.item')
        if (!li) return
        if (li.classList.contains('inventory-header')) return

        const dragData = {
            type: 'Item',
            uuid: li.dataset.itemId ? `Actor.${this.actor.id}.Item.${li.dataset.itemId}` : null,
        }

        event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }

    /**
     * Handle drag over
     * @param {DragEvent} event - The drag event
     * @protected
     */
    _onDragOver(event) {
        event.preventDefault()
    }

    /**
     * Handle drop
     * @param {DragEvent} event - The drag event
     * @protected
     */
    async _onDrop(event) {
        event.preventDefault()

        try {
            const data = TextEditor.getDragEventData(event)
            if (data.type !== 'Item') return

            const item = await Item.implementation.fromDropData(data)
            if (!item) return

            // Convert dropped item based on type
            return this._onDropItemCreate(item)
        } catch (err) {
            console.error('ILARIS | Error handling drop:', err)
            ui.notifications.error('Fehler beim Verarbeiten des gezogenen Elements.')
        }
    }

    /**
     * Handle dropped item creation with type conversion for creatures
     * @param {Item} item - The dropped item
     * @protected
     */
    async _onDropItemCreate(item) {
        try {
            let itemData = {}
            switch (item.type) {
                case 'talent':
                case 'fertigkeit':
                    // Convert skill/talent to free talent for creatures
                    itemData = {
                        name: item.name,
                        type: 'freiestalent',
                        system: {
                            ...item.system,
                            profan: true,
                        },
                    }
                    super._onDropItemCreate(item)
                    return this.actor.createEmbeddedDocuments('Item', [itemData])
                case 'uebernatuerliche_fertigkeit':
                    // Convert supernatural skill to supernatural free talent
                    itemData = {
                        name: item.name,
                        type: 'freiestalent',
                        system: {
                            ...item.system,
                            profan: false,
                        },
                    }
                    super._onDropItemCreate(item)
                    return this.actor.createEmbeddedDocuments('Item', [itemData])
                default:
                    // Create direct copy
                    itemData = {
                        name: item.name,
                        type: item.type,
                        system: item.system,
                    }
                    super._onDropItemCreate(item)
            }
        } catch (err) {
            console.error('ILARIS | Error creating dropped item:', err)
            ui.notifications.error('Fehler beim Erstellen des Elements.')
        }
    }
}
