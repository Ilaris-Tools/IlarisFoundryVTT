import { IlarisItemSheet } from './item.js';

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
            template: 'systems/Ilaris/templates/sheets/items/manoever.html',
        });
    }

    async getData () {
        const data = await super.getData();
        data.manoever = CONFIG.ILARIS.manoever;
        const vorteileItems = [];
        const vorteile = [];
        const stile = [];

        // Durchsucht alle packs und items in der Welt. Filtert bei packs alle packs mit dem typ Item und überprüft ob ein Item dort den typ vorteil hat.
        // Wenn ja, wird das pack geladen und die Items werden in ein Array gepusht. Anschließend werden die Vorteile sortiert nach gruppe
        for await (const pack of game.packs) {
            if(pack.metadata.type == "Item") {
                if(pack.index.contents.length > 0 && pack.index.contents[0].type == 'vorteil') {
                    vorteileItems.push(...(await pack.getDocuments()));
                }
            }
        }
        game.items.forEach(item => {
            if(item.type == 'vorteil') {
                vorteileItems.push(item);
            }
        });
        vorteileItems.forEach((vorteil) => {
            if(vorteil.system.gruppe == 3 || vorteil.system.gruppe == 5 || vorteil.system.gruppe == 7) {
                stile.push({key: vorteil._id, label: vorteil.name});
            } else {
                vorteile.push({key: vorteil._id, label: vorteil.name});
            }
        });
        vorteile.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));
        stile.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));
        data.vorteile = vorteile;
        data.stile = stile;
        data.waffeneigenschaften = CONFIG.ILARIS.waffeneigenschaften;
        data.schadenstypen = CONFIG.ILARIS.schadenstypen;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.add-voraussetzung').click(() => this._onAddVoraussetzung());
        html.find('.voraussetzung-delete').click((ev) => this._onDeleteVoraussetzung(ev));
        html.find('.add-input').click(() => this._onAddInput());
        html.find('.delete-input').click((ev) => this._onDeleteInput(ev));
        html.find('.add-modification').click(() => this._onAddModification());
        html.find('.delete-modification').click((ev) => this._onDeleteModification(ev));
    }

    _onAddVoraussetzung() {
        this.item.system.voraussetzungen = Object.values(this.item.system.voraussetzungen);
        this.item.system.voraussetzungen.push({name: 'Neue Voraussetzung', type: 'VORTEIL', value: []});
        this.document.render();
    }

    _onDeleteVoraussetzung(event) {
        let eigid = $(event.currentTarget).data('voraussetzungid');
        this.item.system.voraussetzungen = Object.values(this.item.system.voraussetzungen);
        this.item.system.voraussetzungen.splice(eigid, 1);
        this.document.render();
    }

    _onAddInput() {
        this.item.system.inputs = Object.values(this.item.system.inputs);
        this.item.system.inputs.push({label: 'CHECKBOX',field: ''});
        this.document.render();
    }

    _onDeleteInput(event) {
        let eigid = $(event.currentTarget).data('inputid');
        this.item.system.inputs = Object.values(this.item.system.inputs);
        this.item.system.inputs.splice(eigid, 1);
        this.document.render();
    }

    _onAddModification() {
        this.item.system.modifications = Object.values(this.item.system.modifications);
        this.item.system.modifications.push({
            type: "ATTACK",
            value: 0,
            operator: "ADD",
            target: ""
        });
        this.document.render();
    }

    _onDeleteModification(event) {
        let eigid = $(event.currentTarget).data('modificationid');
        this.item.system.modifications = Object.values(this.item.system.modifications);
        this.item.system.modifications.splice(eigid, 1);
        this.document.render();
    }
}
