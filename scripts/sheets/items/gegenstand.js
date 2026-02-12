import { IlarisItemSheet } from './item.js'

export class GegenstandSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'gegenstand'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/gegenstand.hbs',
        },
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        if (context.hasOwner) {
            context.speicherplatz_list = this.document.actor.misc.speicherplatz_list
        }

        return context
    }
}
