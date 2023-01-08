import { IlarisItem } from "./item.js";

export class AngriffItem extends IlarisItem {
    setManoevers() {
        // TODO: könnte man vlt. dynamisch machen:
        // alle aus dem pack und dann vorteile prüfen
        this.data.data.manoever.kbak = {selected: false}
    }
}