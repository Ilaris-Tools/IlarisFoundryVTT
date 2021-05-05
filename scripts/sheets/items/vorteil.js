import { IlarisItemSheet } from "./item.js";

export class VorteilSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            // classes: ["wrath-and-glory", "sheet", "actor"],
            // classes: ["ilaris", "sheet"],
            template: "systems/Ilaris/templates/sheets/items/vorteil.html",
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
    // static get defaultOptions() {
    //     return mergeObject(super.defaultOptions, {
    //         classes: ["wrath-and-glory", "sheet", "item"],
    //         template: "systems/wrath-and-glory/template/sheet/armour.html",
    //         width: 500,
    //         height: 412,
    //         resizable: false,
    //         tabs: [
    //             {
    //                 navSelector: ".sheet-tabs",
    //                 contentSelector: ".sheet-body",
    //                 initial: "description",
    //             },
    //         ]
    //     });
    // }

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
