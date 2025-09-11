import { IlarisItemSheet } from './item.js'
import { EffectsManager } from '../common/effects-manager.js'

export class VorteilSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            template: 'systems/Ilaris/templates/sheets/items/vorteil.hbs',
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

    async getData() {
        const data = await super.getData()

        // Prepare configuration arrays for selectOptions helper
        data.vorteilsgruppen = CONFIG.ILARIS.vorteilsgruppen

        // Add effects data using the mixin
        return EffectsManager.prepareEffectsData.call(this, data)
    }

    // _getHeaderButtons() {
    //     let buttons = super._getHeaderButtons();
    //     return buttons;
    // }

    activateListeners(html) {
        super.activateListeners(html)

        // Use the effects manager for effect controls
        EffectsManager.activateEffectListeners.call(this, html)
    }
}

// Apply the EffectsManager mixin to the VorteilSheet
Object.assign(VorteilSheet.prototype, EffectsManager)
