import { CombatItem } from "./combat.js";

export class AngriffItem extends CombatItem {
    getTp() {
        return this.document.system.tp?.replace(/[Ww]/g, "d") || "";
    }
}