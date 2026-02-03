import { IlarisItemSheet } from './item.js'

export class AbgeleiteterWertSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/abgeleiteter-wert.hbs',
        })
    }
}
