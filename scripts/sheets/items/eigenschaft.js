import { IlarisItemSheet } from './item.js'

export class EigenschaftSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'eigenschaft'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/eigenschaft.hbs',
        },
    }
}
