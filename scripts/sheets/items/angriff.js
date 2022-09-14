import { IlarisItemSheet } from './item.js';

export class AngriffSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/angriff.html',
        });
    }
}
