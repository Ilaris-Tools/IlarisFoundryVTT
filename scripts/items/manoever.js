import { IlarisItem } from "./item.js";

export class ManoeverItem extends IlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        if (!this.system.voraussetzungen) {
            return true;
        }

        // Split by ODER first to get OR conditions
        const orGroups = this.system.voraussetzungen.split(" ODER ");
        
        // Check if any of the OR groups is fulfilled
        return orGroups.some(group => {
            // Split by comma to get AND conditions
            const andConditions = group.split(",").map(c => c.trim());
            
            // All conditions in an AND group must be true
            return andConditions.every(condition => {
                const parts = condition.split(" ");
                const type = parts[0];
                const value = parts.slice(1).join(" ");

                switch(type) {
                    case "Waffeneigenschaft":
                        // Find the key where the value matches
                        const eigenschaftKey = Object.entries(CONFIG.ILARIS.waffeneigenschaften)
                            .find(([key, val]) => val === value)?.[0];
                        return item.system.eigenschaften[eigenschaftKey];
                    case "Vorteil":
                        return actor._hasVorteil(value);
                    default:
                        return false;
                }
            });
        });
    }
}