import { IlarisItem } from "./item.js";

export class ManoeverItem extends IlarisItem {
    istNutzbar(actor, item) {
        if (this.vorraussetzung) {
            console.log(this.vorraussetzung);
            // todo: check vorteile
            return false;
        } else {
            return true;
        }
    }
}