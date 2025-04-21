import { IlarisItem } from "./item.js";

export class CombatItem extends IlarisItem {
    async setManoevers() {
        // TODO: könnte man vlt. dynamisch machen:
        //manoever davor mehr typen geben melee, ranged, magic, liturgie, commandos, intimidate
        //einstellungs option für system geben, um hausregel comp pack zu verwenden statt standard ilaris
        // alle aus dem pack und dann vorteile prüfen
        const manoeverPack = game.packs.get(game.settings.get('Ilaris', 'IlarisManoeverPaket'));
        const manoeverItemData = (await manoeverPack.getDocuments());
        if("nahkampfwaffe" === this.type || ("angriff" === this.type && this.system.typ === "Nah")) {
            this.manoever = [];
            manoeverItemData.forEach(manoever => {
                if(manoever.system.gruppe === 0 && manoever._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push(manoever);
                }
            });
        }
        if("fernkampfwaffe" === this.type  || ("angriff" === this.type && this.system.typ === "Fern")) {
        }
        // this.system.manoever.kbak = {selected: false}
        // TODO: deepcopy from config hier rein und filtern 
        // oder possible flag setzen je nach vorteilen des owners.
    }
}