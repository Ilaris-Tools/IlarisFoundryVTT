import { IlarisItemSheet } from './item.js';

export class FreiesTalentSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/freies_talent.html',
        });
    }
}
