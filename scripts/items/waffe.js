import { CombatItem } from "./combat.js";

export class WaffeItem extends CombatItem {
    getTp() {
        return this.document.system.schaden?.replace(/[Ww]/g, "d") || "";
    }
}