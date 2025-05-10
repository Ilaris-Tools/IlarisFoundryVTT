import { IlarisItem } from "./item.js";

export class CombatItem extends IlarisItem {
    async setManoevers() {
        // TODO: könnte man vlt. dynamisch machen:
        // use _stats.compendiumSource or flags.core.sourceId to identify if already in list

        // Durchsucht alle packs und items in der Welt. Filtert bei packs alle packs mit dem typ Item und überprüft ob ein Item dort den typ Manoever hat.
        // Wenn ja, wird das pack geladen und die Items werden in ein Array gepusht.
        const manoeverItems = [];
        for await (const pack of game.packs) {
            if(pack.metadata.type == "Item") {
                if(pack.index.contents.length > 0 && pack.index.contents[0].type == 'manoever') {
                    manoeverItems.push(...(await pack.getDocuments()));
                }
            }
        }
        game.items.forEach(item => {
            if(item.type == "manoever") {
                manoeverItems.push(item);
            }
        });

        this.manoever = [];
        if("nahkampfwaffe" === this.type || ("angriff" === this.type && this.system.typ === "Nah")) {
            this.manoever = [];
            manoeverItems.forEach(manoever => {
                if((manoever.system.gruppe == 0 || manoever.system.gruppe == 4) && manoever._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...manoever,
                        id: manoever.name.replace(/[\s\W]/g, '_'), 
                        inputValues: Object.values(manoever.system.inputs).map(input => {
                        return {
                            ...input,
                            value: ''
                        };
                    })});
                }
            });
        }
        if("fernkampfwaffe" === this.type  || ("angriff" === this.type && this.system.typ === "Fern")) {
        }
    }
}