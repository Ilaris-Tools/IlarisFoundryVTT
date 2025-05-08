import { IlarisItem } from "./item.js";
import { ManoeverItem } from "./manoever.js";
import { CombatItem } from "./combat.js";

const handler = {
    construct(_, args) {
        switch (args[0]?.type) {
            case "angriff":
            case "nahkampfwaffe":
            case "fernkampfwaffe":    
                return new CombatItem(...args);
            case "manoever":
                return new ManoeverItem(...args);
            default:
                return new IlarisItem(...args);
        }
    },
};

export const IlarisItemProxy = new Proxy(IlarisItem, handler);
