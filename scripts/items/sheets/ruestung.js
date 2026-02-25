import { IlarisItemSheet } from './item.js'

export class RuestungSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'ruestung'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/ruestung.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        return context
    }
}
