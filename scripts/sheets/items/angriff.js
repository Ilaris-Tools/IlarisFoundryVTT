import { IlarisItemSheet } from './item.js';

export class AngriffSheet extends IlarisItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/angriff.html',
        });
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        console.log("Angriff listeners");
        html.find('.add-eigenschaft').click((ev) => this._onAddEigenschaft(ev));
        html.find('.del-eigenschaft').click((ev) => this._onDelEigenschaft(ev));
    }

    _getSubmitData(updateData={}) {
        const data = super._getSubmitData(updateData);
        // dirty workaround for v9 to turn objects back into arrays. 
        // In V10 a datamodel with schema should solve this, by directly using arrays
        console.log("data");
        // console.log(data);
        let eigenschaften = [];
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith("data.eigenschaften") && key.endsWith("name")) {
                var idx = key.split(".")[2];
                eigenschaften.push({name: value, text: data[`data.eigenschaften.${idx}.text`]})
                delete data[key];
                delete data[`data.eigenschaften.${idx}.text`]
            }
        }
        console.log(eigenschaften);
        data["data.eigenschaften"] = eigenschaften;
        return data;
    }
    
    _onAddEigenschaft(event) {
        //let item = this.document.data;
        console.log(this.document);
        this.document.data.data.eigenschaften.push({name: "Neue Eigenschaft", text: ""});
        console.log(this.document);
        this.document.render();
    }

    _onDelEigenschaft(event){
        let eigid = $(event.currentTarget).data('eigenschaftid');
        //console.log(`remove: ${eigid}`);
        this.document.data.data.eigenschaften.splice(eigid, 1);
        this.document.render();
    }

    getPossibleManoevers(){
        /* liste von verfügbarer manövern für diesen Angriff (ProbenDialog)
        Kombination aus allgemeinen, (waffeneigenschaften) und kampfvorteilen
        NOTE: Waffeneigenschaften sind automatische Effekte und Vorteile erlauben Manöver.
        */ 
        CONFIG.ILARIS.manoever_nahkampf
        let manoevers = [
            ""
        ];



    }

}
