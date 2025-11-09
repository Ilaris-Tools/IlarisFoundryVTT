import { IlarisItemSheet } from './item.js'

export class FernkampfwaffeSheet extends IlarisItemSheet {
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

        // for migration from dice_anzahl and dice_plus to tp
        // Only migrate if tp is not set yet AND old fields exist
        if (!this.item.system.tp && (this.item.system.dice_plus || this.item.system.dice_anzahl)) {
            this.item.system.tp = `${this.item.system.dice_anzahl}W6${
                this.item.system.dice_plus < 0 ? '' : '+'
            }${this.item.system.dice_plus}`
            delete this.item.system.dice_anzahl
            delete this.item.system.dice_plus
        }
        return data
    }

    /**
     * Get all available waffeneigenschaft items from compendiums
     * @returns {Promise<Array>} Array of eigenschaft objects with name and id
     * @private
     */
    async _getAvailableEigenschaften() {
        const eigenschaften = []

        // Search through all compendiums
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item') {
                const items = await pack.getDocuments()
                for (const item of items) {
                    if (item.type === 'waffeneigenschaft') {
                        eigenschaften.push({
                            name: item.name,
                            id: item.id,
                        })
                    }
                }
            }
        }

        // Also include eigenschaften from world items
        for (const item of game.items) {
            if (item.type === 'waffeneigenschaft') {
                eigenschaften.push({
                    name: item.name,
                    id: item.id,
                })
            }
        }

        // Sort by name for better UX
        eigenschaften.sort((a, b) => a.name.localeCompare(b.name))

        return eigenschaften
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/fernkampfwaffe.hbs',
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
