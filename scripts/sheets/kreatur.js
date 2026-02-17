import { IlarisActorSheet } from './actor.js'

export class KreaturSheet extends IlarisActorSheet {
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
