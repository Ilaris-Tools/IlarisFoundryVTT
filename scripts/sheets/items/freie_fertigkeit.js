import { IlarisItemSheet } from './item.js';

export class FreieFertigkeitSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/freie_fertigkeit.html',
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

    async getData() {
        const data = await super.getData();
        
        // Prepare configuration arrays for selectOptions helper
        data.stufen = CONFIG.ILARIS.stufen;
        
        // Convert existing freie_fertigkeiten object to array format
        data.freieFertigkeitsgruppen = Object.entries(CONFIG.ILARIS.freie_fertigkeiten).map(([value, label]) => ({
            value: value,
            label: label
        }));
        
        return data;
    }

    // _getHeaderButtons() {
    //     let buttons = super._getHeaderButtons();
    //     return buttons;
    // }

    // activateListeners(html) {
    //     super.activateListeners(html);
    // }
}
