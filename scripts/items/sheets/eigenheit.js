import { IlarisItemSheet } from './item.js'

export class EigenheitSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'eigenheit'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/scripts/items/templates/eigenheit.hbs',
        },
    }
}
