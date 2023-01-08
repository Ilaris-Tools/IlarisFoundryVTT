import { IlarisItem } from "./item.js";
import { ManoeverItem } from "./manoever.js";
import { AngriffItem } from "./angriff.js";

const handler = {
    construct(_, args) {
        switch (args[0]?.type) {
            case "angriff":
                return new AngriffItem(...args);
            case "manoever":
                return new ManoeverItem(...args);
            default:
                return new IlarisItem(...args);
        }
    },
};

export const IlarisItemProxy = new Proxy(IlarisItem, handler);
