import { CombatItem } from './combat-item.js'

export class AngriffItem extends CombatItem {
    getTp() {
        return this.system.tp?.replace(/[Ww]/g, 'd') || ''
    }
}
