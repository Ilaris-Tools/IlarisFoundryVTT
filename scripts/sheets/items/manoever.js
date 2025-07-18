import { IlarisItemSheet } from './item.js'
import {
    IlarisGameSettingNames,
    ConfigureGameSettingsCategories,
} from './../../settings/configure-game-settings.model.js'

/* template.json
    "manoever": {
      "voraussetzungen": "Vorteil Name1",
      "inputs": [
        {
            "label": "Checkbox",
            "field": "CHECKBOX"
        },
        { 
            label: "Auswahl",
            field: "SELECTOR",
            choices: ["foo", "bar", "baz"]
        }, 
        {
            label: "X",
            field: "NUMBER",
            min: 0,
            max: 8
        }
      ],
      "modifications": [
        {
            "type": DAMAGE | DEFENCE | ATTACK | INITIATIVE | LOADING_TIME | SPECIAL_RESSOURCE | WEAPON_DAMAGE | CHANGE_DAMAGE_TYPE | ZERO_DAMAGE | ARMOR_BREAKING | SPECIAL_TEXT,
            "value": 0,
            "operator": MULTIPLY | ADD (+/- values) | SUBTRACT (braucht man vermutlich nur bei Werten vor die man kein - setzen kann zb. wenn sie aus target kommen) | DIVIDE
            "target": "Wert zb aus Actor (99% aller Faelle aus Actor) wie actor.system.abgeleitete.gs, der entsprechend des operator behandelt wird"
        }
      ],
      "gruppe": 0,
      "probe": "", // beschreibt nur was weiter oben durch modifications bewirkt wird
      "gegenprobe": "",
      "text": ""
    },
*/

export class ManoeverSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/manoever.html',
        })
    }

    async getData() {
        const data = await super.getData()
        data.manoever = CONFIG.ILARIS.manoever
        data.schadenstypen = CONFIG.ILARIS.schadenstypen
        console.log(data)
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.add-modification').click(() => this._onAddModification())
        html.find('.delete-modification').click((ev) => this._onDeleteModification(ev))
    }

    async _onAddModification() {
        const modifications = Object.values(this.item.system.modifications)
        modifications.push({
            type: 'ATTACK',
            value: 0,
            operator: 'ADD',
            target: '',
            affectedByInput: true,
        })

        await this.item.update({
            'system.modifications': modifications,
        })
    }

    async _onDeleteModification(event) {
        let eigid = $(event.currentTarget).data('modificationid')
        const modifications = Object.values(this.item.system.modifications)
        modifications.splice(eigid, 1)

        await this.item.update({
            'system.modifications': modifications,
        })
    }
}
