import { IlarisItemSheet } from './item.js';

export class VorteilSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/vorteil.html',
            // width: 720,
            // height: 800,
            // resizable: false,
            // tabs: [
            //     {
            //         navSelector: ".sheet-tabs",
            //         contentSelector: ".sheet-body",
            //         initial: "fertigkeiten",
            //     },
            // ]
        });
    }

    // getData() {
    //     const data = super.getData();
    //     return data;
    // }

    // _getHeaderButtons() {
    //     let buttons = super._getHeaderButtons();
    //     return buttons;
    // }

    // activateListeners(html) {
    //     super.activateListeners(html);
    // }
}
