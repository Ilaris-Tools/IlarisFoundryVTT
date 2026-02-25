import { IlarisItemSheet } from './item.js'

export class FertigkeitSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'skill'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/fertigkeit.hbs',
        },
    }
}
