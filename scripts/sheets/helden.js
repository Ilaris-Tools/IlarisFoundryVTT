import { IlarisActorSheet } from './actor.js'
import * as settings from './../settings/index.js'

export class HeldenSheet extends IlarisActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // classes: ["ilaris", "sheet"],
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/helden.hbs',
            // width: 720,
            // height: 800,
            // resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'fertigkeiten',
                },
            ],
        })
    }

    async getData() {
        return {
            ...(await super.getData()),
            isWeaponSpaceRequirementActive: game.settings.get(
                settings.ConfigureGameSettingsCategories.Ilaris,
                settings.IlarisGameSettingNames.weaponSpaceRequirement,
            ),
        }
    }
}
