import { IlarisItemSheet } from './item.js';

export class AngriffSheet extends IlarisItemSheet {
    async getData () {
        const data = await super.getData();
        data.angrifftypen = CONFIG.ILARIS.angriff_typ;
        return data;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: 'systems/Ilaris/templates/sheets/items/angriff.html',
        });
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        console.log("Angriff listeners");
        html.find('.add-eigenschaft').click((ev) => this._onAddEigenschaft(ev));
        html.find('.del-eigenschaft').click((ev) => this._onDelEigenschaft(ev));
    }
    
    _onAddEigenschaft(event) {
        //let item = this.document.data;
        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften);
        this.document.system.eigenschaften.push({name: "Neue Eigenschaft", text: ""});
        console.log(this.document);
        this.document.render();
    }

    async _onDelEigenschaft(event){
        let eigid = $(event.currentTarget).data('eigenschaftid');
        this.document.system.eigenschaften = Object.values(this.document.system.eigenschaften);
        this.document.system.eigenschaften.splice(eigid, 1);
        
        // Update the embedded item through the parent actor
        if (this.document.isEmbedded) {
            await this.document.actor.updateEmbeddedDocuments("Item", [
                {_id: this.document.id, "system.eigenschaften": this.document.system.eigenschaften}
            ]);
        } else {
            await this.document.update({"system.eigenschaften": this.document.system.eigenschaften});
        }
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
