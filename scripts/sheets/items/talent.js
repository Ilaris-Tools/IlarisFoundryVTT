import { IlarisItemSheet } from "./item.js";

export class TalentSheet extends IlarisItemSheet {

    getData() {
        const data = super.getData();
        if (data.hasOwner) {
            // console.log(this.item.actor.data.misc.profan_fertigkeit_list);
            data.fertigkeit_list = this.item.actor.data.data.misc.profan_fertigkeit_list;
        };
        // console.log("In item.js");
        // console.log(data.actor);
        // console.log(data);
        return data;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: "systems/Ilaris/templates/sheets/items/talent.html",
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
