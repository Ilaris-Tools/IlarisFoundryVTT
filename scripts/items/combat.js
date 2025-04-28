import { IlarisItem } from "./item.js";

export class CombatItem extends IlarisItem {
    async setManoevers() {
        // TODO: könnte man vlt. dynamisch machen:
        //manoever davor mehr typen geben melee, ranged, magic, liturgie, commandos, intimidate
        //einstellungs option für system geben, um hausregel comp pack zu verwenden statt standard ilaris
        // alle aus dem pack und dann vorteile prüfen

        // Durchsucht alle packs und items in der Welt. Filtert bei packs alle packs mit dem typ Item und überprüft ob ein Item dort den typ Manoever hat.
        // Wenn ja, wird das pack geladen und die Items werden in ein Array gepusht.
        const manoeverItems = [];
        game.packs.forEach(async (pack) => {
            if(pack.metadata.type == "Item") {
                if(pack.index.contents.length > 0 && pack.index.contents[0].type == 'manoever') {
                    manoeverItems.push(...(await pack.getDocuments()));
                }
            }
        });
        game.items.forEach(item => {
            if(item.type == "manoever") {
                manoeverItems.push(item);
            }
        });

        console.log("manoeverItems",manoeverItems);
        if("nahkampfwaffe" === this.type || ("angriff" === this.type && this.system.typ === "Nah")) {
            this.manoever = [];
            manoeverItems.forEach(manoever => {
                if(manoever.system.gruppe === 0 && manoever._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push(manoever);
                }
            });
        }
        if("fernkampfwaffe" === this.type  || ("angriff" === this.type && this.system.typ === "Fern")) {
        }
    }
}