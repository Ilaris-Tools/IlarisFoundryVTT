import { IlarisItemSheet } from './item.js'

export class FreiesTalentSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/freies_talent.hbs',
        })
    }
}
