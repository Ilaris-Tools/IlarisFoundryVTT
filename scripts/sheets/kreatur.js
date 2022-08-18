import { IlarisActorSheet } from './actor.js';

export class KreaturSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/kreatur.html',
        });
    }
}
