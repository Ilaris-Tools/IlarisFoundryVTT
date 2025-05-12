import { IlarisItem } from "./item.js";

export class CombatItem extends IlarisItem {
    async setManoevers() {
        // Get selected maneuver packs from settings
        const selectedPacks = JSON.parse(game.settings.get('Ilaris', 'manoeverPacks'));
        
        // Get maneuvers from selected packs
        const manoeverItems = [];
        for await (const packId of selectedPacks) {
            const pack = game.packs.get(packId);
            if (pack) {
                manoeverItems.push(...(await pack.getDocuments()));
            }
        }

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
                        })
                    });
                }
            });
            
            // Sort maneuvers by gruppe (0 before 4) and then by name
            this.manoever.sort((a, b) => {
                // First sort by gruppe
                if (a.system.gruppe !== b.system.gruppe) {
                    return a.system.gruppe - b.system.gruppe;
                }
                // Then sort by name
                return a.name.localeCompare(b.name);
            });
        }
        if("fernkampfwaffe" === this.type  || ("angriff" === this.type && this.system.typ === "Fern")) {
        }
    }
}