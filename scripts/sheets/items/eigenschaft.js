import { IlarisItemSheet } from './item.js';

export class EigenschaftSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/eigenschaft.html',
        });
    }
}
