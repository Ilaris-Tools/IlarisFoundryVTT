import { IlarisItem } from './item.js'

export class ManoeverItem extends IlarisItem {
    _manoeverRequirementsFulfilled(actor, item) {
        if (
            this.system.voraussetzungen != null &&
            Object.values(this.system.voraussetzungen).length > 0
        ) {
            const fulfilled = []
            Object.values(this.system.voraussetzungen).forEach((voraussetzung) => {
                if (voraussetzung.type == 'WAFFENEIGENSCHAFT') {
                    fulfilled.push(item.system.eigenschaften[voraussetzung.value] == true)
                }
                if (voraussetzung.type == 'VORTEIL') {
                    fulfilled.push(actor._hasVorteil(voraussetzung.value) == true)
                }
                if (voraussetzung.type == 'STILE') {
                    // gleich wie vorteile, aber macht den PR nochmal größer
                    fulfilled.push(actor._hasKampfstilSelected(voraussetzung.value) == true)
                }
            })
            return fulfilled.every((e) => e == true)
        } else {
            return true
        }
    }
}
