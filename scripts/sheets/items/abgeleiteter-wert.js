import { IlarisItemSheet } from './item.js'

export class AbgeleiteterWertSheet extends IlarisItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'abgeleiteter-wert'],
    }

    /** @override */
    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/abgeleiteter-wert.hbs',
        },
    }
}
