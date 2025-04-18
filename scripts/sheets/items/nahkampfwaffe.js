import { IlarisItemSheet } from './item.js';

export class NahkampfwaffeSheet extends IlarisItemSheet {
    async getData() {
        const data = super.getData();
        if (data.hasOwner) {
            data.speicherplatz_list = this.item.actor.misc.speicherplatz_list;
        }
        return data;
    }

    static get defaultOptions() {
        console.log("defaultOptions",this);
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/nahkampfwaffe.html',
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
