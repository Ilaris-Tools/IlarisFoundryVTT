import { IlarisItemSheet } from './item.js'

/* template.json
    "manoever": {
      "voraussetzungen": [
        {
          "name": "Voraussetzung Beschreibung",
          "type": "VORTEIL | WAFFENEIGENSCHAFT | STIL",
          "value": ["VorteilID1", "VorteilID2"]
        }
      ],
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
            "type": DAMAGE | DEFENCE | ATTACK | INITIATIVE | LOADING_TIME | SPECIAL_RESSOURCE | WEAPON_DAMAGE | CHANGE_DAMAGE_TYPE,
            "value": 0,
            "operator": MULTIPLY | ADD (+/- values) | SUBTRACT (braucht man vermutlich nur bei Werten vor die man kein - setzen kann zb. wenn sie aus target kommen)
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
            template: 'systems/Ilaris/templates/sheets/items/manoever.hbs',
        })
    }

    async getData() {
        const data = await super.getData()
        data.manoever = CONFIG.ILARIS.manoever
        const vorteileItems = []
        const vorteile = []
        const stile = []

        // Get selected vorteile packs from settings
        const selectedPacks = JSON.parse(game.settings.get('Ilaris', 'vorteilePacks'))

        // Get vorteile from selected packs
        for (const packId of selectedPacks) {
            const pack = game.packs.get(packId)
            if (pack) {
                vorteileItems.push(...(await pack.getDocuments()))
            }
        }
        vorteileItems.forEach((item) => {
            if (item.type === 'vorteil') {
                if (item.system.gruppe == 3 || item.system.gruppe == 5 || item.system.gruppe == 7) {
                    stile.push({ key: item._id, label: item.name })
                } else {
                    vorteile.push({ key: item._id, label: item.name })
                }
            }
        })
        vorteile.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0))
        stile.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0))
        data.vorteile = vorteile
        data.stile = stile
        data.waffeneigenschaften = CONFIG.ILARIS.waffeneigenschaften
        data.schadenstypen = CONFIG.ILARIS.schadenstypen
        console.log(data)
        return data
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.add-voraussetzung').click(() => this._onAddVoraussetzung())
        html.find('.voraussetzung-delete').click((ev) => this._onDeleteVoraussetzung(ev))
        html.find('.add-modification').click(() => this._onAddModification())
        html.find('.delete-modification').click((ev) => this._onDeleteModification(ev))
    }

    async _onAddVoraussetzung() {
        const voraussetzungen = Object.values(this.item.system.voraussetzungen)
        voraussetzungen.push({ name: 'Neue Voraussetzung', type: 'VORTEIL', value: [] })

        await this.item.update({
            'system.voraussetzungen': voraussetzungen,
        })
    }

    async _onDeleteVoraussetzung(event) {
        let eigid = $(event.currentTarget).data('voraussetzungid')
        const voraussetzungen = Object.values(this.item.system.voraussetzungen)
        voraussetzungen.splice(eigid, 1)

        // Update the item with the new voraussetzungen array
        await this.item.update({
            'system.voraussetzungen': voraussetzungen,
        })
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
