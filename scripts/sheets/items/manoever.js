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
      "gruppe": 0,
      "probe": "",
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
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.add-voraussetzung').click(() => this._onAddVoraussetzung());
        html.find('.voraussetzung-delete').click((ev) => this._ongDeleteVoraussetzun(ev));
    }

    _onAddVoraussetzung() {
        this.document.system.voraussetzungen = Object.values(this.document.system.voraussetzungen);
        this.document.system.voraussetzungen.push({name: 'Neue Voraussetzung', type: 'VORTEIL', value: []});
        this.document.render();
    }

    _ongDeleteVoraussetzun(event) {
        let eigid = $(event.currentTarget).data('voraussetzungid');
        this.document.system.voraussetzungen = Object.values(this.document.system.voraussetzungen);
        this.document.system.voraussetzungen.splice(eigid, 1);
        this.document.render();
    }
}
