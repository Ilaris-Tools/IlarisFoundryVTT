import { WaffeBaseSheet } from './waffe-base.js'

export class NahkampfwaffeSheet extends WaffeBaseSheet {
    async getData() {
        const data = await super.getData()

        if (data.hasOwner) {
            data.speicherplatz_list = this.item.actor.misc.speicherplatz_list
        }

        // Fetch available waffeneigenschaften from all compendiums
        data.availableEigenschaften = await this._getAvailableEigenschaften()

        // Ensure eigenschaften is an array
        if (!Array.isArray(this.item.system.eigenschaften)) {
            this.item.system.eigenschaften = []
        }

        // Migrate legacy damage format
        this._migrateLegacyDamageFormat(data)

        return data
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/nahkampfwaffe.hbs',
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
        })
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
