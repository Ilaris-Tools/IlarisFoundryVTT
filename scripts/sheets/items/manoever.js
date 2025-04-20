import { IlarisItemSheet } from './item.js';


/* template.json
    "manoever": {
      "voraussetzungen": [],
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
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.add-voraussetzung').click(() => this._onAddVoraussetzung());
        html.find('.voraussetzung-delete').click((ev) => this._ongDeleteVoraussetzun(ev));
    }

    _onAddVoraussetzung() {
        this.document.system.voraussetzungen = Object.values(this.document.system.voraussetzungen);
        this.document.system.voraussetzungen.push({name: "Neue Voraussetzung", type: "VORTEIL"});
        this.document.render();
    }

    _ongDeleteVoraussetzun(event) {
        let eigid = $(event.currentTarget).data('voraussetzungid');
        this.document.system.voraussetzungen = Object.values(this.document.system.voraussetzungen);
        this.document.system.voraussetzungen.splice(eigid, 1);
        this.document.render();
    }
}
