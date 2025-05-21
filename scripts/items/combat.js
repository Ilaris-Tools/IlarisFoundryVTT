import { IlarisItem } from "./item.js";

export class CombatItem extends IlarisItem {
    async setManoevers() {
        // Get selected maneuver packs from settings
        const selectedPacks = JSON.parse(game.settings.get('Ilaris', 'manoeverPacks'));
        
        // Get maneuvers from selected packs
        const packItems = [];
        for await (const packId of selectedPacks) {
            const pack = game.packs.get(packId);
            if (pack) {
                packItems.push(...(await pack.getDocuments()));
            }
        }

        this.manoever = [];
        if("nahkampfwaffe" === this.type || ("angriff" === this.type && this.system.typ === "Nah")) {
            this.manoever = [];
            packItems.forEach(item => {
                if (item.type === 'manoever' && (item.system.gruppe == 0 || item.system.gruppe == 4) && item._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...item,
                        id: item.name.replace(/[\s\W]/g, '_'), 
                        inputValue: {
                            ...item.system.input,
                            value: ''
                        }
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
            this.manoever = [];
            packItems.forEach(item => {
                if(item.type === 'manoever' && item.system.gruppe == 1 && item._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...item,
                        id: item.name.replace(/[\s\W]/g, '_'), 
                        inputValue: {
                            ...item.system.input,
                            value: ''
                        }
                    });
                }
            });
        }
        if("zauber" === this.type) {
            this.manoever = [];
            packItems.forEach(item => {
                if(item.type === 'manoever' && item.system.gruppe == 2 && item._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...item,
                        id: item.name.replace(/[\s\W]/g, '_'), 
                        inputValue: {
                            ...item.system.input,
                            value: ''
                        }
                    });
                }   
            });
        }
        if("liturgie" === this.type) {
            this.manoever = [];
            packItems.forEach(item => {
                if(item.type === 'manoever' && item.system.gruppe == 3 && item._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...item,
                        id: item.name.replace(/[\s\W]/g, '_'), 
                        inputValue: {
                            ...item.system.input,
                            value: ''
                        }
                    });
                }
            }); 
        }
        if("anrufung" === this.type) {
            this.manoever = [];
            packItems.forEach(item => {
                if(item.type === 'manoever' && item.system.gruppe == 4 && item._manoeverRequirementsFulfilled(this.actor, this)) {
                    this.manoever.push({
                        ...item,
                        id: item.name.replace(/[\s\W]/g, '_'), 
                        inputValue: {
                            ...item.system.input,
                            value: ''
                        }
                    });      
                }
            });
        }
    }
}