import { IlarisItemSheet } from './item.js';

export class NahkampfwaffeSheet extends IlarisItemSheet {
    async getData() {
        const data = super.getData();
        
        if (data.hasOwner) {
            data.speicherplatz_list = this.item.actor.misc.speicherplatz_list;
        }
        
        // for migration from dice_anzahl and dice_plus to tp
        // Only migrate if tp is not set yet AND old fields exist
        if(!this.item.system.tp && (this.item.system.dice_plus || this.item.system.dice_anzahl)) {
            this.item.system.tp = `${this.item.system.dice_anzahl}W6${this.item.system.dice_plus < 0 ? '' : '+'}${this.item.system.dice_plus}`;
            delete this.item.system.dice_anzahl;
            delete this.item.system.dice_plus;
        }
        return data;
    }

    static get defaultOptions() {
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
