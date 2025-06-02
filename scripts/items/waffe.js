import { CombatItem } from "./combat.js";

export class WaffeItem extends CombatItem {
    getTp() {
        return this.system.schaden?.replace(/[Ww]/g, "d") || "";
    }
}