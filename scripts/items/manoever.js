import { IlarisItem } from "./item.js";

export class ManoeverItem extends IlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        if (this.vorraussetzungen) {
            fulfilled = [];
            this.vorraussetzungen.forEach(vorraussetzung => {
                if(vorraussetzung.type == "WAFFENEIGENSCHAFT") {
                    fulfilled.push(item.system.eigenschaften[vorraussetzung.value] == true);
                }
                if(vorraussetzung.type == "VORTEIL") {
                    fulfilled.push(actor._hasVorteil(vorraussetzung.value) == true);
                }
                if(vorraussetzung.type == "STILE") {
                    // gleich wie vorteile, aber macht den PR nochmal größer
                    fulfilled.push(actor._hasVorteil(vorraussetzung.value) == true);
                }
            }); 
            console.log(fulfilled);
            return fulfilled.every((e) => e == true);
        } else {
            return true;
        }
    }
}