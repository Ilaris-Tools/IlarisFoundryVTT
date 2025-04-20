import { IlarisItem } from "./item.js";

export class ManoeverItem extends IlarisItem {
    istNutzbar(actor, item) {
        if (this.vorraussetzungen) {
            console.log(this.vorraussetzungen);
            // todo: check vorteile
            return false;
        } else {
            return true;
        }
    }
}