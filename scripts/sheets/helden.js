import { IlarisActorSheet } from './actor.js';

export class HeldenSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/helden.html',
            // width: 720,
            // height: 800,
            // resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'fertigkeiten',
                },
            ],
        });
    }
}
