import { IlarisItemSheet } from './item.js';

export class UebernatuerlichTalentSheet extends IlarisItemSheet {
    getData() {
        const data = super.getData();
        if (data.hasOwner) {
            data.fertigkeit_list = this.item.actor.system.misc.uebernatuerlich_fertigkeit_list;
            console.log(data);
        }
        return data;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/uebernatuerlich_talent.html',
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
